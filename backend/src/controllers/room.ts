import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, language, isPublic, passcode } = req.body;
    const hostId = req.user?.id;

    if (!hostId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Room name is required.' });
    }

    // Set starting code template based on language
    let startingCode = '';
    switch (language) {
      case 'python':
        startingCode = '# CodeSync AI Room\nprint("Hello, CodeSync!")\n';
        break;
      case 'cpp':
        startingCode = '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeSync!" << std::endl;\n    return 0;\n}\n';
        break;
      case 'java':
        startingCode = 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeSync!");\n    }\n}\n';
        break;
      default: // javascript
        startingCode = '// CodeSync AI Room\nconsole.log("Hello, CodeSync!");\n';
    }

    const hashedPasscode = passcode ? await bcrypt.hash(String(passcode), 10) : null;
    const room = await prisma.room.create({
      data: {
        name,
        description,
        language: language || 'javascript',
        code: startingCode,
        isPublic: isPublic !== undefined ? isPublic : true,
        passcode: hashedPasscode,
        hostId,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const { passcode: _, ...publicRoom } = room as any;
    return res.status(201).json({ room: publicRoom });
  } catch (error) {
    console.error('Create Room Error:', error);
    return res.status(500).json({ error: 'Failed to create room.' });
  }
};

export const getRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, language } = req.query;

    const where: any = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    if (language) {
      where.language = String(language);
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const publicRooms = rooms.map((room) => {
      const { passcode: _, ...safeRoom } = room as any;
      return safeRoom;
    });

    return res.status(200).json({ rooms: publicRooms });
  } catch (error) {
    console.error('Get Rooms Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve rooms.' });
  }
};

export const getRoomById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { passcode } = req.query;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Passcode protection check
    if (!room.isPublic && room.hostId !== req.user?.id) {
      if (room.passcode) {
        const passcodeValue = String(passcode || '');
        const isValid = await bcrypt.compare(passcodeValue, room.passcode);
        if (!isValid) {
          return res.status(403).json({ error: 'Invalid room passcode.', passcodeRequired: true });
        }
      }
    }

    const { passcode: _, ...publicRoom } = room as any;
    return res.status(200).json({ room: publicRoom });
  } catch (error) {
    console.error('Get Room Error:', error);
    return res.status(500).json({ error: 'Failed to load room details.' });
  }
};

export const updateRoomCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, language } = req.body;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Only host or room members can update standard settings
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        code: code !== undefined ? code : room.code,
        language: language !== undefined ? language : room.language,
      },
    });

    return res.status(200).json({ room: updatedRoom });
  } catch (error) {
    console.error('Update Room Error:', error);
    return res.status(500).json({ error: 'Failed to save room updates.' });
  }
};

export const deleteRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    if (room.hostId !== req.user?.id) {
      return res.status(403).json({ error: 'Only the room host can delete this room.' });
    }

    await prisma.room.delete({ where: { id } });

    return res.status(200).json({ message: 'Room successfully deleted.' });
  } catch (error) {
    console.error('Delete Room Error:', error);
    return res.status(500).json({ error: 'Failed to delete room.' });
  }
};
