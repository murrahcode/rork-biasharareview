
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpcClient } from '@/lib/trpc';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { GoogleSignin, SignInSuccessResponse } from '@react-native-google-signin/google-signin';
// import { IOS_CLIENT_ID } from '@/constants/credentials';

const defaultNotificationSettings = {
  reviewLikes: true,
  reviewReplies: true,
  newFollowers: true,
  promotions: false,
};

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      // iosClientId: IOS_CLIENT_ID,
      webClientId: '1005001835023-euem3vlgb5q1ieb2d0nnohpi3917oq7p.apps.googleusercontent.com',
    });
  }, []);

  const syncUserWithBackend = useCallback(async (fbUser: FirebaseUser) => {
    try {
      console.log('[AuthContext] Syncing user with backend:', fbUser.uid);
      const result = await trpcClient.auth.syncUser.mutate({
        uid: fbUser.uid,
        displayName: fbUser.displayName || '',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || '',
      });
      console.log('[AuthContext] User sync result:', result);
      return result.success;
    } catch (error) {
      console.error('[AuthContext] Failed to sync user with backend:', error);
      return false;
    }
  }, []);

  const loadUserProfile = useCallback(async (userId: string, fbUser: FirebaseUser, retryCount = 0) => {
    console.log(`[AuthContext] Loading user profile for userId: ${userId}`);
    
    const userDocRef = doc(db, 'users', userId);
    
    try {
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log('[AuthContext] User profile loaded successfully');
        
        const joinedAt = userData.createdAt 
          ? (userData.createdAt as Timestamp).toDate().toISOString() 
          : userData.created_at
          ? (userData.created_at as Timestamp).toDate().toISOString()
          : new Date().toISOString();
        
        setUser({
          id: userId,
          name: userData.displayName || userData.name || 'User',
          email: userData.email || '',
          avatar: userData.photoURL || userData.avatar,
          favorites: userData.favorites || [],
          reviewsCount: userData.reviewsCount || 0,
          isEntityOwner: userData.isEntityOwner || false,
          ownedEntityIds: userData.ownedEntityIds || [],
          joinedAt,
          isPublicProfile: userData.isPublicProfile ?? true,
          requireFollowApproval: userData.requireFollowApproval ?? false,
          showActivity: userData.showActivity ?? true,
          notificationSettings: userData.notificationSettings || defaultNotificationSettings,
        } as User);
      } else {
        console.warn('[AuthContext] User profile does not exist in Firestore yet');
        if (retryCount < 5) {
          console.log(`[AuthContext] Retrying to load profile... (${retryCount + 1}/5)`);
          setTimeout(() => loadUserProfile(userId, fbUser, retryCount + 1), 2000);
        } else {
          console.log('[AuthContext] Creating fallback user profile from Firebase Auth data');
          const fallbackUser: User = {
            id: userId,
            name: fbUser.displayName || 'User',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || null,
            favorites: [],
            reviewsCount: 0,
            isEntityOwner: false,
            ownedEntityIds: [],
            joinedAt: new Date().toISOString(),
            isPublicProfile: true,
            requireFollowApproval: false,
            showActivity: true,
            notificationSettings: defaultNotificationSettings,
          };
          setUser(fallbackUser);
        }
      }
    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      console.error('[AuthContext] Failed to load user profile:', errorCode, error.message);
      
      if ((errorCode === 'unavailable' || errorCode === 'failed-precondition') && retryCount < 5) {
        console.log(`[AuthContext] Retrying... (${retryCount + 1}/5)`);
        setTimeout(() => loadUserProfile(userId, fbUser, retryCount + 1), 2000 * (retryCount + 1));
      } else {
        console.log('[AuthContext] Using fallback user profile from Firebase Auth data');
        const fallbackUser: User = {
          id: userId,
          name: fbUser.displayName || 'User',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || null,
          favorites: [],
          reviewsCount: 0,
          isEntityOwner: false,
          ownedEntityIds: [],
          joinedAt: new Date().toISOString(),
          isPublicProfile: true,
          requireFollowApproval: false,
          showActivity: true,
          notificationSettings: defaultNotificationSettings,
        };
        setUser(fallbackUser);
      }
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    
    const authUnsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('[AuthContext] Auth state changed:', fbUser ? `User: ${fbUser.uid}` : 'No user');
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const syncSuccess = await syncUserWithBackend(fbUser);
        if (syncSuccess) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        await loadUserProfile(fbUser.uid, fbUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      authUnsubscribe();
    };
  }, [loadUserProfile, syncUserWithBackend]);

  const saveUserProfile = async (userId: string, userData: User) => {
    try {
      await setDoc(doc(db, 'users', userId), userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  };

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent. Please check your inbox.' };
    } catch (error: any) {
      console.error('Password reset failed:', error);
      if (error.code === 'auth/user-not-found') {
        return { success: false, message: 'No account found with this email address.' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, message: 'Invalid email address.' };
      }
      return { success: false, message: 'Failed to send password reset email. Please try again.' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      setIsLoading(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const now = new Date().toISOString();
      const newUser: any = {
        id: credential.user.uid,
        name,
        email,
        avatar: null,
        favorites: [],
        reviewsCount: 0,
        isEntityOwner: false,
        ownedEntityIds: [],
        created_at: serverTimestamp(),
        user_role: 'user',
        isPublicProfile: true,
        requireFollowApproval: false,
        showActivity: true,
        notificationSettings: defaultNotificationSettings,
      };
      await setDoc(doc(db, 'users', credential.user.uid), newUser);
      setUser({
        id: credential.user.uid,
        name,
        email,
        avatar: null,
        favorites: [],
        reviewsCount: 0,
        isEntityOwner: false,
        ownedEntityIds: [],
        joinedAt: now,
        isPublicProfile: true,
        requireFollowApproval: false,
        showActivity: true,
        notificationSettings: defaultNotificationSettings,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Signup failed:', error);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'This email is already registered. Please login instead.' };
      } else if (error.code === 'auth/weak-password') {
        return { success: false, message: 'Password is too weak. Please use at least 6 characters.' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, message: 'Invalid email address.' };
      }
      return { success: false, message: 'Signup failed. Please try again.' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (result: SignInSuccessResponse): Promise<boolean> => {
    try {
      // First, authenticate with Firebase using Google ID token
      const idToken = result.data.idToken;
      if (!idToken) {
        console.error('Google login failed: No ID token received');
        return false;
      }

      // Create Firebase credential and sign in
      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseAuthResult = await signInWithCredential(auth, credential);
      const firebaseUser = firebaseAuthResult.user;
      const firebaseUserId = firebaseUser.uid;

      // Now use Firebase UID (not Google user ID) for Firestore operations
      const googleUser = result.data.user;
      let userDoc = await getDoc(doc(db, 'users', firebaseUserId));
      
      if (!userDoc.exists()) {
        const newUser: any = {
          id: firebaseUserId,
          name: googleUser.name || firebaseUser.displayName || 'User',
          email: googleUser.email || firebaseUser.email || '',
          avatar: googleUser.photo || firebaseUser.photoURL || null,
          favorites: [],
          reviewsCount: 0,
          isEntityOwner: false,
          ownedEntityIds: [],
          created_at: serverTimestamp(),
          user_role: 'user',
          isPublicProfile: true,
          requireFollowApproval: false,
          showActivity: true,
          notificationSettings: defaultNotificationSettings,
        };
        await setDoc(doc(db, 'users', firebaseUserId), newUser);
        userDoc = await getDoc(doc(db, 'users', firebaseUserId));
      }
      
      await loadUserProfile(firebaseUserId, firebaseUser);
      return true;
    } catch (error) {
      console.error('Google login failed:', error);
      return false;
    }
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  const toggleFavorite = useCallback(async (entityId: string) => {
    if (!user) return;

    const favorites = user.favorites.includes(entityId)
      ? user.favorites.filter(id => id !== entityId)
      : [...user.favorites, entityId];

    const updatedUser = { ...user, favorites };
    await saveUserProfile(user.id, updatedUser);
  }, [user]);

  return useMemo(() => ({
    user,
    firebaseUser,
    isLoading,
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    logout,
    toggleFavorite,
    isAuthenticated: !!user,
  }), [user, firebaseUser, isLoading, login, signup, loginWithGoogle, resetPassword, logout, toggleFavorite]);
});
