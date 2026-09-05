import React, { useState, useEffect } from 'react';
import { StudioWorkspace, WorkspaceFolder, WorkspaceMember } from '../types';
import { 
  Users, 
  FolderPlus, 
  Folder, 
  Plus, 
  Copy, 
  Check, 
  Mail, 
  ShieldCheck, 
  Edit3, 
  Eye, 
  Trash2, 
  X, 
  Briefcase, 
  Globe, 
  Sparkles,
  UserCheck
} from 'lucide-react';

export type Workspace = StudioWorkspace;

export const INITIAL_WORKSPACES: StudioWorkspace[] = [
  {
    id: 'ws_personal',
    name: 'Personal Studio',
    description: 'Private workspace for personal creative projects and experiments',
    icon: '👤',
    isDefault: true,
    createdAt: '2026-08-15',
    folders: [
      { id: 'fld_drafts', name: 'Drafts', color: 'indigo', projectCount: 4 },
      { id: 'fld_social', name: 'Social Clips', color: 'rose', projectCount: 2 },
    ],
    members: [
      {
        id: 'mem_self',
        name: 'Prakash Suvedi',
        email: 'prakashsuvedi.backup@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'owner',
        status: 'active',
        lastActive: 'Just now',
      },
    ],
  },
  {
    id: 'ws_tourism_nepal',
    name: 'Tourism Board Nepal',
    description: 'Collaborative campaigns for Visit Nepal, Everest heritage & Annapurna reels',
    icon: '🏔️',
    isDefault: false,
    createdAt: '2026-08-20',
    folders: [
      { id: 'fld_campaigns', name: 'National Campaigns', color: 'emerald', projectCount: 6 },
      { id: 'fld_drone', name: 'Cinematic Drone Footage', color: 'amber', projectCount: 8 },
      { id: 'fld_client_reviews', name: 'Client Revisions', color: 'purple', projectCount: 3 },
    ],
    members: [
      {
        id: 'mem_prakash',
        name: 'Prakash Suvedi',
        email: 'prakashsuvedi.backup@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'owner',
        status: 'active',
        lastActive: 'Active now',
      },
      {
        id: 'mem_aarav',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@nepalai.tech',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        role: 'editor',
        status: 'active',
        lastActive: '5m ago',
      },
      {
        id: 'mem_sunita',
        name: 'Sunita Thapa',
        email: 'sunita.review@tourism.gov.np',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        role: 'reviewer',
        status: 'active',
        lastActive: '12m ago',
      },
    ],
  },
  {
    id: 'ws_kathmandu_agency',
    name: 'Kathmandu Commercials',
    description: 'Commercial video studio for TV advertisements and agency productions',
    icon: '🎬',
    isDefault: false,
    createdAt: '2026-08-28',
    folders: [
      { id: 'fld_ads', name: 'TV Commercials', color: 'blue', projectCount: 5 },
      { id: 'fld_raw', name: 'Raw Takes', color: 'slate', projectCount: 12 },
    ],
    members: [
      {
        id: 'mem_prakash',
        name: 'Prakash Suvedi',
        email: 'prakashsuvedi.backup@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'owner',
        status: 'active',
        lastActive: 'Active now',
      },
      {
        id: 'mem_binod',
        name: 'Binod Shrestha',
        email: 'binod.video@agency.np',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        role: 'editor',
        status: 'active',
        lastActive: '2h ago',
      },
    ],
  },
];

export const DEFAULT_WORKSPACES = INITIAL_WORKSPACES;

interface WorkspacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspaceId?: string;
  onSelectWorkspace: (workspace: StudioWorkspace) => void;
}

export const WorkspacesModal: React.FC<WorkspacesModalProps> = ({
  isOpen,
  onClose,
  activeWorkspaceId,
  onSelectWorkspace,
}) => {
  const [workspaces, setWorkspaces] = useState<StudioWorkspace[]>(() => {
    const saved = localStorage.getItem('nepalai_workspaces');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_WORKSPACES;
      }
    }
    return INITIAL_WORKSPACES;
  });

  const [selectedWsId, setSelectedWsId] = useState<string>(
    activeWorkspaceId || workspaces[0]?.id || 'ws_personal'
  );

  // New workspace creation state
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsIcon, setNewWsIcon] = useState('📁');

  // New folder state
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'reviewer'>('editor');
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('nepalai_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  const activeWs = workspaces.find(w => w.id === selectedWsId) || workspaces[0];

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const newWs: StudioWorkspace = {
      id: `ws_${Date.now()}`,
      name: newWsName.trim(),
      description: newWsDesc.trim() || 'Shared team workspace',
      icon: newWsIcon || '📁',
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0],
      folders: [
        { id: `fld_${Date.now()}_1`, name: 'Drafts', color: 'indigo', projectCount: 0 },
        { id: `fld_${Date.now()}_2`, name: 'Final Renders', color: 'emerald', projectCount: 0 },
      ],
      members: [
        {
          id: `mem_${Date.now()}`,
          name: 'Prakash Suvedi',
          email: 'prakashsuvedi.backup@gmail.com',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          role: 'owner',
          status: 'active',
          lastActive: 'Active now',
        },
      ],
    };

    const updated = [...workspaces, newWs];
    setWorkspaces(updated);
    setSelectedWsId(newWs.id);
    setIsCreatingWs(false);
    setNewWsName('');
    setNewWsDesc('');
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !activeWs) return;

    const newFolder: WorkspaceFolder = {
      id: `fld_${Date.now()}`,
      name: newFolderName.trim(),
      color: 'indigo',
      projectCount: 0,
    };

    const updated = workspaces.map(w => {
      if (w.id === activeWs.id) {
        return {
          ...w,
          folders: [...w.folders, newFolder],
        };
      }
      return w;
    });

    setWorkspaces(updated);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWs) return;

    const newMember: WorkspaceMember = {
      id: `mem_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      role: inviteRole,
      status: 'invited',
      lastActive: 'Invitation sent',
    };

    const updated = workspaces.map(w => {
      if (w.id === activeWs.id) {
        return {
          ...w,
          members: [...w.members, newMember],
        };
      }
      return w;
    });

    setWorkspaces(updated);
    setInviteEmail('');
    setInviteSuccessMsg(`Invitation sent to ${newMember.email} with role: ${inviteRole.toUpperCase()}`);
    setTimeout(() => setInviteSuccessMsg(null), 4000);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `https://studio.nepalai.tech/join?ws=${activeWs.id}&role=${inviteRole}&token=${Date.now()}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Studio Workspaces & Collaboration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Shared project folders, permissions, and team editing suites</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Workspace Sidebar & Right Workspace Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {/* Left Column: Workspaces List */}
          <div className="md:col-span-4 space-y-3 border-r border-slate-100 dark:border-slate-800/80 pr-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Workspaces</span>
              <button
                onClick={() => setIsCreatingWs(!isCreatingWs)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Create Workspace Inline Form */}
            {isCreatingWs && (
              <form onSubmit={handleCreateWorkspace} className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Workspace Name"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newWsIcon}
                    onChange={(e) => setNewWsIcon(e.target.value)}
                    className="w-10 px-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                    title="Emoji Icon"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Short Description (optional)"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingWs(false)}
                    className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Workspaces List */}
            <div className="space-y-1.5">
              {workspaces.map((ws) => {
                const isSelected = ws.id === activeWs.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => setSelectedWsId(ws.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{ws.icon || '📁'}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{ws.name}</span>
                          {ws.isDefault && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {ws.folders.length} Folders • {ws.members.length} Members
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Workspace View, Folders & Collaboration */}
          <div className="md:col-span-8 space-y-5">
            {/* Workspace Title & Switch Button */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeWs.icon || '📁'}</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activeWs.name}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeWs.description}</p>
              </div>

              <button
                onClick={() => {
                  onSelectWorkspace(activeWs);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Switch to this Workspace</span>
              </button>
            </div>

            {/* Shared Project Folders */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Project Folders</span>
                </span>
                <button
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Folder</span>
                </button>
              </div>

              {/* Add Folder Form */}
              {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    placeholder="Folder name (e.g., Client Approvals, Social Reels)"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md"
                    autoFocus
                  />
                  <button type="submit" className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-md">
                    Add
                  </button>
                </form>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {activeWs.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition flex items-center gap-2.5"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{folder.name}</div>
                      <div className="text-[10px] text-slate-500">{folder.projectCount || 0} projects</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Members & Invite Collaboration */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Team Collaborators ({activeWs.members.length})</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Team Sync Active</span>
                </span>
              </div>

              {/* Invite Bar */}
              <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Enter teammate email to invite..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'reviewer')}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="editor">Editor (Can Edit)</option>
                  <option value="reviewer">Reviewer (View & Feedback)</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                  title="Copy direct invitation link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Link'}</span>
                </button>
              </form>

              {inviteSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{inviteSuccessMsg}</span>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-1.5">
                {activeWs.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{member.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            member.role === 'owner'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : member.role === 'editor'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{member.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-slate-400">{member.lastActive}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
