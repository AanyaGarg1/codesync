import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  bio?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { token, user } = await authAPI.login({ email, password });
          localStorage.setItem('codesync_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { token, user } = await authAPI.register({ name, email, password });
          localStorage.setItem('codesync_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('codesync_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const token = localStorage.getItem('codesync_token');
        if (!token) return;
        try {
          const { user } = await authAPI.me();
          set({ user, token, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('codesync_token');
        }
      },
    }),
    {
      name: 'codesync-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Editor/Room store
interface RoomState {
  roomId: string | null;
  roomName: string;
  language: string;
  code: string;
  stdin: string;
  output: { stdout: string; stderr: string; exitCode: number | null; timeMs: number } | null;
  isRunning: boolean;
  connectedUsers: any[];
  activePanel: 'editor' | 'whiteboard' | 'interview';
  interviewMode: boolean;
  problemDescription: string;
  setRoom: (id: string, name: string) => void;
  setLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  setStdin: (stdin: string) => void;
  setOutput: (out: RoomState['output']) => void;
  setRunning: (v: boolean) => void;
  setUsers: (users: any[]) => void;
  setActivePanel: (panel: RoomState['activePanel']) => void;
  setInterviewMode: (v: boolean) => void;
  setProblemDescription: (v: string) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>()((set) => ({
  roomId: null,
  roomName: '',
  language: 'javascript',
  code: '// Welcome to CodeSync AI\nconsole.log("Hello, World!");\n',
  stdin: '',
  output: null,
  isRunning: false,
  connectedUsers: [],
  activePanel: 'editor',
  interviewMode: false,
  problemDescription: '',

  setRoom: (id, name) => set({ roomId: id, roomName: name }),
  setLanguage: (lang) => set({ language: lang }),
  setCode: (code) => set({ code }),
  setStdin: (stdin) => set({ stdin }),
  setOutput: (output) => set({ output }),
  setRunning: (v) => set({ isRunning: v }),
  setUsers: (users) => set({ connectedUsers: users }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setInterviewMode: (v) => set({ interviewMode: v }),
  setProblemDescription: (v) => set({ problemDescription: v }),
  reset: () =>
    set({
      roomId: null,
      roomName: '',
      language: 'javascript',
      code: '// Welcome to CodeSync AI\nconsole.log("Hello, World!");\n',
      output: null,
      connectedUsers: [],
      interviewMode: false,
      problemDescription: '',
    }),
}));
