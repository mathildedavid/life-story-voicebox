import { useState } from 'react';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecordingsList } from '@/components/RecordingsList';
import { LifeStorySummary } from '@/components/LifeStorySummary';
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
  RefreshCw
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
    saveToDatabase
  } = useAudioRecording(recordingsHook);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(() => 
    LIFE_STORY_QUESTIONS[Math.floor(Math.random() * LIFE_STORY_QUESTIONS.length)]
  );

  const getNewQuestion = () => {
    let newQuestion;
    do {
      newQuestion = LIFE_STORY_QUESTIONS[Math.floor(Math.random() * LIFE_STORY_QUESTIONS.length)];
    } while (newQuestion === currentQuestion && LIFE_STORY_QUESTIONS.length > 1);
    setCurrentQuestion(newQuestion);
  };

  const handleMainButtonClick = () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      pauseRecording();
    } else if (recordingState === 'paused') {
      resumeRecording();
    }
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

  const getMainButtonIcon = () => {
    if (recordingState === 'idle') {
      return <Mic className="w-8 h-8" />;
    } else if (recordingState === 'recording') {
      return <Pause className="w-8 h-8" />;
    } else if (recordingState === 'paused') {
      return <Play className="w-8 h-8" />;
    }
    return <Mic className="w-8 h-8" />;
  };

  const getMainButtonClass = () => {
    let baseClass = "recording-button flex items-center justify-center text-white";
    
    if (recordingState === 'recording') {
      return `${baseClass} recording animate-recording-pulse`;
    } else if (recordingState === 'paused') {
      return `${baseClass} paused`;
    }
    return baseClass;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="recording-card text-center animate-fade-in">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-light mb-4 text-foreground">
              Life Story Recorder
            </h1>
            
            {/* Question Section */}
            <div className="mb-6 p-6 bg-muted/20 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-foreground text-lg font-medium leading-relaxed">
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
            
            <p className="text-muted-foreground text-lg">
              {recordingState === 'idle' && "Ready to capture your memories"}
              {recordingState === 'recording' && "Recording your story..."}
              {recordingState === 'paused' && "Recording paused"}
            </p>
          </div>

          {/* Timer Display */}
          <div className="mb-12">
            <div className={`timer-display ${recordingState === 'recording' ? 'recording animate-breathe' : ''}`}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          {/* Main Recording Button */}
          <div className="mb-12 flex justify-center">
            <button
              onClick={handleMainButtonClick}
              className={getMainButtonClass()}
            >
              {getMainButtonIcon()}
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            {recordingState === 'recording' && (
              <Button
                onClick={stopRecording}
                variant="secondary"
                size="lg"
                className="control-button"
              >
                <Square className="w-5 h-5" />
              </Button>
            )}

            {recordingState === 'paused' && (
              <Button
                onClick={saveToDatabase}
                variant="secondary"
                size="lg"
                className="control-button bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
              >
                <Save className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {recordingState === 'recording' ? (
                <Mic className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
              <span>Microphone</span>
            </div>
            
            {recording && (
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-success" />
                <span>Duration: {formatTime(recording.duration)}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          {recordingState === 'idle' && (
            <div className="mt-8 p-6 bg-muted/20 rounded-2xl">
              <h3 className="text-lg font-medium mb-3 text-foreground">How to get started:</h3>
              <ul className="text-left text-muted-foreground space-y-2">
                <li>• Click the red button to start recording</li>
                <li>• Share your memories, stories, and experiences</li>
                <li>• Use pause/resume to take breaks</li>
                <li>• Press stop when you're finished</li>
                <li>• Save your recording to preserve it permanently</li>
                <li>• Download recordings to your device anytime</li>
              </ul>
            </div>
          )}

        </Card>

        {/* Life Story Summary */}
        <LifeStorySummary />

        {/* Recordings History */}
        <div className="mt-8">
          <RecordingsList recordingsHook={recordingsHook} />
        </div>
      </div>
    </div>
  );
};