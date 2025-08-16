-- Add post_count column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0 CHECK (post_count >= 0);

-- Create function to update post counts
CREATE OR REPLACE FUNCTION update_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment post count
    UPDATE profiles 
    SET post_count = post_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement post count
    UPDATE profiles 
    SET post_count = post_count - 1
    WHERE id = OLD.author_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle soft delete (is_active change)
    IF OLD.is_active = true AND NEW.is_active = false THEN
      -- Post was deactivated
      UPDATE profiles 
      SET post_count = post_count - 1
      WHERE id = NEW.author_id;
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      -- Post was reactivated
      UPDATE profiles 
      SET post_count = post_count + 1
      WHERE id = NEW.author_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update post counts
CREATE TRIGGER update_post_count_on_insert
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_count();

CREATE TRIGGER update_post_count_on_delete
  AFTER DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_count();

CREATE TRIGGER update_post_count_on_update
  AFTER UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_count();

-- Initialize post counts for existing profiles
UPDATE profiles 
SET post_count = (
  SELECT COUNT(*) 
  FROM posts 
  WHERE posts.author_id = profiles.id AND posts.is_active = true
);