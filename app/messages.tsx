import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/types';
import ConversationList from '@/components/chat/ConversationList';
import Colors from '@/constants/colors';

export default function MessagesScreen() {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to view messages.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
      return;
    }

    if (!user) return;

    console.log('[MessagesScreen] Loading conversations for user:', user.id);

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('userId', '==', user.id),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('[MessagesScreen] Conversations updated:', snapshot.docs.length);
        const loadedConversations = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            entityId: data.entityId,
            entityName: data.entityName,
            userId: data.userId,
            userName: data.userName,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt
              ? (data.lastMessageAt as Timestamp).toDate().toISOString()
              : undefined,
            unreadCount: data.unreadCount || 0,
            createdAt: data.createdAt
              ? (data.createdAt as Timestamp).toDate().toISOString()
              : new Date().toISOString(),
          } as Chat;
        });
        setConversations(loadedConversations);
        setIsLoading(false);
      },
      (error) => {
        console.error('[MessagesScreen] Error loading conversations:', error);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to load conversations. Please try again.');
      }
    );

    return () => unsubscribe();
  }, [user, isAuthenticated]);

  const handleSelectConversation = (chatId: string) => {
    router.push(`/chat/${chatId}` as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerStyle: { backgroundColor: Colors.light.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' as const },
        }}
      />

      <ConversationList
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
