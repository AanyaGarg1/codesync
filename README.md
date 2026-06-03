# CodeSync AI

CodeSync AI is a collaborative coding interview platform designed to simulate real technical interviews in a shared environment. It combines a real-time code editor, collaborative whiteboard, interview monitoring tools, session tracking, and AI-powered feedback generation to create a complete interview experience for both interviewers and candidates.

The primary objective of this project is to provide an interactive and efficient platform for conducting coding interviews while maintaining transparency, collaboration, and detailed post-interview analysis.

---

## Features

### Authentication
- User registration and login
- Protected routes using authentication guards
- Session-based access control

### Real-Time Collaborative Coding
- Shared Monaco Editor
- Multiple users can work simultaneously in the same room
- Live synchronization using Socket.IO and Yjs
- Multi-language coding support

### Interview Rooms
- Create and join interview rooms
- Interviewer and candidate roles
- Live participant tracking
- Interview session timer

### Collaborative Whiteboard
- Shared drawing canvas
- Real-time synchronization
- Adjustable brush colors and sizes

### Interview Monitoring
- Interview start and end tracking
- Tab-switch detection
- Browser focus monitoring
- Violation logging

### Timeline Tracking
The platform records important interview events including:
- Interview started
- Interview ended
- Tab switching events
- User activity updates

### AI Feedback Generation
After each interview, the platform generates:
- AI-generated interview summaries
- Candidate performance analysis
- Strengths and weaknesses
- Overall performance ratings

### Report Generation
Download interview reports in:
- JSON format
- PDF format

Reports include:
- Interview details
- Problem statement
- Participant information
- Timeline events
- Tab-switch violations
- AI feedback
- Interviewer feedback
- Final code submission

---

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Monaco Editor
- Socket.IO Client
- Yjs

### Backend
- Node.js
- Express.js
- TypeScript
- Socket.IO
- Prisma ORM

### Database
- PostgreSQL

### AI Integration
- AI-powered interview evaluation and feedback generation

---

## Project Structure

```text
codesync-ai/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│
└── README.md
```

---

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd codesync-ai
```

---

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
PORT=5000
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Start the backend server:

```bash
npm run dev
```

---

## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend application:

```bash
npm run dev
```

---

## Usage

### Creating an Interview

1. Login to the platform.
2. Create a new interview room.
3. Share the room link with participants.
4. Start the interview session.
5. Monitor coding activity and whiteboard collaboration.

### Conducting the Interview

1. Discuss the problem statement.
2. Observe live coding progress.
3. Use the collaborative whiteboard when needed.
4. Monitor tab-switch violations.
5. End the interview session upon completion.

### Reviewing Results

After ending the interview:

- View AI-generated feedback
- Add interviewer comments
- Review timeline events
- Download PDF reports
- Download JSON reports

---

## Future Improvements

Planned enhancements include:

- Room password protection
- Integrated video and audio communication
- Secure code execution sandbox
- Plagiarism detection
- AI-generated interview question recommendations
- Advanced interview analytics dashboard
- Company-specific interview templates
- Session recording and playback

---

## Challenges Faced

Some of the major challenges encountered during development were:

- Real-time synchronization conflicts
- Collaborative editor state management
- Socket disconnection handling
- Interview session persistence
- Structured report generation
- Maintaining low-latency communication between participants

---

## Learning Outcomes

This project provided valuable experience in:

- Real-time systems development
- WebSocket communication
- Collaborative application design
- Database modeling using Prisma
- Authentication and authorization workflows
- Full-stack TypeScript development
- AI integration within web applications

---

## Author

**Aanya Garg**

BS-MS Applied Mathematics and Scientific Computing  
Indian Institute of Technology Roorkee

---
