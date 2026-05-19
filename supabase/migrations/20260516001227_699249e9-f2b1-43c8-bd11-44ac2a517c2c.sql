-- Add age column to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS age integer;

-- Add thumbnail_url and work_file_urls (array) to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS work_file_urls text[] NOT NULL DEFAULT '{}';

-- Backfill work_file_urls from existing single work_file_url where present
UPDATE public.courses
SET work_file_urls = ARRAY[work_file_url]
WHERE work_file_url IS NOT NULL
  AND (work_file_urls IS NULL OR array_length(work_file_urls, 1) IS NULL);
