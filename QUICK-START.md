# EMR Mobile - Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
cd D:\code-source\EMR\source\emr-mobile
npm install
```

### 2. Configure Environment
Create `.env` file in the project root:
```env
AZURE_B2C_TENANT_NAME=your-tenant
AZURE_B2C_TENANT_ID=your-tenant-id
AZURE_B2C_CLIENT_ID=your-client-id
AZURE_B2C_SIGN_IN_POLICY=B2C_1_SignIn
API_BASE_URL=https://api.emr.example.com
```

### 3. Run the Application

**iOS Simulator**:
```bash
npm run ios
```

**Android Emulator**:
```bash
npm run android
```

**Expo Go (Development)**:
```bash
npm start
```

## New Features Implemented

### Authentication Screens

1. **Enhanced Login Screen** (`src/app/(auth)/login.tsx`)
   - Azure AD B2C integration
   - Biometric authentication option
   - Remember me functionality
   - Smooth animations

2. **Biometric Setup** (`src/app/(auth)/biometric-setup.tsx`)
   - First-time setup wizard
   - Clear benefit explanations
   - Skip option available

3. **User Profile** (`src/app/(app)/profile.tsx`)
   - User information display
   - Profile avatar with initials
   - Navigation to settings
   - Sign out functionality

4. **Settings** (`src/app/(app)/settings.tsx`)
   - Biometric toggle
   - Notification preferences
   - Theme selection
   - Privacy & legal links

## File Locations

### Screens
```
src/app/(auth)/
  ├── login.tsx              - Enhanced login screen
  └── biometric-setup.tsx    - Biometric setup wizard

src/app/(app)/
  ├── _layout.tsx            - Tab navigation (updated)
  ├── home.tsx               - Home screen
  ├── profile.tsx            - User profile (NEW)
  └── settings.tsx           - App settings (NEW)
```

### API Integration
```
src/lib/api/
  └── auth-api.ts            - Auth API functions & hooks (NEW)
```

### Storage
```
src/lib/storage/
  ├── token-storage.ts       - Enhanced with generic storage
  └── biometric-auth.ts      - Biometric authentication
```

### Types
```
src/types/
  └── auth.types.ts          - Enhanced with new types
```

## Testing the Implementation

### Manual Testing Steps

1. **Login Flow**:
   ```
   - Open app
   - Tap "Sign in with Azure AD"
   - Complete Azure AD authentication
   - Should redirect to biometric setup (first time)
   - Enable or skip biometric
   - Should land on home screen
   ```

2. **Biometric Authentication**:
   ```
   - Sign out from profile
   - On login screen, tap "Sign in with Face ID"
   - Complete biometric authentication
   - Should navigate to home screen
   ```

3. **Profile Screen**:
   ```
   - Tap Profile tab
   - View user information
   - Tap Settings
   - Should navigate to settings screen
   - Tap back to return to profile
   ```

4. **Settings**:
   ```
   - Toggle biometric authentication
   - Change theme selection
   - Toggle notification preferences
   - Verify settings persist
   ```

5. **Sign Out**:
   ```
   - From profile, tap Sign Out
   - Confirm in dialog
   - Should return to login screen
   ```

## API Endpoints

The app expects these endpoints to be available:

```
Authentication:
  GET  /api/auth/me                    - Current user profile

User Management:
  GET    /api/users/:userId/profile      - Get user profile
  PATCH  /api/users/:userId/profile      - Update profile
  GET    /api/users/:userId/preferences  - Get preferences
  PATCH  /api/users/:userId/preferences  - Update preferences
  POST   /api/auth/register              - Register new user
```

## Common Issues & Solutions

### Issue: TypeScript errors
**Solution**: Run `npm install` to ensure all dependencies are installed

### Issue: Biometric not available
**Solution**: Test on physical device or iOS Simulator with Face ID enabled

### Issue: API calls failing
**Solution**: Check `.env` file and ensure `API_BASE_URL` is correct

### Issue: Navigation not working
**Solution**: Clear Metro bundler cache:
```bash
npm start -- --reset-cache
```

### Issue: Animations stuttering
**Solution**: Enable `useNativeDriver` in animations (already implemented)

## Development Commands

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

# Clear cache
npm start -- --reset-cache
```

## Project Structure

```
emr-mobile/
├── src/
│   ├── app/                    # Screen files (Expo Router)
│   │   ├── (auth)/            # Authentication screens
│   │   ├── (app)/             # Main app screens
│   │   ├── _layout.tsx        # Root layout
│   │   └── index.tsx          # Entry point
│   ├── components/            # Reusable components
│   │   └── ui/                # UI components
│   ├── lib/                   # Libraries & utilities
│   │   ├── api/               # API client & endpoints
│   │   ├── auth/              # Authentication logic
│   │   └── storage/           # Secure storage
│   ├── stores/                # Zustand state management
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript type definitions
├── assets/                    # Images, fonts, etc.
├── .env                       # Environment variables
└── package.json              # Dependencies
```

## Key Technologies

- **Expo SDK 50**: React Native framework
- **Expo Router**: File-based navigation
- **TypeScript**: Type safety
- **TanStack Query**: Data fetching & caching
- **Zustand**: State management
- **Axios**: HTTP client
- **Expo Secure Store**: Encrypted storage
- **Expo Local Authentication**: Biometric auth
- **React Native**: Mobile UI framework

## Design System

### Colors
```typescript
Primary:      '#2563EB'  // Healthcare blue
Secondary:    '#64748B'  // Slate gray
Danger:       '#EF4444'  // Red
Success:      '#10B981'  // Green
Background:   '#F8FAFC'  // Light gray
```

### Spacing Scale
```
xs:  4px
sm:  8px
md:  12px
lg:  16px
xl:  24px
2xl: 32px
```

### Typography Scale
```
Display:    32px (Bold)
Headline:   28px (Bold)
Title:      20px (Semibold)
Body:       16px (Regular)
Caption:    14px (Regular)
Label:      12px (Medium)
```

## Next Steps

1. **Connect to Backend**: Update `API_BASE_URL` in `.env`
2. **Test on Devices**: Test Face ID on iOS, Fingerprint on Android
3. **Customize Branding**: Update logo, colors, and app name
4. **Add Analytics**: Integrate analytics service
5. **Push Notifications**: Set up push notification service
6. **Error Tracking**: Add error tracking (e.g., Sentry)

## Support

For questions or issues:
- Check `FEATURE-52-IMPLEMENTATION.md` for detailed implementation notes
- Review `SCREEN-FLOW.md` for visual screen flows
- Consult the codebase comments for specific functionality

---

**Version**: 1.0.0
**Last Updated**: December 26, 2024
**Feature**: #52 User Authentication Screens
