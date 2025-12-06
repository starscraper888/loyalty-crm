-- Add unique constraint to profiles phone number
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);
