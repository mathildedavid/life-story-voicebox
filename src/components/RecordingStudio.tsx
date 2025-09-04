import { useState, useEffect } from 'react';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecordingsList } from '@/components/RecordingsList';
import { LifeStorySummary } from '@/components/LifeStorySummary';
import { useLifeStorySummary } from '@/hooks/useLifeStorySummary';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
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
  AlertCircle,
  BarChart3,
  Clock
} from 'lucide-react';

const LIFE_STORY_QUESTIONS = [
  "Where and when were you born, and what was your hometown like?",
  "Tell me about your parents - what were they like and what did they do?",
  "Do you have siblings? What was your relationship with them growing up?",
  "What are your earliest childhood memories?",
  "What kind of child were you - shy, outgoing, curious, rebellious?",
  "What family traditions or values shaped you most?",
  "Who was your biggest influence growing up and why?",
  "What schools did you attend and how did they shape you?",
  "Were you a good student? What subjects interested you most?",
  "What extracurricular activities were you involved in?",
  "Who was your most memorable teacher and what did they teach you?",
  "What were your teenage years like?",
  "What did you want to be when you grew up?",
  "How did you choose your career path?",
  "What was your first job and what did you learn from it?",
  "What has been your most significant professional achievement?",
  "What was your biggest professional failure and what did it teach you?",
  "Who were your mentors or role models in your field?",
  "What skills or qualities have been most important to your success?",
  "How has your industry or field changed during your career?",
  "Tell me about meeting your spouse/partner - what attracted you to them?",
  "What has been the key to your lasting relationships?",
  "Do you have children? How has parenthood changed you?",
  "Who are your closest friends and how did you meet them?",
  "What role has friendship played in your life?",
  "What has been the most difficult period of your life?",
  "What major decisions or turning points shaped your path?",
  "How do you handle failure or setbacks?",
  "What fears have you had to overcome?",
  "What would you do differently if you could go back?",
  "What principles or values guide your decisions?",
  "How have your beliefs or worldview changed over time?",
  "What does success mean to you?",
  "What are you most proud of in your life?",
  "What legacy do you hope to leave?",
  "What are your hobbies or passions outside of work?",
  "What books, movies, or music have influenced you most?",
  "Where do you feel most at home or peaceful?",
  "What makes you laugh?",
  "How do you like to spend your free time?",
  "What advice would you give to your younger self?",
  "What has surprised you most about getting older?",
  "What do you wish more people understood about you or your field?",
  "What are you still learning or working to improve?",
  "What question do you wish I had asked?",
  "What are you most excited about for the future?",
  "What goals or dreams do you still want to pursue?",
  "How do you want to be remembered?",
  "What would you want people to learn from your story?",
  "If you could have dinner with anyone, living or dead, who would it be and why?"
];

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
  const [currentQuestion, setCurrentQuestion] = useState(() => 
    LIFE_STORY_QUESTIONS[Math.floor(Math.random() * LIFE_STORY_QUESTIONS.length)]
  );

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



  const getNewQuestion = () => {
    let newQuestion;
    do {
      newQuestion = LIFE_STORY_QUESTIONS[Math.floor(Math.random() * LIFE_STORY_QUESTIONS.length)];
    } while (newQuestion === currentQuestion && LIFE_STORY_QUESTIONS.length > 1);
    setCurrentQuestion(newQuestion);
  };

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AccessibilitySettings />
      
      <div className="w-full max-w-xl mx-auto">
        <Card className="p-8 bg-[var(--gradient-cream-wheat)] border border-border rounded-3xl text-center animate-fade-in shadow-[var(--shadow-warm)]">
          {/* Loading/Success/Error State Area */}
          {(recordingState === 'saving' || recordingState === 'processing' || recordingState === 'saved' || recordingState === 'error' || generatingSummary) && (
              <div className={`mb-6 p-6 rounded-2xl border animate-fade-in transition-all duration-500 ${
                recordingState === 'saved'
                  ? 'bg-encouragement-bg border-encouragement/30' 
                  : recordingState === 'error'
                  ? 'bg-[var(--gradient-error)] border-destructive/20 text-destructive-foreground'
                  : 'bg-gradient-to-r from-recording/5 to-recording/10 border-recording/20 text-recording-foreground'
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
                    <>
                      <Sparkles className="w-8 h-8 text-encouragement" />
                      <span className="text-xl-elderly font-medium text-encouragement">
                        {(() => {
                          const message = recordingsHook.encouragementModal.message || "Your Story Shines! ✨";
                          console.log('🎯 RENDERING SUCCESS MESSAGE:', { 
                            modalMessage: recordingsHook.encouragementModal.message,
                            modalMessageLength: recordingsHook.encouragementModal.message?.length,
                            fallback: "Your Story Shines! ✨",
                            finalMessage: message,
                            finalMessageLength: message.length
                          });
                          return message;
                        })()}
                      </span>
                    </>
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
            
            {/* Question Section with warm gradient */}
            <div className="mb-6 p-6 bg-[var(--gradient-warm)] rounded-2xl border border-border/50">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-foreground text-xl-elderly font-medium leading-relaxed">
                    {currentQuestion}
                  </p>
                </div>
                <Button
                  onClick={getNewQuestion}
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                  title="Get another question"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
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

          {/* Main Recording Button */}
          {recordingState === 'recording' && (
            <div className="mb-12 flex justify-center gap-4">
              <Button
                onClick={handleMainButtonClick}
                size="lg"
                className="text-2xl-elderly px-8 py-4 h-auto min-w-32"
              >
                Pause
              </Button>
              <Button
                onClick={handleSave}
                variant="secondary"
                size="lg"
                className="text-2xl-elderly px-8 py-4 h-auto bg-success/10 hover:bg-success/20 text-success border-success/30"
              >
                Save
              </Button>
            </div>
          )}
          
          {(recordingState === 'idle' || recordingState === 'error' || recordingState === 'saved' || recordingState === 'saving' || recordingState === 'processing') && (
            <div className="mb-12 flex justify-center">
              <Button
                onClick={handleMainButtonClick}
                size="lg"
                disabled={recordingState === 'saving' || recordingState === 'processing'}
                className="text-2xl-elderly px-8 py-4 h-auto min-w-32"
                aria-label={recordingState === 'saving' || recordingState === 'processing' ? 'Processing recording...' : 'Start recording'}
              >
                {getMainButtonText()}
              </Button>
            </div>
          )}

          {/* Control Buttons */}
          {recordingState === 'paused' && (recording || elapsedTime > 0) && (
            <div className="flex justify-center gap-4 mb-8">
              <Button
                onClick={resumeRecording}
                size="lg"
                className="text-2xl-elderly px-8 py-4 h-auto"
              >
                Continue
              </Button>
              <Button
                onClick={handleSave}
                variant="secondary"
                size="lg"
                className="text-2xl-elderly px-8 py-4 h-auto bg-success/10 hover:bg-success/20 text-success border-success/30"
                disabled={false}
              >
                Save
              </Button>
            </div>
          )}

        </Card>

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