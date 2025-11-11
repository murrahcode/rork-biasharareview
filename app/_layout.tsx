import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthContext } from "@/contexts/AuthContext";
import { UserDashboardContext } from "@/contexts/UserDashboardContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="entity/[id]" options={{ title: "Entity Details" }} />
      <Stack.Screen name="review/submit" options={{ title: "Write Review", presentation: "modal" }} />
      <Stack.Screen name="dashboard" options={{ title: "Entity Dashboard" }} />
      <Stack.Screen name="user-dashboard" options={{ title: "User Dashboard" }} />
      <Stack.Screen name="contact" options={{ title: "Contact Us" }} />
      <Stack.Screen name="plans" options={{ title: "Select Plan" }} />
      <Stack.Screen name="listing/create" options={{ title: "Add Listing" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      <Stack.Screen name="chats" options={{ title: "My Chats" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        await SplashScreen.hideAsync();
        setIsReady(true);
      } catch (error) {
        console.error('[App] Initialization error:', error);
        await SplashScreen.hideAsync();
        setIsReady(true);
      }
    }

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading BiasharaReview...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthContext>
            <UserDashboardContext>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </UserDashboardContext>
          </AuthContext>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
});
