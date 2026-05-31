const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('codesync_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    let data: any;

    try {
      data = await res.json();
    } catch {
      if (!res.ok) throw new Error('Request failed');
      return {} as T;
    }

    if (!res.ok) {
      const error = new Error(data.error || 'Request failed') as Error & { status?: number; passcodeRequired?: boolean };
      error.status = res.status;
      if (data.passcodeRequired) {
        error.passcodeRequired = true;
      }
      throw error;
    }
    return data as T;
  } catch (err: any) {
    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:4000');
    }
    throw err;
  }
}

// Auth
export const authAPI = {
  register: (body: { email: string; password: string; name: string }) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<{ user: any }>('/auth/me'),
};

// Rooms
export const roomsAPI = {
  list: (params?: { search?: string; language?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<{ rooms: any[] }>(`/rooms${qs}`);
  },
  get: (id: string, passcode?: string) => {
    const qs = passcode ? `?passcode=${passcode}` : '';
    return request<{ room: any }>(`/rooms/${id}${qs}`);
  },
  create: (body: { name: string; description?: string; language?: string; isPublic?: boolean; passcode?: string }) =>
    request<{ room: any }>('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request<{ message: string }>(`/rooms/${id}`, { method: 'DELETE' }),
};

// Sandbox
export const sandboxAPI = {
  run: (body: { code: string; language: string; stdin?: string }) =>
    request<{ stdout: string; stderr: string; exitCode: number | null; timeMs: number }>('/sandbox/run', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// AI
export const aiAPI = {
  explain: (code: string, language: string) =>
    request<{ explanation: string }>('/ai/explain', { method: 'POST', body: JSON.stringify({ code, language }) }),
  optimize: (code: string, language: string) =>
    request<{ optimization: string }>('/ai/optimize', { method: 'POST', body: JSON.stringify({ code, language }) }),
  bug: (code: string, language: string) =>
    request<{ report: string }>('/ai/bug', { method: 'POST', body: JSON.stringify({ code, language }) }),
  hint: (code: string, language: string, problemDescription: string) =>
    request<{ hint: string }>('/ai/hint', {
      method: 'POST',
      body: JSON.stringify({ code, language, problemDescription }),
    }),
  feedback: (body: { code: string; language: string; problemDescription: string; history?: string; roomId?: string; duration?: number }) =>
    request<{ text: string; rating: number }>('/ai/feedback', { method: 'POST', body: JSON.stringify(body) }),
};

// Analytics
export const analyticsAPI = {
  dashboard: () =>
    request<{
      problemsSolved: number;
      totalLines: number;
      activeDays: number;
      languageStats: Record<string, number>;
      aiTokensUsed: number;
      snippetsSaved: number;
      interviews: any[];
    }>('/analytics/dashboard'),
};
