CodeSync AI

A collaborative coding interview platform built to simulate real technical interviews in a shared environment. The platform provides a real-time code editor, whiteboard, interview monitoring, session recording, and AI-assisted feedback generation.

The goal of this project is to help interviewers conduct coding interviews efficiently while providing candidates with an experience similar to real-world technical interviews.

Features
Authentication
User registration and login
Protected routes using authentication guards
Session-based access control
Real-Time Collaborative Coding
Shared Monaco Editor
Multiple users can work in the same room simultaneously
Live synchronization using Socket.IO and Yjs
Language switching support
Interview Rooms
Create and join interview rooms
Interviewer and candidate roles
Live participant tracking
Session timer
Whiteboard
Collaborative drawing canvas
Real-time synchronization
Adjustable brush size and colors
Interview Monitoring
Interview start/end tracking
Tab switch detection
Focus loss monitoring
Violation logging
Timeline Tracking

Records important interview events such as:

Interview started
Interview ended
Tab switching events
User activity updates
AI Feedback

After the interview:

AI-generated interview summary
Candidate performance analysis
Strengths and weaknesses
Overall rating
Report Generation

Generate downloadable reports in:

JSON format
PDF format

Reports contain:

Interview details
Problem statement
Participants
Timeline events
Tab violations
AI feedback
Interviewer feedback
Final code submission
Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Monaco Editor
Socket.IO Client
Yjs
Backend
Node.js
Express.js
TypeScript
Socket.IO
Prisma ORM
Database
PostgreSQL
AI Integration
AI-based interview evaluation and feedback generation
Project Structure
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
Installation
Clone the repository
git clone <repository-url>
cd codesync-ai
Backend Setup
cd backend

npm install

Create a .env file:

DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
PORT=5000

Run Prisma migrations:

npx prisma migrate dev

Start the backend server:

npm run dev
Frontend Setup
cd frontend

npm install

Create .env.local:

NEXT_PUBLIC_API_URL=http://localhost:5000

Start the frontend:

npm run dev
Usage
Creating an Interview
Login to the platform
Create a new interview room
Share the room link with participants
Start the interview session
Monitor coding activity and whiteboard collaboration
Conducting the Interview
Discuss the problem statement
Observe live coding progress
Use the whiteboard when required
Monitor tab-switch violations
End the interview once completed
Reviewing Results

After ending the session:

View AI-generated feedback
Add interviewer comments
Review timeline events
Download PDF or JSON reports
Future Improvements

Some planned enhancements include:

Room passwords
Video/audio communication
Code execution sandbox
Plagiarism detection
AI-generated interview questions
Interview analytics dashboard
Company-specific interview templates
Recording and playback support
Challenges Faced

During development, some of the major challenges included:

Real-time synchronization conflicts
Collaborative editor state management
Socket disconnection handling
Interview session persistence
Generating structured interview reports
Maintaining low-latency updates across multiple participants
Learning Outcomes

This project provided hands-on experience with:

Real-time systems
WebSocket communication
Collaborative editing
Database design using Prisma
Authentication and authorization
Full-stack TypeScript development
AI integration into web applications
Aanya Garg
