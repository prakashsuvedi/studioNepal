import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface StorageConfig {
  provider: 'local' | 'supabase' | 'r2' | 's3';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseBucket?: string;
  publicBaseUrl?: string;
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'data', 'storage');

export class StorageBucketService {
  private config: StorageConfig;
  private supabaseClient: SupabaseClient | null = null;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      provider: (process.env.STORAGE_PROVIDER as any) || 'local',
      supabaseUrl: process.env.SUPABASE_URL || 'https://pnqahzcztfvpyfbogrel.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      supabaseBucket: process.env.SUPABASE_BUCKET || 'nepalai-media',
      publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || '',
      ...config,
    };

    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      try {
        fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
      } catch (e) {
        console.warn('Could not create local storage directory:', e);
      }
    }

    this.initSupabaseClient();
  }

  private initSupabaseClient() {
    if (this.config.supabaseUrl && this.config.supabaseAnonKey && this.config.supabaseUrl.startsWith('http')) {
      try {
        this.supabaseClient = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
          auth: { persistSession: false },
        });
      } catch (err) {
        console.warn('Supabase client initialization warning:', err);
      }
    }
  }

  public getConfig(): StorageConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<StorageConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initSupabaseClient();
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

    // 1. Try Supabase Storage Bucket
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
          console.warn('Supabase JS SDK upload warning, using local fallback:', error?.message);
        }
      } catch (err) {
        console.warn('Supabase upload exception, falling back to local disk:', err);
      }
    }

    // 2. Local Storage Disk Bucket
    const filePath = path.join(LOCAL_STORAGE_DIR, sanitizedFilename);
    fs.writeFileSync(filePath, buffer);

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
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(sanitized).toLowerCase();
      let mimeType = 'application/octet-stream';
      if (['.mp4', '.mov'].includes(ext)) mimeType = 'video/mp4';
      else if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
      else if (['.png'].includes(ext)) mimeType = 'image/png';
      else if (['.mp3', '.wav', '.ogg'].includes(ext)) mimeType = 'audio/mpeg';

      return { buffer, mimeType, exists: true };
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
        console.warn('Supabase download error:', err);
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
      const localFiles = fs.readdirSync(LOCAL_STORAGE_DIR);
      for (const file of localFiles) {
        const stats = fs.statSync(path.join(LOCAL_STORAGE_DIR, file));
        if (stats.isFile()) {
          fileList.push({ filename: file, sizeBytes: stats.size, provider: 'local' });
        }
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
        console.warn('Supabase list files notice:', err);
      }
    }

    return fileList;
  }

  /**
   * Read file synchronously from local disk
   */
  public getLocalFile(filename: string): { buffer: Buffer; exists: boolean; filePath?: string; fileSize?: number } {
    const sanitized = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(LOCAL_STORAGE_DIR, sanitized);
    if (fs.existsSync(filePath)) {
      return { buffer: fs.readFileSync(filePath), exists: true, filePath, fileSize: fs.statSync(filePath).size };
    }
    return { buffer: Buffer.alloc(0), exists: false };
  }
}

export const storageBucket = new StorageBucketService();
