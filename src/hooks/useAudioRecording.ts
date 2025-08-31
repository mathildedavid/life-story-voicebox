import { useState, useRef, useCallback } from 'react';
import { toast } from './use-toast';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'completed';

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export const useAudioRecording = (recordingsHook?: ReturnType<typeof import('./useRecordings').useRecordings>) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const { saveRecording } = recordingsHook || {};
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - (pauseTimeRef.current * 1000);
    intervalRef.current = setInterval(() => {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(currentTime);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    console.log('startRecording called - current state:', recordingState);
    
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('Microphone access granted, stream:', stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      });

      console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('Total chunks:', chunksRef.current.length);
        }
      };

      mediaRecorder.onstop = () => {
        // Only process onstop if we're not in the middle of a manual save
        if (recordingState === 'paused') {
          console.log('MediaRecorder onstop fired during paused save - ignoring');
          return;
        }
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        // Use the elapsed time at the moment of stopping
        const recordingDuration = (Date.now() - startTimeRef.current) / 1000;
        
        console.log('Recording stopped - Debug info:', {
          blobSize: blob.size,
          calculatedDuration: recordingDuration,
          elapsedTimeState: elapsedTime,
          chunksCount: chunksRef.current.length,
          startTime: startTimeRef.current
        });
        
        setRecording({
          blob,
          url,
          duration: recordingDuration
        });
        setRecordingState('completed');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      console.log('Starting MediaRecorder...');
      mediaRecorder.start(1000); // Collect data every 1 second instead of 100ms
      console.log('MediaRecorder state:', mediaRecorder.state);
      setRecordingState('recording');
      startTimer();
      
      toast({
        title: "Recording started",
        description: "Share your life story..."
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: `Could not start recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }, [startTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      stopTimer();
      // Store accumulated time when pausing
      pauseTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
      
      toast({
        title: "Recording paused",
        description: "Take your time..."
      });
    }
  }, [recordingState, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      startTimer();
      
      toast({
        title: "Recording resumed",
        description: "Continue sharing..."
      });
    }
  }, [recordingState, startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      // Capture final elapsed time before stopping
      const finalElapsedTime = elapsedTime;
      console.log('Stop recording called - elapsedTime:', finalElapsedTime);
      
      mediaRecorderRef.current.stop();
      stopTimer();
      
      toast({
        title: "Recording completed",
        description: "Your story has been saved!"
      });
    }
  }, [recordingState, stopTimer, elapsedTime]);

  const resetRecording = useCallback(() => {
    console.log('Resetting recording - current state:', recordingState);
    
    // Clear timer first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Stop and clear media recorder
    if (mediaRecorderRef.current) {
      try {
        console.log('Stopping MediaRecorder, current state:', mediaRecorderRef.current.state);
        
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        
        // Stop all tracks from the stream
        if (mediaRecorderRef.current.stream) {
          console.log('Stopping stream tracks...');
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind, track.readyState);
            track.stop();
          });
        }
      } catch (error) {
        console.log('MediaRecorder cleanup error (expected):', error);
      }
      
      // Clear the reference
      mediaRecorderRef.current = null;
    }
    
    // Clean up recording URL
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }
    
    // Reset all state in batch
    setRecordingState('idle');
    setElapsedTime(0);
    setRecording(null);
    chunksRef.current = [];
    pauseTimeRef.current = 0;
    startTimeRef.current = 0;
    
    console.log('Recording reset complete - new state: idle');
  }, [recording, recordingState]);

  const saveToDatabase = useCallback(async () => {
    console.log('saveToDatabase called with state:', {
      recordingState,
      hasMediaRecorder: !!mediaRecorderRef.current,
      chunksCount: chunksRef.current.length,
      hasRecording: !!recording,
      pauseTime: pauseTimeRef.current
    });

    if (recordingState === 'paused' && mediaRecorderRef.current && chunksRef.current.length > 0) {
      console.log('Processing paused state save...');
      
      // For paused recordings, create the blob directly and save
      const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
      const finalDuration = pauseTimeRef.current;
      
      console.log('Saving from paused state - Debug info:', {
        blobSize: blob.size,
        duration: finalDuration,
        chunksCount: chunksRef.current.length,
        currentState: recordingState
      });
      
      try {
        console.log('Calling saveRecording function...');
        const result = await saveRecording(blob, finalDuration);
        console.log('saveRecording result:', result);
        
        if (result) {
          console.log('Save successful, resetting...');
          
          // Add a small delay to ensure MediaRecorder cleanup completes
          setTimeout(() => {
            resetRecording();
            toast({
              title: "Recording saved",
              description: "Ready to record your next story!"
            });
          }, 100);
        } else {
          console.error('saveRecording returned null/false');
        }
      } catch (error) {
        console.error('Save failed with error:', error);
      }
      
    } else if (recording) {
      console.log('Processing completed state save...');
      const result = await saveRecording(recording.blob, recording.duration);
      if (result) {
        resetRecording();
        toast({
          title: "Recording saved",
          description: "Ready to record your next story!"
        });
      }
    } else {
      console.log('Cannot save - invalid state:', {
        recordingState,
        hasMediaRecorder: !!mediaRecorderRef.current,
        chunksCount: chunksRef.current.length,
        hasRecording: !!recording
      });
    }
  }, [recordingState, recording, saveRecording, resetRecording]);

  const downloadRecording = useCallback(() => {
    if (recording) {
      const link = document.createElement('a');
      link.href = recording.url;
      link.download = `life-story-${new Date().toISOString().split('T')[0]}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Recording downloaded",
        description: "Your story is saved to your device"
      });
    }
  }, [recording]);

  return {
    recordingState,
    elapsedTime,
    recording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    downloadRecording,
    saveToDatabase
  };
};