-- Add tracking columns to redemptions table
ALTER TABLE redemptions 
ADD COLUMN IF NOT EXISTS redemption_number SERIAL,
ADD COLUMN IF NOT EXISTS performed_by uuid REFERENCES auth.users(id);

-- Add index for faster lookup by number
CREATE INDEX IF NOT EXISTS idx_redemptions_number ON redemptions(redemption_number);

-- Update RLS to allow staff to view/insert these columns
-- (Existing policies should cover it as they are "ALL" or "SELECT", but good to verify)
-- The "Staff can view and manage redemptions" policy allows ALL, so inserts to new columns are fine.
