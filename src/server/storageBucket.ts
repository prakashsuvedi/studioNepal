import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const execFileAsync = promisify(execFile);

export interface StorageConfig {
  provider: 'local' | 'supabase' | 'r2' | 's3';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseBucket?: string;
  publicBaseUrl?: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'data', 'storage');
const LOCAL_UPLOADS_DIST = path.join(process.cwd(), 'dist', 'uploads');
const LOCAL_UPLOADS_PUBLIC = path.join(process.cwd(), 'public', 'uploads');

export class StorageBucketService {
  private config: StorageConfig;
  private supabaseClient: SupabaseClient | null = null;
  private s3Client: S3Client | null = null;
  private reaperIntervalId: NodeJS.Timeout | null = null;

  constructor(config?: Partial<StorageConfig>) {
    let rawEndpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT || process.env.S3_ENDPOINT || '';
    let resolvedBucket = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET || process.env.S3_BUCKET || 'nepalai';
    let resolvedRegion = process.env.R2_REGION || process.env.S3_REGION || process.env.AWS_REGION || 'auto';

    // If region contains descriptive text, spaces, or parentheses (e.g. "Asia-Pacific (APAC)"), or is Cloudflare R2, normalize to "auto"
    if (
      !resolvedRegion ||
      resolvedRegion.includes(' ') ||
      resolvedRegion.includes('(') ||
      resolvedRegion.toLowerCase().includes('apac') ||
      (rawEndpoint && rawEndpoint.includes('r2.cloudflarestorage.com'))
    ) {
      resolvedRegion = 'auto';
    }

    // If endpoint has trailing bucket path (e.g. https://<account_id>.r2.cloudflarestorage.com/nepalai), normalize it
    if (rawEndpoint) {
      try {
        const parsed = new URL(rawEndpoint);
        if (parsed.pathname && parsed.pathname.length > 1) {
          const pathSegments = parsed.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0 && (!process.env.R2_BUCKET && !process.env.S3_BUCKET)) {
            resolvedBucket = pathSegments[0];
          }
          parsed.pathname = '';
          rawEndpoint = parsed.origin;
        }
      } catch {
        // Safe skip on string manipulation if invalid URL structure
      }
    }

    this.config = {
      provider: (process.env.STORAGE_PROVIDER as any) || (rawEndpoint || process.env.R2_ACCESS_KEY_ID ? 'r2' : 'local'),
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      supabaseBucket: process.env.SUPABASE_BUCKET || 'nepalai-media',
      publicBaseUrl: process.env.R2_PUBLIC_URL || process.env.STORAGE_PUBLIC_BASE_URL || '',
      s3Endpoint: rawEndpoint,
      s3Region: resolvedRegion,
      s3Bucket: resolvedBucket,
      s3AccessKeyId: (process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim(),
      s3SecretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
      ...config,
    };

    [LOCAL_STORAGE_DIR, LOCAL_UPLOADS_DIST, LOCAL_UPLOADS_PUBLIC].forEach(dir => {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (e) {
          // Ignore mkdir warnings in restricted environments
        }
      }
    });

    this.initClients();
    this.startDiskReaperService(30, 2); // Run reaper every 30 mins, purge temporary artifacts > 2h
  }

  private initClients() {
    // 1. Supabase Storage Client
    if (this.config.supabaseUrl && this.config.supabaseAnonKey && this.config.supabaseUrl.startsWith('http')) {
      try {
        this.supabaseClient = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
          auth: { persistSession: false },
        });
      } catch (err) {
        console.warn('[Storage] Supabase client initialization notice:', err);
      }
    }

    // 2. AWS S3 / Cloudflare R2 Client
    if (this.config.s3AccessKeyId && this.config.s3SecretAccessKey) {
      try {
        this.s3Client = new S3Client({
          region: this.config.s3Region || 'auto',
          endpoint: this.config.s3Endpoint || undefined,
          credentials: {
            accessKeyId: this.config.s3AccessKeyId,
            secretAccessKey: this.config.s3SecretAccessKey,
          },
        });
      } catch (err) {
        console.warn('[Storage] S3/R2 client initialization notice:', err);
      }
    }
  }

  public getConfig(): StorageConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<StorageConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initClients();
  }

  /**
   * Save / Upload buffer or base64 binary media to storage bucket
   */
  public async saveMedia(
    filename: string,
    data: Buffer | string,
    mimeType = 'image/jpeg'
  ): Promise<{ url: string; provider: string; sizeBytes: number; filename: string }> {
    let buffer: Buffer;

    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        const matches = data.match(/^data:([^;]+);base64,(.*)$/);
        if (matches && matches[2]) {
          mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(data, 'utf-8');
        }
      } else {
        buffer = Buffer.from(data, 'base64');
      }
    } else {
      buffer = data;
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // 1. Try Cloudflare R2 / S3 Storage if configured
    if (this.s3Client && this.config.s3Bucket) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.config.s3Bucket,
            Key: sanitizedFilename,
            Body: buffer,
            ContentType: mimeType,
          })
        );

        const publicBase = this.config.publicBaseUrl || (this.config.s3Endpoint ? `${this.config.s3Endpoint}/${this.config.s3Bucket}` : '');
        const fileUrl = publicBase ? `${publicBase}/${sanitizedFilename}` : `/api/storage/file/${sanitizedFilename}`;

        return {
          url: fileUrl,
          provider: 's3_r2',
          sizeBytes: buffer.length,
          filename: sanitizedFilename,
        };
      } catch (s3Err: any) {
        console.warn('[Storage] S3/R2 upload exception, trying secondary provider:', s3Err?.message || s3Err);
      }
    }

    // 2. Try Supabase Storage Bucket
    if (this.supabaseClient && (this.config.provider === 'supabase' || process.env.SUPABASE_URL)) {
      try {
        const { data: uploadData, error } = await this.supabaseClient.storage
          .from(this.config.supabaseBucket || 'nepalai-media')
          .upload(sanitizedFilename, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error && uploadData) {
          const { data: publicUrlData } = this.supabaseClient.storage
            .from(this.config.supabaseBucket || 'nepalai-media')
            .getPublicUrl(sanitizedFilename);

          return {
            url: publicUrlData.publicUrl,
            provider: 'supabase',
            sizeBytes: buffer.length,
            filename: sanitizedFilename,
          };
        } else {
          // Fall back gracefully to local storage
        }
      } catch (err) {
        // Fall back gracefully
      }
    }

    // 3. Local Storage Disk Bucket (with Non-Blocking Async FFmpeg FastStart Normalization)
    const filePath = path.join(LOCAL_STORAGE_DIR, sanitizedFilename);
    await fs.promises.writeFile(filePath, buffer);

    if (sanitizedFilename.endsWith('.mp4') || (mimeType && mimeType.startsWith('video/'))) {
      try {
        const tmpPath = `${filePath}.norm.mp4`;
        // Non-blocking async execution avoids event-loop starvation
        await execFileAsync('ffmpeg', ['-y', '-i', filePath, '-c:v', 'copy', '-movflags', '+faststart', tmpPath], {
          timeout: 15000,
        });
        if (fs.existsSync(tmpPath)) {
          const stats = await fs.promises.stat(tmpPath);
          if (stats.size > 1000) {
            await fs.promises.rename(tmpPath, filePath);
            buffer = await fs.promises.readFile(filePath);
          }
        }
      } catch (normErr) {
        // Safe skip on non-fatal normalization notice
      }
    }

    const hostBase = this.config.publicBaseUrl || '';
    const fileUrl = `${hostBase}/api/storage/file/${sanitizedFilename}`;

    return {
      url: fileUrl,
      provider: 'local',
      sizeBytes: buffer.length,
      filename: sanitizedFilename,
    };
  }

  /**
   * Download / Retrieve binary data from storage bucket
   */
  public async downloadMedia(filename: string): Promise<{ buffer: Buffer; mimeType: string; exists: boolean }> {
    const sanitized = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Check Local Disk first
    const filePath = path.join(LOCAL_STORAGE_DIR, sanitized);
    if (fs.existsSync(filePath)) {
      const buffer = await fs.promises.readFile(filePath);
      const ext = path.extname(sanitized).toLowerCase();
      let mimeType = 'application/octet-stream';
      if (['.mp4', '.mov'].includes(ext)) mimeType = 'video/mp4';
      else if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
      else if (['.png'].includes(ext)) mimeType = 'image/png';
      else if (['.mp3', '.wav', '.ogg'].includes(ext)) mimeType = 'audio/mpeg';

      return { buffer, mimeType, exists: true };
    }

    // Check S3/R2
    if (this.s3Client && this.config.s3Bucket) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.config.s3Bucket,
            Key: sanitized,
          })
        );
        if (response.Body) {
          const byteArray = await response.Body.transformToByteArray();
          return {
            buffer: Buffer.from(byteArray),
            mimeType: response.ContentType || 'application/octet-stream',
            exists: true,
          };
        }
      } catch (s3Err) {
        // Continue to Supabase
      }
    }

    // Check Supabase Storage Bucket
    if (this.supabaseClient) {
      try {
        const { data: fileData, error } = await this.supabaseClient.storage
          .from(this.config.supabaseBucket || 'nepalai-media')
          .download(sanitized);

        if (!error && fileData) {
          const arrayBuf = await fileData.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuf),
            mimeType: fileData.type || 'application/octet-stream',
            exists: true,
          };
        }
      } catch (err) {
        // Fall through
      }
    }

    return { buffer: Buffer.alloc(0), mimeType: 'text/plain', exists: false };
  }

  /**
   * List files stored in bucket
   */
  public async listFiles(): Promise<Array<{ filename: string; sizeBytes: number; provider: string }>> {
    const fileList: Array<{ filename: string; sizeBytes: number; provider: string }> = [];

    if (fs.existsSync(LOCAL_STORAGE_DIR)) {
      const localFiles = await fs.promises.readdir(LOCAL_STORAGE_DIR);
      for (const file of localFiles) {
        try {
          const stats = await fs.promises.stat(path.join(LOCAL_STORAGE_DIR, file));
          if (stats.isFile()) {
            fileList.push({ filename: file, sizeBytes: stats.size, provider: 'local' });
          }
        } catch {}
      }
    }

    // List from Cloudflare R2 / S3
    if (this.s3Client && this.config.s3Bucket) {
      try {
        const s3Res = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.config.s3Bucket,
            MaxKeys: 100,
          })
        );
        if (s3Res.Contents) {
          for (const item of s3Res.Contents) {
            if (item.Key) {
              fileList.push({
                filename: item.Key,
                sizeBytes: item.Size || 0,
                provider: 'r2',
              });
            }
          }
        }
      } catch (s3Err) {
        // Continue to Supabase and local
      }
    }

    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.storage
          .from(this.config.supabaseBucket || 'nepalai-media')
          .list();

        if (!error && data) {
          for (const item of data) {
            fileList.push({
              filename: item.name,
              sizeBytes: item.metadata?.size || 0,
              provider: 'supabase',
            });
          }
        }
      } catch (err) {
        // Ignore
      }
    }

    return fileList;
  }

  /**
   * Directly inspect and query Cloudflare R2 bucket connection
   */
  public async inspectR2Bucket(): Promise<{
    authorized: boolean;
    bucket: string;
    endpoint: string;
    region: string;
    keyCount: number;
    objects: Array<{ key: string; size: number; lastModified?: string }>;
    latencyMs: number;
    error: string | null;
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
  }> {
    const startTime = Date.now();
    const bucket = this.config.s3Bucket || 'nepalai';
    const endpoint = this.config.s3Endpoint || '';
    const region = this.config.s3Region || 'auto';

    const accessKeyId = this.config.s3AccessKeyId || '';
    const secretKey = this.config.s3SecretAccessKey || '';

    const maskedAccessKeyId = accessKeyId.length >= 8
      ? `${accessKeyId.slice(0, 4)}••••••••${accessKeyId.slice(-4)}`
      : 'Not configured';

    const sigv4Details = {
      signingMethod: 'AWS4-HMAC-SHA256',
      region: region,
      service: 's3',
      canonicalUri: `/${bucket}`,
      canonicalQuery: 'list-type=2&max-keys=50',
      signedHeaders: 'host;x-amz-content-sha256;x-amz-date',
      maskedAccessKeyId,
      secretKeyLength: secretKey.length,
    };

    if (!this.s3Client || !accessKeyId || !secretKey) {
      return {
        authorized: false,
        bucket,
        endpoint,
        region,
        keyCount: 0,
        objects: [],
        latencyMs: Date.now() - startTime,
        error: 'R2 credentials (access key or secret) not configured in environment',
        errorCode: 'CredentialsMissing',
        statusCode: 400,
        sigv4Details,
      };
    }

    try {
      const res = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          MaxKeys: 50,
        })
      );

      const objects = (res.Contents || []).map((item) => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified ? item.LastModified.toISOString() : undefined,
      }));

      return {
        authorized: true,
        bucket,
        endpoint,
        region,
        keyCount: res.KeyCount || objects.length,
        objects,
        latencyMs: Date.now() - startTime,
        error: null,
        errorCode: null,
        statusCode: 200,
        sigv4Details,
      };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const errorCode = err?.name || err?.Code || (errorMsg.includes('SignatureDoesNotMatch') ? 'SignatureDoesNotMatch' : 'StorageError');
      const statusCode = err?.$metadata?.httpStatusCode || (errorMsg.includes('403') || errorMsg.includes('SignatureDoesNotMatch') ? 403 : 500);

      return {
        authorized: false,
        bucket,
        endpoint,
        region,
        keyCount: 0,
        objects: [],
        latencyMs: Date.now() - startTime,
        error: errorMsg,
        errorCode,
        statusCode,
        sigv4Details,
      };
    }
  }

  /**
   * Read file from local disk with path-traversal hardening
   */
  public getLocalFile(filename: string): { buffer: Buffer; exists: boolean; filePath?: string; fileSize?: number } {
    const sanitized = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.resolve(LOCAL_STORAGE_DIR, sanitized);

    // Defense against path traversal attack
    if (!filePath.startsWith(LOCAL_STORAGE_DIR)) {
      console.warn('[StorageSecurity] Potential path traversal attempt rejected:', filename);
      return { buffer: Buffer.alloc(0), exists: false };
    }

    if (fs.existsSync(filePath)) {
      return { buffer: fs.readFileSync(filePath), exists: true, filePath, fileSize: fs.statSync(filePath).size };
    }
    return { buffer: Buffer.alloc(0), exists: false };
  }

  /**
   * Automated local disk cleanup to purge temporary artifacts older than maxAgeDays
   */
  public cleanExpiredCache(maxAgeDays = 7): { deletedFiles: number; freedBytes: number } {
    let deletedFiles = 0;
    let freedBytes = 0;
    try {
      if (!fs.existsSync(LOCAL_STORAGE_DIR)) return { deletedFiles: 0, freedBytes: 0 };
      const now = Date.now();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      const files = fs.readdirSync(LOCAL_STORAGE_DIR);

      for (const file of files) {
        const fullPath = path.join(LOCAL_STORAGE_DIR, file);
        try {
          const stats = fs.statSync(fullPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            freedBytes += stats.size;
            fs.unlinkSync(fullPath);
            deletedFiles++;
          }
        } catch {
          // ignore single file stat errors
        }
      }
    } catch (e) {
      console.warn('[StorageCleanup] Notice during cache cleanup:', e);
    }
    return { deletedFiles, freedBytes };
  }

  /**
   * Background Disk Reaper Service
   * Periodically scans storage and uploads folders, purging temp artifacts older than maxAgeHours
   * Protects recent uploads (< 15 mins) from race conditions during active writes.
   */
  public startDiskReaperService(intervalMinutes = 30, maxAgeHours = 2) {
    if (this.reaperIntervalId) return;

    const runReaper = async () => {
      const targetDirs = [LOCAL_STORAGE_DIR, LOCAL_UPLOADS_DIST, LOCAL_UPLOADS_PUBLIC];
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      const minAgeProtectionMs = 15 * 60 * 1000; // Never delete files written in last 15 minutes
      const now = Date.now();

      let purgedCount = 0;
      let freedBytes = 0;

      for (const dir of targetDirs) {
        if (!fs.existsSync(dir)) continue;
        try {
          const files = await fs.promises.readdir(dir);
          for (const file of files) {
            // Keep sample assets and sample previews
            if (file.startsWith('sample_') || file.startsWith('everest_') || file.startsWith('Kathmandu_')) continue;

            const fullPath = path.join(dir, file);
            try {
              const stats = await fs.promises.stat(fullPath);
              if (stats.isFile()) {
                const age = now - stats.mtimeMs;
                if (age > maxAgeMs && age > minAgeProtectionMs) {
                  freedBytes += stats.size;
                  await fs.promises.unlink(fullPath);
                  purgedCount++;
                }
              }
            } catch {}
          }
        } catch {}
      }

      if (purgedCount > 0) {
        console.log(`[StorageReaper] Auto-purged ${purgedCount} expired temporary files (${Math.round(freedBytes / (1024 * 1024) * 10) / 10} MB reclaimed).`);
      }
    };

    // Schedule recurring interval
    this.reaperIntervalId = setInterval(runReaper, intervalMinutes * 60 * 1000);
    // Unref so it doesn't block Node process shutdown
    if (this.reaperIntervalId.unref) this.reaperIntervalId.unref();
  }

  public stopDiskReaperService() {
    if (this.reaperIntervalId) {
      clearInterval(this.reaperIntervalId);
      this.reaperIntervalId = null;
    }
  }
}

export const storageBucket = new StorageBucketService();
