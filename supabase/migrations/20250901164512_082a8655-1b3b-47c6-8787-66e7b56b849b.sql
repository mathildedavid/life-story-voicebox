-- Add transcript column to recordings table
ALTER TABLE public.recordings 
ADD COLUMN transcript TEXT;