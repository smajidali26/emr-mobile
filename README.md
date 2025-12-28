# EMR Mobile Application

A modern React Native mobile application for Electronic Medical Records (EMR) built with Expo.

## Features

- Azure AD B2C Authentication
- Biometric Authentication (Face ID, Touch ID, Fingerprint)
- Secure Token Storage
- Modern UI with NativeWind (Tailwind CSS)
- Type-safe with TypeScript
- State Management with Zustand
- Data Fetching with TanStack Query
- File-based Routing with Expo Router

## Tech Stack

- **Framework:** React Native with Expo SDK 50+
- **Navigation:** Expo Router (file-based routing)
- **Authentication:** Azure AD B2C with expo-auth-session
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Language:** TypeScript
- **Secure Storage:** expo-secure-store
- **Biometric Auth:** expo-local-authentication

## Project Structure

```
emr-mobile/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── _layout.tsx        # Root layout
│   │   ├── index.tsx          # Entry point
│   │   ├── (auth)/            # Auth screens
│   │   │   ├── _layout.tsx
│   │   │   └── login.tsx
│   │   └── (app)/             # Authenticated screens
│   │       ├── _layout.tsx
│   │       └── home.tsx
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   └── features/          # Feature components
│   ├── lib/
│   │   ├── api/               # API client & React Query
│   │   ├── auth/              # Azure AD B2C auth
│   │   └── storage/           # Secure storage utilities
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
├── assets/                    # Images, fonts, etc.
├── App.tsx                    # App entry point
├── app.json                   # Expo configuration
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Azure AD B2C tenant configured

## Environment Configuration

Create a copy of `.env.example` as `.env` and configure the following:

```env
# Azure AD B2C Configuration
AZURE_B2C_TENANT_NAME=your-tenant
AZURE_B2C_TENANT_ID=your-tenant-id
AZURE_B2C_CLIENT_ID=your-client-id
AZURE_B2C_REDIRECT_URI=emr://auth/callback
AZURE_B2C_AUTHORITY_DOMAIN=your-tenant.b2clogin.com
AZURE_B2C_SIGN_IN_POLICY=B2C_1_SignUpSignIn
AZURE_B2C_SIGN_UP_POLICY=B2C_1_SignUp
AZURE_B2C_RESET_PASSWORD_POLICY=B2C_1_PasswordReset
AZURE_B2C_API_SCOPE=https://your-tenant.onmicrosoft.com/api/access

# API Configuration
API_BASE_URL=https://api.emr.example.com
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Azure AD B2C Setup

1. Create an Azure AD B2C tenant
2. Register a mobile application
3. Configure redirect URIs: `emr://auth/callback`
4. Create user flows for Sign In, Sign Up, and Password Reset
5. Configure API scopes
6. Update environment variables with your tenant details

## Authentication Flow

1. User opens the app
2. If not authenticated, redirected to login screen
3. User taps "Sign in with Azure AD"
4. Opens Azure AD B2C login page in browser
5. User authenticates
6. Browser redirects back to app with authorization code
7. App exchanges code for access token
8. Token stored securely in expo-secure-store
9. User navigated to home screen

### Biometric Authentication

- Optional biometric authentication (Face ID/Touch ID/Fingerprint)
- Only available after initial Azure AD login
- Securely stores tokens for quick access
- Can be disabled in settings

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Security Features

- Secure token storage with expo-secure-store
- Automatic token refresh
- PKCE flow for OAuth2
- Biometric authentication option
- Encrypted storage for sensitive data
- Network security configurations

## API Integration

The app uses axios-based API client with:

- Automatic token injection
- Token refresh on 401
- Request/response interceptors
- Error handling
- TypeScript support

Example API call:

```typescript
import { apiClient } from '@lib/api/client';

const data = await apiClient.get('/patients/123');
```

## State Management

The app uses Zustand for state management:

- `auth-store`: Authentication state
- `app-store`: Global app state

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass
4. Submit a pull request

## License

Proprietary - All rights reserved