# EMR Mobile - Screen Flow Guide

## Authentication Flow

```
┌─────────────────────┐
│   Login Screen      │
│  (auth/login.tsx)   │
│                     │
│  - Azure AD Button  │
│  - Remember Me      │
│  - Biometric Login  │
└──────────┬──────────┘
           │
           │ First Login?
           ├─── YES ──────────────┐
           │                      │
           │                      ▼
           │            ┌─────────────────────┐
           │            │ Biometric Setup     │
           │            │(auth/biometric-     │
           │            │    setup.tsx)       │
           │            │                     │
           │            │  - Enable Prompt    │
           │            │  - Benefits List    │
           │            │  - Skip Option      │
           │            └──────────┬──────────┘
           │                       │
           └─── NO ────────────────┤
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │   Home Screen       │
                         │ (app/home.tsx)      │
                         │                     │
                         │  - Dashboard        │
                         │  - Quick Actions    │
                         └─────────────────────┘
```

## Main App Navigation

```
┌──────────────────────────────────────────────────────┐
│                  Tab Navigation                       │
│                                                       │
│  ┌──────────────┐              ┌──────────────┐     │
│  │   🏠 Home    │              │   👤 Profile  │     │
│  └──────┬───────┘              └──────┬────────┘     │
│         │                             │              │
└─────────┼─────────────────────────────┼──────────────┘
          │                             │
          ▼                             ▼
 ┌─────────────────┐          ┌─────────────────────┐
 │  Home Screen    │          │  Profile Screen     │
 │ (app/home.tsx)  │          │ (app/profile.tsx)   │
 │                 │          │                     │
 │  - Welcome      │          │  - User Avatar      │
 │  - Stats        │          │  - User Info        │
 │  - Quick Nav    │          │  - Profile Details  │
 └─────────────────┘          │  - Settings Link    │
                              │  - Sign Out         │
                              └──────────┬──────────┘
                                         │
                                         │ Tap Settings
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  Settings Screen    │
                              │ (app/settings.tsx)  │
                              │                     │
                              │  - Biometric        │
                              │  - Notifications    │
                              │  - Theme            │
                              │  - Privacy & Legal  │
                              │  - Advanced         │
                              └─────────────────────┘
```

## Settings Screen Layout

```
┌─────────────────────────────────────┐
│  ‹ Back          Settings           │
├─────────────────────────────────────┤
│                                     │
│  SECURITY                           │
│  ┌───────────────────────────────┐ │
│  │ Face ID              [Toggle] │ │
│  │ Use Face ID to sign in        │ │
│  └───────────────────────────────┘ │
│                                     │
│  NOTIFICATIONS                      │
│  ┌───────────────────────────────┐ │
│  │ All Notifications    [Toggle] │ │
│  ├───────────────────────────────┤ │
│  │ Email Notifications  [Toggle] │ │
│  ├───────────────────────────────┤ │
│  │ Push Notifications   [Toggle] │ │
│  └───────────────────────────────┘ │
│                                     │
│  APPEARANCE                         │
│  ┌───────────────────────────────┐ │
│  │ Light                    ( )  │ │
│  ├───────────────────────────────┤ │
│  │ Dark                     ( )  │ │
│  ├───────────────────────────────┤ │
│  │ System                   (•)  │ │
│  └───────────────────────────────┘ │
│                                     │
│  PRIVACY & LEGAL                    │
│  ┌───────────────────────────────┐ │
│  │ Privacy Policy            ›   │ │
│  ├───────────────────────────────┤ │
│  │ Terms of Service          ›   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ADVANCED                           │
│  ┌───────────────────────────────┐ │
│  │ Clear Cache               ›   │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## Profile Screen Layout

```
┌─────────────────────────────────────┐
│              Profile                │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────────┐             │
│         │             │             │
│         │     JD      │   Avatar    │
│         │             │             │
│         └─────────────┘             │
│                                     │
│         John Doe                    │
│         john.doe@hospital.com       │
│         ┌─────────────┐             │
│         │   Doctor    │   Badge     │
│         └─────────────┘             │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Email    john.doe@email.com  │ │
│  ├───────────────────────────────┤ │
│  │ Phone    +1 234 567 8900     │ │
│  ├───────────────────────────────┤ │
│  │ Role     Doctor              │ │
│  ├───────────────────────────────┤ │
│  │ Tenant   abc-123-def         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⚙️  Settings              ›   │ │
│  ├───────────────────────────────┤ │
│  │ 🔒  Privacy Policy        ›   │ │
│  ├───────────────────────────────┤ │
│  │ 📄  Terms of Service      ›   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │         Sign Out              │ │
│  │         (Red Button)          │ │
│  └───────────────────────────────┘ │
│                                     │
│         Version 1.0.0               │
└─────────────────────────────────────┘
```

## Login Screen States

### Initial State
```
┌─────────────────────────────────────┐
│                                     │
│         ┌─────────┐                 │
│         │   EMR   │   Logo          │
│         └─────────┘                 │
│                                     │
│       Welcome Back                  │
│   Sign in to access your            │
│   electronic medical records        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Sign in with Azure AD        │ │
│  │      (Primary Button)         │ │
│  └───────────────────────────────┘ │
│                                     │
│  Remember me              [Toggle] │
│                                     │
│              OR                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Sign in with Face ID         │ │
│  │     (Outline Button)          │ │
│  └───────────────────────────────┘ │
│                                     │
│  By signing in, you agree to our   │
│  Terms of Service and Privacy      │
│  Policy                            │
└─────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────┐
│                                     │
│         ┌─────────┐                 │
│         │   EMR   │                 │
│         └─────────┘                 │
│                                     │
│       Welcome Back                  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │         Loading...            │ │
│  │           ⏳                  │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## Biometric Setup Screen

```
┌─────────────────────────────────────┐
│                                     │
│         ┌─────────┐                 │
│         │   🔐    │   Icon          │
│         └─────────┘                 │
│                                     │
│      Enable Face ID                 │
│                                     │
│  Use Face ID for quick and secure   │
│  access to your medical records     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ⚡ Quick Access              │ │
│  │  Sign in instantly without    │ │
│  │  entering credentials         │ │
│  │                               │ │
│  │  🛡️ Enhanced Security         │ │
│  │  Your biometric data never    │ │
│  │  leaves your device           │ │
│  │                               │ │
│  │  ✨ Convenience               │ │
│  │  No need to remember          │ │
│  │  passwords or PINs            │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    Enable Face ID             │ │
│  │    (Primary Button)           │ │
│  └───────────────────────────────┘ │
│                                     │
│         Skip for Now                │
│         (Ghost Button)              │
│                                     │
│  You can change this setting        │
│  anytime in your account settings   │
└─────────────────────────────────────┘
```

## Color Scheme

- Primary Blue: `#2563EB`
- Background: `#F8FAFC`
- Text Primary: `#1E293B`
- Text Secondary: `#64748B`
- Text Tertiary: `#94A3B8`
- Border: `#E2E8F0`
- Danger Red: `#EF4444`
- Success: `#10B981`

## Typography

- Header Title: 32px, Bold
- Screen Title: 28px, Bold
- Section Title: 14px, Semibold, Uppercase
- Body Large: 18px
- Body: 16px
- Body Small: 14px
- Caption: 12px

## Spacing

- Container Padding: 16px-24px
- Card Padding: 16px (md), 20px (lg)
- Section Spacing: 24px
- Item Spacing: 16px
- Element Spacing: 8px-12px

---

**Note**: All screens are fully responsive and adapt to both iOS and Android platforms with platform-specific optimizations.
