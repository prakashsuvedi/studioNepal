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
      const rawUser = process.env.SUPABASE_PG_USER || 'postgres.pnqahzcztfvpyfbogrel';
      const user = rawUser.startsWith('postgrespostgres.')
        ? rawUser.replace('postgrespostgres.', 'postgres.')
        : rawUser;
      const password = process.env.SUPABASE_PG_PASSWORD || '';

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

        CREATE TABLE IF NOT EXISTS avatars (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) DEFAULT 'custom',
          gender VARCHAR(50) DEFAULT 'male',
          image_url TEXT NOT NULL,
          thumbnail_url TEXT,
          default_voice_id VARCHAR(100),
          default_language VARCHAR(50),
          style_preset VARCHAR(100),
          description TEXT,
          consent_status VARCHAR(50) DEFAULT 'verified',
          consent_timestamp TIMESTAMPTZ,
          consent_legal_declaration TEXT,
          signer_full_name VARCHAR(255),
          signer_relationship VARCHAR(255),
          moderation_status VARCHAR(50) DEFAULT 'approved',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS custom_voices (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          gender VARCHAR(50) DEFAULT 'unspecified',
          language VARCHAR(50) DEFAULT 'ne-NP',
          description TEXT,
          sample_audio_url TEXT NOT NULL,
          sample_audio_filename VARCHAR(255),
          sample_duration_seconds NUMERIC DEFAULT 0,
          sample_format VARCHAR(50) DEFAULT 'mp3',
          speaker_embedding JSONB,
          acoustic_characteristics JSONB,
          model_engine VARCHAR(100) DEFAULT 'azure_custom_neural',
          consent_status VARCHAR(50) DEFAULT 'verified',
          consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
          consent_legal_declaration TEXT,
          signer_full_name VARCHAR(255),
          signer_relationship VARCHAR(255),
          moderation_status VARCHAR(50) DEFAULT 'approved',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          title VARCHAR(255) NOT NULL,
          aspect_ratio VARCHAR(50) DEFAULT '16:9',
          scenes JSONB NOT NULL DEFAULT '[]'::jsonb,
          subtitles JSONB NOT NULL DEFAULT '[]'::jsonb,
          audio_tracks JSONB NOT NULL DEFAULT '[]'::jsonb,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          version INT DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Safe column migrations for existing tables
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(255) DEFAULT 'usr_guest';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'video';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'ne';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_external_id VARCHAR(255) DEFAULT 'none';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(50) DEFAULT '16:9';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS scenes JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS subtitles JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS audio_tracks JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
        DO $$ BEGIN ALTER TABLE projects ALTER COLUMN owner_user_id DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
        DO $$ BEGIN ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'active'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
        DO $$ BEGIN ALTER TABLE projects ALTER COLUMN project_type SET DEFAULT 'video'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
        DO $$ BEGIN ALTER TABLE projects ALTER COLUMN language SET DEFAULT 'ne'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
        DO $$ BEGIN ALTER TABLE projects ALTER COLUMN source_external_id SET DEFAULT 'none'; EXCEPTION WHEN OTHERS THEN NULL; END $$;

        CREATE TABLE IF NOT EXISTS project_snapshots (
          id VARCHAR(255) PRIMARY KEY,
          project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
          version_number INT NOT NULL,
          title VARCHAR(255),
          description TEXT,
          scenes_count INT DEFAULT 0,
          payload JSONB NOT NULL,
          created_by VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Bootstrap Supabase RPC Stored Procedures
      await client.query(`
        CREATE OR REPLACE FUNCTION save_project_atomic_transaction(
          p_project_id VARCHAR,
          p_user_id VARCHAR,
          p_title VARCHAR,
          p_aspect_ratio VARCHAR,
          p_scenes JSONB,
          p_subtitles JSONB,
          p_audio_tracks JSONB,
          p_metadata JSONB,
          p_create_snapshot BOOLEAN DEFAULT true
        ) RETURNS JSONB AS $$
        DECLARE
          v_version INT := 1;
          v_result JSONB;
          v_snapshot_id VARCHAR;
        BEGIN
          INSERT INTO projects (id, user_id, status, project_type, language, source_external_id, title, aspect_ratio, scenes, subtitles, audio_tracks, metadata, version, created_at, updated_at)
          VALUES (p_project_id, p_user_id, 'active', 'video', 'ne', 'none', p_title, p_aspect_ratio, p_scenes, p_subtitles, p_audio_tracks, p_metadata, 1, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            aspect_ratio = EXCLUDED.aspect_ratio,
            scenes = EXCLUDED.scenes,
            subtitles = EXCLUDED.subtitles,
            audio_tracks = EXCLUDED.audio_tracks,
            metadata = EXCLUDED.metadata,
            version = projects.version + 1,
            updated_at = NOW()
          RETURNING version INTO v_version;

          IF p_create_snapshot THEN
            v_snapshot_id := 'snap_' || p_project_id || '_v' || v_version || '_' || CAST(EXTRACT(EPOCH FROM NOW())*1000 AS BIGINT);
            INSERT INTO project_snapshots (id, project_id, version_number, title, scenes_count, payload, created_by, created_at)
            VALUES (
              v_snapshot_id,
              p_project_id,
              v_version,
              p_title || ' (v' || v_version || ')',
              jsonb_array_length(p_scenes),
              jsonb_build_object(
                'projectId', p_project_id,
                'versionNumber', v_version,
                'title', p_title,
                'scenes', p_scenes,
                'subtitles', p_subtitles,
                'audioTracks', p_audio_tracks,
                'metadata', p_metadata
              ),
              COALESCE(p_user_id, 'system'),
              NOW()
            );
          END IF;

          v_result := jsonb_build_object(
            'success', true,
            'projectId', p_project_id,
            'version', v_version,
            'snapshotId', v_snapshot_id,
            'scenesCount', jsonb_array_length(p_scenes),
            'subtitlesCount', jsonb_array_length(p_subtitles),
            'timestamp', NOW()
          );

          RETURN v_result;
        EXCEPTION WHEN OTHERS THEN
          RAISE EXCEPTION 'Atomic save failed: %', SQLERRM;
        END;
        $$ LANGUAGE plpgsql;
      `);
      client.release();
      console.log('✅ Supabase PostgreSQL schema and RPC procedures verified.');
    } catch (err: any) {
      console.warn('PostgreSQL schema bootstrap notice:', err?.message || err);
    }
  }

  /**
   * Determine if a PostgreSQL error is transient and safe to retry
   */
  private isTransientError(err: any): boolean {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    const code = err.code || '';
    return (
      code === '57P01' || // admin shutdown
      code === '08006' || // connection failure
      code === '08001' || // unable to establish connection
      code === '08004' || // server rejected connection
      code === '40001' || // serialization failure / deadlock
      code === '53300' || // too many connections
      msg.includes('connection terminated') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('too many clients') ||
      msg.includes('client has already been released')
    );
  }

  /**
   * Execute an atomic transaction block with automatic BEGIN, COMMIT, ROLLBACK, and exponential backoff retry
   */
  public async executeTransaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    if (!this.pool) throw new Error('PostgreSQL pool not initialized');

    let attempt = 0;
    while (true) {
      attempt++;
      let client: pg.PoolClient | null = null;
      try {
        client = await this.pool.connect();
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err: any) {
        if (client) {
          await client.query('ROLLBACK').catch((rbErr) => console.warn('Rollback warning:', rbErr));
        }
        if (attempt >= maxRetries || !this.isTransientError(err)) {
          throw err;
        }
        const delay = 150 * Math.pow(2, attempt - 1) + Math.random() * 50;
        await new Promise((res) => setTimeout(res, delay));
      } finally {
        if (client) {
          try {
            client.release();
          } catch (_) {}
        }
      }
    }
  }

  /**
   * Execute query with automatic retry on transient connection drops
   */
  public async query(text: string, params?: any[], maxRetries = 3) {
    if (!this.pool) throw new Error('PostgreSQL pool not initialized');

    let attempt = 0;
    while (true) {
      attempt++;
      try {
        return await this.pool.query(text, params);
      } catch (err: any) {
        if (attempt >= maxRetries || !this.isTransientError(err)) {
          throw err;
        }
        const delay = 100 * Math.pow(2, attempt - 1) + Math.random() * 40;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  public async getDiagnosticReport() {
    const startTime = Date.now();
    const host = process.env.SUPABASE_PG_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com';
    const port = Number(process.env.SUPABASE_PG_PORT) || 5432;
    const database = process.env.SUPABASE_PG_DATABASE || 'postgres';
    const rawUser = process.env.SUPABASE_PG_USER || 'postgres.pnqahzcztfvpyfbogrel';
    const user = rawUser.startsWith('postgrespostgres.')
      ? rawUser.replace('postgrespostgres.', 'postgres.')
      : rawUser;

    if (!this.pool) {
      return {
        connected: false,
        host,
        port,
        database,
        user,
        connectionStringRedacted: `postgresql://${user}:••••••@${host}:${port}/${database}`,
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
        connectionStringRedacted: `postgresql://${user}:••••••@${host}:${port}/${database}`,
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
        connectionStringRedacted: `postgresql://${user}:••••••@${host}:${port}/${database}`,
        error: err?.message || 'Database connection error',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  public async syncCustomVoice(voice: any) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.query(`
        INSERT INTO custom_voices (
          id, user_id, name, gender, language, description, sample_audio_url,
          sample_audio_filename, sample_duration_seconds, sample_format,
          speaker_embedding, acoustic_characteristics, model_engine,
          consent_status, consent_timestamp, consent_legal_declaration,
          signer_full_name, signer_relationship, moderation_status,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          gender = EXCLUDED.gender,
          language = EXCLUDED.language,
          description = EXCLUDED.description,
          sample_audio_url = EXCLUDED.sample_audio_url,
          speaker_embedding = EXCLUDED.speaker_embedding,
          acoustic_characteristics = EXCLUDED.acoustic_characteristics,
          consent_status = EXCLUDED.consent_status,
          consent_timestamp = EXCLUDED.consent_timestamp,
          consent_legal_declaration = EXCLUDED.consent_legal_declaration,
          signer_full_name = EXCLUDED.signer_full_name,
          signer_relationship = EXCLUDED.signer_relationship,
          moderation_status = EXCLUDED.moderation_status,
          updated_at = NOW();
      `, [
        voice.id,
        voice.userId,
        voice.name,
        voice.gender || 'unspecified',
        voice.language || 'ne-NP',
        voice.description || '',
        voice.sampleAudioUrl,
        voice.sampleAudioFilename || null,
        voice.sampleDurationSeconds || 0,
        voice.sampleFormat || 'mp3',
        JSON.stringify(voice.speakerEmbedding || []),
        JSON.stringify(voice.acousticCharacteristics || {}),
        voice.modelEngine || 'azure_custom_neural',
        voice.consentStatus || 'verified',
        voice.consentTimestamp || new Date().toISOString(),
        voice.consentLegalDeclaration || '',
        voice.signerFullName || '',
        voice.signerRelationship || '',
        voice.moderationStatus || 'approved',
        voice.createdAt || new Date().toISOString(),
        voice.updatedAt || new Date().toISOString(),
      ]);
    } catch (err: any) {
      console.warn('syncCustomVoice failed:', err?.message || err);
    }
  }

  public async deleteCustomVoice(id: string) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.query('DELETE FROM custom_voices WHERE id = $1', [id]);
    } catch (err: any) {
      console.warn('deleteCustomVoice in postgres failed:', err?.message || err);
    }
  }
}

export const postgresDb = new PostgresService();
