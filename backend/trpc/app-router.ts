import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import syncUserRoute from "./routes/auth/sync-user/route";
import submitReviewRoute from "./routes/reviews/submit-review/route";
import calculateRatingsRoute from "./routes/reviews/calculate-ratings/route";
import moderateReviewRoute from "./routes/reviews/moderate-review/route";
import createChatRoute from "./routes/chat/create-chat/route";
import sendMessageRoute from "./routes/chat/send-message/route";
import markReadRoute from "./routes/chat/mark-read/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    syncUser: syncUserRoute,
  }),
  reviews: createTRPCRouter({
    submit: submitReviewRoute,
    calculateRatings: calculateRatingsRoute,
    moderate: moderateReviewRoute,
  }),
  chat: createTRPCRouter({
    create: createChatRoute,
    sendMessage: sendMessageRoute,
    markRead: markReadRoute,
  }),
});

export type AppRouter = typeof appRouter;
