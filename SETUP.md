# EMR Mobile App - Setup Guide

This guide will help you set up and run the EMR mobile application.

## Project Overview

The EMR Mobile Application is a React Native application built with Expo that provides secure access to Electronic Medical Records through Azure AD B2C authentication.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or later)
   - Download from https://nodejs.org/
   - Verify: `node --version`

2. **npm** or **yarn**
   - Comes with Node.js
   - Verify: `npm --version`

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

4. **Mobile Development Environment**
   - **For iOS**: Xcode (macOS only)
   - **For Android**: Android Studio with emulator
   - **For Testing**: Expo Go app on your physical device

## Installation Steps

### 1. Install Dependencies

Navigate to the project directory and install all dependencies:

```bash
cd D:\code-source\EMR\source\emr-mobile
npm install
```

### 2. Configure Environment Variables

The app uses Azure AD B2C for authentication. You need to configure these settings:

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your Azure AD B2C settings:
   ```env
   AZURE_B2C_TENANT_NAME=your-tenant
   AZURE_B2C_TENANT_ID=your-tenant-id
   AZURE_B2C_CLIENT_ID=your-client-id
   AZURE_B2C_REDIRECT_URI=emr://auth/callback
   AZURE_B2C_AUTHORITY_DOMAIN=your-tenant.b2clogin.com
   AZURE_B2C_SIGN_IN_POLICY=B2C_1_SignUpSignIn
   AZURE_B2C_API_SCOPE=https://your-tenant.onmicrosoft.com/api/access
   API_BASE_URL=https://api.emr.example.com
   ```

3. Update `app.json` with your Azure settings in the `extra` field:
   ```json
   "extra": {
     "AZURE_B2C_TENANT_NAME": "your-tenant",
     "AZURE_B2C_CLIENT_ID": "your-client-id",
     // ... other settings
   }
   ```

### 3. Azure AD B2C Configuration

You need to set up Azure AD B2C:

#### Create Azure AD B2C Tenant

1. Go to Azure Portal
2. Create a new Azure AD B2C tenant
3. Note your tenant name (e.g., `yourcompany.onmicrosoft.com`)

#### Register Mobile Application

1. In Azure AD B2C, go to "App registrations"
2. Click "New registration"
3. Enter application name: "EMR Mobile"
4. Select "Accounts in any identity provider or organizational directory"
5. Add Redirect URI:
   - Platform: Public client/native (mobile & desktop)
   - URI: `emr://auth/callback`
6. Click "Register"
7. Note the Application (client) ID

#### Create User Flows

1. Go to "User flows" in Azure AD B2C
2. Create the following flows:
   - **Sign up and sign in**: `B2C_1_SignUpSignIn`
   - **Password reset**: `B2C_1_PasswordReset`

#### Configure API Scopes

1. Go to "Expose an API"
2. Add a scope: `api.access`
3. Note the full scope URI

## Running the Application

### Start Development Server

```bash
npm start
```

This will start the Expo development server and show a QR code.

### Run on iOS Simulator (macOS only)

```bash
npm run ios
```

Or press `i` in the terminal after running `npm start`.

### Run on Android Emulator

```bash
npm run android
```

Or press `a` in the terminal after running `npm start`.

### Run on Physical Device

1. Install Expo Go app from App Store or Google Play
2. Scan the QR code shown in the terminal
3. The app will load on your device

## Project Structure

```
emr-mobile/
├── src/
│   ├── app/                        # Expo Router screens
│   │   ├── _layout.tsx            # Root layout with providers
│   │   ├── index.tsx              # Entry point/redirect logic
│   │   ├── (auth)/                # Authentication screens
│   │   │   ├── _layout.tsx
│   │   │   └── login.tsx
│   │   └── (app)/                 # Authenticated app screens
│   │       ├── _layout.tsx
│   │       └── home.tsx
│   ├── components/
│   │   └── ui/                    # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── TextInput.tsx
│   │       ├── Card.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── api/                   # API client
│   │   │   ├── client.ts          # Axios instance with auth
│   │   │   └── query-client.ts    # TanStack Query config
│   │   ├── auth/                  # Authentication
│   │   │   ├── config.ts          # Azure B2C config
│   │   │   ├── auth-service.ts    # Auth logic
│   │   │   └── auth-context.tsx   # React context
│   │   └── storage/               # Storage utilities
│   │       ├── token-storage.ts   # Secure token storage
│   │       └── biometric-auth.ts  # Biometric auth
│   ├── hooks/                     # Custom React hooks
│   ├── stores/                    # Zustand stores
│   │   ├── auth-store.ts
│   │   └── app-store.ts
│   └── types/                     # TypeScript types
│       ├── auth.types.ts
│       └── api.types.ts
├── assets/                        # Images, fonts
├── App.tsx                        # Entry point
├── app.json                       # Expo configuration
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Key Features Implemented

### 1. Authentication
- Azure AD B2C OAuth2 flow with PKCE
- Secure token storage using expo-secure-store
- Automatic token refresh
- Biometric authentication (Face ID, Touch ID, Fingerprint)

### 2. Navigation
- File-based routing with Expo Router
- Protected routes for authenticated users
- Automatic redirect based on auth status

### 3. State Management
- Zustand for global state
- TanStack Query for server state
- React Context for auth state

### 4. UI Components
- Custom reusable components
- Consistent styling with variants
- Loading and error states
- Safe area handling

### 5. API Integration
- Axios-based HTTP client
- Automatic token injection
- Error handling and retries
- TypeScript support

## Testing the Application

### Test Authentication Flow

1. Launch the app
2. You should see the login screen
3. Tap "Sign in with Azure AD"
4. Browser opens with Azure AD B2C login
5. Enter credentials (or sign up)
6. After successful auth, you're redirected to the home screen
7. Your user info is displayed

### Test Biometric Authentication (if available)

1. Sign in once with Azure AD
2. Sign out
3. On login screen, tap "Sign in with [Face ID/Touch ID/Fingerprint]"
4. Authenticate with biometrics
5. You're signed in without browser flow

## Troubleshooting

### Issue: App doesn't start

**Solution:**
```bash
# Clear Expo cache
expo start -c

# Or
npm start -- --clear
```

### Issue: Azure AD redirect not working

**Solution:**
1. Verify redirect URI in Azure AD B2C matches `emr://auth/callback`
2. Check app.json has correct scheme: `"scheme": "emr"`
3. Rebuild the app after changing configuration

### Issue: TypeScript errors

**Solution:**
```bash
# Run type check
npm run type-check

# Check for missing dependencies
npm install
```

### Issue: Module resolution errors

**Solution:**
1. Clear Metro bundler cache: `npm start -- --reset-cache`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Issue: Authentication fails

**Solution:**
1. Check Azure AD B2C configuration
2. Verify environment variables are correct
3. Check network connectivity
4. Look at console logs for detailed error messages

## Development Workflow

### Adding New Screens

1. Create a new file in `src/app/` directory
2. Export a React component
3. Navigation is automatic based on file structure

### Adding New UI Components

1. Create component in `src/components/ui/`
2. Follow existing patterns for variants and props
3. Export from `src/components/ui/index.ts`

### Adding API Endpoints

1. Use the `apiClient` from `src/lib/api/client.ts`
2. Example:
   ```typescript
   import { apiClient } from '@lib/api/client';

   const patients = await apiClient.get('/patients');
   ```

### Adding State

1. For global app state, use Zustand stores
2. For server state, use TanStack Query
3. For component state, use React hooks

## Next Steps

1. **Configure Azure AD B2C** with your tenant details
2. **Update environment variables** in app.json
3. **Install dependencies**: `npm install`
4. **Start the app**: `npm start`
5. **Test authentication** flow
6. **Add features** as needed

## Useful Commands

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type checking
npm run type-check

# Linting
npm run lint

# Clear cache and restart
npm start -- --clear
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/routing/introduction/)
- [React Native](https://reactnative.dev/)
- [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)

## Support

For issues or questions:
1. Check this setup guide
2. Review the troubleshooting section
3. Check project documentation in README.md
4. Contact the development team
