# HTK Tennis V2

A tennis club management application for Hogelids Tennis Klubb (HTK), featuring court booking and competitive ladder tournament system ("Stegen").

## ✨ Features

- 🎾 **Court Booking System** - Book tennis courts with date/time picker
- 🪜 **Ladder Tournament ("Stegen")** - Year-based competitive ladder with opt-in participation, challenge mechanics, and match reporting
- 👤 **User Management** - Firebase Authentication with role-based access (user/admin/superuser)
- ⚙️ **Admin Panel** - Manage users, app settings, and announcements
- 📊 **Profile System** - User profiles with ladder statistics and match history
- 📢 **Announcements** - System-wide notifications with links
- 🇸🇪 **Swedish Localization** - UI in Swedish for the tennis club

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite (Rolldown)** - Fast Rust-based build tool
- **Firebase** - Authentication and Firestore database
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Accessible components built on Radix UI
- **Vitest** - Unit testing with coverage

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Add your Firebase configuration to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server:

```bash
npm run dev
```

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Production build (runs type-check, lint, test, then builds)
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🔥 Firebase Setup

The app requires Firebase Authentication and Firestore database. Set up your Firebase project and configure the environment variables as shown above.

For detailed setup instructions:
- **Booking System**: See [`docs/booking-data-structure.md`](./docs/booking-data-structure.md)
- **Ladder System**: See [`docs/LADDER_SYSTEM.md`](./docs/LADDER_SYSTEM.md)

## 🎨 Components

The app uses shadcn/ui components. Add new components with:

```bash
npx shadcn@latest add <component-name>
```

## 📚 Documentation

- [`docs/LADDER_SYSTEM.md`](./docs/LADDER_SYSTEM.md) - Complete ladder tournament documentation
- [`docs/booking-data-structure.md`](./docs/booking-data-structure.md) - Booking system and Firestore setup
- [`docs/testing.md`](./docs/testing.md) - Testing guide and best practices
- [`docs/deployment-github-pages.md`](./docs/deployment-github-pages.md) - Deployment instructions
- [`docs/ladderstats-feature.md`](./docs/ladderstats-feature.md) - Ladder statistics feature
- [`docs/field-naming-conventions.md`](./docs/field-naming-conventions.md) - Code conventions

## 📄 License

MIT
