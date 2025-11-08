# BiasharaReview v1.1 - Firebase Setup Guide

## Overview

BiasharaReview has been upgraded to use Firebase as the backend for authentication, database, and file storage. This guide will help you complete the Firebase configuration.

## ✅ What's Been Implemented

### Core Features
- ✅ Firebase JS SDK integrated (web-compatible, works with Expo Go)
- ✅ Authentication with Email/Password and Google
- ✅ Firestore database for all data storage
- ✅ Firebase Storage for image uploads
- ✅ Claim Profile functionality
- ✅ Add Listing flow with 3 pricing tiers
- ✅ Contact Us / Claim Request forms
- ✅ Image upload (profile photos for listings)

### Pages Created
1. `/app/contact.tsx` - Contact Us / Claim Profile form
2. `/app/plans.tsx` - Pricing plans (Basic, Standard, Premium)
3. `/app/listing/create.tsx` - Add new listing form
4. `/app/(tabs)/profile.tsx` - Updated with "Add Listing" button

### Backend Structure
- `/lib/firebase.ts` - Firebase initialization
- `/lib/firebaseService.ts` - All CRUD operations
- `/constants/plans.ts` - Pricing tier definitions
- `/contexts/AuthContext.tsx` - Firebase authentication integrated

---

## 🔧 Firebase Configuration Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "BiasharaReview" (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable these providers:
   - ✅ **Email/Password** - Click Enable → Save
   - ✅ **Google** - Click Enable → Use project support email → Save

**Note:** Facebook authentication has been removed from the app to simplify the login process.

### 3. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (we'll set rules next)
4. Select your region (choose closest to Tanzania/Africa)
5. Click "Enable"

#### Set Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and paste:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Entities collection (public read, admin write)
    match /entities/{entityId} {
      allow read: if true;
      allow write: if request.auth != null; // Restrict to admins in production
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.admin == true);
    }
    
    // Listing submissions (pending approval)
    match /listingSubmissions/{submissionId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.admin == true);
      allow create: if request.auth != null;
      allow update, delete: if request.auth.token.admin == true;
    }
    
    // Claim requests
    match /claimRequests/{claimId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.admin == true);
      allow create: if request.auth != null;
      allow update, delete: if request.auth.token.admin == true;
    }
    
    // Chats
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.entityOwnerId);
      
      match /messages/{messageId} {
        allow read, create: if request.auth != null;
      }
    }
  }
}
\`\`\`

Click **Publish** to save the rules.

### 4. Enable Firebase Storage

1. Go to **Storage** in Firebase Console
2. Click "Get Started"
3. Use **Production mode**
4. Choose same region as Firestore
5. Click "Done"

#### Set Storage Security Rules

Go to **Storage** → **Rules** tab and paste:

\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Listing images
    match /listings/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId &&
        request.resource.contentType.matches('image/.*') &&
        request.resource.size < 5 * 1024 * 1024; // 5MB max
    }
    
    // Review images
    match /reviews/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId &&
        request.resource.contentType.matches('image/.*') &&
        request.resource.size < 3 * 1024 * 1024; // 3MB max
    }
  }
}
\`\`\`

Click **Publish** to save the rules.

### 5. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click **Web app icon** (</>)
4. Register app with nickname "BiasharaReview Web"
5. Copy the **firebaseConfig** object

### 6. Add Environment Variables

Create a `.env` file in your project root:

\`\`\`env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
\`\`\`

Replace the values with your actual Firebase config values.

**Important:** Add `.env` to your `.gitignore` file!

### 7. Initialize Firestore Collections

**Important:** The app now automatically creates user documents via the backend when users sign up or sign in. The `users` collection will be created automatically.

You can still manually create other collections if needed:

1. Go to **Firestore Database**
2. Click "Start collection"
3. Create these collections (leave them empty):
   - `entities`
   - `reviews`
   - `listingSubmissions`
   - `claimRequests`
   - `chats`

**Note:** The `users` collection is automatically created by the backend when the first user signs up.

---

## 📱 Testing the App

### Test Email/Password Authentication
1. Run the app: `npm start` or `bun start`
2. Navigate to Login screen
3. Click "Sign Up" to create a new account
4. Fill in name, email, and password
5. Submit the form
6. **Verify in Firebase Console:**
   - Go to Authentication → Users tab
   - Confirm new user appears with correct email
   - Go to Firestore Database → users collection
   - Find document with the user's UID
   - Verify all fields are present:
     - `uid`, `displayName`, `email`, `photoURL`
     - `createdAt`, `lastLogin`, `role: "user"`, `isActive: true`
     - `favorites: []`, `reviewsCount: 0`, `isEntityOwner: false`
     - `notificationSettings` object with all boolean fields
7. You should be automatically logged in and redirected to dashboard
8. Try logging out and logging back in with the same credentials
9. **Verify lastLogin update:**
   - After logging in again, check the user document in Firestore
   - The `lastLogin` timestamp should be updated to the current time

### Test Google Authentication
1. On login screen, click "Continue with Google"
2. Complete Google OAuth flow
3. Verify user is created in both Authentication and Firestore
4. Profile should include:
   - `displayName` from Google account
   - `photoURL` with Google profile picture
   - `email` from Google account
   - All other default fields (role, isActive, etc.)
5. Try logging in again with Google
6. Verify `lastLogin` timestamp is updated

### Test Listing Submission
1. Sign in to the app
2. Go to Profile tab
3. Click "Add New Listing"
4. Select a plan (Basic/Standard/Premium)
5. Fill in the listing form
6. Upload a photo
7. Submit
8. Check Firestore → `listingSubmissions` collection

### Test Claim Profile
1. Go to any entity detail page
2. Click "Claim Profile" button (only shows for unclaimed entities)
3. Fill in the claim form
4. Submit
5. Check Firestore → `claimRequests` collection

---

## 🔐 Admin Access

To mark users as admins (for approving listings/claims):

1. Go to Firebase Console → Authentication
2. Click on a user
3. Go to "Custom claims" section
4. Add: `{"admin": true}`
5. Save

Admin users will have permission to:
- Approve/reject listing submissions
- Approve/reject claim requests
- Delete reviews
- Manage entities

---

## 🚀 What's Next

### Features Still Needed (Not Included Due to Scope)

1. **Chat Functionality** - Create chat list and chat detail pages
2. **Admin Dashboard** - Create admin panel for reviewing submissions
3. **Payment Integration** - Implement payment processing for plans
4. **Startup Flow** - Currently goes to login; change to go directly to home
5. **Map/Location Features** - Disabled per requirements

### Quick Wins You Can Implement

#### Remove Startup Login Requirement
The app currently shows login screen on startup. To change this to go directly to home:

In `app/_layout.tsx`, the initial route is controlled by expo-router automatically based on the folder structure. Since `/(tabs)/index.tsx` exists, it should already go to home. If it's redirecting to login, remove any redirect logic in your auth context or layout files.

#### Social Login
The app already includes Google authentication. See `GOOGLE_FACEBOOK_AUTH_SETUP.md` for configuration instructions.

---

## 🛠️ Troubleshooting

### Issue: "Unable to load user profile" after sign up/sign in
**Symptoms:** Blank dashboard screen showing "Unable to load user profile" message

**Causes:**
1. User profile document was not created in Firestore during signup
2. Firestore security rules preventing read access
3. Network connectivity issues

**Solutions:**
1. **Check Firestore Console:**
   - Go to Firebase Console → Firestore Database
   - Check if `users` collection exists
   - Look for a document with the user's UID
   - If missing, the signup process failed to create the profile

2. **Verify Firestore Security Rules:**
   - Ensure users collection has `allow read: if true;`
   - Check the rules match the ones in this guide
   - Publish any rule changes

3. **Check Console Logs:**
   - Look for `[AuthContext]` log messages
   - Error messages will indicate if it's a permission or network issue

4. **Clear App Data and Retry:**
   - Sign out completely
   - Close and restart the app
   - Try signing up with a new account

5. **Test Firebase Connection:**
   - Open Firebase Console while the app is running
   - Watch for new documents being created in real-time
   - If nothing appears, there's a connection issue

### Issue: Firebase not defined errors
- Make sure `.env` file exists and has correct values
- Restart the expo dev server after adding `.env`
- Check that all EXPO_PUBLIC_* variables are set
- **Note:** The current implementation uses hardcoded config, so `.env` is optional

### Issue: Permission denied on Firestore
- Check that you've published the security rules
- Verify user is authenticated before trying to write
- Check rules in Firebase Console
- Make sure `allow read: if true;` is set for users collection

### Issue: Image upload fails
- Check Storage security rules are published
- Verify image is < 5MB
- Ensure user is authenticated
- Check file format is JPG, JPEG, or PNG

### Issue: Google login doesn't work
- Make sure you've enabled Google Sign-In in Firebase
- Verify OAuth client IDs are correctly configured
- Check redirect URI matches in Google Cloud Console

### Issue: "Client is offline" or "unavailable" errors
**Symptoms:** Error messages like "Failed to load user profile: unavailable" or "Firebase client is offline"

**Root Cause:** This error typically means **Firestore Database is not enabled** in your Firebase project.

**Solutions:**
1. **Enable Firestore Database (MOST COMMON FIX):**
   - Go to Firebase Console → Firestore Database
   - If you see "Get started" button, click it
   - Choose "Start in production mode"
   - Select your region (closest to your users)
   - Click "Enable"
   - Wait 1-2 minutes for Firestore to be provisioned
   - Restart your app

2. **Check Firestore Security Rules:**
   - After enabling Firestore, make sure rules are set correctly (see section above)
   - The `users` collection MUST have `allow read: if true;`
   - Click "Publish" after updating rules

3. **Verify Internet Connection:**
   - Check your device/emulator has network access
   - Try accessing other websites to confirm connectivity

4. **Clear App Cache and Retry:**
   - Close the app completely
   - Restart the Expo dev server
   - Reopen the app and try again

5. **Check Firebase Configuration:**
   - Verify all EXPO_PUBLIC_FIREBASE_* variables are set correctly in `.env`
   - Make sure the project ID matches your actual Firebase project
   - Restart dev server after changing `.env` values

6. **Auto-Retry Logic:**
   - The app will automatically retry loading the profile 3 times
   - If it fails after 3 attempts, check the solutions above

**Note:** The "unavailable" error almost always means Firestore is not enabled. Enable it first before trying other solutions.

---

## 📊 Database Structure

### Collections

**users**
\`\`\`
{
  id: string (same as auth UID)
  uid: string (Firebase Auth UID)
  name: string (deprecated, use displayName)
  displayName: string
  email: string
  avatar?: string (deprecated, use photoURL)
  photoURL?: string (URL)
  favorites: string[] (entity IDs)
  reviewsCount: number
  isEntityOwner: boolean
  ownedEntityIds: string[]
  created_at: timestamp (deprecated, use createdAt)
  createdAt: timestamp
  lastLogin: timestamp
  role: string (default: "user")
  isActive: boolean
  isPublicProfile: boolean
  requireFollowApproval: boolean
  showActivity: boolean
  notificationSettings: {
    reviewLikes: boolean
    reviewReplies: boolean
    newFollowers: boolean
    promotions: boolean
  }
}
\`\`\`

**listingSubmissions**
\`\`\`
{
  id: auto-generated
  userId: string
  planId: 'basic' | 'standard' | 'premium'
  name: string
  description: string
  entityType: 'business' | 'figure'
  categories: string[]
  location: string
  contactInfo: { phone, email, website, address, social }
  profilePhotoUrl?: string (Storage URL)
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: timestamp
  reviewedAt?: timestamp
}
\`\`\`

**claimRequests**
\`\`\`
{
  id: auto-generated
  userId: string
  entityId: string
  businessName: string
  contactName: string
  email: string
  phone: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: timestamp
  reviewedAt?: timestamp
}
\`\`\`

**entities** (migrated from mock data)
\`\`\`
{
  id: string
  name: string
  entityType: 'business' | 'figure'
  categories: string[]
  location: string
  contactInfo: { ... }
  isClaimed: boolean
  biasharaScore: number
  totalReviews: number
  description: string
  imageUrl: string
  isPremium: boolean
}
\`\`\`

**reviews**
\`\`\`
{
  id: string
  entityId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number (1-5)
  reviewText: string
  dateOfExperience: string
  createdAt: timestamp
  photoUrls?: string[]
  isVerified: boolean
  likes: number
  reports: number
}
\`\`\`

---

## 📧 Support

For issues or questions:
- Check Firebase Console logs
- Review Firestore security rules
- Verify environment variables are set
- Check expo logs for errors

---

## ✅ Deployment Checklist

Before going live:
- [ ] Set up Firebase project in production mode
- [ ] Configure all authentication providers
- [ ] Set proper Firestore security rules
- [ ] Set proper Storage security rules
- [ ] Add environment variables
- [ ] Test all flows (signup, login, listing, claim)
- [ ] Set up admin users
- [ ] Create backup strategy for Firestore
- [ ] Monitor Firebase usage and quotas
- [ ] Configure Firebase App Check (optional, for security)
- [ ] Set up Firebase Functions for backend logic (if needed)

---

---

## 🔄 Recent Changes

### Version 1.3.0 (Current)
**Changes:**
- **NEW: Automatic User Document Creation** - User documents are now automatically created/updated via backend when users sign up or sign in
- **Backend Integration** - Added Firebase Admin SDK to backend for secure user document management
- **User Sync Endpoint** - New tRPC mutation `auth.syncUser` handles all user document operations
- **Enhanced User Fields** - Added `uid`, `displayName`, `photoURL`, `createdAt`, `lastLogin`, `role`, and `isActive` fields
- **Retry Logic** - Improved profile loading with 5 retry attempts for better reliability
- **Consistent Field Names** - Backend uses Firebase Admin conventions (`displayName`, `photoURL`, `createdAt`)

**How It Works:**
1. User signs up or signs in with Firebase Auth
2. `AuthContext` automatically calls backend `auth.syncUser` mutation
3. Backend creates/updates user document in Firestore using Firebase Admin SDK
4. Fields updated:
   - **New users:** All fields including `uid`, `email`, `displayName`, `photoURL`, `createdAt`, `lastLogin`, `role`, etc.
   - **Existing users:** Only `lastLogin`, `email`, `displayName`, and `photoURL` are updated
5. Client loads the user profile from Firestore

**Benefits:**
- **Secure:** User documents are created server-side with proper validation
- **Reliable:** Backend has full Firestore access, no offline issues
- **Consistent:** Same logic for email/password and Google sign-in
- **Auditable:** `lastLogin` timestamp tracks user activity

### Version 1.2.0
**Changes:**
- Simplified Firebase initialization (removed complex persistence logic)
- Changed from real-time `onSnapshot` to one-time `getDoc` for user profile loading
- Improved error handling for offline scenarios
- Better logging for debugging authentication issues
- Fixed issue where user profiles weren't loading after signup

**Why these changes:**
- `onSnapshot` was causing issues with offline cache and multiple tabs
- One-time reads with `getDoc` are more reliable for initial profile loading
- Simpler Firebase configuration reduces edge cases and bugs
- Better error messages help identify issues faster

### What This Means for You:
- **More reliable:** Profile loading now works consistently
- **Better errors:** Clear messages when things go wrong
- **Simpler debugging:** Console logs show exactly what's happening
- **Offline support:** Firebase SDK handles offline mode automatically

---

**Version:** 1.3.0  
**Last Updated:** January 2025  
**Framework:** React Native (Expo), Firebase JS SDK v12+, Firebase Admin SDK v13+, Hono Backend, tRPC
