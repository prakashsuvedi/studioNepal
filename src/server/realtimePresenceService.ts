export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'editor' | 'reviewer' | 'director' | 'sound_engineer';
  currentSceneId?: string;
  color: string;
  lastActiveTime: number;
  isEditing: boolean;
  statusText?: string;
}

const COLOR_PALETTE = ['#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B', '#06B6D4'];

class RealtimePresenceService {
  private activeProjectUsers: Map<string, Map<string, PresenceUser>> = new Map();

  /**
   * Heartbeat to join or update presence in a project workspace
   */
  public updatePresence(projectId: string, user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    currentSceneId?: string;
    isEditing?: boolean;
    statusText?: string;
  }): PresenceUser[] {
    let projectRoom = this.activeProjectUsers.get(projectId);
    if (!projectRoom) {
      projectRoom = new Map();
      this.activeProjectUsers.set(projectId, projectRoom);
    }

    const existing = projectRoom.get(user.id);
    const colorIndex = Math.abs(user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % COLOR_PALETTE.length;

    const presenceUser: PresenceUser = {
      id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || user.email)}`,
      role: (user.role as any) || (existing?.role || 'editor'),
      currentSceneId: user.currentSceneId || existing?.currentSceneId || 'scene-1',
      color: COLOR_PALETTE[colorIndex],
      lastActiveTime: Date.now(),
      isEditing: user.isEditing ?? true,
      statusText: user.statusText || 'Editing Video Timeline',
    };

    projectRoom.set(user.id, presenceUser);

    // Prune stale users inactive for > 45 seconds
    const now = Date.now();
    for (const [uid, u] of projectRoom.entries()) {
      if (now - u.lastActiveTime > 45000 && uid !== user.id) {
        projectRoom.delete(uid);
      }
    }

    return Array.from(projectRoom.values());
  }

  /**
   * Get list of active presence users for a project
   */
  public getPresenceUsers(projectId: string): PresenceUser[] {
    const projectRoom = this.activeProjectUsers.get(projectId);
    if (!projectRoom) return [];

    const now = Date.now();
    const active: PresenceUser[] = [];
    for (const u of projectRoom.values()) {
      if (now - u.lastActiveTime <= 45000) {
        active.push(u);
      }
    }
    return active;
  }
}

export const realtimePresenceService = new RealtimePresenceService();
