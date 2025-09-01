import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Download, Trash2, ChevronDown, ChevronRight, FileText, Loader2 } from 'lucide-react';
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
  recordingsHook?: ReturnType<typeof useRecordings>;
}

export const RecordingsList = ({ className, recordingsHook }: RecordingsListProps) => {
  const defaultRecordings = useRecordings();
  const { recordings, loading, deleteRecording, getRecordingUrl, transcribeRecording } = recordingsHook || defaultRecordings;
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());
  const [expandedRecordings, setExpandedRecordings] = useState<Set<string>>(new Set());
  const [transcribingIds, setTranscribingIds] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (recordingId: string) => {
    setExpandedRecordings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordingId)) {
        newSet.delete(recordingId);
      } else {
        newSet.add(recordingId);
      }
      return newSet;
    });
  };

  const handleTranscribe = async (recordingId: string) => {
    if (!transcribeRecording) return;
    
    setTranscribingIds(prev => new Set(prev).add(recordingId));
    try {
      await transcribeRecording(recordingId);
    } finally {
      setTranscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
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
              <Collapsible key={recording.id}>
                <div className="rounded-lg border bg-card hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4 p-4">
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
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">
                          {recording.title || 'Untitled Recording'}
                        </h4>
                        {recording.transcript ? (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Transcribed
                          </Badge>
                        ) : transcribingIds.has(recording.id) ? (
                          <Badge variant="outline" className="text-xs">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Transcribing...
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No transcript
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDate(recording.created_at)}</span>
                        <span>{recording.duration ? formatTime(recording.duration) : 'No duration'}</span>
                        <span>{recording.file_size ? `${Math.round(recording.file_size / 1024)} KB` : 'No size'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {recording.transcript && (
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpanded(recording.id)}
                            className="shrink-0"
                          >
                            {expandedRecordings.has(recording.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                      {!recording.transcript && !transcribingIds.has(recording.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTranscribe(recording.id)}
                          className="shrink-0 text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Transcribe
                        </Button>
                      )}
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

                  {recording.transcript && (
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="bg-muted/30 rounded-lg p-4 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Transcript</span>
                        </div>
                        <p className="text-sm leading-relaxed">{recording.transcript}</p>
                      </div>
                    </CollapsibleContent>
                  )}
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};