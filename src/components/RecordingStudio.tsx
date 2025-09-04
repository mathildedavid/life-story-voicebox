import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecordingsList } from '@/components/RecordingsList';
import { LifeStorySummary } from '@/components/LifeStorySummary';
import { useLifeStorySummary } from '@/hooks/useLifeStorySummary';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
import { QuestionSuggestion } from '@/components/QuestionSuggestion';
import { 
  Play, 
  Pause, 
  Square, 
  Download,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  Save,
  RefreshCw,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';


const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const RecordingStudio = () => {
  console.log('RecordingStudio component is rendering');
  
  const recordingsHook = useRecordings();
  const {
    recordingState,
    elapsedTime,
    recording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    downloadRecording,
    saveToDatabase,
    startNewRecording,
    errorMessage,
    clearError,
    processingStep
  } = useAudioRecording(recordingsHook);

  console.log('RecordingStudio - recordingState:', recordingState);
  console.log('RecordingStudio - hooks loaded successfully');

  const [isPlaying, setIsPlaying] = useState(false);

  const { generating: generatingSummary } = useLifeStorySummary();


  // Log encouragement modal state changes
  useEffect(() => {
    console.log('🎭 Encouragement modal state changed:', {
      isOpen: recordingsHook.encouragementModal.isOpen,
      message: recordingsHook.encouragementModal.message,
      messageLength: recordingsHook.encouragementModal.message?.length || 0,
      recordingState
    });
  }, [recordingsHook.encouragementModal.isOpen, recordingsHook.encouragementModal.message, recordingState]);

  // Close encouragement modal when starting a new recording
  useEffect(() => {
    if (recordingState === 'recording' && recordingsHook.encouragementModal.isOpen) {
      console.log('🧹 Closing encouragement modal because new recording started');
      recordingsHook.closeEncouragementModal();
    }
  }, [recordingState, recordingsHook.encouragementModal.isOpen, recordingsHook.closeEncouragementModal]);




  const handleMainButtonClick = () => {
    console.log('=== BUTTON CLICKED ===');
    console.log('Main button clicked - current state:', recordingState);
    
    if (recordingState === 'idle' || recordingState === 'error') {
      console.log('Starting recording from button click...');
      if (recordingState === 'error') {
        clearError();
      }
      startRecording();
    } else if (recordingState === 'recording') {
      console.log('Pausing recording from button click...');
      pauseRecording();
    } else if (recordingState === 'paused') {
      console.log('Resuming recording from button click...');
      resumeRecording();
    } else if (recordingState === 'saved') {
      console.log('Starting new recording from saved state...');
      startNewRecording();
    } else {
      console.log('Unhandled recording state:', recordingState);
    }
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleSave = async () => {
    console.log('💾 SAVE BUTTON CLICKED - starting save process...');
    await saveToDatabase();
  };

  const handleDownload = () => {
    downloadRecording();
  };

  const handlePlayback = () => {
    if (!recording) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      // Stop audio playback
    } else {
      setIsPlaying(true);
      const audio = new Audio(recording.url);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };

  const getMainButtonText = () => {
    if (recordingState === 'idle' || recordingState === 'error') {
      return 'Start';
    } else if (recordingState === 'recording') {
      return 'Pause';
    } else if (recordingState === 'paused') {
      return 'Continue';
    } else if (recordingState === 'saved') {
      return 'Start';
    } else if (recordingState === 'saving' || recordingState === 'processing') {
      return 'Processing...';
    }
    return 'Start';
  };

  const getMainButtonClass = () => {
    const baseClass = "recording-button flex items-center justify-center text-white transition-all duration-300";
    
    if (recordingState === 'recording') {
      return `${baseClass} recording animate-recording-pulse`;
    } else if (recordingState === 'paused') {
      return `${baseClass} paused`;
    } else if (recordingState === 'saving' || recordingState === 'processing') {
      return `${baseClass} opacity-60 cursor-not-allowed`;
    } else if (recordingState === 'saved') {
      return `${baseClass} bg-primary hover:bg-primary/90 transform hover:scale-105`;
    } else if (recordingState === 'error') {
      return `${baseClass} bg-red-500 hover:bg-red-600`;
    }
    return baseClass;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <AccessibilitySettings />
      
      <div className="w-full max-w-lg mx-auto">
        <motion.div
          className="rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl p-8 text-center border border-white/40"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Loading/Success/Error State Area */}
          {(recordingState === 'saving' || recordingState === 'processing' || recordingState === 'saved' || recordingState === 'error' || generatingSummary) && (
              <div className={`mb-6 animate-fade-in transition-all duration-500 ${
                recordingState === 'saved'
                  ? '' 
                  : recordingState === 'error'
                  ? 'p-6 rounded-2xl border bg-[var(--gradient-error)] border-destructive/20 text-destructive-foreground'
                  : 'p-6 rounded-2xl border bg-gradient-to-r from-recording/5 to-recording/10 border-recording/20 text-recording-foreground'
              }`}>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  {recordingState === 'saving' && (
                    <>
                      <RefreshCw className="w-8 h-8 animate-spin text-recording" />
                      <span className="text-xl-elderly font-medium">Saving your recording...</span>
                    </>
                  )}
                  {recordingState === 'processing' && (
                    <>
                      <RefreshCw className="w-8 h-8 animate-spin text-recording" />
                      <span className="text-xl-elderly font-medium">
                        {processingStep === 'transcribing' ? 'Transcribing your story...' : 'Generating personalized insights...'}
                      </span>
                    </>
                  )}
                  {generatingSummary && recordingState !== 'processing' && (
                    <>
                      <RefreshCw className="w-8 h-8 animate-spin text-recording" />
                      <span className="text-xl-elderly font-medium">Generating story insights...</span>
                    </>
                  )}
                  {recordingState === 'error' && (
                    <>
                      <AlertCircle className="w-8 h-8 text-destructive" />
                      <div className="text-center">
                        <h4 className="text-xl-elderly font-semibold mb-2 text-destructive">Something went wrong</h4>
                        <p className="text-lg-elderly leading-relaxed opacity-90 max-w-md">
                          {errorMessage || 'An unexpected error occurred. Please try again.'}
                        </p>
                      </div>
                    </>
                  )}
                  {recordingState === 'saved' && (
                    <div className="w-full">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900 font-medium leading-relaxed shadow-inner border border-emerald-200 flex items-start gap-3"
                      >
                        <Sparkles className="text-emerald-600 flex-shrink-0 mt-1" size={24} />
                        <p className="text-lg text-left">
                          {(() => {
                            const message = recordingsHook.encouragementModal.message || "I love that you shared your story! It's such a unique detail that adds a beautiful flavor to your memories. Your courage in expressing your experiences is inspiring—please keep sharing your delightful stories!";
                            console.log('🎯 RENDERING SUCCESS MESSAGE:', { 
                              modalMessage: recordingsHook.encouragementModal.message,
                              modalMessageLength: recordingsHook.encouragementModal.message?.length,
                              fallback: "Your Story Shines! ✨",
                              finalMessage: message,
                              finalMessageLength: message.length
                            });
                            return message;
                          })()}
                        </p>
                      </motion.div>
                    </div>
                  )}
                </div>
                {recordingState === 'error' && (
                  <div className="mt-4 pt-3 border-t border-red-200 w-full text-center">
                    <Button 
                      onClick={clearError}
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl-elderly md:text-4xl font-medium mb-4 text-foreground">
              Life Story Recorder
            </h1>
            
            
            {(recordingState === 'recording' || recordingState === 'paused' || recordingState === 'completed' || recordingState === 'saving' || recordingState === 'processing' || recordingState === 'saved' || recordingState === 'error') && (
              <p className="text-muted-foreground text-lg">
                {recordingState === 'recording' && (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-recording rounded-full animate-gentle-pulse"></div>
                      Recording your story...
                    </span>
                )}
                {recordingState === 'paused' && (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-pause rounded-full"></div>
                      Recording paused
                    </span>
                )}
                {recordingState === 'completed' && (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Recording completed!
                    </span>
                )}
                {(recordingState === 'saving' || recordingState === 'processing') && (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-recording" />
                      {recordingState === 'saving' ? 'Saving...' : 
                       processingStep === 'transcribing' ? 'Transcribing...' : 'Analyzing...'}
                    </span>
                )}
                {recordingState === 'saved' && (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-success" />
                      Ready for your next story!
                    </span>
                )}
                {recordingState === 'error' && (
                    <span className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      Please try again
                    </span>
                )}
              </p>
            )}
          </div>

          {/* Timer Display */}
          <div className="mb-12">
            <div className={`timer-display ${recordingState === 'recording' ? 'recording animate-breathe' : ''}`}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          {/* Recording State Buttons */}
          {recordingState === 'recording' && (
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={handleMainButtonClick}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-2xl bg-orange-400/40 backdrop-blur-md border border-orange-300/30 text-orange-900 font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-orange-400/60 transition"
              >
                Pause
              </motion.button>
              <motion.button
                onClick={handleSave}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-2xl bg-blue-400/40 backdrop-blur-md border border-blue-300/30 text-blue-900 font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-400/60 transition"
              >
                Save
              </motion.button>
            </div>
          )}
          
          {(recordingState === 'idle' || recordingState === 'error' || recordingState === 'saved' || recordingState === 'saving' || recordingState === 'processing') && (
            <div className="flex justify-center">
              <motion.button
                onClick={handleMainButtonClick}
                disabled={recordingState === 'saving' || recordingState === 'processing'}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-4 rounded-2xl bg-green-400/40 backdrop-blur-md border border-green-300/30 text-green-900 font-semibold text-lg flex items-center gap-2 shadow-lg hover:shadow-xl hover:bg-green-400/60 transition"
                aria-label={recordingState === 'saving' || recordingState === 'processing' ? 'Processing recording...' : 'Start recording'}
              >
                <Play size={22} /> {getMainButtonText()}
              </motion.button>
            </div>
          )}

          {/* Paused State Buttons */}
          {recordingState === 'paused' && (recording || elapsedTime > 0) && (
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={resumeRecording}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-2xl bg-green-400/40 backdrop-blur-md border border-green-300/30 text-green-900 font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-green-400/60 transition"
              >
                Continue
              </motion.button>
              <motion.button
                onClick={handleSave}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-2xl bg-blue-400/40 backdrop-blur-md border border-blue-300/30 text-blue-900 font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-400/60 transition"
              >
                Save
              </motion.button>
            </div>
          )}

        </motion.div>

        {/* Question Suggestion */}
        <div className="mt-6">
          <QuestionSuggestion />
        </div>

        {/* Life Story Summary */}
        <div className="mt-8">
          <LifeStorySummary />
        </div>

        {/* Recordings History */}
        <div className="mt-8">
          <RecordingsList recordingsHook={recordingsHook} />
        </div>

      </div>
    </div>
  );
};