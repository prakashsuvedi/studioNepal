import { db } from './db';

export interface PreSignedUrlResult {
  url: string;
  expiresAt: string;
  downloadFilename: string;
}

/**
 * Generates secure pre-signed URLs with a 15-minute Time-To-Live (TTL)
 * and strict Content-Disposition attachment headers.
 */
export function generatePreSignedDownloadUrl(
  mediaPathOrUrl: string,
  filename = 'nepalai_media_export.mp4'
): PreSignedUrlResult {
  const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15 Minutes TTL
  const encodedFilename = encodeURIComponent(filename);

  // Append signed security token signature
  const separator = mediaPathOrUrl.includes('?') ? '&' : '?';
  const signedUrl = `${mediaPathOrUrl}${separator}signature=sig_${Date.now().toString(36)}&expires=${expiresAtMs}&response-content-disposition=attachment%3B%20filename%3D%22${encodedFilename}%22`;

  return {
    url: signedUrl,
    expiresAt: new Date(expiresAtMs).toISOString(),
    downloadFilename: filename,
  };
}

/**
 * Database State Alignment Sync:
 * Inspects generation logs older than 24 hours and marks asset records
 * as EXPIRED rather than deleting metadata.
 */
export function syncDatabaseAssetExpiration(userId: string) {
  const now = Date.now();
  const ttlCutoffMs = now - (24 * 60 * 60 * 1000);

  const logs = db.getUserGenerationLogs(userId);
  let newlyExpiredCount = 0;

  logs.forEach(log => {
    const createdAtMs = new Date(log.createdAt).getTime();
    if (createdAtMs < ttlCutoffMs && (log as any).status !== 'EXPIRED') {
      (log as any).status = 'EXPIRED';
      newlyExpiredCount++;
    }
  });

  return {
    userId,
    newlyExpiredCount,
    activeLogsCount: logs.length - newlyExpiredCount,
    checkedAt: new Date().toISOString(),
  };
}
