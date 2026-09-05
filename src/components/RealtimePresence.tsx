import React, { useState, useEffect } from 'react';
import { Users, Eye, Sparkles, Activity, Shield } from 'lucide-react';
import { UserSession } from '../types';

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'editor' | 'reviewer' | 'director' | 'sound_engineer';
  currentSceneId?: string;
  color: string;
  lastActiveTime?: number;
  isEditing: boolean;
  statusText?: string;
}

interface RealtimePresenceProps {
  projectId?: string;
  user: UserSession | null;
  currentSceneId?: string;
  onFocusScene?: (sceneId: string) => void;
}

export const RealtimePresence: React.FC<RealtimePresenceProps> = ({
  projectId = 'project_default',
  user,
  currentSceneId = 'scene-1',
  onFocusScene,
}) => {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [showTooltipUser, setShowTooltipUser] = useState<string | null>(null);

  // Send heartbeat and get active presence users
  const sendHeartbeat = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/realtime/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role === 'admin' ? 'director' : 'editor',
          currentSceneId,
          isEditing: true,
          statusText: `Editing Scene ${currentSceneId.replace('scene-', '#')}`,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.activeUsers)) {
        setActiveUsers(data.activeUsers);
      }
    } catch (e) {
      console.warn('Realtime presence heartbeat warning:', e);
    }
  };

  useEffect(() => {
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [projectId, user, currentSceneId]);

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-1.5 shadow-sm text-slate-200">
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-bold text-slate-300">
          {activeUsers.length || 1} Active
        </span>
      </div>

      {/* User Avatar Stack */}
      <div className="flex items-center -space-x-2 overflow-visible">
        {activeUsers.map(u => (
          <div
            key={u.id}
            className="relative group cursor-pointer"
            onMouseEnter={() => setShowTooltipUser(u.id)}
            onMouseLeave={() => setShowTooltipUser(null)}
            onClick={() => u.currentSceneId && onFocusScene && onFocusScene(u.currentSceneId)}
          >
            <img
              src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
              alt={u.name}
              className="w-7 h-7 rounded-full border-2 bg-slate-800 object-cover transition transform group-hover:scale-110 z-10"
              style={{ borderColor: u.color || '#10B981' }}
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-emerald-500"
              title="Online now"
            ></span>

            {/* Hover Tooltip */}
            {showTooltipUser === u.id && (
              <div className="absolute top-9 left-1/2 -translate-x-1/2 z-50 w-48 bg-slate-950 border border-slate-800 rounded-xl p-2.5 shadow-2xl text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white truncate">{u.name}</p>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold text-white"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.role}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>{u.statusText || 'Active in project'}</span>
                </p>
                {u.currentSceneId && (
                  <p className="text-[10px] text-rose-400 font-semibold pt-0.5">
                    Click to view {u.currentSceneId}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
