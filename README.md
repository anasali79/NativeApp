# To-Do App — React Native + NestJS + MongoDB

A full-stack Android to-do application built with React Native CLI (TypeScript), NestJS backend, and MongoDB database. Features user authentication, smart task sorting, and a signature "drain bar" that visually shows time remaining before deadlines.

## Screenshots

> Run the app to see the UI in action. The design follows a "quiet UI" philosophy with one signature visual element — the time-left drain bar.

## Features

### Core
- **User registration & login** with email/password (JWT-based authentication)
- **Add tasks** with title, description, scheduled date-time, deadline, and priority
- **Mark tasks as completed** (optimistic UI with rollback)
- **Delete tasks** with confirmation dialog
- **View tasks** in a grouped, sorted list with status indicators

### Bonus
- **Smart sort algorithm** — ranks tasks by `priority + deadline urgency + scheduled time boost`
- **Drain bar** — a 3px progress bar that empties as the deadline approaches (the app's signature feature)
- **Grouped sections** — Overdue → Today → Later → Done
- **Filter bar** — filter by status (All/Open/Done), priority, and sort mode (Smart/Deadline/Newest)
- **Tags** — add up to 5 tags per task, displayed on task rows
- **Dark mode** — automatic, follows system theme
- **Optimistic updates** — instant UI response on toggle/delete, rollback on failure
- **Session persistence** — token stored in AsyncStorage, auto-restore on app restart
- **Auto-logout** — 401 responses trigger automatic session clear

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native CLI 0.87 + TypeScript |
| State management | React Context + useReducer (no Redux) |
| Backend | NestJS (Node.js) |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (bcryptjs for password hashing) |
| Date picker | @react-native-community/datetimepicker |
| Storage | @react-native-async-storage/async-storage |

## Smart Sort Algorithm

```
score = priorityPoints + urgencyPoints + nowBoost

priorityPoints: low=10, medium=20, high=30
urgencyPoints:  no deadline → 0
                overdue → 40
                else → 30 * exp(-hoursLeft / 48)
nowBoost:       scheduledAt exists and scheduledAt <= now + 2h → +10

Tie-break: earlier deadline first, then newer createdAt first
```

Tasks are grouped into sections:
1. **Overdue** — deadline has passed
2. **Today** — deadline or scheduled time is today
3. **Later** — everything else (including no deadline)
4. **Done** — completed tasks (most recently completed first)

## Project Structure

```
todo-assignment/
├── app/                          # React Native (Android)
│   ├── App.tsx                   # Root component
│   └── src/
│       ├── api/                  # API client and endpoint functions
│       │   ├── client.ts         # Fetch wrapper with auth + error handling
│       │   ├── auth.ts           # Auth API (register, login, getMe)
│       │   └── tasks.ts          # Tasks API (CRUD + filters)
│       ├── context/
│       │   └── AuthContext.tsx    # Auth state (session, login, logout)
│       ├── hooks/
│       │   └── useTasks.ts       # Task state with useReducer + optimistic updates
│       ├── domain/
│       │   ├── types.ts          # Shared TypeScript types
│       │   ├── rank.ts           # Smart sort algorithm + section builder
│       │   └── dates.ts          # Date formatting utilities
│       ├── theme/
│       │   ├── colors.ts         # Color tokens (light + dark)
│       │   ├── typography.ts     # Type scale
│       │   ├── spacing.ts        # Spacing + radius tokens
│       │   └── useTheme.ts       # Theme hook (follows system scheme)
│       ├── components/
│       │   ├── Field.tsx         # Text input with focus/error states
│       │   ├── Button.tsx        # Primary + text button with loading
│       │   ├── Chip.tsx          # Pill-shaped filter/selection chip
│       │   ├── DrainBar.tsx      # Time-left progress bar (signature)
│       │   ├── TaskRow.tsx       # Full task row with stripe, checkbox, meta
│       │   ├── EmptyState.tsx    # Empty/filtered/error states
│       │   └── AddTaskSheet.tsx  # Bottom sheet for add/edit task
│       └── screens/
│           ├── AuthScreen.tsx    # Login / register screen
│           └── HomeScreen.tsx    # Task list with filters + dock
├── backend/                      # NestJS API
│   ├── src/
│   │   ├── main.ts              # Entry point (CORS, validation, 0.0.0.0)
│   │   ├── app.module.ts        # Root module (Config, Mongoose, Auth, Tasks)
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.guard.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── dto/register.dto.ts
│   │   │   ├── dto/login.dto.ts
│   │   │   └── schemas/user.schema.ts
│   │   └── tasks/
│   │       ├── tasks.module.ts
│   │       ├── tasks.controller.ts
│   │       ├── tasks.service.ts
│   │       ├── dto/create-task.dto.ts
│   │       ├── dto/update-task.dto.ts
│   │       ├── dto/list-tasks-query.dto.ts
│   │       └── schemas/task.schema.ts
│   ├── .env.example
│   └── package.json
├── DESIGN.md                     # Design specification
├── PLAN.md                       # Development plan
└── README.md                     # This file
```

## API Endpoints

### Auth
| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password }` | `{ token, user: { id, email } }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user: { id, email } }` |
| GET | `/auth/me` | — (Bearer token) | `{ id, email }` |

### Tasks (all require Bearer token)
| Method | Route | Notes |
|---|---|---|
| GET | `/tasks` | Query: `status`, `priority`, `tag`, `q` |
| POST | `/tasks` | Create task |
| PATCH | `/tasks/:id` | Partial update |
| DELETE | `/tasks/:id` | Delete task |

## Setup & Run Instructions

### Prerequisites
- Node.js LTS (18+)
- JDK 17
- Android Studio (SDK Platform, Platform-Tools, emulator)
- MongoDB (local or Atlas)

### Backend

```bash
cd backend

# Copy env file and edit values
cp .env.example .env

# Install dependencies
npm install

# Start the server
npm run start:dev
```

The server runs on `http://0.0.0.0:3000`. Android emulator reaches it via `http://10.0.2.2:3000`.

### Mobile App

#### Option A: Run via Expo Go (Fastest — Test directly on physical phone via QR code)
No Android Studio or JDK required!

```bash
cd expo-app

# Start Expo dev server
npx expo start
```
1. Install **Expo Go** from Google Play Store or App Store on your phone.
2. Ensure your phone and PC are connected to the same Wi-Fi / mobile hotspot.
3. Scan the QR code shown in your terminal with Expo Go (Android) or Camera app (iOS).
4. The app will automatically connect to your backend!

#### Option B: React Native CLI (Android Studio / Emulator)
Requires Android Studio, SDK, and JDK 17 setup.

```bash
cd app

# Install dependencies
npm install

# Terminal 1: Start Metro bundler
npx react-native start

# Terminal 2: Build and run on Android
npx react-native run-android
```

### Environment Variables (.env)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |

## Security Notes

- Passwords are hashed with bcrypt (cost 10) — never stored or returned in plaintext
- JWT tokens are validated on every protected route
- Every task query filters by `userId` — users can only access their own tasks
- Wrong login returns a generic "Email or password is wrong." message (prevents email enumeration)
- `.env` file is in `.gitignore` — secrets never committed

## Known Limitations

- No offline support (requires network connection to the backend)
- No push notifications
- Android-only (iOS support requires CocoaPods setup)
- No image attachments for tasks
