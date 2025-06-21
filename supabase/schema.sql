-- Create tables for Last Message app

-- Users table to store user preferences and status
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_frequency_days INTEGER DEFAULT 7,
  last_check_sent TIMESTAMP WITH TIME ZONE,
  last_check_confirmed TIMESTAMP WITH TIME ZONE,
  missed_checks_count INTEGER DEFAULT 0,
  is_deceased BOOLEAN DEFAULT FALSE,
  messages_sent BOOLEAN DEFAULT FALSE
);

-- Messages table to store final messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  message_content TEXT NOT NULL, -- Encrypted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passcodes table to store device passcodes
CREATE TABLE IF NOT EXISTS passcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  passcode TEXT NOT NULL, -- Encrypted
  recipient_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alive checks table to track alive check emails
CREATE TABLE IF NOT EXISTS alive_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_passcodes_user_id ON passcodes(user_id);
CREATE INDEX IF NOT EXISTS idx_alive_checks_user_id ON alive_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_alive_checks_token ON alive_checks(token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_passcodes_updated_at
BEFORE UPDATE ON passcodes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();