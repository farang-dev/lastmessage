import CryptoJS from 'crypto-js';

// Generate a secure encryption key based on user ID to ensure data is tied to specific users
const getEncryptionKey = (userId: string) => {
  // Combine the user ID with a server-side secret for added security
  // In production, you would use a more secure server-side secret
  const serverSecret = process.env.CLERK_SECRET_KEY || 'fallback-secret-key';
  return `${userId}-${serverSecret}`;
};

// Encrypt data before storing in Supabase
export const encryptData = (data: string, userId: string): string => {
  const key = getEncryptionKey(userId);
  return CryptoJS.AES.encrypt(data, key).toString();
};

// Decrypt data retrieved from Supabase
export const decryptData = (encryptedData: string, userId: string): string => {
  const key = getEncryptionKey(userId);
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};