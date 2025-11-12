import Constants, { ExecutionEnvironment } from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safe wrapper for GoogleSignin that handles Expo Go
let GoogleSignin: any = null;
let isGoogleSigninAvailable = false;

if (!isExpoGo) {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    isGoogleSigninAvailable = true;
  } catch (error) {
    console.warn('Google Sign-In module not available:', error);
    isGoogleSigninAvailable = false;
  }
}

// Export a safe wrapper object
export const safeGoogleSignin = {
  get isAvailable() {
    return isGoogleSigninAvailable && !isExpoGo;
  },
  get GoogleSignin() {
    if (!this.isAvailable) {
      throw new Error('Google Sign-In is not available in Expo Go');
    }
    return GoogleSignin;
  },
  async hasPlayServices(options?: any) {
    if (!this.isAvailable) {
      throw new Error('Google Sign-In is not available in Expo Go');
    }
    return GoogleSignin.hasPlayServices(options);
  },
  async signIn() {
    if (!this.isAvailable) {
      throw new Error('Google Sign-In is not available in Expo Go');
    }
    return GoogleSignin.signIn();
  },
  configure(options: any) {
    if (!this.isAvailable) {
      console.warn('Google Sign-In configuration skipped in Expo Go');
      return;
    }
    GoogleSignin.configure(options);
  },
};

// Type definition matching @react-native-google-signin/google-signin
export interface SignInSuccessResponse {
  type: 'success';
  data: {
    idToken: string | null;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      photo: string | null;
      familyName: string | null;
      givenName: string | null;
    };
  };
}

