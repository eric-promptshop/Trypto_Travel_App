-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom function for cosine similarity search
CREATE OR REPLACE FUNCTION match_content_by_embedding(
  query_embedding vector(1536),  -- OpenAI embeddings are 1536 dimensions
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content_type text,
  title text,
  description text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    pc.id,
    pc.content_type::text,
    pc.title,
    pc.description,
    1 - (pc.embedding <=> query_embedding) as similarity
  FROM processed_content pc
  WHERE 1 - (pc.embedding <=> query_embedding) > match_threshold
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create index for vector similarity search
CREATE INDEX processed_content_embedding_idx ON processed_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for content hash lookup
CREATE INDEX processed_content_hash_idx ON processed_content USING hash (content_hash);

-- Create composite index for tag queries
CREATE INDEX content_tags_composite_idx ON content_tags (category, content_id);

-- Create function to update analytics
CREATE OR REPLACE FUNCTION update_content_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_analytics (
    date,
    content_type,
    total_processed,
    success_count,
    avg_confidence
  )
  VALUES (
    CURRENT_DATE,
    NEW.content_type::text,
    1,
    CASE WHEN NEW.confidence > 0.5 THEN 1 ELSE 0 END,
    NEW.confidence
  )
  ON CONFLICT (date, content_type) DO UPDATE
  SET
    total_processed = content_analytics.total_processed + 1,
    success_count = content_analytics.success_count + 
      CASE WHEN NEW.confidence > 0.5 THEN 1 ELSE 0 END,
    avg_confidence = (
      (content_analytics.avg_confidence * content_analytics.total_processed + NEW.confidence) / 
      (content_analytics.total_processed + 1)
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics
CREATE TRIGGER update_analytics_on_content_insert
AFTER INSERT ON processed_content
FOR EACH ROW
EXECUTE FUNCTION update_content_analytics(); 