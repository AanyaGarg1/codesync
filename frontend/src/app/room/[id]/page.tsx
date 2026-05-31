'use client';

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import * as Y from 'yjs';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';
import { useAuthStore, useRoomStore } from '@/store';
import { roomsAPI, sandboxAPI, aiAPI } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import AuthGuard from '@/components/AuthGuard';

// Lazy load Monaco
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false, loading: () => <div className="flex-1 skeleton" /> });

const LANG_MAP: Record<string, string> = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
  java: 'java',
};

const LANG_IDS: Record<string, string> = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
  java: 'java',
};

// ── AI Panel ──────────────────────────────────────────────────────────────────
function AIPanel({ code, language, problemDescription }: { code: string; language: string; problemDescription: string }) {
  const [activeTab, setActiveTab] = useState<'explain' | 'optimize' | 'bug' | 'hint'>('explain');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const actions = [
    { key: 'explain', label: '📖 Explain', fn: () => aiAPI.explain(code, language).then((r) => r.explanation) },
    { key: 'optimize', label: '⚡ Optimize', fn: () => aiAPI.optimize(code, language).then((r) => r.optimization) },
    { key: 'bug', label: '🐛 Detect Bugs', fn: () => aiAPI.bug(code, language).then((r) => r.report) },
    { key: 'hint', label: '💡 Hint', fn: () => aiAPI.hint(code, language, problemDescription || 'general coding problem').then((r) => r.hint) },
  ] as const;

  const run = async (fn: () => Promise<string>, key: string) => {
    setActiveTab(key as any);
    setLoading(true);
    setOutput('');
    try {
      const result = await fn();
      setOutput(result);
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="text-base">🤖</span> AI Assistant
        <span className="badge badge-violet ml-auto">Gemini</span>
      </div>
      <div className="flex border-b border-[var(--border)]">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => run(a.fn, a.key)}
            className={`px-3 py-2 text-xs font-medium transition-colors flex-1 ${activeTab === a.key ? 'text-violet-400 border-b-2 border-violet-500' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-4 rounded" style={{ width: `${Math.random() * 40 + 60}%` }} />)}
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-4">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Gemini AI is thinking...
            </div>
          </div>
        ) : output ? (
          <div className="prose-dark text-sm whitespace-pre-wrap leading-relaxed font-mono text-xs">{output}</div>
        ) : (
          <div className="text-center text-[var(--text-muted)] text-sm mt-8">
            <div className="text-3xl mb-3">🤖</div>
            <p>Select an AI action above to analyze your code.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Terminal Panel ──────────────────────────────────────────────────────────
function TerminalPanel({ code, language }: { code: string; language: string }) {
  const { stdin, setStdin, output, setOutput, isRunning, setRunning } = useRoomStore();

  const run = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const result = await sandboxAPI.run({ code, language, stdin });
      setOutput(result);
    } catch (err: any) {
      setOutput({ stdout: '', stderr: err.message, exitCode: -1, timeMs: 0 });
    }
    setRunning(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span>▶</span> Terminal
        {output && (
          <span className={`badge ml-2 ${output.exitCode === 0 ? 'badge-emerald' : 'badge-rose'}`}>
            {output.exitCode === 0 ? '✓ Success' : '✕ Error'} · {output.timeMs}ms
          </span>
        )}
        <button
          id="run-code-btn"
          onClick={run}
          disabled={isRunning}
          className="ml-auto btn-primary text-xs px-3 py-1.5 disabled:opacity-60"
        >
          {isRunning ? (
            <span className="flex items-center gap-1.5"><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Running...</span>
          ) : '▶ Run'}
        </button>
      </div>
      <div className="flex-1 overflow-auto font-mono text-xs p-4 space-y-3">
        {/* Stdin */}
        <div>
          <div className="text-[var(--text-muted)] mb-1">STDIN</div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Optional input..."
            rows={2}
            className="input-field text-xs font-mono resize-none"
          />
        </div>
        {/* Output */}
        {output && (
          <>
            {output.stdout && (
              <div>
                <div className="text-emerald-400 mb-1">STDOUT</div>
                <pre className="bg-[var(--bg-card)] rounded-lg p-3 text-emerald-300 whitespace-pre-wrap break-all">{output.stdout}</pre>
              </div>
            )}
            {output.stderr && (
              <div>
                <div className="text-rose-400 mb-1">STDERR</div>
                <pre className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 text-rose-300 whitespace-pre-wrap break-all">{output.stderr}</pre>
              </div>
            )}
          </>
        )}
        {!output && !isRunning && (
          <div className="text-center text-[var(--text-muted)] py-8">
            <div className="text-2xl mb-2">▶</div>
            <p>Press Run to execute your code</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chat Panel ──────────────────────────────────────────────────────────────
function ChatPanel({ roomId, socket, user }: { roomId: string; socket: any; user: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive-message', (msg: any) => setMessages((m) => [...m, msg]));
    socket.on('room-state', ({ chatHistory }: any) => setMessages(chatHistory || []));
    return () => { socket.off('receive-message'); socket.off('room-state'); };
  }, [socket]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send-message', { roomId, message: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header"><span>💬</span> Chat</div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.senderId === user?.id ? 'flex-row-reverse' : ''}`}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {m.senderName?.[0] || '?'}
            </div>
            <div className={`max-w-[80%] ${m.senderId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="text-xs text-[var(--text-muted)] mb-1">{m.senderName} · {m.timestamp}</div>
              <div className={`px-3 py-2 rounded-xl text-sm ${m.senderId === user?.id ? 'bg-violet-600/30 text-violet-100' : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'}`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-[var(--border)] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="input-field text-sm py-2 flex-1"
        />
        <button onClick={send} className="btn-primary text-xs px-3 py-2">Send</button>
      </div>
    </div>
  );
}

// ── Whiteboard ──────────────────────────────────────────────────────────────
function WhiteboardPanel({ roomId, socket }: { roomId: string; socket: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#a78bfa');
  const [size, setSize] = useState(3);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback((x: number, y: number, color: string, size: number, fromX?: number, fromY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (fromX !== undefined && fromY !== undefined) ctx.moveTo(fromX, fromY);
    else ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('whiteboard-update', (action: any) => {
      draw(action.x, action.y, action.color, action.size, action.fromX, action.fromY);
    });
    socket.on('whiteboard-cleared', () => {
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    });
    socket.on('room-state', ({ whiteboardData }: any) => {
      if (whiteboardData?.length) {
        whiteboardData.forEach((a: any) => draw(a.x, a.y, a.color, a.size, a.fromX, a.fromY));
      }
    });
    return () => { socket.off('whiteboard-update'); socket.off('whiteboard-cleared'); };
  }, [socket, draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !lastPos.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const action = { x, y, fromX: lastPos.current.x, fromY: lastPos.current.y, color, size };
    draw(x, y, color, size, lastPos.current.x, lastPos.current.y);
    socket?.emit('whiteboard-draw', { roomId, drawAction: action });
    lastPos.current = { x, y };
  };

  const handleMouseUp = () => { setDrawing(false); lastPos.current = null; };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    socket?.emit('whiteboard-clear', { roomId });
  };

  const colors = ['#a78bfa', '#67e8f9', '#6ee7b7', '#fda4af', '#fcd34d', '#ffffff'];

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span>🖊️</span> Whiteboard
        <div className="ml-auto flex items-center gap-2">
          {colors.map((c) => (
            <button key={c} onClick={() => setColor(c)} className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110" style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }} />
          ))}
          <input type="range" min={1} max={10} value={size} onChange={(e) => setSize(+e.target.value)} className="w-16 accent-violet-500" />
          <button onClick={clearBoard} className="btn-secondary text-xs px-2 py-1">Clear</button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ background: 'var(--bg-card)' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}

// ── Main Room Page ──────────────────────────────────────────────────────────
export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user } = useAuthStore();
  const {
    code, setCode, language, setLanguage, setRoom, connectedUsers, setUsers, activePanel, setActivePanel,
    problemDescription, setProblemDescription, reset
  } = useRoomStore();

  const [room, setRoomData] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rightPanel, setRightPanel] = useState<'ai' | 'chat' | 'whiteboard'>('ai');
  const [showInterviewFeedback, setShowInterviewFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [fetchingFeedback, setFetchingFeedback] = useState(false);
  const [timer, setTimer] = useState(0);
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [interviewState, setInterviewState] = useState<{ active: boolean; startedAt: number | null; problemDescription: string; hostId: string }>({
    active: false,
    startedAt: null,
    problemDescription: '',
    hostId: '',
  });
  const [isInterviewer, setIsInterviewer] = useState(false);
  const timerRef = useRef<any>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  const initializeYjs = () => {
    if (yDocRef.current && awarenessRef.current) return;

    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);
    awareness.setLocalStateField('user', {
      id: user?.id,
      name: user?.name,
      avatarUrl: user?.avatarUrl,
      color: '#8b5cf6',
    });

    ydoc.on('update', (update, origin) => {
  if (origin !== socketRef.current) {
    socketRef.current?.emit('yjs-update', { roomId, update });
  }
});

    awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      if (!socketRef.current) return;
      const clients = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(awareness, clients);
      if (update.byteLength > 0) {
        socketRef.current.emit('awareness-update', { roomId, update });
      }
    });

    yDocRef.current = ydoc;
    awarenessRef.current = awareness;
  };

 const attachMonacoBinding = async (editor: any) => {
  if (!yDocRef.current || !awarenessRef.current || !editor) return;
  if (bindingRef.current) return;

  const { MonacoBinding } = await import('y-monaco');
  const yText = yDocRef.current.getText('monaco');

  bindingRef.current = new MonacoBinding(
    yText,
    editor.getModel(),
    new Set([editor]),
    awarenessRef.current
  );

  setCode(yText.toString());

  // ✅ ADD THIS — keep store in sync as editor content changes
  yText.observe(() => {
    setCode(yText.toString());
  });
};
  useEffect(() => {
    loadRoom();
    return () => {
      disconnectSocket();
      reset();
      setSocket(null);
    };
  }, [roomId]);

  useEffect(() => {
    if (!room || !user) return;
    const s = connectSocket();
    socketRef.current = s;
    setSocket(s);

    const joinRoom = () => {
      initializeYjs();
      s.emit('join-room', {
        roomId,
        userId: user?.id,
        name: user?.name,
        avatarUrl: user?.avatarUrl,
        awarenessClientId: yDocRef.current?.clientID,
      });
    };

    if (s.connected) {
      joinRoom();
    }
    s.on('connect', joinRoom);

    s.on('room-state', ({ language: l, users, interviewState }: any) => {
      if (l) setLanguage(l);
      if (users) setUsers(users);
      if (interviewState) {
        setInterviewState(interviewState);
        setProblemDescription(interviewState.problemDescription || '');
        setIsInterviewer(interviewState.hostId === user?.id);
      }
    });

    s.on('yjs-sync', (update: ArrayBuffer) => {
      const ydoc = yDocRef.current;
      if (!ydoc) return;
      Y.applyUpdate(ydoc, new Uint8Array(update), s);
    });

    s.on('yjs-update', (update: ArrayBuffer) => {
      const ydoc = yDocRef.current;
      if (!ydoc) return;
      Y.applyUpdate(ydoc, new Uint8Array(update), s);
    });

    s.on('awareness-sync', (update: ArrayBuffer) => {
      const awareness = awarenessRef.current;
      if (!awareness) return;
      applyAwarenessUpdate(awareness, new Uint8Array(update), s);
    });

    s.on('awareness-update', (update: ArrayBuffer) => {
      const awareness = awarenessRef.current;
      if (!awareness) return;
      applyAwarenessUpdate(awareness, new Uint8Array(update), s);
    });

    s.on('language-update', (l: string) => setLanguage(l));
    s.on('presence-update', (users: any[]) => setUsers(users));
    s.on('interview-state', (state: any) => {
      setInterviewState(state);
      setProblemDescription(state.problemDescription || '');
      setIsInterviewer(state.hostId === user?.id);
    });

    return () => {
      s.off('connect', joinRoom);
      s.off('room-state');
      s.off('yjs-sync');
      s.off('yjs-update');
      s.off('awareness-sync');
      s.off('awareness-update');
      s.off('language-update');
      s.off('presence-update');
      s.off('interview-state');
    };
  }, [room, user]);

  // Interview timer
  useEffect(() => {
    if (interviewState.active && interviewState.startedAt) {
      setTimer(Math.max(0, Math.floor((Date.now() - interviewState.startedAt) / 1000)));
      timerRef.current = setInterval(() => {
        setTimer(Math.max(0, Math.floor((Date.now() - (interviewState.startedAt || Date.now())) / 1000)));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [interviewState.active, interviewState.startedAt]);

  const loadRoom = async (enteredPasscode?: string) => {
    setLoading(true);
    setPasscodeError('');
    try {
      const { room: r } = await roomsAPI.get(roomId, enteredPasscode);
      setRoomData(r);
      setRoom(r.id, r.name);
      setLanguage(r.language);
      setPasscodeRequired(false);
      setPasscode('');
      if (r.host?.id && user?.id) {
        setIsInterviewer(r.host.id === user.id);
      }
    } catch (err: any) {
      if (err.passcodeRequired) {
        setPasscodeRequired(true);
      } else {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditorMount = async(editor: any) => {
    editorRef.current = editor;
    initializeYjs();
   await attachMonacoBinding(editor);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    socket?.emit('language-change', { roomId, language: lang });
  };

  const handlePasscodeSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!passcode.trim()) {
      setPasscodeError('Passcode is required to enter this room.');
      return;
    }
    await loadRoom(passcode.trim());
  };

 const endInterview = async () => {
  setFetchingFeedback(true);
  
  // ✅ Emit end to all users first
  socket?.emit('interview-end', { roomId });
  
  try {
    const durationSeconds = interviewState.startedAt ? Math.floor((Date.now() - interviewState.startedAt) / 1000) : 0;
    const result = await aiAPI.feedback({
      code,
      language,
      problemDescription: problemDescription || 'General coding problem — evaluate code quality and approach.',
      roomId,
      // ✅ pass code as history snapshot
      history: JSON.stringify([{ timestamp: new Date().toISOString(), code }]),
      duration: durationSeconds,
    });
    setFeedbackData(result);
    setShowInterviewFeedback(true);
  } catch {
    setFeedbackData({ text: 'Could not generate feedback at this time.', rating: 3 });
    setShowInterviewFeedback(true);
  }
  
  setFetchingFeedback(false);
  setInterviewState((prev) => ({ ...prev, active: false }));
};
  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 mx-auto flex items-center justify-center text-xl">CS</div>
        <div className="text-[var(--text-secondary)] text-sm">Loading room...</div>
      </div>
    </div>
  );

  if (passcodeRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060810] text-white px-4">
        <div className="glass-elevated w-full max-w-md rounded-3xl p-8 border border-[var(--border)]">
          <h2 className="text-2xl font-bold mb-2">Enter room passcode</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">This room is private. Enter the passcode shared by the host to join.</p>
          {passcodeError && <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-300 mb-4">{passcodeError}</div>}
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Passcode</label>
              <input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className="input-field w-full"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1 py-3">Join room</button>
              <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary flex-1 py-3">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-deep)]">
      {/* Top bar */}
      <header className="glass border-b border-[var(--border)] flex items-center gap-3 px-4 py-2.5 flex-shrink-0">
        <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-white text-lg">←</Link>
        <div className="w-px h-5 bg-[var(--border)]" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">CS</div>
          <span className="font-semibold text-sm">{room?.name || 'Room'}</span>
        </div>

        {/* Language selector */}
        <div className="ml-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="input-field text-xs py-1.5 w-36 cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>

        {/* Panel toggles */}
        <div className="flex border border-[var(--border)] rounded-lg overflow-hidden ml-2">
          {(['editor', 'whiteboard'] as const).map((p) => (
            <button key={p} onClick={() => setActivePanel(p === 'editor' ? 'editor' : 'whiteboard')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${activePanel === p || (p === 'editor' && activePanel !== 'whiteboard') ? 'bg-violet-600/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-white'}`}>
              {p === 'editor' ? '⌨ Editor' : '🖊 Board'}
            </button>
          ))}
        </div>

        {/* Interview mode */}
        <div className="flex items-center gap-2 ml-auto">
          {interviewState.active && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 font-mono text-sm font-bold">{formatTimer(timer)}</span>
            </div>
          )}
          <button
            id="interview-mode-btn"
            onClick={() => {
              if (!isInterviewer) return;
              if (interviewState.active) {
                endInterview(); // ✅ already emits interview-end inside
              } else {
                const defaultProblem = 'Solve a coding problem using a clean and efficient algorithm. Share the approach and assumptions in comments where helpful.';
                const problem = problemDescription.trim() || defaultProblem;
                setProblemDescription(problem);
                socket?.emit('interview-start', {
                  roomId,
                  problemDescription: problem,
                });
              }
            }}
            disabled={fetchingFeedback || (!isInterviewer && !interviewState.active)}
            className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all ${interviewState.active ? 'bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30' : 'btn-secondary'}`}
          >
            {fetchingFeedback ? '⏳ Analyzing...' : interviewState.active ? (isInterviewer ? '⏹ End Interview' : '⏳ In Session') : '🎯 Start Interview'}
          </button>
        </div>

        {/* User presence */}
        <div className="flex -space-x-2 ml-2">
          {connectedUsers.slice(0, 4).map((u) => (
            <div key={u.socketId} title={u.name} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white border-2 border-[var(--bg-base)]">
              {u.name?.[0] || '?'}
            </div>
          ))}
          {connectedUsers.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-medium border-2 border-[var(--bg-base)]">+{connectedUsers.length - 4}</div>
          )}
        </div>
      </header>

      {/* Interview problem bar */}
      {interviewState.active && (
        <div className="bg-violet-600/10 border-b border-violet-600/20 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Problem</span>
          <input
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Describe the interview problem here (e.g. Two Sum, Longest Substring without Repeating Characters)..."
            readOnly={!isInterviewer}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-[var(--text-muted)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
          />
          {!isInterviewer && (
            <div className="text-[var(--text-muted)] text-xs">Problem statement visible to all participants.</div>
          )}
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor or Whiteboard */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-[var(--border)]">
          {activePanel === 'whiteboard' ? (
            <WhiteboardPanel roomId={roomId} socket={socket} />
          ) : (
            <MonacoEditor
              height="100%"
              language={LANG_IDS[language] || 'javascript'}
              defaultValue={code}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'gutter',
                padding: { top: 16, bottom: 16 },
                bracketPairColorization: { enabled: true },
              }}
            />
          )}

          {/* Terminal */}
          <div className="h-52 border-t border-[var(--border)] flex-shrink-0 overflow-hidden">
            <TerminalPanel code={code} language={language} />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          {/* Right panel tabs */}
          <div className="flex border-b border-[var(--border)] flex-shrink-0">
            {(['ai', 'chat', 'whiteboard'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setRightPanel(tab); if (tab === 'whiteboard') setActivePanel('whiteboard'); }}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${rightPanel === tab ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-600/5' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              >
                {tab === 'ai' ? '🤖 AI' : tab === 'chat' ? '💬 Chat' : '🖊 Board'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'ai' && <AIPanel code={code} language={language} problemDescription={problemDescription} />}
            {rightPanel === 'chat' && <ChatPanel roomId={roomId} socket={socket} user={user} />}
            {rightPanel === 'whiteboard' && <WhiteboardPanel roomId={roomId} socket={socket} />}
          </div>
        </div>
      </div>

      {/* Interview Feedback Modal */}
      {showInterviewFeedback && feedbackData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-elevated rounded-2xl p-8 w-full max-w-lg border border-violet-600/30 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">🎯 Interview Feedback</h2>
              <div className="text-4xl font-black gradient-text">{feedbackData.rating?.toFixed(1)}<span className="text-lg text-[var(--text-secondary)]">/5</span></div>
            </div>
            <div className="prose-dark text-sm whitespace-pre-wrap leading-relaxed bg-[var(--bg-card)] rounded-xl p-4 max-h-64 overflow-auto">
              {feedbackData.text}
            </div>
            <button onClick={() => setShowInterviewFeedback(false)} className="btn-primary w-full py-3">Close →</button>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
