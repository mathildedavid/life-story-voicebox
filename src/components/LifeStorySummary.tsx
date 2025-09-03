import { useState } from 'react';
import { useLifeStorySummary } from '@/hooks/useLifeStorySummary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  BarChart3, 
  Sparkles,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const getThemeColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-50 text-green-600 border-green-200';
    case 'developing':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'evident':
      return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'beginning':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getThemeLabel = (key: string): string => {
  const labels: Record<string, string> = {
    selfReflection: 'Self Reflection',
    storytelling: 'Storytelling',
    memoryPreservation: 'Memory Preservation',
    personalGrowth: 'Personal Growth'
  };
  return labels[key] || key;
};

export const LifeStorySummary = () => {
  const { summary, loading, generating, generateSummary } = useLifeStorySummary();
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="life-story-card mb-8 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BookOpen className="w-5 h-5 animate-pulse" />
            <span>Loading your story...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="life-story-card mb-8 animate-fade-in">
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2 text-foreground">Your Story Awaits</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start recording your memories to create a beautiful autobiography summary that grows with each story you share.
          </p>
          <Button 
            onClick={() => generateSummary(true)}
            disabled={generating}
            variant="outline"
            size="lg"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating Summary...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate First Summary
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  const stats = summary.statistics;
  const hasMultipleRecordings = stats.totalRecordings > 1;

  return (
    <Card className="life-story-card mb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="story-icon">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your Life Story</h2>
            <p className="text-sm text-muted-foreground">A growing autobiography</p>
          </div>
        </div>
        <Button
          onClick={() => generateSummary(true)}
          disabled={generating}
          variant="ghost"
          size="sm"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Story Summary */}
      <div className="mb-6">
        <div className={`story-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <p className="text-foreground leading-relaxed">
            {summary.summary_text}
          </p>
        </div>
        {summary.summary_text.length > 300 && (
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="mt-2 text-primary hover:text-primary/80"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </Button>
        )}
      </div>

    </Card>
  );
};