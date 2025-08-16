-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_is_active ON comments(is_active);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at);

-- Create function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comment count
    UPDATE posts 
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comment count
    UPDATE posts 
    SET comment_count = comment_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle soft delete (is_active change)
    IF OLD.is_active = true AND NEW.is_active = false THEN
      -- Comment was deactivated
      UPDATE posts 
      SET comment_count = comment_count - 1
      WHERE id = NEW.post_id;
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      -- Comment was reactivated
      UPDATE posts 
      SET comment_count = comment_count + 1
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update comment counts
CREATE TRIGGER update_comment_count_on_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

CREATE TRIGGER update_comment_count_on_delete
  AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

CREATE TRIGGER update_comment_count_on_update
  AFTER UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();