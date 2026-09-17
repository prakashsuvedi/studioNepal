import Stripe from 'stripe';
import crypto from 'crypto';

export interface StripePackageConfig {
  id: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio';
  name: string;
  usdPrice: number;
  amountCents: number;
  credits: number;
  tier: 'starter' | 'creator' | 'pro_studio';
  description: string;
}

export const STRIPE_PACKAGES: Record<string, StripePackageConfig> = {
  sasta_50_npr: {
    id: 'sasta_50_npr',
    name: 'Sasta Micro-Pass (3 HD Images, 1x5m Video, 1x5m Audio)',
    usdPrice: 0.38,
    amountCents: 38,
    credits: 60,
    tier: 'starter',
    description: '3 HD Images, 1x5m Video, 1x5m Audio Micro-Credits',
  },
  starter: {
    id: 'starter',
    name: 'Starter Tier (500 Credits)',
    usdPrice: 19.0,
    amountCents: 1900,
    credits: 500,
    tier: 'starter',
    description: '500 AI Generation Credits for Solo Creators',
  },
  creator: {
    id: 'creator',
    name: 'Creator Tier (1,800 Credits)',
    usdPrice: 49.0,
    amountCents: 4900,
    credits: 1800,
    tier: 'creator',
    description: '1,800 AI Generation Credits (Commercial Rights + Priority Queue)',
  },
  pro_studio: {
    id: 'pro_studio',
    name: 'Pro Studio Tier (5,000 Credits)',
    usdPrice: 129.0,
    amountCents: 12900,
    credits: 5000,
    tier: 'pro_studio',
    description: '5,000 AI Generation Credits (Full API Access + Unlimited Custom Voice Training)',
  },
};

export class StripeGatewayService {
  private stripeClient: Stripe | null = null;
  private processedWebhookEvents = new Map<string, { timestamp: number; payload: any }>();
  private defaultSigningSecret = 'whsec_nepalai_stripe_webhook_secret_2026';

  constructor() {
    // Periodically clean up in-memory processed webhook cache older than 24h
    setInterval(() => {
      const cutoff = Date.now() - 24 * 3600 * 1000;
      for (const [key, value] of this.processedWebhookEvents.entries()) {
        if (value.timestamp < cutoff) {
          this.processedWebhookEvents.delete(key);
        }
      }
    }, 3600 * 1000).unref();
  }

  /**
   * Lazy initialization of Stripe SDK client to avoid crash on startup when key is unset
   */
  public getStripeClient(): Stripe | null {
    const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY;
    if (!key) {
      return null;
    }
    if (!this.stripeClient) {
      this.stripeClient = new Stripe(key, {
        apiVersion: '2025-02-24.acacia' as any,
        appInfo: {
          name: 'NepalAI Studio Stripe Gateway',
          version: '1.0.0',
          url: 'https://studio.nepalai.tech',
        },
      });
    }
    return this.stripeClient;
  }

  public getPublishableKey(): string {
    return (
      process.env.STRIPE_PUBLISHABLE_KEY ||
      process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
      'pk_test_nepalai_stripe_pub_2026'
    );
  }

  public getWebhookSecret(): string {
    return (
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.STRIPE_SIGNING_SECRET ||
      this.defaultSigningSecret
    );
  }

  public getPackage(packageId: string): StripePackageConfig | null {
    return STRIPE_PACKAGES[packageId] || null;
  }

  /**
   * Idempotency Check: Returns true if this event ID or Stripe Payment ID has already been fulfilled
   */
  public isWebhookEventProcessed(id: string): boolean {
    return this.processedWebhookEvents.has(id);
  }

  /**
   * Mark an event or payment ID as processed in memory
   */
  public markWebhookEventProcessed(id: string, payload: any): void {
    this.processedWebhookEvents.set(id, {
      timestamp: Date.now(),
      payload,
    });
  }

  /**
   * Create a Stripe Checkout Session on the server
   */
  public async createCheckoutSession(params: {
    userId: string;
    packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio';
    userEmail: string;
    userName?: string;
    appBaseUrl?: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    success: boolean;
    sessionId: string;
    url: string | null;
    amount: number;
    amountCents: number;
    currency: string;
    credits: number;
    packageName: string;
    mode: 'stripe_api' | 'stripe_hosted_fallback';
  }> {
    const pkg = this.getPackage(params.packageId);
    if (!pkg) {
      throw new Error(`Invalid packageId: ${params.packageId}`);
    }

    const stripe = this.getStripeClient();
    const appUrl = params.appBaseUrl || process.env.APP_URL || 'http://localhost:3000';
    const successUrl = params.successUrl || `${appUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = params.cancelUrl || `${appUrl}/?payment=cancelled`;

    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: params.userEmail,
          client_reference_id: params.userId,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `NepalAI Studio: ${pkg.name}`,
                  description: pkg.description,
                  images: ['https://studio.nepalai.tech/icon.png'],
                },
                unit_amount: pkg.amountCents,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: params.userId,
            userEmail: params.userEmail,
            packageId: pkg.id,
            packageName: pkg.name,
            credits: String(pkg.credits),
            tier: pkg.tier,
          },
          payment_intent_data: {
            metadata: {
              userId: params.userId,
              userEmail: params.userEmail,
              packageId: pkg.id,
              packageName: pkg.name,
              credits: String(pkg.credits),
              tier: pkg.tier,
            },
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        return {
          success: true,
          sessionId: session.id,
          url: session.url,
          amount: pkg.usdPrice,
          amountCents: pkg.amountCents,
          currency: 'USD',
          credits: pkg.credits,
          packageName: pkg.name,
          mode: 'stripe_api',
        };
      } catch (err: any) {
        console.error('[StripeGateway] Error creating Stripe Checkout Session via SDK:', err);
        throw new Error(`Stripe API error: ${err.message || 'Failed to create checkout session'}`);
      }
    }

    // When STRIPE_SECRET_KEY is not yet provisioned in environment, generate standard session format
    const sessionId = `cs_test_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    return {
      success: true,
      sessionId,
      url: `${appUrl}/?stripe_checkout_session=${sessionId}&package=${pkg.id}`,
      amount: pkg.usdPrice,
      amountCents: pkg.amountCents,
      currency: 'USD',
      credits: pkg.credits,
      packageName: pkg.name,
      mode: 'stripe_hosted_fallback',
    };
  }

  /**
   * Create a PaymentIntent for direct card elements
   */
  public async createPaymentIntent(params: {
    userId: string;
    packageId: 'sasta_50_npr' | 'starter' | 'creator' | 'pro_studio';
    userEmail: string;
    paymentMethodId?: string;
  }): Promise<{
    success: boolean;
    paymentIntentId: string;
    clientSecret: string | null;
    amount: number;
    amountCents: number;
    currency: string;
    status: string;
  }> {
    const pkg = this.getPackage(params.packageId);
    if (!pkg) {
      throw new Error(`Invalid packageId: ${params.packageId}`);
    }

    const stripe = this.getStripeClient();
    if (stripe) {
      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: pkg.amountCents,
        currency: 'usd',
        receipt_email: params.userEmail,
        metadata: {
          userId: params.userId,
          userEmail: params.userEmail,
          packageId: pkg.id,
          packageName: pkg.name,
          credits: String(pkg.credits),
          tier: pkg.tier,
        },
      };

      if (params.paymentMethodId) {
        intentParams.payment_method = params.paymentMethodId;
        intentParams.confirm = true;
        intentParams.automatic_payment_methods = {
          enabled: true,
          allow_redirects: 'never',
        };
      } else {
        intentParams.automatic_payment_methods = { enabled: true };
      }

      const intent = await stripe.paymentIntents.create(intentParams);
      return {
        success: true,
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        amount: pkg.usdPrice,
        amountCents: pkg.amountCents,
        currency: 'USD',
        status: intent.status,
      };
    }

    const paymentIntentId = `pi_test_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    return {
      success: true,
      paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_${crypto.randomBytes(6).toString('hex')}`,
      amount: pkg.usdPrice,
      amountCents: pkg.amountCents,
      currency: 'USD',
      status: 'requires_payment_method',
    };
  }

  /**
   * Verify Webhook Signature according to Stripe Cryptographic HMAC-SHA256 specification
   */
  public verifyAndConstructWebhookEvent(
    rawBody: Buffer | string,
    signatureHeader: string | string[] | undefined,
    secretOverride?: string
  ): Stripe.Event {
    const secret = secretOverride || this.getWebhookSecret();
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);

    // Attempt Stripe SDK official constructEvent first if client is available
    const stripe = this.getStripeClient();
    if (stripe) {
      try {
        return stripe.webhooks.constructEvent(bodyString, signature, secret);
      } catch (err: any) {
        // If Stripe SDK fails, also verify via our cryptographic engine
        console.warn('[StripeGateway] stripe.webhooks.constructEvent check:', err?.message);
      }
    }

    // Cryptographic Stripe Webhook signature verification (t=timestamp,v1=signature)
    const elements = signature.split(',');
    let timestamp = '';
    const signatures: string[] = [];

    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      throw new Error('Invalid stripe-signature header structure');
    }

    // Verify timestamp freshness (tolerance: 300 seconds)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (isNaN(timestampNum) || Math.abs(now - timestampNum) > 300) {
      throw new Error(`Webhook timestamp outside tolerance range (${Math.abs(now - timestampNum)}s difference)`);
    }

    // Compute expected HMAC-SHA256
    const signedPayload = `${timestamp}.${bodyString}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const isValid = signatures.some((sig) => {
      try {
        const sigBuf = Buffer.from(sig, 'hex');
        const expBuf = Buffer.from(expectedSignature, 'hex');
        if (sigBuf.length !== expBuf.length) return false;
        return crypto.timingSafeEqual(sigBuf, expBuf);
      } catch {
        return false;
      }
    });

    if (!isValid) {
      throw new Error('Stripe webhook HMAC signature mismatch');
    }

    try {
      return JSON.parse(bodyString) as Stripe.Event;
    } catch {
      throw new Error('Malformed webhook JSON payload');
    }
  }

  /**
   * Helper to generate a valid signed Stripe Webhook payload for test automation and QA verification
   */
  public generateSignedWebhookHeader(payloadJson: string, secretOverride?: string): string {
    const secret = secretOverride || this.getWebhookSecret();
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payloadJson}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return `t=${timestamp},v1=${signature}`;
  }
}

export const stripeGateway = new StripeGatewayService();
