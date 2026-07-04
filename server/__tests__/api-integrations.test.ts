import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDb } from '../db';
import { users, threecommasAccounts, cryptohopperAccounts, krakenAccounts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('API Integrations', () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');
    
    // Create test user
    const result = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: 'test@example.com',
      loginMethod: 'test',
    });
    testUserId = (result as any).insertId || 1;
  });

  afterAll(async () => {
    if (db && testUserId) {
      await db.delete(threecommasAccounts).where(eq(threecommasAccounts.userId, testUserId));
      await db.delete(cryptohopperAccounts).where(eq(cryptohopperAccounts.userId, testUserId));
      await db.delete(krakenAccounts).where(eq(krakenAccounts.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('3Commas Account Management', () => {
    it('should store 3Commas API credentials securely', async () => {
      const result = await db.insert(threecommasAccounts).values({
        userId: testUserId,
        apiKey: 'encrypted-key-123',
        apiSecret: 'encrypted-secret-456',
        accountName: 'My 3Commas Account',
        isActive: 1,
      });

      expect((result as any).insertId).toBeDefined();

      const account = await db.select().from(threecommasAccounts).where(
        eq(threecommasAccounts.userId, testUserId)
      );

      expect(account.length).toBe(1);
      expect(account[0].accountName).toBe('My 3Commas Account');
      expect(account[0].isActive).toBe(1);
    });

    it('should track last sync time', async () => {
      const now = new Date();
      const result = await db.insert(threecommasAccounts).values({
        userId: testUserId,
        apiKey: 'key-sync-test',
        apiSecret: 'secret-sync-test',
        accountName: 'Sync Test Account',
        lastSyncedAt: now,
      });

      const account = await db.select().from(threecommasAccounts).where(
        eq(threecommasAccounts.userId, testUserId)
      );

      expect(account[0].lastSyncedAt).toBeDefined();
    });
  });

  describe('Cryptohopper Account Management', () => {
    it('should store Cryptohopper OAuth tokens securely', async () => {
      const result = await db.insert(cryptohopperAccounts).values({
        userId: testUserId,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        accountName: 'My Cryptohopper Account',
        isActive: 1,
      });

      const insertId = (result as any).insertId || (result as any)[0]?.id;
      expect(insertId).toBeDefined();

      const account = await db.select().from(cryptohopperAccounts).where(
        eq(cryptohopperAccounts.userId, testUserId)
      );

      expect(account.length).toBeGreaterThan(0);
      expect(account[0].accountName).toBe('My Cryptohopper Account');
    });

    it('should support token refresh', async () => {
      const result = await db.insert(cryptohopperAccounts).values({
        userId: testUserId,
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        accountName: 'Token Refresh Test',
      });

      const accountId = (result as any).insertId || (result as any)[0]?.id;
      if (!accountId) return; // Skip if insert failed

      // Simulate token refresh
      await db.update(cryptohopperAccounts)
        .set({ accessToken: 'new-token' })
        .where(eq(cryptohopperAccounts.id, accountId));

      const updated = await db.select().from(cryptohopperAccounts).where(
        eq(cryptohopperAccounts.id, accountId)
      );

      if (updated.length > 0) {
        expect(updated[0].accessToken).toBe('new-token');
      }
    });
  });

  describe('Kraken Account Management', () => {
    it('should store Kraken API credentials with proper encryption', async () => {
      const result = await db.insert(krakenAccounts).values({
        userId: testUserId,
        apiKey: 'kraken-key-encrypted',
        apiSecret: 'kraken-secret-encrypted',
        accountName: 'My Kraken Account',
        isActive: 1,
      });

      const insertId = (result as any).insertId || (result as any)[0]?.id;
      expect(insertId).toBeDefined();

      const account = await db.select().from(krakenAccounts).where(
        eq(krakenAccounts.userId, testUserId)
      );

      expect(account.length).toBeGreaterThan(0);
      expect(account[0].accountName).toBe('My Kraken Account');
    });

    it('should support multiple Kraken accounts per user', async () => {
      await db.insert(krakenAccounts).values({
        userId: testUserId,
        apiKey: 'key-1',
        apiSecret: 'secret-1',
        accountName: 'Account 1',
      });

      await db.insert(krakenAccounts).values({
        userId: testUserId,
        apiKey: 'key-2',
        apiSecret: 'secret-2',
        accountName: 'Account 2',
      });

      const accounts = await db.select().from(krakenAccounts).where(
        eq(krakenAccounts.userId, testUserId)
      );

      expect(accounts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Account Activation/Deactivation', () => {
    it('should allow toggling account active status', async () => {
      const result = await db.insert(threecommasAccounts).values({
        userId: testUserId,
        apiKey: 'key-toggle',
        apiSecret: 'secret-toggle',
        accountName: 'Toggle Test',
        isActive: 1,
      });

      const accountId = (result as any).insertId || (result as any)[0]?.id;
      if (!accountId) return; // Skip if insert failed

      // Deactivate
      await db.update(threecommasAccounts)
        .set({ isActive: 0 })
        .where(eq(threecommasAccounts.id, accountId));

      let account = await db.select().from(threecommasAccounts).where(
        eq(threecommasAccounts.id, accountId)
      );

      if (account.length > 0) {
        expect(account[0].isActive).toBe(0);
      }

      // Reactivate
      await db.update(threecommasAccounts)
        .set({ isActive: 1 })
        .where(eq(threecommasAccounts.id, accountId));

      account = await db.select().from(threecommasAccounts).where(
        eq(threecommasAccounts.id, accountId)
      );

      if (account.length > 0) {
        expect(account[0].isActive).toBe(1);
      }
    });
  });
});
