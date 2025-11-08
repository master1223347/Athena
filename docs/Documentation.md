# CanvasIQ Developer Onboarding Guide

Welcome to CanvasIQ! This guide will help new developers quickly understand the project, set up their environment, and start contributing.

---

## Project Overview
CanvasIQ is a modern academic companion for students using Canvas LMS. It visualizes progress, enables achievement tracking, and provides AI-powered study help. The project includes a React frontend, Python backend services, and Supabase integration for authentication and data storage.

---

## Main Features
- **Global Leaderboard & Achievements**: Track and compare progress with students worldwide.
- **Private Group Leaderboards**: Compete in invite-only groups.
- **Calendar Integration**: Sync assignments and deadlines automatically.
- **No Manual Uploads**: CanvasIQ pulls assignment info directly from Canvas.
- **AI-Powered Study Help**: Personalized practice and Q&A via AI assistant.
- **Privacy & Security**: All data is private and secure.
- **Daily Login Streaks**: **Earn XP rewards for consecutive daily logins with milestone bonuses**.
- **Weekly Completion Streaks**: **Earn XP rewards for completing weekly assignments consistently**.

---

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Python (FastAPI), Supabase
- **Analytics**: Mixpanel (see `docs/analytics-guide.md`)

---

## Repository Structure
- `src/` - Main React app (components, pages, hooks, contexts, services)
- `x-chatbot/` - Python AI/Canvas file processing pipeline
- `supabase/` - Supabase config and serverless functions
- `public/` - Static assets
- `docs/` - Documentation (analytics, guides)
- `AgentAI.py` - FastAPI backend for AI assistant

---

## Getting Started
### Prerequisites
- Node.js & npm (recommended: install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Python 3.9+
- Supabase account (for local testing)

### Setup Steps
1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd canvasiq-real
   ```
2. **Install frontend dependencies**
   ```sh
   npm i
   ```
3. **Start the frontend**
   ```sh
   npm run dev
   ```
4. **Set up environment variables**
   - Create a `.env` file in the root directory:
     ```
     OPENAI_API_KEY=sk-...your-key...
     SUPABASE_URL=https://yourproject.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-secret-key
     ```
5. **Run the backend (AI assistant)**
   ```sh
   uvicorn AgentAI:app --reload
   ```
   For production:
   ```sh
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker AgentAI:app
   ```
6. **Supabase Functions**
   - See `supabase/functions/` for serverless sync and API endpoints.

---

## Key Files & Directories
- `src/pages/` - Main app pages (Dashboard, Achievements, Calendar, etc.)
- `src/components/` - UI and layout components
- `src/contexts/` - Auth and theme context providers
- `src/services/` - API and business logic
- `x-chatbot/` - Python pipeline for Canvas file processing and AI
- `AgentAI.py` - FastAPI backend for chat/AI
- `docs/analytics-guide.md` - Analytics implementation details

---

## Analytics & Event Tracking
- Mixpanel is used for analytics (see `docs/analytics-guide.md`)
- Key events: Sign Up, Login, Feature Usage, Onboarding, Page View, etc.
- User identification and privacy best practices are implemented.

---

## Common Tasks
- **Add a new page**: 
  1. Create a new file in `src/pages/` (e.g. `MyNewPage.tsx`).
  2. Use the page template below for consistency:
     ```tsx
     // src/pages/MyNewPage.tsx
     // Purpose: [Describe what this page does, e.g. "Displays user profile info"]
     import React from "react";
     import MainLayout from "@/components/layouts/MainLayout";
     // ...other imports...
     const MyNewPage = () => {
       // [Add main logic here]
       return (
         <MainLayout>
           {/* Page content goes here */}
         </MainLayout>
       );
     };
     export default MyNewPage;
     ```
  3. Add a route in `src/App.tsx`:
     ```tsx
     // ...existing code...
     <Route path="/my-new-page" element={<MyNewPage />} />
     // ...existing code...
     ```
  4. Add a comment above your route describing its purpose.

- **Add a new component**:
  1. Place your component in `src/components/` (e.g. `src/components/common/MyButton.tsx`).
  2. At the top of the file, add a comment explaining what the component does and any props it expects.
  3. Example:
     ```tsx
     // src/components/common/MyButton.tsx
     // Purpose: Custom button for submitting forms. Props: label (string), onClick (function)
     ```
  4. Import and use your component in pages or other components as needed.

- **Track a new event**:
  1. Use the functions in `src/utils/eventTracker.ts`.
  2. At the event location, add a comment explaining what is being tracked and why.
  3. Example:
     ```tsx
     // Track when user clicks the submit button for analytics
     trackFeatureUsage("SubmitButton", "used", { location: "ProfilePage" });
     ```
  4. Follow the standards in `docs/analytics-guide.md` for naming and properties.

- **Update analytics**:
  1. See `docs/analytics-guide.md` for standards and examples.
  2. Add comments in your code when you add or change analytics events, describing what the event means and what properties are included.

---

## Help & Resources
- **FAQ**: See `src/pages/HelpPage.tsx` for common user questions. Each question/answer pair is commented for clarity.
- **Student Testimonials**: See `src/pages/LandingPage.tsx` for real user feedback. Testimonials are in a commented array at the top of the file.
- **Contact**: Ask in the team chat or open an issue. If you add a new contact method, document it here and in the code.

---

## Contributing
- Fork the repo, create a feature branch, and submit a pull request.
- Follow code style and commit message guidelines. Add comments to explain non-obvious logic or decisions.
- Review analytics and privacy standards before merging. If you change data collection, update comments and documentation.

---

## Deployment
- See README.md for deployment instructions (Lovable, Netlify, etc.). If you add a new deployment method, document the steps here and in the README.

---

## Additional Documentation
- Analytics: `docs/analytics-guide.md`
- API: See backend Python files and Supabase functions

---

## Pages, Subcomponents, and Endpoints Overview

This section provides a detailed, organized reference for all main pages, their purpose, key subcomponents, and related backend/API endpoints. Use this to quickly understand the app's structure and how everything connects.

---

### 1. User-Facing Pages

#### DashboardPage (`src/pages/DashboardPage.tsx`)
- **Purpose**: Main user dashboard showing progress, assignments, and quick actions.
- **Subcomponents**:
  - `DashboardHeader`: Displays summary and greeting.
  - `StreakDisplay`: **Prominently featured streak tracker with XP rewards**.
  - `ProgressGraph`: Visualizes academic progress (uses user/course data).
  - `AssignmentList`: Lists upcoming assignments, deadlines, and status.
  - `SyncButton`: Triggers manual Canvas sync.
- **Endpoints**:
  - `/supabase/functions/canvas-sync`: Syncs Canvas data for the user.
  - `/api/user`: Fetches user profile and progress data.

#### AchievementsPage (`src/pages/AchievementsPage.tsx`)
- **Purpose**: Displays earned badges, levels, and achievement history.
- **Subcomponents**:
  - `AchievementCard`: Shows individual badge details.
  - `LevelProgressBar`: Displays leveling progress and XP.
- **Endpoints**:
  - `/api/achievements`: Fetches achievements and badge data.

#### CalendarPage (`src/pages/CalendarPage.tsx`)
- **Purpose**: Visual calendar of assignments and events.
- **Subcomponents**:
  - `CalendarView`: Main calendar UI, supports month/week/day views.
  - `EventModal`: View/edit event details, add custom events.
- **Endpoints**:
  - `/api/calendar`: Fetches calendar events and assignment due dates.

#### CoursesPage (`src/pages/CoursesPage.tsx`)
- **Purpose**: List and manage Canvas courses.
- **Subcomponents**:
  - `CourseCard`: Displays course summary, grade, and status.
  - `AddCourseForm`: Allows manual course addition (for non-Canvas courses).
- **Endpoints**:
  - `/api/courses`: Fetches course list and details.

#### Leaderboard Pages
- **LeaderboardPage** (`src/pages/LeaderboardPage.tsx`)
- **LeaderboardGroupsPage** (`src/pages/LeaderboardGroupsPage.tsx`)
- **LeaderboardGroupsIdPage** (`src/pages/LeaderboardGroupsIdPage.tsx`)
  - **Purpose**: Global and group leaderboards for achievements.
  - **Subcomponents**:
    - `LeaderboardTable`: Displays ranking, scores, and badges.
    - `GroupSelector`: Allows user to select or join a group.
  - **Endpoints**:
    - `/api/leaderboard`: Fetches leaderboard data (global/group).
    - `/api/groups`: Fetches available groups and membership info.

#### GamblingPage (`src/pages/GamblingPage.tsx`)
- **Purpose**: Gamified features for extra motivation (e.g., points betting).
- **Subcomponents**:
  - `GambleWidget`: Interactive game UI, handles bets and results.
- **Endpoints**:
  - `/api/gamble`: Handles game logic and user bets.

#### AIAssistantPage (`src/pages/AIAssistantPage.tsx`)
- **Purpose**: AI-powered study help and Q&A.
- **Subcomponents**:
  - `Chatbot`: Main chat interface, supports context/history and course selection.
- **Endpoints**:
  - `/chat`: FastAPI endpoint in `AgentAI.py` for AI responses.

#### ProfilePage (`src/pages/ProfilePage.tsx`)
- **Purpose**: User profile, settings, and avatar upload.
- **Subcomponents**:
  - `ProfileForm`: Edit user info (name, email, etc.).
  - `AvatarUploader`: Change profile picture, supports drag-and-drop.
- **Endpoints**:
  - `/api/user`: Update profile info.
  - `/api/avatar`: Upload avatar image.

#### SettingsPage (`src/pages/SettingsPage.tsx`)
- **Purpose**: App and account settings, Canvas integration.
- **Subcomponents**:
  - `ThemeSelector`: Switch between light/dark mode.
  - `CanvasIntegrationForm`: Connect Canvas account, manage API token.
- **Endpoints**:
  - `/api/settings`: Update app/account settings.
  - `/supabase/functions/canvas-sync`: Connect Canvas account and sync data.

#### RegisterPage / LoginPage / ForgotPasswordPage / UpdatePasswordPage
- **Purpose**: User authentication and onboarding.
- **Subcomponents**:
  - `RegisterForm`: Handles new user registration, referral, and validation.
  - `LoginForm`: Handles login, error handling, and redirects.
  - `ForgotPasswordForm`: Request password reset.
  - `UpdatePasswordForm`: Set new password after reset.
- **Endpoints**:
  - `/api/auth/register`: Register new user.
  - `/api/auth/login`: Login user.
  - `/api/auth/forgot-password`: Request password reset.
  - `/api/auth/update-password`: Update password after reset.

#### LandingPage (`src/pages/LandingPage.tsx`)
- **Purpose**: Marketing, highlights, testimonials, and onboarding steps.
- **Subcomponents**:
  - `