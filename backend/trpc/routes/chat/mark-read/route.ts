import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const markReadRoute = publicProcedure
  .input(
    z.object({
      chatId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[markRead] Marking chat as read:', input.chatId);

    try {
      const chatRef = doc(db, 'chats', input.chatId);
      await updateDoc(chatRef, {
        unreadCount: 0,
      });

      console.log('[markRead] Chat marked as read');

      return {
        success: true,
      };
    } catch (error) {
      console.error('[markRead] Error marking chat as read:', error);
      throw new Error('Failed to mark chat as read');
    }
  });

export default markReadRoute;
