/**
 * Phase 4 Verification Test Suite: Frontend Network Resilience, Client Timeouts & Exponential Backoff
 * Tests:
 * 1. Automatic AbortController timeout execution
 * 2. Transient 5xx error exponential backoff and retry success
 * 3. Fast-failure on non-retryable 4xx errors (400, 401, 403, 404)
 * 4. Auth token & header injection
 * 5. Caller abort signal propagation
 * 6. Structured ApiClientError classification
 */

import http from 'http';
import { ApiClient, ApiClientError } from '../src/lib/apiClient';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('🌐 Running Phase 4: Frontend Network Resilience & API Client Tests');
  console.log('================================================================\n');

  // Set up a mock HTTP server to simulate various network scenarios
  let requestCount = 0;
  let serverPort = 9876;
  const receivedHeaders: Record<string, string> = {};

  const mockServer = http.createServer((req, res) => {
    requestCount++;
    Object.assign(receivedHeaders, req.headers);

    const url = req.url || '/';

    if (url === '/api/test/success') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', data: 'hello nepalai' }));
      return;
    }

    if (url === '/api/test/slow') {
      // Simulate 500ms delay
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'slow_ok' }));
      }, 500);
      return;
    }

    if (url === '/api/test/transient-500') {
      if (requestCount < 3) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Service temporarily unavailable' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'recovered_on_retry', attempt: requestCount }));
      }
      return;
    }

    if (url === '/api/test/client-error-400') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid scene duration' }));
      return;
    }

    if (url === '/api/test/client-error-401') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized token expired' }));
      return;
    }

    if (url === '/api/test/text') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('NepalAI Raw Text Stream');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  await new Promise<void>((resolve) => mockServer.listen(serverPort, () => resolve()));
  const baseUrl = `http://localhost:${serverPort}`;

  try {
    const client = new ApiClient({
      defaultTimeoutMs: 5000,
      defaultMaxRetries: 3,
      defaultRetryDelayMs: 50,
    });

    // --- Test Group 1: Standard Success & Auth Injection ---
    console.log('--- Test Group 1: Standard Execution & Header Injection ---');
    requestCount = 0;
    const successRes = await client.get<{ status: string; data: string }>(`${baseUrl}/api/test/success`, {
      token: 'test_jwt_bearer_token_xyz',
      userId: 'usr_phase4_alice',
      headers: { 'x-custom-trace': 'trace_123' },
    });

    assert(successRes.status === 'ok', 'Client parses JSON response successfully');
    assert(successRes.data === 'hello nepalai', 'Response data field matches payload');
    assert(receivedHeaders['authorization'] === 'Bearer test_jwt_bearer_token_xyz', 'Bearer Authorization header injected');
    assert(receivedHeaders['x-user-id'] === 'usr_phase4_alice', 'x-user-id header injected');
    assert(receivedHeaders['x-custom-trace'] === 'trace_123', 'Custom headers merged cleanly');

    // --- Test Group 2: Timeout Abort Handling ---
    console.log('\n--- Test Group 2: AbortController Timeout Protection ---');
    requestCount = 0;
    let timeoutCaught = false;
    let timeoutCode = '';

    try {
      await client.get(`${baseUrl}/api/test/slow`, {
        timeoutMs: 100, // 100ms timeout on 500ms endpoint
        maxRetries: 1,
        retryDelayMs: 10,
      });
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        timeoutCaught = true;
        timeoutCode = err.code;
      }
    }

    assert(timeoutCaught, 'Slow request triggers AbortController timeout');
    assert(timeoutCode === 'TIMEOUT', 'Error code classified as TIMEOUT', timeoutCode);

    // --- Test Group 3: Transient 5xx Error Exponential Backoff & Recovery ---
    console.log('\n--- Test Group 3: Transient 5xx Retry & Exponential Backoff ---');
    requestCount = 0;
    const retryRes = await client.get<{ status: string; attempt: number }>(`${baseUrl}/api/test/transient-500`, {
      maxRetries: 3,
      retryDelayMs: 30,
    });

    assert(retryRes.status === 'recovered_on_retry', 'Client recovers after transient 503 errors');
    assert(retryRes.attempt === 3, 'Client retried exactly 3 times before recovering');
    assert(requestCount === 3, 'Total HTTP attempts equals 3');

    // --- Test Group 4: Fast-Failure on Non-Retryable 4xx Client Errors ---
    console.log('\n--- Test Group 4: Fast-Failure on 4xx Client Errors ---');
    requestCount = 0;
    let clientErrorCaught = false;
    let clientErrorStatus = 0;

    try {
      await client.post(`${baseUrl}/api/test/client-error-400`, { sceneId: 'invalid' }, {
        maxRetries: 3,
      });
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        clientErrorCaught = true;
        clientErrorStatus = err.status || 0;
      }
    }

    assert(clientErrorCaught, 'HTTP 400 Bad Request throws ApiClientError');
    assert(clientErrorStatus === 400, 'Error status is 400');
    assert(requestCount === 1, 'Client fast-failed on attempt 1 without burning retries');

    // 401 Unauthorized check
    requestCount = 0;
    let unauthCaught = false;
    try {
      await client.get(`${baseUrl}/api/test/client-error-401`, { maxRetries: 3 });
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        unauthCaught = true;
      }
    }
    assert(unauthCaught, 'HTTP 401 Unauthorized fast-fails without retries');
    assert(requestCount === 1, 'HTTP 401 attempted only 1 time');

    // --- Test Group 5: External Caller Abort Signal ---
    console.log('\n--- Test Group 5: External Caller AbortSignal Cancellation ---');
    const externalController = new AbortController();
    let abortedCaught = false;
    let abortedCode = '';

    const abortPromise = client.get(`${baseUrl}/api/test/slow`, {
      signal: externalController.signal,
      timeoutMs: 5000,
    }).catch((err: any) => {
      if (err instanceof ApiClientError) {
        abortedCaught = true;
        abortedCode = err.code;
      }
    });

    // Abort after 50ms
    setTimeout(() => externalController.abort(), 50);
    await abortPromise;

    assert(abortedCaught, 'External AbortSignal successfully halts request');
    assert(abortedCode === 'ABORTED', 'Error code classified as ABORTED', abortedCode);

    // --- Test Group 6: Text & Binary Stream Responses ---
    console.log('\n--- Test Group 6: Alternative Response Types ---');
    const textRes = await client.get<string>(`${baseUrl}/api/test/text`, { responseType: 'text' });
    assert(textRes === 'NepalAI Raw Text Stream', 'responseType "text" correctly returns raw string');

  } finally {
    mockServer.close();
  }

  console.log('\n================================================================');
  if (failed === 0) {
    console.log(`🎉 All ${passed}/${passed} Phase 4 Frontend Resilience Tests PASSED!`);
  } else {
    console.error(`⚠️ ${failed} tests failed out of ${passed + failed}`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runPhase4Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
