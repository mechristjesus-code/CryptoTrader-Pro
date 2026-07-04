import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const marketRouter = router({
  /**
   * Get OHLC data from Kraken
   */
  getOHLC: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        interval: z.number().default(60),
        since: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // In production: Fetch from Kraken API
        return {
          success: true,
          data: {
            pair: input.pair,
            interval: input.interval,
            ohlc: [
              [1704067200, "42500.0", "43200.0", "42300.0", "43000.0", "1234.5", "53000000"],
              [1704070800, "43000.0", "43500.0", "42800.0", "43200.0", "1567.2", "67500000"],
            ],
          },
        };
      } catch (error) {
        console.error("[marketRouter.getOHLC]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get ticker information
   */
  getTicker: protectedProcedure
    .input(z.object({ pair: z.string() }))
    .query(async ({ input }) => {
      try {
        return {
          success: true,
          data: {
            pair: input.pair,
            bid: "43150.5",
            ask: "43151.2",
            last: "43150.8",
            volume24h: "15234.567",
            high24h: "44200.0",
            low24h: "42100.0",
          },
        };
      } catch (error) {
        console.error("[marketRouter.getTicker]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get market overview
   */
  getOverview: protectedProcedure.query(async () => {
    try {
      return {
        success: true,
        data: {
          btc: { price: "43150.50", change24h: "+2.5%", volume: "28.5B" },
          eth: { price: "2280.75", change24h: "+1.8%", volume: "12.3B" },
          topMovers: [
            { symbol: "SOL/USD", change: "+8.2%", price: "98.50" },
            { symbol: "XRP/USD", change: "+5.1%", price: "2.15" },
          ],
          marketSentiment: "bullish",
          dominance: { btc: "48.2%", eth: "16.5%" },
        },
      };
    } catch (error) {
      console.error("[marketRouter.getOverview]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),
});

export default marketRouter;

