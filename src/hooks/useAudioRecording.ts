import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'completed' | 'saving' | 'processing' | 'saved' | 'error';

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export const useAudioRecording = (recordingsHook?: ReturnType<typeof import('./useRecordings').useRecordings>) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isStartingNew, setIsStartingNew] = useState(false);
  const [processingStep, setProcessingStep] = useState<'saving' | 'transcribing' | 'analyzing'>('saving');
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

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [startTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      stopTimer();
      // Store accumulated time when pausing
      pauseTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
    }
  }, [recordingState, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      startTimer();
    }
  }, [recordingState, startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      // Capture final elapsed time before stopping
      const finalElapsedTime = elapsedTime;
      console.log('Stop recording called - elapsedTime:', finalElapsedTime);
      
      mediaRecorderRef.current.stop();
      stopTimer();
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

  const startNewRecording = useCallback(async () => {
    if (isStartingNew || recordingState === 'saving' || recordingState === 'processing') return; // Prevent double-click and invalid states
    
    setIsStartingNew(true);
    setErrorMessage('');
    
    try {
      // Reset from saved state and start a new recording
      resetRecording();
      // Small delay to ensure state is reset before starting
      await new Promise(resolve => setTimeout(resolve, 150));
      await startRecording();
    } catch (error) {
      console.error('Error starting new recording:', error);
      setErrorMessage('Failed to start recording. Please check microphone permissions.');
      setRecordingState('error');
    } finally {
      setIsStartingNew(false);
    }
  }, [resetRecording, startRecording, isStartingNew, recordingState]);

  const saveToDatabase = useCallback(async () => {
    console.log('saveToDatabase called with state:', {
      recordingState,
      hasMediaRecorder: !!mediaRecorderRef.current,
      chunksCount: chunksRef.current.length,
      hasRecording: !!recording,
      pauseTime: pauseTimeRef.current
    });

    // Set saving state immediately
    const currentState = recordingState;
    setRecordingState('saving');
    setErrorMessage('');
    setProcessingStep('saving');

    // Minimum display time for saving state
    const savingStartTime = Date.now();
    const minSavingTime = 1000; // 1 second minimum

    if (currentState === 'paused' && mediaRecorderRef.current && chunksRef.current.length > 0) {
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
        
        // Ensure minimum saving time has passed before transitioning
        const elapsedSavingTime = Date.now() - savingStartTime;
        if (elapsedSavingTime < minSavingTime) {
          await new Promise(resolve => setTimeout(resolve, minSavingTime - elapsedSavingTime));
        }
        
        setRecordingState('processing');
        const result = await saveRecording(blob, finalDuration, undefined, {
          onStepChange: (step) => setProcessingStep(step)
        });
        console.log('saveRecording result:', result);
        
        if (result) {
          console.log('Save successful, setting saved state...');
          setRecordingState('saved');
          
          // Clean up the media recorder and chunks after successful save
          if (mediaRecorderRef.current) {
            try {
              if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
              }
              if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
              }
            } catch (error) {
              console.log('MediaRecorder cleanup error (expected):', error);
            }
            mediaRecorderRef.current = null;
          }
          chunksRef.current = [];
          
          // Notify the LifeStorySummary to regenerate
          window.dispatchEvent(new CustomEvent('recordingSaved'));
        } else {
          setErrorMessage('Failed to save recording. Please try again.');
          setRecordingState('error');
        }
      } catch (error) {
        console.error('Save failed with error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to save recording');
        setRecordingState('error');
      }
      
    } else if (recording) {
      console.log('Processing completed state save...');
      
      try {
        // Ensure minimum saving time has passed before transitioning
        const elapsedSavingTime = Date.now() - savingStartTime;
        if (elapsedSavingTime < minSavingTime) {
          await new Promise(resolve => setTimeout(resolve, minSavingTime - elapsedSavingTime));
        }
        
        setRecordingState('processing');
        const result = await saveRecording(recording.blob, recording.duration, undefined, {
          onStepChange: (step) => setProcessingStep(step)
        });
        
        if (result) {
          setRecordingState('saved');
          
          // Clean up recording after successful save
          if (recording?.url) {
            URL.revokeObjectURL(recording.url);
          }
          setRecording(null);
          
          // Notify the LifeStorySummary to regenerate
          window.dispatchEvent(new CustomEvent('recordingSaved'));
        } else {
          setErrorMessage('Failed to save recording. Please try again.');
          setRecordingState('error');
        }
      } catch (error) {
        console.error('Save failed with error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to save recording');
        setRecordingState('error');
      }
    } else {
      console.log('Cannot save - invalid state:', {
        recordingState,
        hasMediaRecorder: !!mediaRecorderRef.current,
        chunksCount: chunksRef.current.length,
        hasRecording: !!recording
      });
      setErrorMessage('No recording to save. Please record something first.');
      setRecordingState('error');
    }
  }, [recordingState, recording, saveRecording]);

  const downloadRecording = useCallback(() => {
    if (recording) {
      const link = document.createElement('a');
      link.href = recording.url;
      link.download = `life-story-${new Date().toISOString().split('T')[0]}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [recording]);

  const clearError = useCallback(() => {
    setErrorMessage('');
    setRecordingState('idle');
  }, []);

  return {
    recordingState,
    elapsedTime,
    recording,
    errorMessage,
    processingStep,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    downloadRecording,
    saveToDatabase,
    startNewRecording,
    clearError
  };
};