'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-Time Collaboration',
    desc: 'Code together with live cursors, typing indicators, and conflict-free sync powered by WebSockets.',
    color: 'cyan',
  },
  {
    icon: '🤖',
    title: 'AI Coding Assistant',
    desc: 'Explain code, detect bugs, optimize algorithms, and get progressive interview hints via Gemini AI.',
    color: 'violet',
  },
  {
    icon: '🔒',
    title: 'Secure Sandbox Execution',
    desc: 'Run C++, Python, JavaScript, and Java in isolated environments with timeout and memory limits.',
    color: 'emerald',
  },
  {
    icon: '🎯',
    title: 'Technical Interview Mode',
    desc: 'Role-based sessions with timer, hidden test cases, AI feedback scorecard, and session replay.',
    color: 'rose',
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    desc: 'Track coding activity, language proficiency, collaboration stats, and AI usage over time.',
    color: 'amber',
  },
  {
    icon: '🖊️',
    title: 'Collaborative Whiteboard',
    desc: 'Sketch architectures, draw data structures, and brainstorm together in real time.',
    color: 'cyan',
  },
];

const CODE_SNIPPETS = [
  `// Two Sum — O(n) Hash Map Solution
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) return [map.get(comp), i];
    map.set(nums[i], i);
  }
}`,
  `# Binary Search — O(log n)
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target: return mid
        elif arr[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1`,
  `// Merge Sort — O(n log n)
const mergeSort = arr => {
  if (arr.length <= 1) return arr;
  const mid = arr.length >> 1;
  const L = mergeSort(arr.slice(0, mid));
  const R = mergeSort(arr.slice(mid));
  return merge(L, R);
};`,
];

function TypewriterCode() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const current = CODE_SNIPPETS[idx];
    if (charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, 18);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % CODE_SNIPPETS.length);
        setDisplayed('');
        setCharIdx(0);
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [charIdx, idx]);

  return (
    <pre className="font-mono text-sm leading-relaxed text-emerald-300 whitespace-pre-wrap break-words">
      {displayed}
      <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse" />
    </pre>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-[var(--border)]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
            CS
          </div>
          <span className="font-bold text-lg gradient-text">CodeSync AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#tech" className="hover:text-white transition-colors">Tech Stack</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
          <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navbar />

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 badge badge-violet">
                <span className="status-online" />
                Now Live — AI-Powered Platform
              </div>
              <h1 className="text-5xl lg:text-7xl font-black leading-none tracking-tight">
                <span className="gradient-text text-glow-violet">Code Together.</span>
                <br />
                <span className="text-white">Interview Smarter.</span>
                <br />
                <span className="text-[var(--text-secondary)] text-4xl lg:text-5xl font-bold">Ship Faster.</span>
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
                The only platform that combines <strong className="text-white">real-time collaborative coding</strong>,{' '}
                <strong className="text-white">AI-powered assistance</strong>, secure{' '}
                <strong className="text-white">sandbox execution</strong>, and a full{' '}
                <strong className="text-white">technical interview suite</strong> — in one stunning interface.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/register" className="btn-primary text-base px-8 py-3 gradient-border">
                  Start Coding Free →
                </Link>
                <Link href="/dashboard" className="btn-secondary text-base px-8 py-3">
                  View Dashboard
                </Link>
              </div>
              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                {[['4', 'Languages'], ['∞', 'Collaborators'], ['AI', 'Assistant'], ['0ms', 'Setup']].map(([val, label]) => (
                  <div key={label}>
                    <div className="text-2xl font-black gradient-text">{val}</div>
                    <div className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Code Editor Preview */}
            <div className="relative">
              <div className="gradient-border">
                <div className="glass-elevated rounded-xl overflow-hidden shadow-2xl glow-violet">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1 rounded text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                        room/algorithms-deep-dive
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {['A', 'B', 'C'].map((l) => (
                        <div
                          key={l}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white border-2 border-[var(--bg-card)]"
                        >
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Code area */}
                  <div className="p-6 min-h-64">
                    <TypewriterCode />
                  </div>
                  {/* Output bar */}
                  <div className="border-t border-[var(--border)] px-6 py-3 bg-[var(--bg-card)]">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-emerald">✓ Passed 3/3 tests</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">Runtime: 42ms · Memory: 18.2 MB</span>
                      <div className="ml-auto flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <span className="status-online" />
                        <span>3 collaborators</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating AI card */}
              <div className="absolute -bottom-8 -left-8 glass-elevated rounded-xl px-5 py-4 shadow-xl glow-cyan w-64">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-sm">🤖</div>
                  <span className="text-sm font-semibold">AI Assistant</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  This solution runs in <span className="text-emerald-400 font-mono">O(n)</span> time. Consider using a
                  sliding window for space optimization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <div className="badge badge-cyan mx-auto">Features</div>
            <h2 className="text-4xl lg:text-5xl font-black">
              Everything you need,<br />
              <span className="gradient-text">nothing you don&apos;t.</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              Built by engineers, for engineers. Every feature was designed to handle real-world complexity at scale.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-xl p-6 hover-lift group cursor-default border border-[var(--border)] hover:border-[var(--border-glow)] transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2 group-hover:gradient-text transition-all">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="relative py-24 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Powered by <span className="gradient-text">Modern Tech</span></h2>
            <p className="text-[var(--text-secondary)]">Production-grade stack used by top engineering teams worldwide.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              ['Next.js 15', 'violet'], ['TypeScript', 'cyan'], ['Socket.IO', 'emerald'],
              ['Prisma ORM', 'violet'], ['Gemini AI', 'cyan'], ['Monaco Editor', 'emerald'],
              ['Zustand', 'rose'], ['Tailwind CSS', 'cyan'], ['Node.js', 'emerald'],
              ['SQLite/PG', 'violet'], ['Docker', 'rose'], ['Express', 'amber'],
            ].map(([tech, color]) => (
              <div key={tech} className={`badge badge-${color} text-sm py-2 px-4 hover-lift cursor-default`}>
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="relative py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-elevated rounded-2xl p-12 gradient-border space-y-6">
            <div className="text-5xl">🚀</div>
            <h2 className="text-4xl font-black">
              Ready to <span className="gradient-text">level up</span>?
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
              Join thousands of engineers using CodeSync AI for collaboration, interview prep, and AI-powered coding sessions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register" className="btn-primary text-base px-10 py-4">
                Create Free Account →
              </Link>
              <Link href="/dashboard" className="btn-secondary text-base px-10 py-4">
                Explore Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">CS</div>
            <span className="font-bold gradient-text">CodeSync AI</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Built with ❤️ for engineers — {new Date().getFullYear()}
          </p>
          <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/auth/register" className="hover:text-white transition-colors">Register</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
