import pg from 'pg';

export class PostgresService {
  private pool: pg.Pool | null = null;
  public isConnected = false;

  constructor() {
    this.initPool();
  }

  private initPool() {
    try {
      const host = process.env.SUPABASE_PG_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com';
      const port = Number(process.env.SUPABASE_PG_PORT) || 5432;
      const database = process.env.SUPABASE_PG_DATABASE || 'postgres';
      const user = process.env.SUPABASE_PG_USER || 'postgres.pnqahzcztfvpyfbogrel';
      const password = process.env.SUPABASE_PG_PASSWORD || 'Pr@9851312299';

      this.pool = new pg.Pool({
        host,
        port,
        database,
        user,
        password,
        ssl: { rejectUnauthorized: false }, // Supabase SSL requirement
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10,
      });

      this.pool.on('error', (err) => {
        console.warn('PostgreSQL Pool unexpected error:', err.message);
        this.isConnected = false;
      });

      this.testConnection();
    } catch (err) {
      console.warn('PostgreSQL Pool initialization failed:', err);
    }
  }

  public async testConnection(): Promise<boolean> {
    if (!this.pool) return false;
    try {
      const client = await this.pool.connect();
      const res = await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      console.log('✅ Supabase PostgreSQL Database Connected Successfully! Time:', res.rows[0].now);
      await this.bootstrapTables();
      return true;
    } catch (err: any) {
      console.warn('⚠️ PostgreSQL connection notice (using JSON store fallback):', err?.message || err);
      this.isConnected = false;
      return false;
    }
  }

  private async bootstrapTables() {
    if (!this.pool || !this.isConnected) return;
    try {
      const client = await this.pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          picture TEXT,
          role VARCHAR(50) DEFAULT 'client',
          tier VARCHAR(50) DEFAULT 'freemium',
          credits INT DEFAULT 10,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          user_email VARCHAR(255),
          package_id VARCHAR(50),
          package_name VARCHAR(255),
          amount NUMERIC,
          currency VARCHAR(10),
          credits_added INT,
          stripe_payment_id TEXT,
          status VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS generation_logs (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          type VARCHAR(50),
          prompt TEXT,
          status VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      client.release();
      console.log('✅ Supabase PostgreSQL schema verified.');
    } catch (err: any) {
      console.warn('PostgreSQL schema bootstrap notice:', err?.message || err);
    }
  }

  public async query(text: string, params?: any[]) {
    if (!this.pool) throw new Error('PostgreSQL pool not initialized');
    return this.pool.query(text, params);
  }

  public async getDiagnosticReport() {
    const startTime = Date.now();
    const host = process.env.SUPABASE_PG_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com';
    const port = Number(process.env.SUPABASE_PG_PORT) || 5432;
    const database = process.env.SUPABASE_PG_DATABASE || 'postgres';
    const user = process.env.SUPABASE_PG_USER || 'postgres.pnqahzcztfvpyfbogrel';

    if (!this.pool) {
      return {
        connected: false,
        host,
        port,
        database,
        user,
        connectionStringRedacted: `postgresql://${user}:Pr***@${host}:${port}/${database}`,
        error: 'Pool not initialized',
        latencyMs: 0,
      };
    }

    try {
      const client = await this.pool.connect();
      const timeRes = await client.query('SELECT NOW() as now, VERSION() as version');
      const userCountRes = await client.query('SELECT count(*) FROM users').catch(() => ({ rows: [{ count: '0' }] }));
      const txCountRes = await client.query('SELECT count(*) FROM transactions').catch(() => ({ rows: [{ count: '0' }] }));
      const logCountRes = await client.query('SELECT count(*) FROM generation_logs').catch(() => ({ rows: [{ count: '0' }] }));
      client.release();

      const latencyMs = Date.now() - startTime;
      this.isConnected = true;

      return {
        connected: true,
        host,
        port,
        database,
        user,
        connectionStringRedacted: `postgresql://${user}:Pr***@${host}:${port}/${database}`,
        serverTime: timeRes.rows[0].now,
        version: timeRes.rows[0].version,
        latencyMs,
        counts: {
          users: parseInt(userCountRes.rows[0].count, 10),
          transactions: parseInt(txCountRes.rows[0].count, 10),
          logs: parseInt(logCountRes.rows[0].count, 10),
        },
      };
    } catch (err: any) {
      this.isConnected = false;
      return {
        connected: false,
        host,
        port,
        database,
        user,
        connectionStringRedacted: `postgresql://${user}:Pr***@${host}:${port}/${database}`,
        error: err?.message || 'Database connection error',
        latencyMs: Date.now() - startTime,
      };
    }
  }
}

export const postgresDb = new PostgresService();
