/**
 * Field-Level Encryption Utility
 * Provides client-side encryption for sensitive form fields like SSN
 *
 * SECURITY FIX: Implement SSN encryption in form state
 * Assigned: Robert Carter
 * Task: Add field-level encryption for SSN before storing in state
 *
 * NOTE: This provides defense-in-depth for memory dumps and debugging exposure.
 * Server-side encryption is still required for data at rest.
 *
 * SECURITY UPDATE: Now uses Web Crypto API (SubtleCrypto) for AES-256-GCM encryption
 * which is available in React Native's JavaScript environment.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { secureLogger } from './secure-logger';

/**
 * Encryption configuration for AES-256-GCM
 */
const ENCRYPTION_KEY_SIZE = 32; // 256 bits for AES-256
const IV_SIZE = 12; // 96 bits for GCM (recommended)
const TAG_SIZE = 16; // 128 bits authentication tag
const SESSION_KEY_STORAGE_KEY = 'emr_session_encryption_key';

/**
 * Session key stored in secure storage
 */
let cachedSessionKey: CryptoKey | null = null;

/**
 * Get or create a session encryption key using Web Crypto API
 * Key is stored in expo-secure-store for persistence during session
 */
const getOrCreateSessionKey = async (): Promise<CryptoKey> => {
  if (cachedSessionKey) {
    return cachedSessionKey;
  }

  try {
    // Try to retrieve existing key from secure storage
    const storedKeyBase64 = await SecureStore.getItemAsync(SESSION_KEY_STORAGE_KEY);

    if (storedKeyBase64) {
      // Import the stored key
      const keyBytes = Uint8Array.from(atob(storedKeyBase64), c => c.charCodeAt(0));
      cachedSessionKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      return cachedSessionKey;
    }

    // Generate a new random key
    const keyBytes = await Crypto.getRandomBytesAsync(ENCRYPTION_KEY_SIZE);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(keyBytes)));

    // Store in secure storage
    await SecureStore.setItemAsync(SESSION_KEY_STORAGE_KEY, keyBase64);

    // Import as CryptoKey for use with SubtleCrypto
    cachedSessionKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(keyBytes),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return cachedSessionKey;
  } catch (error) {
    secureLogger.error('Failed to get or create session key:', error);
    throw new Error('ENCRYPTION_KEY_ERROR: Failed to initialize encryption key');
  }
};

/**
 * Clear the session key (call on logout)
 */
export const clearEncryptionKey = async (): Promise<void> => {
  cachedSessionKey = null;
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY_STORAGE_KEY);
  } catch (error) {
    secureLogger.error('Failed to clear encryption key:', error);
  }
};

/**
 * Encrypt sensitive field data using AES-256-GCM
 * Uses Web Crypto API (SubtleCrypto) for proper authenticated encryption
 *
 * @param plaintext - The sensitive data to encrypt
 * @returns Base64 encoded encrypted data with IV prepended
 * @throws Error if encryption fails - NEVER falls back to plaintext
 */
export const encryptField = async (plaintext: string): Promise<string> => {
  if (!plaintext || plaintext.trim() === '') {
    return '';
  }

  // Get the session key - this will throw if key cannot be obtained
  const key = await getOrCreateSessionKey();

  // Generate random IV (Initialization Vector) for GCM
  const ivBytes = await Crypto.getRandomBytesAsync(IV_SIZE);
  const iv = new Uint8Array(ivBytes);

  // Convert plaintext to bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Encrypt using AES-256-GCM via Web Crypto API
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: TAG_SIZE * 8, // Tag length in bits
    },
    key,
    plaintextBytes
  );

  const encrypted = new Uint8Array(encryptedBuffer);

  // Combine IV + encrypted data (ciphertext + auth tag)
  // Format: [12 bytes IV][variable ciphertext + 16 bytes tag]
  const combined = new Uint8Array(iv.length + encrypted.length);
  combined.set(iv, 0);
  combined.set(encrypted, iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypt sensitive field data using AES-256-GCM
 *
 * @param ciphertext - Base64 encoded encrypted data
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (tampered data, wrong key, etc.)
 */
export const decryptField = async (ciphertext: string): Promise<string> => {
  if (!ciphertext || ciphertext.trim() === '') {
    return '';
  }

  // Get session key
  const key = await getOrCreateSessionKey();

  // Decode base64
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

  // Validate minimum length (IV + at least tag)
  if (combined.length < IV_SIZE + TAG_SIZE) {
    throw new Error('DECRYPTION_ERROR: Invalid encrypted data - too short');
  }

  // Extract IV and encrypted data (ciphertext + tag)
  const iv = combined.slice(0, IV_SIZE);
  const encryptedWithTag = combined.slice(IV_SIZE);

  // Decrypt using AES-256-GCM via Web Crypto API
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: TAG_SIZE * 8,
    },
    key,
    encryptedWithTag
  );

  // Convert bytes back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};

/**
 * Hash sensitive data for comparison without storing plaintext
 * Useful for validation without keeping the original value
 *
 * @param data - The data to hash
 * @returns Hex-encoded hash
 */
export const hashField = async (data: string): Promise<string> => {
  if (!data || data.trim() === '') {
    return '';
  }

  try {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return digest;
  } catch (error) {
    console.error('Hashing failed:', error);
    throw new Error('Failed to hash sensitive field');
  }
};

/**
 * SECURITY NOTE: True secure memory wiping is NOT possible in JavaScript
 *
 * JavaScript strings are immutable and managed by the garbage collector.
 * There is no way to overwrite the actual memory contents of a string.
 *
 * This function is REMOVED because it provided false security assurance.
 * The previous implementation was a no-op (reassigning a parameter doesn't
 * affect the original string in the caller's scope).
 *
 * MITIGATION STRATEGIES for sensitive data in React Native:
 * 1. Minimize the time sensitive data exists in memory
 * 2. Use encrypted storage (expo-secure-store) instead of plain state
 * 3. Clear state variables to empty strings when no longer needed
 * 4. For truly sensitive operations, use native modules with secure memory
 * 5. The encryption in this module already protects SSN in memory
 *
 * If you need to clear a sensitive variable, simply assign it to '':
 *   sensitiveData = '';  // Allows GC to collect the old value
 *
 * This won't securely wipe memory, but it removes the reference,
 * allowing garbage collection to eventually reclaim the memory.
 */

// Export removed - see documentation above
// If you were using secureWipe(), replace with direct assignment:
//   secureWipe(ssn);  ->  ssn = '';
