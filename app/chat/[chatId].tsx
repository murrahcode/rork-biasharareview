import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { trpcClient } from '@/lib/trpc';
import { ChatMessage } from '@/types';
import ChatThread from '@/components/chat/ChatThread';
import Colors from '@/constants/colors';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [chatName, setChatName] = useState<string>('Chat');

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to access chat.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
      return;
    }

    if (!chatId || !user) return;

    console.log('[ChatScreen] Loading chat:', chatId);

    const loadChatInfo = async () => {
      try {
        const chatQuery = query(collection(db, 'chats'), where('__name__', '==', chatId));
        const chatSnapshot = await getDocs(chatQuery);
        
        if (!chatSnapshot.empty) {
          const chatData = chatSnapshot.docs[0].data();
          setChatName(chatData.entityName || 'Chat');
        }
      } catch (error) {
        console.error('[ChatScreen] Error loading chat info:', error);
      }
    };

    loadChatInfo();

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('[ChatScreen] Messages updated:', snapshot.docs.length);
        const loadedMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            chatId: data.chatId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            message: data.message,
            timestamp: data.timestamp
              ? (data.timestamp as Timestamp).toDate().toISOString()
              : new Date().toISOString(),
            read: data.read || false,
          } as ChatMessage;
        });
        setMessages(loadedMessages);
        setIsLoading(false);
      },
      (error) => {
        console.error('[ChatScreen] Error loading messages:', error);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to load messages. Please try again.');
      }
    );

    return () => unsubscribe();
  }, [chatId, user, isAuthenticated]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!user || !chatId) return;

      console.log('[ChatScreen] Sending message:', message);
      setIsSending(true);

      try {
        await trpcClient.chat.sendMessage.mutate({
          chatId,
          senderId: user.id,
          senderName: user.name,
          senderAvatar: user.avatar || undefined,
          message,
        });
        console.log('[ChatScreen] Message sent successfully');
      } catch (error) {
        console.error('[ChatScreen] Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [chatId, user]
  );

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chat' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: chatName,
          headerStyle: { backgroundColor: Colors.light.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ChatThread
        messages={messages}
        currentUserId={user.id}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isSending={isSending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
