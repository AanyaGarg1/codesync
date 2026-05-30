import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeSync AI — Real-Time Collaborative Coding & Interview Platform',
  description:
    'CodeSync AI is a production-grade collaborative coding and technical interview platform with AI assistance, secure code execution, live collaboration, and advanced analytics.',
  keywords: ['collaborative coding', 'technical interview', 'AI coding assistant', 'real-time editor', 'code execution'],
  authors: [{ name: 'CodeSync AI' }],
  openGraph: {
    title: 'CodeSync AI',
    description: 'AI-Powered Real-Time Collaborative Coding Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060810] text-[#e8eaf2] antialiased">
        {children}
      </body>
    </html>
  );
}
