import { storageBucket } from './storageBucket';

export interface VersionSnapshot {
  id: string;
  projectId: string;
  versionNumber: number;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
  ownerId?: string;
  scenesCount: number;
  totalDurationSeconds: number;
  scenesData: any[];
  audioTracksData?: any[];
  storageUrl?: string;
}

class VersionHistoryService {
  private inMemoryVersions: Map<string, VersionSnapshot[]> = new Map();
  private projectOwners: Map<string, string> = new Map(); // projectId -> ownerId

  /**
   * Save a new version snapshot of a video project to Supabase Storage Bucket
   */
  public async saveVersion(params: {
    projectId: string;
    title: string;
    description?: string;
    createdBy: string;
    ownerId?: string;
    scenes: any[];
    audioTracks?: any[];
  }): Promise<VersionSnapshot> {
    const { projectId, title, description = 'Automatic autosave snapshot', createdBy, ownerId, scenes, audioTracks = [] } = params;

    if (ownerId && !this.projectOwners.has(projectId)) {
      this.projectOwners.set(projectId, ownerId);
    }

    const existingVersions = this.inMemoryVersions.get(projectId) || [];
    const versionNumber = existingVersions.length + 1;
    const versionId = `ver_${projectId}_v${versionNumber}_${Date.now()}`;

    const totalDurationSeconds = scenes.reduce((acc, s) => acc + (Number(s.duration) || 3), 0);

    const snapshotPayload = {
      id: versionId,
      projectId,
      versionNumber,
      title: title || `Version ${versionNumber}`,
      description,
      createdAt: new Date().toISOString(),
      createdBy,
      ownerId: ownerId || this.projectOwners.get(projectId) || createdBy,
      scenesCount: scenes.length,
      totalDurationSeconds,
      scenesData: scenes,
      audioTracksData: audioTracks,
    };

    // Save JSON binary snapshot to Supabase Storage Bucket
    const filename = `versions/${projectId}/v${versionNumber}_${Date.now()}.json`;
    let storageUrl = '';
    try {
      const saved = await storageBucket.saveMedia(
        filename,
        JSON.stringify(snapshotPayload, null, 2),
        'application/json'
      );
      storageUrl = saved.url;
    } catch (e) {
      console.warn('Could not save version to storage bucket:', e);
    }

    const versionSnapshot: VersionSnapshot = {
      ...snapshotPayload,
      storageUrl,
    };

    existingVersions.unshift(versionSnapshot); // newest first
    this.inMemoryVersions.set(projectId, existingVersions);

    return versionSnapshot;
  }

  /**
   * Check if caller has permission to view or restore a project
   */
  public hasAccess(projectId: string, userId?: string, isAdmin?: boolean): boolean {
    if (isAdmin) return true;
    const owner = this.projectOwners.get(projectId);
    // If no owner registered (e.g. open guest project), allow access
    if (!owner) return true;
    // If owner matches
    if (userId && (owner === userId || owner.toLowerCase() === userId.toLowerCase())) return true;
    return false;
  }

  /**
   * List all versions for a project
   */
  public getVersions(projectId: string, userId?: string, isAdmin?: boolean): VersionSnapshot[] | null {
    if (!this.hasAccess(projectId, userId, isAdmin)) {
      return null;
    }
    return this.inMemoryVersions.get(projectId) || [];
  }

  /**
   * Get specific version snapshot by ID
   */
  public getVersionById(projectId: string, versionId: string, userId?: string, isAdmin?: boolean): VersionSnapshot | null {
    if (!this.hasAccess(projectId, userId, isAdmin)) {
      return null;
    }
    const versions = this.inMemoryVersions.get(projectId) || [];
    return versions.find(v => v.id === versionId) || null;
  }
}

export const versionHistory = new VersionHistoryService();
