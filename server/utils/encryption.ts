import crypto from 'crypto';
import { ENV } from '../_core/env';

/**
 * Encryption utilities for storing sensitive API credentials
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derive encryption key from JWT secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  return crypto.scryptSync(secret, 'salt', 32);
}

/**
 * Encrypt sensitive data
 */
export function encryptCredential(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

    return result;
  } catch (error) {
    console.error('[Encryption] Failed to encrypt credential:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptCredential(encrypted: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encrypted.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt credential:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Hash API key for comparison (one-way)
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
