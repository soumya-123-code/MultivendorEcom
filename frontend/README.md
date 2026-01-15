# ERP Frontend

A modern React frontend for the ERP system built with Material UI 7, React 18, and TypeScript.

## Features

- **OTP-based Authentication** - Secure passwordless login
- **Role-based Access Control** - Admin, Vendor, Warehouse, Delivery Agent dashboards
- **Persistent Sessions** - Token refresh and proper session management (fixes auto-logout issue)
- **Modern UI** - Material UI 7 with light/dark theme support
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

- React 18
- TypeScript 5
- Material UI 7
- React Router 7
- Vite 6

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── utils/           # API client and service functions
├── components/    # Reusable UI components
├── contexts/      # React contexts (Auth, UI)
├── pages/         # Page components by role
│   ├── admin/     # Admin pages
│   ├── auth/      # Authentication pages
│   ├── delivery/  # Delivery agent pages
│   ├── vendor/    # Vendor pages
│   └── warehouse/ # Warehouse staff pages
├── routes/        # Route configuration
├── theme/         # MUI theme configuration
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Key Fixes from Original Code

1. **Auto-logout on reload** - Fixed by properly initializing auth state from localStorage before making API calls
2. **MUI version mismatch** - Updated to MUI 7 with matching icons package
3. **Route protection** - Simplified ProtectedRoute component that doesn't cause infinite loops
4. **Token refresh** - Proper refresh token handling with request queue to prevent race conditions
5. **Session expiry** - Global event listener for session expiry with clean logout

## Authentication Flow

1. User enters email → OTP sent to email
2. User enters OTP → API returns access + refresh tokens
3. Tokens stored in localStorage along with user data
4. On page reload, stored user shown immediately, then refreshed in background
5. On 401 error, refresh token used to get new access token
6. If refresh fails, user logged out and redirected to login

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
