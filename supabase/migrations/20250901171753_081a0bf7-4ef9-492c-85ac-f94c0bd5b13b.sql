-- Add encouragement_message column to recordings table
ALTER TABLE public.recordings 
ADD COLUMN encouragement_message text;