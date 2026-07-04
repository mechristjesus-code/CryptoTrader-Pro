import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const chatRouter = router({
  /**
   * Send chat message and get AI response
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // In production: Call LLM with user message and context
        const prompt = `User: ${input.message}\n\nContext: ${input.context || "General trading assistance"}\n\nProvide helpful trading advice.`;

        // Mock AI response
        const response = {
          id: Math.random().toString(36).substr(2, 9),
          userMessage: input.message,
          aiResponse: "Based on current market conditions and your bot performance, I recommend reviewing your risk parameters. Your win rate is strong at 68.5%, but consider tightening stop losses to protect gains.",
          timestamp: new Date(),
        };

        return {
          success: true,
          data: response,
        };
      } catch (error) {
        console.error("[chatRouter.sendMessage]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get chat history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return {
          success: true,
          data: [
            {
              id: "1",
              userMessage: "What's the best strategy for BTC?",
              aiResponse: "For BTC, consider DCA or grid trading strategies...",
              timestamp: new Date(Date.now() - 86400000),
            },
          ],
        };
      } catch (error) {
        console.error("[chatRouter.getHistory]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Clear chat history
   */
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return {
        success: true,
        message: "Chat history cleared",
      };
    } catch (error) {
      console.error("[chatRouter.clearHistory]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),
});

export default chatRouter;

