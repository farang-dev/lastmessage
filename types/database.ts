// Database schema types for TypeScript type safety

export interface User {
  id: string; // Clerk user ID
  email: string;
  created_at: string;
  updated_at: string;
  check_frequency_days: number; // How often to send alive checks (in days)
  last_check_sent: string | null; // When the last alive check was sent
  last_check_confirmed: string | null; // When the last alive check was confirmed
  missed_checks_count: number; // Number of consecutive missed checks
  is_deceased: boolean; // Whether the user is presumed deceased
  messages_sent: boolean; // Whether final messages have been sent
}

export interface Message {
  id: string;
  user_id: string; // Clerk user ID
  recipient_email: string;
  message_content: string; // Encrypted
  created_at: string;
  updated_at: string;
}

export interface Passcode {
  id: string;
  user_id: string; // Clerk user ID
  device_type: string; // e.g., "iPhone", "MacBook", "Windows PC"
  passcode: string; // Encrypted
  recipient_email: string;
  created_at: string;
  updated_at: string;
}

export interface AliveCheck {
  id: string;
  user_id: string; // Clerk user ID
  token: string; // Unique token for confirmation link
  sent_at: string;
  confirmed_at: string | null;
  expires_at: string;
}