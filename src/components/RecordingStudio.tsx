import { useState } from 'react';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecordingsList } from '@/components/RecordingsList';
import { 
  Play, 
  Pause, 
  Square, 
  Download,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  Save
} from 'lucide-react';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const RecordingStudio = () => {
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
  } = useAudioRecording();

  const [isPlaying, setIsPlaying] = useState(false);

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

        {/* Recordings History */}
        <div className="mt-8">
          <RecordingsList />
        </div>
      </div>
    </div>
  );
};