-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Create function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower count for the user being followed
    UPDATE profiles 
    SET follower_count = (
      SELECT COUNT(*) FROM follows WHERE following_id = NEW.following_id
    )
    WHERE id = NEW.following_id;
    
    -- Update following count for the user who is following
    UPDATE profiles 
    SET following_count = (
      SELECT COUNT(*) FROM follows WHERE follower_id = NEW.follower_id
    )
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update follower count for the user being unfollowed
    UPDATE profiles 
    SET follower_count = (
      SELECT COUNT(*) FROM follows WHERE following_id = OLD.following_id
    )
    WHERE id = OLD.following_id;
    
    -- Update following count for the user who is unfollowing
    UPDATE profiles 
    SET following_count = (
      SELECT COUNT(*) FROM follows WHERE follower_id = OLD.follower_id
    )
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update follow counts
CREATE TRIGGER update_follow_counts_on_insert
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

CREATE TRIGGER update_follow_counts_on_delete
  AFTER DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Add follower_count and following_count columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0 CHECK (follower_count >= 0),
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0 CHECK (following_count >= 0);