'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { roomsAPI, analyticsAPI, interviewAPI } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: 'badge-amber',
  python: 'badge-cyan',
  cpp: 'badge-violet',
  java: 'badge-rose',
};

function Sidebar({ user, activeSection, onSectionChange, onNewRoom, onLogout }: { user: any; activeSection: 'rooms' | 'analytics' | 'interviews'; onSectionChange: (section: 'rooms' | 'analytics' | 'interviews') => void; onNewRoom: () => void; onLogout: () => void }) {
  const links = [
    { icon: '📁', label: 'My Rooms', section: 'rooms' as const },
    { icon: '📊', label: 'Analytics', section: 'analytics' as const },
    { icon: '🎯', label: 'Interviews', section: 'interviews' as const },
  ];

  return (
    <aside className="w-56 flex-shrink-0 glass border-r border-[var(--border)] flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">CS</div>
          <span className="font-bold gradient-text text-sm">CodeSync AI</span>
        </div>
      </div>
      <nav className="p-3 flex-1 space-y-1">
        <button onClick={onNewRoom} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full text-left font-medium text-[var(--text-secondary)] hover:text-white hover:bg-white/5">
          <span className="text-base">⊞</span>
          <span>New Room</span>
        </button>
        {links.map((l) => (
          <button
            key={l.label}
            onClick={() => onSectionChange(l.section)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full text-left font-medium ${activeSection === l.section ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
          >
            <span className="text-base">{l.icon}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0] || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={onLogout} className="btn-secondary w-full mt-2 text-xs py-2">Sign Out</button>
      </div>
    </aside>
  );
}

function StatsCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="glass rounded-xl p-5 hover-lift border border-[var(--border)] hover:border-[var(--border-glow)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`badge badge-${color} text-xs`}>{label}</span>
      </div>
      <div className="text-3xl font-black gradient-text">{value}</div>
    </div>
  );
}

function CreateRoomModal({ onClose, onCreate }: { onClose: () => void; onCreate: (room: any) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isPublic, setIsPublic] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { room } = await roomsAPI.create({ name, description, language, isPublic, passcode: isPublic ? undefined : passcode || undefined });
      onCreate(room);
    } catch (err: any) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-elevated rounded-2xl p-8 w-full max-w-md space-y-5 border border-[var(--border-glow)]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Create New Room</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-xl">✕</button>
        </div>
        {error && <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Room Name *</label>
            <input id="room-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Algorithm Practice" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label>
            <input id="room-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you working on?" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Language</label>
            <select id="room-lang" value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field cursor-pointer">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsPublic(!isPublic)} className={`w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-violet-600' : 'bg-[var(--border-glow)]'} relative`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">{isPublic ? 'Public room' : 'Private room'}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Passcode</label>
            <input
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Optional passcode for private room"
              className="input-field"
              disabled={isPublic}
            />
            <div className="text-xs text-[var(--text-muted)] mt-1">
              If this room is private, enter a passcode to require authentication before joining.
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading} id="create-room-btn" className="btn-primary flex-1 py-2.5">
              {loading ? 'Creating...' : 'Create Room →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [interviewSessions, setInterviewSessions] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<'rooms' | 'analytics' | 'interviews'>('rooms');

  useEffect(() => {
    if (!user) return;
    loadRooms();
    loadAnalytics();
    loadInterviews();
  }, [user?.id]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const { rooms: r } = await roomsAPI.list();
      setRooms(r);
    } catch { /* show empty state */ }
    setLoadingRooms(false);
  };

  const loadAnalytics = async () => {
    try {
      const data = await analyticsAPI.dashboard();
      setAnalytics(data);
    } catch { /* ignore */ }
  };

  const loadInterviews = async () => {
    try {
      const data = await interviewAPI.list();
      setInterviewSessions(data.sessions || []);
    } catch { /* ignore */ }
  };

  const handleLogout = () => { logout(); router.push('/'); };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar user={user} activeSection={activeSection} onSectionChange={(section) => {
          setActiveSection(section);
          document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth' });
        }} onNewRoom={() => {
          setActiveSection('rooms');
          setShowCreateModal(true);
        }} onLogout={handleLogout} />

        <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass border-b border-[var(--border)] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Welcome back, <span className="gradient-text">{user?.name || 'Engineer'}</span> 👋</h1>
            <p className="text-sm text-[var(--text-muted)]">Let&apos;s build something great today.</p>
          </div>
          <button id="new-room-btn" onClick={() => { setActiveSection('rooms'); setShowCreateModal(true); }} className="btn-primary px-5 py-2.5 text-sm">
            + New Room
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats */}
          <div id="section-analytics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Problems" value={analytics?.problemsSolved ?? '—'} icon="⚡" color="violet" />
            <StatsCard label="Lines Written" value={analytics?.totalLines ? `${(analytics.totalLines / 1000).toFixed(1)}k` : '—'} icon="📝" color="cyan" />
            <StatsCard label="Active Days" value={analytics?.activeDays ?? '—'} icon="🔥" color="emerald" />
            <StatsCard label="Snippets" value={analytics?.snippetsSaved ?? '—'} icon="📎" color="amber" />
          </div>

          {/* Language usage */}
          {analytics?.languageStats && Object.keys(analytics.languageStats).length > 0 && (
            <div className="glass rounded-xl p-6 border border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Language Usage</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(analytics.languageStats).map(([lang, count]) => (
                  <div key={lang} className={`badge ${LANGUAGE_COLORS[lang] || 'badge-violet'} text-sm py-1.5 px-4`}>
                    {lang} · {count as number} runs
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          <div id="section-rooms">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Coding Rooms</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms..."
                className="input-field w-56 text-sm py-2"
              />
            </div>

            {loadingRooms ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton h-36 rounded-xl" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center border border-[var(--border)]">
                <div className="text-4xl mb-4">🔭</div>
                <h3 className="text-lg font-bold mb-2">No rooms yet</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-6">Create your first collaborative coding room to get started.</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary px-6 py-2.5 text-sm">Create Room →</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                  <div key={room.id} className="glass rounded-xl p-5 border border-[var(--border)] hover:border-[var(--border-glow)] hover-lift group transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate group-hover:gradient-text transition-all">{room.name}</h3>
                        {room.description && <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{room.description}</p>}
                      </div>
                      <span className={`badge ${LANGUAGE_COLORS[room.language] || 'badge-violet'} ml-2 flex-shrink-0`}>{room.language}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        {room.host?.avatarUrl && <img src={room.host.avatarUrl} alt="" className="w-5 h-5 rounded-full" />}
                        <span>{room.host?.name}</span>
                      </div>
                      <Link href={`/room/${room.id}`} id={`open-room-${room.id}`} className="btn-primary text-xs px-4 py-1.5">
                        Open →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Interviews */}
          <div id="section-interviews">
            <h2 className="text-lg font-bold mb-4">Recent Interview Sessions</h2>
            {analytics?.interviews?.length > 0 ? (
              <div className="space-y-3">
                {analytics.interviews.slice(0, 5).map((iv: any) => (
                  <div key={iv.id} className="glass rounded-xl px-5 py-4 border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{iv.problemTitle}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        {new Date(iv.date).toLocaleDateString()} · {iv.language}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-black gradient-text">{iv.rating.toFixed(1)}</div>
                        <div className="text-xs text-[var(--text-muted)]">/ 5.0</div>
                      </div>
                      <span className={`badge ${iv.rating >= 4 ? 'badge-emerald' : iv.rating >= 3 ? 'badge-amber' : 'badge-rose'}`}>
                        {iv.rating >= 4 ? 'Great' : iv.rating >= 3 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-8 border border-[var(--border)] text-center text-sm text-[var(--text-secondary)]">
                No interview sessions have been recorded yet.
                <div className="mt-3">Start an interview from a room to see feedback sessions here.</div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(room) => {
            setShowCreateModal(false);
            loadRooms();
            router.push(`/room/${room.id}`);
          }}
        />
      )}
    </div>
    </AuthGuard>
  );
}
