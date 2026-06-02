import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/auth';
import { createRoom, getRooms, getRoomById, updateRoomCode, deleteRoom } from '../controllers/room';
import { getInterviewReport, getUserInterviews, saveInterviewerFeedback } from '../controllers/interview';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { executeCode } from '../services/sandbox';
import {
  getAIExplanation,
  getAIOptimization,
  detectBugs,
  getInterviewHint,
  getInterviewFeedback,
} from '../services/ai';
import prisma from '../config/db';

const router = Router();

// ==========================================
// Authentication Routes
// ==========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateJWT as any, getCurrentUser as any);

// ==========================================
// Collaboration Room Routes
// ==========================================
router.post('/rooms', authenticateJWT as any, createRoom as any);
router.get('/rooms', authenticateJWT as any, getRooms as any);
router.get('/rooms/:id', authenticateJWT as any, getRoomById as any);
router.put('/rooms/:id', authenticateJWT as any, updateRoomCode as any);
router.delete('/rooms/:id', authenticateJWT as any, deleteRoom as any);

// ==========================================
// Secure Code Sandbox Route
// ==========================================
router.post('/sandbox/run', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, language, stdin } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language parameters are required.' });
    }

    const result = await executeCode(code, language, stdin || '');

    // Increment analytics for solved problems / lines written if user is logged in
    if (req.user) {
      try {
        const linesCount = code.split('\n').length;
        const analytics = await prisma.analytics.findUnique({ where: { userId: req.user.id } });
        if (analytics) {
          const stats = JSON.parse(analytics.languageStats);
          stats[language] = (stats[language] || 0) + 1;

          await prisma.analytics.update({
            where: { userId: req.user.id },
            data: {
              problemsSolved: result.exitCode === 0 ? analytics.problemsSolved + 1 : analytics.problemsSolved,
              totalLines: analytics.totalLines + linesCount,
              languageStats: JSON.stringify(stats),
            },
          });
        }
      } catch (err) {
        console.error('Failed to log execution analytics:', err);
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Sandbox API Error:', error);
    return res.status(500).json({ error: 'Internal sandboxing error.' });
  }
});

// ==========================================
// Gemini AI API Routes
// ==========================================
router.post('/ai/explain', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required.' });
    }
    const explanation = await getAIExplanation(code, language);
    return res.status(200).json({ explanation });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/ai/optimize', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required.' });
    }
    const optimization = await getAIOptimization(code, language);
    return res.status(200).json({ optimization });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/ai/bug', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required.' });
    }
    const report = await detectBugs(code, language);
    return res.status(200).json({ report });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/ai/hint', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, language, problemDescription } = req.body;
    if (!code || !language || !problemDescription) {
      return res.status(400).json({ error: 'Code, language, and problemDescription are required.' });
    }
    const hint = await getInterviewHint(code, language, problemDescription);
    return res.status(200).json({ hint });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/ai/feedback', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
      const { code, language, problemDescription, history, roomId, duration, sessionId } = req.body;
      if (!code || !language || !problemDescription) {
        return res.status(400).json({ error: 'Missing interview code details.' });
      }
      const evaluation = await getInterviewFeedback(code, language, problemDescription, history || '[]', duration || 0);

      // Save session AI feedback if there is an open session
      if (sessionId) {
        try {
          await prisma.roomSession.update({
            where: { id: String(sessionId) },
            data: {
              aiFeedback: evaluation.text,
            },
          });
        } catch (sessionErr) {
          console.error('Failed to save AI feedback to session:', sessionErr);
        }
      }

      // Keep legacy interview record and scoring history
      try {
        await prisma.interviewRecord.create({
          data: {
            roomId: roomId || 'session',
            candidateName: req.user?.name || 'Candidate',
            interviewerName: 'CodeSync AI System',
            problemTitle: problemDescription.substring(0, 80) + '...',
            language,
            feedback: evaluation.text,
            rating: evaluation.rating,
            scorecard: JSON.stringify({
              codingStyle: evaluation.rating >= 4 ? 'Excellent' : 'Needs Improvement',
              problemSolving: 'Logical flow verified',
              communication: 'Good structural documentation',
            }),
            codeHistory: code,
          },
        });
      } catch (dbErr) {
        console.error('Failed to save interview scorecard:', dbErr);
      }

      return res.status(200).json(evaluation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
});

router.post('/rooms/:id/interview/feedback', authenticateJWT as any, saveInterviewerFeedback as any);
router.get('/rooms/:id/interview/report', authenticateJWT as any, getInterviewReport as any);
router.get('/interviews', authenticateJWT as any, getUserInterviews as any);
// Dashboard Statistics & Analytics Route
// ==========================================
router.get('/analytics/dashboard', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const analytics = await prisma.analytics.findUnique({
      where: { userId: req.user.id },
    });

    const interviewRecords = await prisma.interviewRecord.findMany({
      where: { candidateName: req.user.name },
      orderBy: { date: 'desc' },
      take: 10,
    });

    const solvedSnippetCount = await prisma.snippet.count({
      where: { userId: req.user.id },
    });

    return res.status(200).json({
      problemsSolved: analytics?.problemsSolved || 0,
      totalLines: analytics?.totalLines || 0,
      activeDays: analytics?.activeDaysCount || 1,
      languageStats: analytics?.languageStats ? JSON.parse(analytics.languageStats) : {},
      aiTokensUsed: analytics?.aiTokensUsed || 0,
      snippetsSaved: solvedSnippetCount,
      interviews: interviewRecords,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to aggregate analytics.' });
  }
});

export default router;
