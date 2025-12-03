import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const sendMessageRoute = publicProcedure
  .input(
    z.object({
      chatId: z.string(),
      senderId: z.string(),
      senderName: z.string(),
      senderAvatar: z.string().optional(),
      message: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[sendMessage] Sending message:', input);

    try {
      const messagesRef = collection(db, 'chats', input.chatId, 'messages');
      await addDoc(messagesRef, {
        chatId: input.chatId,
        senderId: input.senderId,
        senderName: input.senderName,
        senderAvatar: input.senderAvatar || null,
        message: input.message,
        timestamp: serverTimestamp(),
        read: false,
      });

      const chatRef = doc(db, 'chats', input.chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        await updateDoc(chatRef, {
          lastMessage: input.message,
          lastMessageAt: serverTimestamp(),
          unreadCount: increment(1),
        });
      }

      console.log('[sendMessage] Message sent successfully');

      return {
        success: true,
      };
    } catch (error) {
      console.error('[sendMessage] Error sending message:', error);
      throw new Error('Failed to send message');
    }
  });

export default sendMessageRoute;
