import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface LifeStorySummary {
  id: string;
  summary_text: string;
  themes: Record<string, string>;
  statistics: {
    totalRecordings: number;
    totalDuration: number;
    recordingSpan: number;
    avgDuration: number;
    firstRecording: string;
    latestRecording: string;
  };
  created_at: string;
  updated_at: string;
}

export const useLifeStorySummary = () => {
  const [summary, setSummary] = useState<LifeStorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSummary(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('life_story_summaries')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching summary:', error);
        return;
      }

      // Type cast the Json fields to our expected types
      if (data) {
        const typedSummary: LifeStorySummary = {
          ...data,
          themes: data.themes as Record<string, string>,
          statistics: data.statistics as LifeStorySummary['statistics']
        };
        setSummary(typedSummary);
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = useCallback(async (force = false) => {
    console.log('generateSummary called, force:', force);
    setGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to generate your life story summary",
          variant: "destructive"
        });
        return;
      }

      // Check if we need to regenerate
      if (!force && summary) {
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id);

        const currentRecordingCount = recordings?.length || 0;
        if (currentRecordingCount === summary.statistics?.totalRecordings) {
          console.log('Summary is up to date, no need to regenerate');
          return;
        }
      }

      console.log('Calling generate-life-summary function...');
      
      const { data, error } = await supabase.functions.invoke('generate-life-summary', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error generating summary:', error);
        toast({
          title: "Generation failed",
          description: "Could not generate your life story summary",
          variant: "destructive"
        });
        return;
      }

      console.log('Summary generated successfully:', data);
      
      // Refetch to get the updated summary from database
      await fetchSummary();
      
      toast({
        title: "Summary updated",
        description: "Your life story summary has been refreshed"
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate your life story summary",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  }, [summary]);

  useEffect(() => {
    fetchSummary();
    
    // Listen for completed recording processing to silently update summary
    const handleRecordingProcessingComplete = async () => {
      console.log('Recording processing complete event received, will update summary after delay...');
      
      // Wait a bit to ensure recording state has transitioned to 'saved'
      setTimeout(async () => {
        // Don't set generating state for silent background updates
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          console.log('Calling generate-life-summary function silently...');
          
          const { data, error } = await supabase.functions.invoke('generate-life-summary', {
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          });

          if (error) {
            console.error('Error generating summary:', error);
            return;
          }

          console.log('Summary generated successfully in background:', data);
          
          // Silently refetch to get the updated summary from database
          await fetchSummary();
        } catch (error) {
          console.error('Error updating summary in background:', error);
        }
        // No finally block needed since we're not setting generating state
      }, 1000);
    };
    
    window.addEventListener('recordingProcessingComplete', handleRecordingProcessingComplete);
    
    return () => {
      window.removeEventListener('recordingProcessingComplete', handleRecordingProcessingComplete);
    };
  }, []);

  return {
    summary,
    loading,
    generating,
    generateSummary,
    refetch: fetchSummary
  };
};