-- Add user status fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for active users query
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);