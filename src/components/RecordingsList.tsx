import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, Download, Trash2 } from 'lucide-react';
import { useRecordings, type Recording } from '@/hooks/useRecordings';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface RecordingsListProps {
  className?: string;
}

export const RecordingsList = ({ className }: RecordingsListProps) => {
  const { recordings, loading, deleteRecording, getRecordingUrl } = useRecordings();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  const handlePlayPause = async (recording: Recording) => {
    if (playingId === recording.id) {
      // Pause current
      const audio = audioElements.get(recording.id);
      if (audio) {
        audio.pause();
        setPlayingId(null);
      }
      return;
    }

    // Stop any currently playing audio
    if (playingId && audioElements.has(playingId)) {
      audioElements.get(playingId)?.pause();
    }

    // Get signed URL and play
    const url = await getRecordingUrl(recording.file_path);
    if (!url) return;

    let audio = audioElements.get(recording.id);
    if (!audio) {
      audio = new Audio(url);
      audio.addEventListener('ended', () => setPlayingId(null));
      setAudioElements(prev => new Map(prev).set(recording.id, audio));
    }

    setPlayingId(recording.id);
    audio.play();
  };

  const handleDownload = async (recording: Recording) => {
    const url = await getRecordingUrl(recording.file_path);
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = `${recording.title || 'recording'}-${formatDate(recording.created_at)}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (recording: Recording) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      // Stop audio if playing
      if (playingId === recording.id) {
        const audio = audioElements.get(recording.id);
        if (audio) {
          audio.pause();
          setPlayingId(null);
        }
      }
      await deleteRecording(recording.id);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl">Your Recordings</CardTitle>
          <CardDescription>Loading your life stories...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recordings.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl">Your Recordings</CardTitle>
          <CardDescription>Your life story collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
            <p className="text-muted-foreground mb-2">No recordings yet</p>
            <p className="text-sm text-muted-foreground">
              Start recording above to preserve your memories
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">Your Recordings</CardTitle>
        <CardDescription>
          {recordings.length} life {recordings.length === 1 ? 'story' : 'stories'} preserved
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePlayPause(recording)}
                  className="shrink-0"
                >
                  {playingId === recording.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {recording.title || 'Untitled Recording'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(recording.created_at)}</span>
                    <span>{recording.duration ? formatTime(recording.duration) : 'No duration'}</span>
                    <span>{recording.file_size ? `${Math.round(recording.file_size / 1024)} KB` : 'No size'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(recording)}
                    className="shrink-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(recording)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};