import { useState, useRef, useCallback } from 'react';
import { toast } from './use-toast';
import { useRecordings } from './useRecordings';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'completed';

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export const useAudioRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const { saveRecording } = useRecordings();
  
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
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
      mediaRecorder.start(100); // Collect data every 100ms
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
        description: "Please check microphone permissions",
        variant: "destructive"
      });
    }
  }, [elapsedTime, startTimer]);

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
    
    // Stop media recorder if still active
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.log('MediaRecorder already stopped:', error);
      }
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
    
    console.log('Recording reset complete');
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
          
          // Stop any active streams
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
          
          // Reset to idle state immediately
          resetRecording();
          
          toast({
            title: "Recording saved",
            description: "Ready to record your next story!"
          });
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