export interface TabViolation {
  timestamp: number;
  durationMs: number;
  userId: string;
  userName: string;
  reason: string;
}

export interface InterviewSession {
  id: string;
  roomId: string;
  hostId: string;
  startTime: string;
  endTime?: string | null;
  problemStatement?: string | null;
  language: string;
  codeSnapshot: string;
  codeSnapshots: string;
  finalCode?: string | null;
  participants: string;
  chatMessages: string;
  aiFeedback?: string | null;
  interviewerFeedback?: string | null;
  interviewerRatings: string;
  tabViolations: string;
  durationSeconds?: number | null;
  reportJson?: string | null;
}

export interface InterviewFeedbackForm {
  communication: number;
  problemSolving: number;
  codingSkills: number;
  dsaKnowledge: number;
  comments: string;
}
