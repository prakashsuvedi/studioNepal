import React, { useState, useEffect } from 'react';
import { Users, Activity } from 'lucide-react';
import { UserSession } from '../types';

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>(() => {
    if (user) {
      return [{
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role === 'admin' ? 'director' : 'editor',
        color: '#10B981',
        isEditing: true,
        currentSceneId,
        statusText: `Editing Scene ${currentSceneId.replace('scene-', '#')}`,
      }];
    }
    return [];
  });
  const [showTooltipUser, setShowTooltipUser] = useState<string | null>(null);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

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
      if (data.success && Array.isArray(data.activeUsers) && data.activeUsers.length > 0) {
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

  const displayUsers = activeUsers.length > 0 ? activeUsers : (user ? [{
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: (user.role === 'admin' ? 'director' : 'editor') as PresenceUser['role'],
    color: '#10B981',
    isEditing: true,
    currentSceneId,
    statusText: 'Active in project',
  }] : []);

  return (
    <div className="relative inline-flex items-center shrink-0">
      <div 
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-colors shadow-2xs shrink-0 cursor-default"
        title="Live project collaboration presence"
      >
        {/* Pulsing Live Online Indicator */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-slate-700 shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 shrink-0 whitespace-nowrap">
            {displayUsers.length} Online
          </span>
        </div>

        {/* User Avatar Stack with Guaranteed Geometry & Fallback Initials */}
        <div className="flex items-center -space-x-1.5 overflow-visible shrink-0">
          {displayUsers.map(u => {
            const hasImgError = avatarErrors[u.id];
            const initial = (u.name || 'U').charAt(0).toUpperCase();

            return (
              <div
                key={u.id}
                className="relative group cursor-pointer shrink-0"
                onMouseEnter={() => setShowTooltipUser(u.id)}
                onMouseLeave={() => setShowTooltipUser(null)}
                onClick={() => u.currentSceneId && onFocusScene && onFocusScene(u.currentSceneId)}
              >
                {u.avatar && !hasImgError ? (
                  <img
                    src={u.avatar}
                    alt={u.name}
                    onError={() => setAvatarErrors(prev => ({ ...prev, [u.id]: true }))}
                    className="w-5 h-5 rounded-full ring-2 ring-emerald-500/80 bg-slate-100 dark:bg-slate-800 object-cover transition transform group-hover:scale-115 shrink-0"
                  />
                ) : (
                  <div 
                    className="w-5 h-5 rounded-full ring-2 ring-emerald-500/80 bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center transition transform group-hover:scale-115 shrink-0 shadow-2xs"
                  >
                    {initial}
                  </div>
                )}

                {/* Tooltip on Hover */}
                {showTooltipUser === u.id && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xl text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100 text-slate-900 dark:text-slate-100 pointer-events-none">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs truncate text-slate-900 dark:text-white">{u.name}</p>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold text-white shrink-0"
                        style={{ backgroundColor: u.color || '#10B981' }}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{u.statusText || 'Active in project'}</span>
                    </p>
                    {u.currentSceneId && (
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold pt-0.5">
                        Focused on {u.currentSceneId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
