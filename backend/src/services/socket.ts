import { Server, Socket } from 'socket.io';
import prisma from '../config/db';
import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';

interface UserPresence {
  socketId: string;
  userId: string;
  name: string;
  avatarUrl: string;
  cursor?: { lineNumber: number; column: number };
  typing?: boolean;
}

interface InterviewState {
  active: boolean;
  startedAt: number | null;
  problemDescription: string;
  hostId: string;
}

interface ActiveRoomState {
  hostId: string;
  users: Record<string, UserPresence>;
  doc: Y.Doc;
  awareness: Awareness;
  language: string;
  whiteboardData: any[];
  chatHistory: any[];
  interviewState: InterviewState;
  clientAwarenessIds: Record<string, number>;
  currentSessionId?: string;
  tabViolations: Array<{ timestamp: number; durationMs: number; userId: string; userName: string; reason: string }>;
  aiStatus: 'ready' | 'fallback' | 'unavailable';
}

const activeRooms: Record<string, ActiveRoomState> = {};

const createRoomState = (roomId: string, roomDb: any) => {
  const doc = new Y.Doc();
  const yText = doc.getText('monaco');
  yText.insert(0, roomDb?.code || '');

  const awareness = new Awareness(doc);

  const aiStatus: 'ready' | 'fallback' | 'unavailable' = process.env.GEMINI_API_KEY ? 'ready' : 'unavailable';

  return {
    hostId: roomDb?.hostId || 'unknown',
    users: {},
    doc,
    awareness,
    language: roomDb?.language || 'javascript',
    whiteboardData: [],
    chatHistory: [],
    interviewState: {
      active: false,
      startedAt: null,
      problemDescription: '',
      hostId: roomDb?.hostId || 'unknown',
    },
    clientAwarenessIds: {},
    currentSessionId: undefined,
    tabViolations: [],
    aiStatus,
  };
};

export const setupSocketIO = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, userId, name, avatarUrl, awarenessClientId }) => {
      socket.join(roomId);

      if (!activeRooms[roomId]) {
        let roomDb = null;
        try {
          roomDb = await prisma.room.findUnique({ where: { id: roomId } });
        } catch (e) {
          console.error('Failed to load room from db on socket join:', e);
        }

        activeRooms[roomId] = createRoomState(roomId, roomDb);
      }

      if (typeof awarenessClientId === 'number') {
        activeRooms[roomId].clientAwarenessIds[socket.id] = awarenessClientId;
      }

      activeRooms[roomId].users[socket.id] = {
        socketId: socket.id,
        userId: userId || 'anonymous',
        name: name || 'Anonymous',
        avatarUrl: avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=anonymous',
      };

      socket.emit('room-state', {
        language: activeRooms[roomId].language,
        users: Object.values(activeRooms[roomId].users),
        whiteboardData: activeRooms[roomId].whiteboardData,
        chatHistory: activeRooms[roomId].chatHistory,
        interviewState: activeRooms[roomId].interviewState,
        hostId: activeRooms[roomId].hostId,
        tabViolations: activeRooms[roomId].tabViolations,
        aiStatus: activeRooms[roomId].aiStatus,
        currentSessionId: activeRooms[roomId].currentSessionId,
      });

      const currentUpdate = Y.encodeStateAsUpdate(activeRooms[roomId].doc);
      socket.emit('yjs-sync', currentUpdate);

      const awarenessUpdate = encodeAwarenessUpdate(
        activeRooms[roomId].awareness,
        Array.from(activeRooms[roomId].awareness.getStates().keys())
      );

      if (awarenessUpdate.byteLength > 0) {
        socket.emit('awareness-sync', awarenessUpdate);
      }

      socket.to(roomId).emit('user-joined', activeRooms[roomId].users[socket.id]);
      io.to(roomId).emit('presence-update', Object.values(activeRooms[roomId].users));
      io.to(roomId).emit('interview-state', activeRooms[roomId].interviewState);
      io.to(roomId).emit('tab-violations', activeRooms[roomId].tabViolations);
      io.to(roomId).emit('ai-status', activeRooms[roomId].aiStatus);

      console.log(`User ${name} joined room: ${roomId}`);
    });

    socket.on('yjs-update', ({ roomId, update }) => {
      if (!activeRooms[roomId]) return;
      try {
        const encoded = new Uint8Array(update);
        Y.applyUpdate(activeRooms[roomId].doc, encoded, socket);
        socket.to(roomId).emit('yjs-update', update);
      } catch (err) {
        console.error('Yjs update error:', err);
      }
    });

    socket.on('awareness-update', ({ roomId, update }) => {
      if (!activeRooms[roomId]) return;
      try {
        const encoded = new Uint8Array(update);
        applyAwarenessUpdate(activeRooms[roomId].awareness, encoded, socket);
        socket.to(roomId).emit('awareness-update', update);
      } catch (err) {
        console.error('Awareness update error:', err);
      }
    });

    socket.on('language-change', ({ roomId, language }) => {
      if (activeRooms[roomId]) {
        activeRooms[roomId].language = language;
        socket.to(roomId).emit('language-update', language);
      }
    });

    socket.on('interview-start', async ({ roomId, problemDescription }) => {
      if (!activeRooms[roomId]) return;
      const room = activeRooms[roomId];
      if (room.hostId !== activeRooms[roomId].users[socket.id]?.userId) {
        return;
      }
      room.interviewState.active = true;
      room.interviewState.startedAt = Date.now();
      room.interviewState.problemDescription = problemDescription || room.interviewState.problemDescription;

      try {
        const session = await prisma.roomSession.create({
          data: {
            roomId,
            hostId: room.hostId,
            startTime: new Date(room.interviewState.startedAt),
            problemStatement: room.interviewState.problemDescription,
            language: room.language,
            codeSnapshot: room.doc.getText('monaco').toString(),
            codeSnapshots: JSON.stringify([room.doc.getText('monaco').toString()]),
            participants: JSON.stringify(Object.values(room.users).map((u) => ({ id: u.userId, name: u.name }))),
            chatMessages: JSON.stringify(room.chatHistory),
          },
        });
        room.currentSessionId = session.id;
        socket.to(roomId).emit('interview-session', { sessionId: session.id });
        socket.emit('interview-session', { sessionId: session.id });
      } catch (err) {
        console.error('Failed to create interview session record:', err);
      }

      socket.to(roomId).emit('interview-state', room.interviewState);
      socket.emit('interview-state', room.interviewState);
    });

    socket.on('interview-update', ({ roomId, problemDescription }) => {
      if (!activeRooms[roomId]) return;
      const room = activeRooms[roomId];
      if (room.hostId !== activeRooms[roomId].users[socket.id]?.userId) {
        return;
      }
      room.interviewState.problemDescription = problemDescription;
      io.to(roomId).emit('interview-state', room.interviewState);
    });

    socket.on('interview-end', async ({ roomId }) => {
      if (!activeRooms[roomId]) return;
      const room = activeRooms[roomId];
      if (room.hostId !== activeRooms[roomId].users[socket.id]?.userId) {
        return;
      }
      room.interviewState.active = false;
      const endedAt = Date.now();
      const durationSeconds = room.interviewState.startedAt ? Math.floor((endedAt - room.interviewState.startedAt) / 1000) : 0;

      if (room.currentSessionId) {
        try {
          await prisma.roomSession.update({
            where: { id: room.currentSessionId },
            data: {
              endTime: new Date(endedAt),
              durationSeconds,
              finalCode: room.doc.getText('monaco').toString(),
              codeSnapshots: JSON.stringify([room.doc.getText('monaco').toString()]),
              participants: JSON.stringify(Object.values(room.users).map((u) => ({ id: u.userId, name: u.name }))),
              chatMessages: JSON.stringify(room.chatHistory),
              tabViolations: JSON.stringify(room.tabViolations || []),
              reportJson: JSON.stringify({
                problemStatement: room.interviewState.problemDescription,
                participants: Object.values(room.users).map((u) => ({ id: u.userId, name: u.name })),
                violations: room.tabViolations,
              }),
            },
          });
        } catch (err) {
          console.error('Failed to finalize interview session record:', err);
        }
        room.currentSessionId = undefined;
      }

      room.interviewState.startedAt = null;
      io.to(roomId).emit('interview-state', room.interviewState);
      io.to(roomId).emit('tab-violations', room.tabViolations);
    });

    socket.on('whiteboard-draw', ({ roomId, drawAction }) => {
      if (activeRooms[roomId]) {
        activeRooms[roomId].whiteboardData.push(drawAction);
        socket.to(roomId).emit('whiteboard-update', drawAction);
      }
    });

    socket.on('whiteboard-clear', ({ roomId }) => {
      if (activeRooms[roomId]) {
        activeRooms[roomId].whiteboardData = [];
        io.to(roomId).emit('whiteboard-cleared');
      }
    });

    socket.on('send-message', ({ roomId, message }) => {
      if (activeRooms[roomId]) {
        const user = activeRooms[roomId].users[socket.id];
        const chatMsg = {
          id: Date.now().toString(),
          senderName: user ? user.name : 'System',
          senderAvatar: user ? user.avatarUrl : '',
          senderId: user ? user.userId : '',
          text: message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        activeRooms[roomId].chatHistory.push(chatMsg);
        if (activeRooms[roomId].chatHistory.length > 100) {
          activeRooms[roomId].chatHistory.shift();
        }

        io.to(roomId).emit('receive-message', chatMsg);
      }
    });

    socket.on('tab-violation', ({ roomId, reason, durationMs }) => {
      if (!activeRooms[roomId]) return;
      const room = activeRooms[roomId];
      const user = room.users[socket.id];
      if (!user) return;
      const violation = {
        timestamp: Date.now(),
        durationMs: Number(durationMs) || 0,
        userId: user.userId,
        userName: user.name,
        reason: reason || 'Browser focus lost',
      };
      room.tabViolations.push(violation);
      io.to(roomId).emit('violation-update', { count: room.tabViolations.length, violation });
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const roomId in activeRooms) {
        if (activeRooms[roomId].users[socket.id]) {
          const user = activeRooms[roomId].users[socket.id];
          const name = user.name;
          delete activeRooms[roomId].users[socket.id];

          const awarenessClientId = activeRooms[roomId].clientAwarenessIds[socket.id];
          if (typeof awarenessClientId === 'number') {
            removeAwarenessStates(activeRooms[roomId].awareness, [awarenessClientId], socket);
            const removalUpdate = encodeAwarenessUpdate(activeRooms[roomId].awareness, [awarenessClientId]);
            socket.to(roomId).emit('awareness-update', removalUpdate);
            delete activeRooms[roomId].clientAwarenessIds[socket.id];
          }

          try {
            const docText = activeRooms[roomId].doc.getText('monaco').toString();
            await prisma.room.update({
              where: { id: roomId },
              data: { code: docText, language: activeRooms[roomId].language },
            });
          } catch (e) {
            console.error('Failed to auto-save room state on user leave:', e);
          }

          socket.to(roomId).emit('user-left', socket.id);
          io.to(roomId).emit('presence-update', Object.values(activeRooms[roomId].users));

          console.log(`User ${name} left room: ${roomId}`);

          if (Object.keys(activeRooms[roomId].users).length === 0) {
            activeRooms[roomId].whiteboardData = [];
            activeRooms[roomId].chatHistory = [];
          }
        }
      }
    });
  });
};
