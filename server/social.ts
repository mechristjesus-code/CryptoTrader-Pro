import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  createCopyTradingSchema,
  publishTradingSignalSchema,
  joinContestSchema,
  paginationSchema,
} from '../_core/validationSchemas';
import { db } from '../db';
import {
  copyTradingRelationships,
  tradingSignals,
  contests,
  contestParticipants,
} from '../../drizzle/advanced-schema';
import { eq, and, desc, or } from 'drizzle-orm';

export const socialRouter = router({
  /**
   * Follow a trader for copy trading
   */
  followTrader: protectedProcedure
    .input(createCopyTradingSchema)
    .mutation(async ({ input, ctx }) => {
      const relationship = await db.insert(copyTradingRelationships).values({
        followerId: ctx.user.id,
        leaderId: input.leaderId,
        positionSizePercent: input.positionSizePercent.toString(),
      });

      return {
        id: relationship.insertId,
        message: 'Successfully following trader',
      };
    }),

  /**
   * Unfollow a trader
   */
  unfollowTrader: protectedProcedure
    .input(z.object({ leaderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(copyTradingRelationships)
        .set({ status: 'stopped' })
        .where(
          and(
            eq(copyTradingRelationships.followerId, ctx.user.id),
            eq(copyTradingRelationships.leaderId, input.leaderId)
          )
        );

      return { success: true };
    }),

  /**
   * Get list of traders being followed
   */
  getFollowingList: protectedProcedure
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input;

      const following = await db
        .select()
        .from(copyTradingRelationships)
        .where(
          and(
            eq(copyTradingRelationships.followerId, ctx.user.id),
            eq(copyTradingRelationships.status, 'active')
          )
        )
        .orderBy(desc(copyTradingRelationships.startDate))
        .limit(limit)
        .offset(offset);

      return following;
    }),

  /**
   * Get followers list
   */
  getFollowersList: protectedProcedure
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input;

      const followers = await db
        .select()
        .from(copyTradingRelationships)
        .where(
          and(
            eq(copyTradingRelationships.leaderId, ctx.user.id),
            eq(copyTradingRelationships.status, 'active')
          )
        )
        .orderBy(desc(copyTradingRelationships.startDate))
        .limit(limit)
        .offset(offset);

      return followers;
    }),

  /**
   * Publish a trading signal
   */
  publishSignal: protectedProcedure
    .input(publishTradingSignalSchema)
    .mutation(async ({ input, ctx }) => {
      const signal = await db.insert(tradingSignals).values({
        publisherId: ctx.user.id,
        symbol: input.symbol,
        action: input.action,
        price: input.price?.toString(),
        confidence: input.confidence.toString(),
        description: input.description,
      });

      return {
        id: signal.insertId,
        message: 'Trading signal published successfully',
      };
    }),

  /**
   * Get trading signals for a symbol
   */
  getSignals: protectedProcedure
    .input(z.object({
      symbol: z.string(),
      ...paginationSchema.shape,
    }))
    .query(async ({ input, ctx }) => {
      const { symbol, limit, offset } = input;

      const signals = await db
        .select()
        .from(tradingSignals)
        .where(eq(tradingSignals.symbol, symbol))
        .orderBy(desc(tradingSignals.createdAt))
        .limit(limit)
        .offset(offset);

      return signals;
    }),

  /**
   * Get user's published signals
   */
  getMySignals: protectedProcedure
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input;

      const signals = await db
        .select()
        .from(tradingSignals)
        .where(eq(tradingSignals.publisherId, ctx.user.id))
        .orderBy(desc(tradingSignals.createdAt))
        .limit(limit)
        .offset(offset);

      return signals;
    }),

  /**
   * List active contests
   */
  listContests: protectedProcedure
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input;

      const contestsList = await db
        .select()
        .from(contests)
        .where(eq(contests.status, 'active'))
        .orderBy(desc(contests.startDate))
        .limit(limit)
        .offset(offset);

      return contestsList;
    }),

  /**
   * Get contest details with leaderboard
   */
  getContestDetails: protectedProcedure
    .input(z.object({ contestId: z.number() }))
    .query(async ({ input, ctx }) => {
      const contest = await db
        .select()
        .from(contests)
        .where(eq(contests.id, input.contestId));

      if (contest.length === 0) {
        throw new Error('Contest not found');
      }

      const leaderboard = await db
        .select()
        .from(contestParticipants)
        .where(eq(contestParticipants.contestId, input.contestId))
        .orderBy(contestParticipants.rank);

      return {
        ...contest[0],
        leaderboard,
      };
    }),

  /**
   * Join a contest
   */
  joinContest: protectedProcedure
    .input(joinContestSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if already joined
      const existing = await db
        .select()
        .from(contestParticipants)
        .where(
          and(
            eq(contestParticipants.contestId, input.contestId),
            eq(contestParticipants.userId, ctx.user.id)
          )
        );

      if (existing.length > 0) {
        throw new Error('Already joined this contest');
      }

      const participant = await db.insert(contestParticipants).values({
        contestId: input.contestId,
        userId: ctx.user.id,
      });

      return {
        id: participant.insertId,
        message: 'Successfully joined contest',
      };
    }),

  /**
   * Get user's contest participation
   */
  getMyContests: protectedProcedure.query(async ({ ctx }) => {
    const participations = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.userId, ctx.user.id));

      return participations;
  }),

  /**
   * Get social stats
   */
  getSocialStats: protectedProcedure.query(async ({ ctx }) => {
    const followers = await db
      .select()
      .from(copyTradingRelationships)
      .where(
        and(
          eq(copyTradingRelationships.leaderId, ctx.user.id),
          eq(copyTradingRelationships.status, 'active')
        )
      );

    const following = await db
      .select()
      .from(copyTradingRelationships)
      .where(
        and(
          eq(copyTradingRelationships.followerId, ctx.user.id),
          eq(copyTradingRelationships.status, 'active')
        )
      );

    const signals = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.publisherId, ctx.user.id));

    const contests = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.userId, ctx.user.id));

    return {
      followers: followers.length,
      following: following.length,
      signals: signals.length,
      contests: contests.length,
    };
  }),
});
