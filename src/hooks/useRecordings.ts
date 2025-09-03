import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface Recording {
  id: string;
  title: string | null;
  duration: number;
  file_path: string;
  file_size: number | null;
  transcript: string | null;
  encouragement_message: string | null;
  created_at: string;
  updated_at: string;
}

export const useRecordings = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [encouragementModal, setEncouragementModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });
  const [processingCallbacks, setProcessingCallbacks] = useState<{
    onStepChange?: (step: 'transcribing' | 'analyzing') => void;
  }>({});

  const fetchRecordings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRecordings([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recordings:', error);
        toast({
          title: "Error loading recordings",
          description: "Could not load your recording history",
          variant: "destructive"
        });
        return;
      }

      setRecordings(data || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecording = async (audioBlob: Blob, duration: number, title?: string, callbacks?: { onStepChange?: (step: 'transcribing' | 'analyzing') => void }) => {
    console.log('saveRecording function called with:', {
      blobSize: audioBlob.size,
      duration: duration,
      blobType: audioBlob.type,
      title: title
    });

    try {
      console.log('Getting user...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found - showing auth error');
        toast({
          title: "Authentication required",
          description: "Please sign in to save recordings",
          variant: "destructive"
        });
        return null;
      }

      console.log('User found:', user.id);

      console.log('Saving recording - Debug info:', {
        blobSize: audioBlob.size,
        duration: duration,
        blobType: audioBlob.type
      });

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${user.id}/${timestamp}.webm`;

      // Upload audio file to storage
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filename, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: "Upload failed",
          description: "Could not save your recording",
          variant: "destructive"
        });
        return null;
      }

      const recordingData = {
        user_id: user.id,
        title: title || `Recording ${new Date().toLocaleDateString()}`,
        duration: duration,
        file_path: filename,
        file_size: audioBlob.size
      };

      console.log('Inserting to database:', recordingData);

      // Save recording metadata to database
      const { data, error: dbError } = await supabase
        .from('recordings')
        .insert(recordingData)
        .select()
        .single();

      if (dbError) {
        console.error('Error saving recording metadata:', dbError);
        toast({
          title: "Save failed",
          description: "Could not save recording details",
          variant: "destructive"
        });
        return null;
      }

      console.log('Database save successful:', data);

      // Update local state by adding the new recording to the beginning
      setRecordings(prev => {
        console.log('Updating recordings list, adding new recording:', data.id);
        return [data, ...prev];
      });

      // Start transcription with callbacks and wait for completion
      if (data.id && callbacks) {
        await transcribeRecording(data.id, callbacks);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Save failed",
        description: "Could not save your recording",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      const recording = recordings.find(r => r.id === id);
      if (!recording) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('recordings')
        .remove([recording.file_path]);

      if (storageError) {
        console.error('Error deleting file:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Error deleting recording:', dbError);
        toast({
          title: "Delete failed",
          description: "Could not delete recording",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setRecordings(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: "Recording deleted",
        description: "Your recording has been removed"
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  const getRecordingUrl = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('recordings')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting recording URL:', error);
      return null;
    }
  };

  const transcribeRecording = async (recordingId: string, callbacks?: { onStepChange?: (step: 'transcribing' | 'analyzing') => void }) => {
    try {
      console.log('Starting transcription for recording:', recordingId);
      
      // Notify UI that transcription is starting
      callbacks?.onStepChange?.('transcribing');
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { recordingId }
      });

      if (error) {
        console.error('Error calling transcription function:', error);
        // Don't fail the entire flow - just continue without transcript
        console.log('Transcription failed, continuing without transcript');
        // Still try to generate encouragement based on audio
        await generateEncouragement(recordingId, callbacks);
        return;
      }

      console.log('Transcription successful:', data);
      
      // Update local state with transcript
      setRecordings(prev => 
        prev.map(recording => 
          recording.id === recordingId 
            ? { ...recording, transcript: data.transcript }
            : recording
        )
      );

      // Now generate encouragement message
      await generateEncouragement(recordingId, callbacks);

    } catch (error) {
      console.error('Error transcribing recording:', error);
      // Don't fail the entire flow - still try encouragement
      await generateEncouragement(recordingId, callbacks);
    }
  };

  const generateEncouragement = async (recordingId: string, callbacks?: { onStepChange?: (step: 'transcribing' | 'analyzing') => void }) => {
    try {
      console.log('Generating encouragement for recording:', recordingId);
      
      // Notify UI that analysis is starting
      callbacks?.onStepChange?.('analyzing');
      
      const { data, error } = await supabase.functions.invoke('generate-encouragement', {
        body: { recordingId }
      });

      if (error) {
        console.error('Error generating encouragement:', error);
        // Don't show error toast here as it's not critical
        return;
      }

      console.log('Encouragement generated:', data);
      
      // Update local state with encouragement message
      setRecordings(prev => 
        prev.map(recording => 
          recording.id === recordingId 
            ? { ...recording, encouragement_message: data.encouragementMessage }
            : recording
        )
      );

      // Show the encouraging message to the user in modal
      if (data.encouragementMessage) {
        setEncouragementModal({
          isOpen: true,
          message: data.encouragementMessage
        });
      }

      // After encouragement is generated, trigger life story summary regeneration
      console.log('🎉 DISPATCHING recordingProcessingComplete EVENT - This should trigger Your Story Shines!');
      window.dispatchEvent(new CustomEvent('recordingProcessingComplete'));

    } catch (error) {
      console.error('Error generating encouragement:', error);
      
      console.log('🔄 ENTERING FALLBACK ENCOURAGEMENT FLOW');
      
      // Show a fallback encouraging message when API fails
      const fallbackMessage = "Thank you for sharing your story! Every memory you record adds to the beautiful tapestry of your life. Keep sharing - your stories matter! ✨";
      console.log('📝 Setting fallback encouragement modal:', { isOpen: true, message: fallbackMessage });
      
      setEncouragementModal({
        isOpen: true,
        message: fallbackMessage
      });
      
      console.log('✅ Fallback encouragement modal state set successfully');
      
      // Even if encouragement fails, still trigger summary regeneration
      console.log('🚨 DISPATCHING recordingProcessingComplete EVENT after error - This should still trigger Your Story Shines!');
      window.dispatchEvent(new CustomEvent('recordingProcessingComplete'));
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const closeEncouragementModal = () => {
    setEncouragementModal({ isOpen: false, message: '' });
  };

  return {
    recordings,
    loading,
    saveRecording,
    deleteRecording,
    getRecordingUrl,
    transcribeRecording,
    generateEncouragement,
    refetch: fetchRecordings,
    encouragementModal,
    closeEncouragementModal
  };
};