-- Add NOT NULL constraint to author fields
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_author_id_fkey,
ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE
  DEFERRABLE INITIALLY IMMEDIATE;
