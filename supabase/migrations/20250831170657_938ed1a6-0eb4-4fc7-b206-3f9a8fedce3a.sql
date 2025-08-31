-- Create table for life story summaries
CREATE TABLE public.life_story_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  summary_text TEXT NOT NULL,
  themes JSONB DEFAULT '{}',
  statistics JSONB DEFAULT '{}',
  last_recording_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.life_story_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own summaries" 
ON public.life_story_summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" 
ON public.life_story_summaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" 
ON public.life_story_summaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" 
ON public.life_story_summaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_life_story_summaries_updated_at
BEFORE UPDATE ON public.life_story_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();