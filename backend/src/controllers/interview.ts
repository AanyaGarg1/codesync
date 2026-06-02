import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getInterviewReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.hostId !== req.user.id) return res.status(403).json({ error: 'Only the room host can access reports.' });

    const session = sessionId
      ? await prisma.roomSession.findUnique({ where: { id: String(sessionId) } })
      : await prisma.roomSession.findFirst({ where: { roomId: id }, orderBy: { startTime: 'desc' } });

    if (!session) return res.status(404).json({ error: 'Interview session not found.' });

    return res.status(200).json({ session });
  } catch (error) {
    console.error('Interview Report Error:', error);
    return res.status(500).json({ error: 'Failed to load interview report.' });
  }
};

export const getUserInterviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const sessions = await prisma.roomSession.findMany({
      where: {
        OR: [
          { hostId: req.user.id },
          { participants: { contains: req.user.name } },
        ],
      },
      orderBy: { startTime: 'desc' },
      take: 20,
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Get User Interviews Error:', error);
    return res.status(500).json({ error: 'Failed to load interview sessions.' });
  }
};

export const saveInterviewerFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { sessionId, communication, problemSolving, codingSkills, dsaKnowledge, comments } = req.body;

    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.hostId !== req.user.id) return res.status(403).json({ error: 'Only the room host may save interviewer feedback.' });

    const session = sessionId
      ? await prisma.roomSession.findUnique({ where: { id: String(sessionId) } })
      : await prisma.roomSession.findFirst({ where: { roomId: id }, orderBy: { startTime: 'desc' } });
    if (!session || session.roomId !== id) {
      return res.status(404).json({ error: 'Interview session not found.' });
    }

    const ratings = {
      communication: Number(communication) || 0,
      problemSolving: Number(problemSolving) || 0,
      codingSkills: Number(codingSkills) || 0,
      dsaKnowledge: Number(dsaKnowledge) || 0,
    };

    const updatedSession = await prisma.roomSession.update({
      where: { id: String(sessionId) },
      data: {
        interviewerFeedback: comments || '',
        interviewerRatings: JSON.stringify(ratings),
      },
    });

    return res.status(200).json({ session: updatedSession });
  } catch (error) {
    console.error('Save Interviewer Feedback Error:', error);
    return res.status(500).json({ error: 'Failed to save interviewer feedback.' });
  }
};
