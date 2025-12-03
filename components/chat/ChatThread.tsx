import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatMessage } from '@/types';
import Colors from '@/constants/colors';
import MessageInput from './MessageInput';

interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  isSending: boolean;
}

export default function ChatThread({
  messages,
  currentUserId,
  onSendMessage,
  isLoading,
  isSending,
}: ChatThreadProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.senderId === currentUserId;
    const showTimestamp = 
      index === 0 || 
      new Date(item.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000;

    return (
      <View style={styles.messageWrapper}>
        {showTimestamp && (
          <Text style={styles.timestampText}>{formatTime(item.timestamp)}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.messageBubbleUser : styles.messageBubbleOther,
          ]}
        >
          {!isCurrentUser && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.messageTextUser : styles.messageTextOther,
            ]}
          >
            {item.message}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          messages.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />
      
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 8 }]}>
        <MessageInput onSendMessage={onSendMessage} isLoading={isSending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  timestampText: {
    fontSize: 11,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.card,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: Colors.light.text,
  },
  inputContainer: {
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
  },
});
