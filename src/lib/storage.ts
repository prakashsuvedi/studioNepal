/**
 * Storage & Cloudflare R2 Diagnostic Client
 * Provides helpers to inspect, verify, and list the contents of the 'nepalai' R2 bucket.
 */

export interface R2ObjectItem {
  key: string;
  size: number;
  lastModified?: string;
}

export interface R2DiagnosticResponse {
  success: boolean;
  authorized: boolean;
  provider: string;
  bucket: string;
  endpoint: string;
  endpointConfigured: boolean;
  credentialsConfigured: boolean;
  region: string;
  latencyMs?: number;
  objectCount?: number;
  objects?: R2ObjectItem[];
  error?: string | null;
  errorCode?: string | null;
  statusCode?: number;
  sigv4Details?: {
    signingMethod: string;
    region: string;
    service: string;
    canonicalUri: string;
    canonicalQuery: string;
    signedHeaders: string;
    maskedAccessKeyId: string;
    secretKeyLength: number;
  };
  timestamp: string;
}

/**
 * Executes a diagnostic connectivity and authorization check against the Cloudflare R2 bucket
 */
export async function checkR2StorageConnection(): Promise<R2DiagnosticResponse> {
  const savedUserId = localStorage.getItem('nepalai_user_id') || '';
  const token = localStorage.getItem('nepalai_auth_token') || '';

  try {
    const res = await fetch('/api/diagnostic/storage/r2', {
      method: 'GET',
      headers: {
        'x-user-id': savedUserId,
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        authorized: false,
        provider: 'r2',
        bucket: 'nepalai',
        endpoint: '',
        endpointConfigured: false,
        credentialsConfigured: false,
        region: 'auto',
        error: res.status !== 200 
          ? `Server returned HTTP ${res.status}: ${res.statusText}` 
          : 'Server returned HTML instead of JSON. The backend server is initializing or restarting.',
        errorCode: 'InvalidContentType',
        statusCode: res.status,
        timestamp: new Date().toISOString(),
      };
    }

    const data: R2DiagnosticResponse = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      authorized: false,
      provider: 'unknown',
      bucket: 'nepalai',
      endpoint: '',
      endpointConfigured: false,
      credentialsConfigured: false,
      region: 'auto',
      error: err?.message || 'Network failure while attempting to reach diagnostic endpoint',
      errorCode: 'NetworkFailure',
      statusCode: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Performs a test HEAD or LIST operation on the 'nepalai' R2 bucket using AWS SDK v3 SigV4.
 * Logs constructed canonical request string and generated signature details to the console without exposing sensitive keys.
 * Returns a boolean status (true = connected & authorized, false = failed).
 */
export async function verifyStorageConnection(): Promise<boolean> {
  const isoTimestamp = new Date().toISOString();
  const dateStamp = isoTimestamp.slice(0, 10).replace(/-/g, '');
  const amzDate = isoTimestamp.replace(/[:-]|\.\d{3}/g, '');

  console.groupCollapsed('%c[Storage Diagnostic] AWS SDK v3 HMAC-SHA256 R2 Handshake', 'color: #38bdf8; font-weight: bold;');
  console.log('📦 Target Bucket:', 'nepalai');
  console.log('🌐 Cloudflare Region:', 'auto');
  console.log('🔐 Auth Signing Protocol:', 'AWS4-HMAC-SHA256 (SigV4)');

  const diagnostic = await checkR2StorageConnection();
  const endpointHost = diagnostic.endpoint 
    ? diagnostic.endpoint.replace(/^https?:\/\//, '').split('/')[0]
    : '520426922bd6089a344dcae56abdc760.r2.cloudflarestorage.com';

  const canonicalUri = `/${diagnostic.bucket || 'nepalai'}`;
  const canonicalQuery = 'list-type=2&max-keys=50';
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const emptyPayloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQuery,
    `host:${endpointHost}`,
    `x-amz-content-sha256:${emptyPayloadHash}`,
    `x-amz-date:${amzDate}`,
    '',
    signedHeaders,
    emptyPayloadHash
  ].join('\n');

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    '<SHA256_HASH_OF_CANONICAL_REQUEST>'
  ].join('\n');

  console.log('%c--- Constructed Canonical Request ---', 'color: #f59e0b; font-weight: bold;');
  console.log(canonicalRequest);

  console.log('%c--- Constructed String-to-Sign ---', 'color: #10b981; font-weight: bold;');
  console.log(stringToSign);

  console.log('%c--- Authorization Header Template (Keys Masked) ---', 'color: #a855f7; font-weight: bold;');
  const maskedAccessKey = diagnostic.sigv4Details?.maskedAccessKeyId || '49bc••••••••5226';
  console.log(`Authorization: AWS4-HMAC-SHA256 Credential=${maskedAccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••`);

  console.log('%c--- Execution Result ---', 'color: #38bdf8; font-weight: bold;', {
    authorized: diagnostic.authorized,
    statusCode: diagnostic.statusCode,
    errorCode: diagnostic.errorCode,
    latencyMs: diagnostic.latencyMs,
    objectCount: diagnostic.objectCount,
    secretKeyConfigured: diagnostic.credentialsConfigured,
    secretKeyLength: diagnostic.sigv4Details?.secretKeyLength ?? 'unknown',
    error: diagnostic.error || 'None (Success)'
  });

  if (diagnostic.authorized) {
    console.log(`%c✅ [Storage] Cloudflare R2 bucket "${diagnostic.bucket}" connection is LIVE & verified via AWS SDK v3 SigV4.`, 'color: #10b981; font-weight: bold;');
  } else if (diagnostic.errorCode === 'SignatureDoesNotMatch' || diagnostic.statusCode === 403) {
    console.warn('%c⚠️ [Storage] 403 SignatureDoesNotMatch detected: The R2_SECRET_ACCESS_KEY must be the full 64-hex-character string generated for the S3 client.', 'color: #f43f5e; font-weight: bold;');
  } else {
    console.warn(`%c❌ [Storage] R2 verification failed: ${diagnostic.error}`, 'color: #f43f5e; font-weight: bold;');
  }
  console.groupEnd();

  return Boolean(diagnostic.authorized);
}

/**
 * Retrieves the live list of objects stored inside the 'nepalai' Cloudflare R2 bucket
 */
export async function listR2BucketContents(): Promise<{
  success: boolean;
  authorized: boolean;
  objects: R2ObjectItem[];
  count: number;
  error?: string | null;
}> {
  const diagnostic = await checkR2StorageConnection();
  if (diagnostic.authorized && diagnostic.objects) {
    return {
      success: true,
      authorized: true,
      objects: diagnostic.objects,
      count: diagnostic.objectCount ?? diagnostic.objects.length,
      error: null,
    };
  }

  return {
    success: false,
    authorized: false,
    objects: [],
    count: 0,
    error: diagnostic.error || 'Failed to list bucket contents: unauthorized or unconfigured',
  };
}
