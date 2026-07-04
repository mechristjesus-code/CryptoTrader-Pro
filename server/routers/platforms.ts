import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  threecommasAccounts,
  cryptohopperAccounts,
  krakenAccounts,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const platformsRouter = router({
  /**
   * Add or update 3Commas credentials
   */
  addThreecommas: protectedProcedure
    .input(
      z.object({
        apiKey: z.string(),
        apiSecret: z.string(),
        accountName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(threecommasAccounts).values({
          userId: ctx.user.id,
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
          accountName: input.accountName || "3Commas Account",
          isActive: 1,
        });

        return {
          success: true,
          message: "3Commas account added successfully",
        };
      } catch (error) {
        console.error("[platformsRouter.addThreecommas]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Add or update Cryptohopper credentials
   */
  addCryptohopper: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accountName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(cryptohopperAccounts).values({
          userId: ctx.user.id,
          accessToken: input.accessToken,
          accountName: input.accountName || "Cryptohopper Account",
          isActive: 1,
        });

        return {
          success: true,
          message: "Cryptohopper account added successfully",
        };
      } catch (error) {
        console.error("[platformsRouter.addCryptohopper]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Add or update Kraken credentials
   */
  addKraken: protectedProcedure
    .input(
      z.object({
        apiKey: z.string(),
        apiSecret: z.string(),
        accountName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(krakenAccounts).values({
          userId: ctx.user.id,
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
          accountName: input.accountName || "Kraken Account",
          isActive: 1,
        });

        return {
          success: true,
          message: "Kraken account added successfully",
        };
      } catch (error) {
        console.error("[platformsRouter.addKraken]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get connected platforms status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [threecommas, cryptohopper, kraken] = await Promise.all([
        db
          .select()
          .from(threecommasAccounts)
          .where(eq(threecommasAccounts.userId, ctx.user.id))
          .limit(1),
        db
          .select()
          .from(cryptohopperAccounts)
          .where(eq(cryptohopperAccounts.userId, ctx.user.id))
          .limit(1),
        db
          .select()
          .from(krakenAccounts)
          .where(eq(krakenAccounts.userId, ctx.user.id))
          .limit(1),
      ]);

      return {
        success: true,
        data: {
          threecommas: threecommas.length > 0 && threecommas[0].isActive === 1,
          cryptohopper: cryptohopper.length > 0 && cryptohopper[0].isActive === 1,
          kraken: kraken.length > 0 && kraken[0].isActive === 1,
        },
      };
    } catch (error) {
      console.error("[platformsRouter.getStatus]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),
});

export default platformsRouter;

