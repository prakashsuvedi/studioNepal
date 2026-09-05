import { storageBucket } from './storageBucket';

export interface VersionSnapshot {
  id: string;
  projectId: string;
  versionNumber: number;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
  scenesCount: number;
  totalDurationSeconds: number;
  scenesData: any[];
  audioTracksData?: any[];
  storageUrl?: string;
}

class VersionHistoryService {
  private inMemoryVersions: Map<string, VersionSnapshot[]> = new Map();

  /**
   * Save a new version snapshot of a video project to Supabase Storage Bucket
   */
  public async saveVersion(params: {
    projectId: string;
    title: string;
    description?: string;
    createdBy: string;
    scenes: any[];
    audioTracks?: any[];
  }): Promise<VersionSnapshot> {
    const { projectId, title, description = 'Automatic autosave snapshot', createdBy, scenes, audioTracks = [] } = params;

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
   * List all versions for a project
   */
  public getVersions(projectId: string): VersionSnapshot[] {
    return this.inMemoryVersions.get(projectId) || [];
  }

  /**
   * Get specific version snapshot by ID
   */
  public getVersionById(projectId: string, versionId: string): VersionSnapshot | null {
    const versions = this.getVersions(projectId);
    return versions.find(v => v.id === versionId) || null;
  }
}

export const versionHistory = new VersionHistoryService();
