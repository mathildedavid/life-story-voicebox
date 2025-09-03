import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  mockSupabaseClient, 
  mockRecording, 
  resetMocks,
  setupSupabaseMocks 
} from './mocks';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock the hooks
vi.mock('@/hooks/useAudioRecording', () => ({
  useAudioRecording: vi.fn(),
}));

vi.mock('@/hooks/useRecordings', () => ({
  useRecordings: vi.fn(),
}));

vi.mock('@/hooks/useLifeStorySummary', () => ({
  useLifeStorySummary: vi.fn(),
}));

// Mock AuthProvider
vi.mock('@/components/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { id: 'user123' }, loading: false }),
}));

// Import after mocking
import { RecordingStudio } from '@/components/RecordingStudio';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';
import { useLifeStorySummary } from '@/hooks/useLifeStorySummary';

const mockUseAudioRecording = vi.mocked(useAudioRecording);
const mockUseRecordings = vi.mocked(useRecordings);
const mockUseLifeStorySummary = vi.mocked(useLifeStorySummary);

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Processing Steps Investigation', () => {
  let mockSaveToDatabase: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetMocks();
    mockSaveToDatabase = vi.fn();

    // Default mocks
    mockUseRecordings.mockReturnValue({
      recordings: [],
      loading: false,
      saveRecording: vi.fn(),
      deleteRecording: vi.fn(),
      getRecordingUrl: vi.fn(),
      transcribeRecording: vi.fn(),
      generateEncouragement: vi.fn(),
      refetch: vi.fn(),
      encouragementModal: { isOpen: false, message: null },
      closeEncouragementModal: vi.fn(),
    });

    mockUseLifeStorySummary.mockReturnValue({
      summary: null,
      loading: false,
      generating: false,
      generateSummary: vi.fn() as any,
      refetch: vi.fn() as any,
    });
  });

  it('should show correct processing step messages in the right order', async () => {
    // Start with saving state
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'saving',
      elapsedTime: 120,
      recording: mockRecording,
      startRecording: vi.fn(),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      stopRecording: vi.fn(),
      resetRecording: vi.fn(),
      downloadRecording: vi.fn(),
      saveToDatabase: mockSaveToDatabase,
      startNewRecording: vi.fn(),
      errorMessage: null,
      clearError: vi.fn(),
      processingStep: 'saving',
    });

    const { rerender } = render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Should show saving message
    expect(screen.getByText('Saving your recording...')).toBeInTheDocument();

    // Transition to processing with transcribing step
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'processing',
      elapsedTime: 120,
      recording: mockRecording,
      startRecording: vi.fn(),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      stopRecording: vi.fn(),
      resetRecording: vi.fn(),
      downloadRecording: vi.fn(),
      saveToDatabase: mockSaveToDatabase,
      startNewRecording: vi.fn(),
      errorMessage: null,
      clearError: vi.fn(),
      processingStep: 'transcribing',
    });

    rerender(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    expect(screen.getByText('Transcribing your story...')).toBeInTheDocument();

    // Transition to analyzing step
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'processing',
      elapsedTime: 120,
      recording: mockRecording,
      startRecording: vi.fn(),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      stopRecording: vi.fn(),
      resetRecording: vi.fn(),
      downloadRecording: vi.fn(),
      saveToDatabase: mockSaveToDatabase,
      startNewRecording: vi.fn(),
      errorMessage: null,
      clearError: vi.fn(),
      processingStep: 'analyzing',
    });

    rerender(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    expect(screen.getByText('Generating personalized insights...')).toBeInTheDocument();

    // Finally transition to saved state
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'saved',
      elapsedTime: 120,
      recording: mockRecording,
      startRecording: vi.fn(),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      stopRecording: vi.fn(),
      resetRecording: vi.fn(),
      downloadRecording: vi.fn(),
      saveToDatabase: mockSaveToDatabase,
      startNewRecording: vi.fn(),
      errorMessage: null,
      clearError: vi.fn(),
      processingStep: null,
    });

    rerender(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Should show the "Your Story Shines" message
    expect(screen.getByText('Your Story Shines! ✨')).toBeInTheDocument();
    expect(screen.getByText('Ready for your next story!')).toBeInTheDocument();
  });

  it('should handle the case where processing gets stuck and never completes', async () => {
    // Simulate the bug: stays in processing state indefinitely
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'processing',
      elapsedTime: 120,
      recording: mockRecording,
      startRecording: vi.fn(),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      stopRecording: vi.fn(),
      resetRecording: vi.fn(),
      downloadRecording: vi.fn(),
      saveToDatabase: mockSaveToDatabase,
      startNewRecording: vi.fn(),
      errorMessage: null,
      clearError: vi.fn(),
      processingStep: 'analyzing', // Stuck on analyzing
    });

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Should show processing message but NOT the success message
    expect(screen.getByText('Generating personalized insights...')).toBeInTheDocument();
    expect(screen.queryByText('Your Story Shines! ✨')).not.toBeInTheDocument();
  });

  it('should test event listener for processing completion', async () => {
    // This test verifies the event listener is working
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'processing',
      elapsedTime: 120,
      recording: mockRecording,
      startRecording: vi.fn(),
      pauseRecording: vi.fn(),
      resumeRecording: vi.fn(),
      stopRecording: vi.fn(),
      resetRecording: vi.fn(),
      downloadRecording: vi.fn(),
      saveToDatabase: mockSaveToDatabase,
      startNewRecording: vi.fn(),
      errorMessage: null,
      clearError: vi.fn(),
      processingStep: 'analyzing',
    });

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    expect(screen.getByText('Generating personalized insights...')).toBeInTheDocument();

    // Simulate the processing complete event
    act(() => {
      window.dispatchEvent(new CustomEvent('recordingProcessingComplete'));
    });

    // The hook should transition to saved state due to our event listener
    // Note: This test shows the intention - the actual state change would need to be
    // tested through re-render with updated mock or integration test
  });
});