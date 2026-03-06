// Encryption utilities for securing sensitive data (API keys, credentials)
// Uses AES-256-GCM for authenticated encryption

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT = 'headless-admin-dashboard-salt';

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Derive a 32-byte key from the environment variable using scrypt
  return crypto.scryptSync(key, SALT, 32);
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns a base64-encoded string containing: IV + ciphertext + auth tag
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted data + auth tag
  return Buffer.concat([
    iv,
    Buffer.from(encrypted, 'hex'),
    authTag,
  ]).toString('base64');
}

/**
 * Decrypts a base64-encoded string encrypted with encrypt()
 * Returns the original plaintext string
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const buffer = Buffer.from(encryptedText, 'base64');

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(buffer.length - TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH, buffer.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Encrypts an object's sensitive fields
 * @param obj - Object containing data
 * @param sensitiveFields - Array of field names to encrypt
 */
export function encryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of sensitiveFields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      result[field] = encrypt(value) as T[keyof T];
    }
  }

  return result;
}

/**
 * Decrypts an object's sensitive fields
 * @param obj - Object containing encrypted data
 * @param sensitiveFields - Array of field names to decrypt
 */
export function decryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of sensitiveFields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        result[field] = decrypt(value) as T[keyof T];
      } catch {
        // If decryption fails, the value might not be encrypted
        // Leave it as-is
      }
    }
  }

  return result;
}

/**
 * Hashes a string using SHA-256 (for non-reversible hashing like API key verification)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generates a secure random string for API keys, tokens, etc.
 * @param length - Length of the string to generate
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
