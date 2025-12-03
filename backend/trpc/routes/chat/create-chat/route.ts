import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const createChatRoute = publicProcedure
  .input(
    z.object({
      entityId: z.string(),
      entityName: z.string(),
      userId: z.string(),
      userName: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[createChat] Creating chat:', input);

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('entityId', '==', input.entityId),
        where('userId', '==', input.userId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        console.log('[createChat] Chat already exists:', snapshot.docs[0].id);
        return {
          success: true,
          chatId: snapshot.docs[0].id,
        };
      }

      const docRef = await addDoc(chatsRef, {
        entityId: input.entityId,
        entityName: input.entityName,
        userId: input.userId,
        userName: input.userName,
        unreadCount: 0,
        createdAt: serverTimestamp(),
      });

      console.log('[createChat] Chat created successfully:', docRef.id);

      return {
        success: true,
        chatId: docRef.id,
      };
    } catch (error) {
      console.error('[createChat] Error creating chat:', error);
      throw new Error('Failed to create chat');
    }
  });

export default createChatRoute;
