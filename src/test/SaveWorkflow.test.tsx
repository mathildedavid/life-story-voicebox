import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { 
  mockSupabaseClient, 
  mockRecording, 
  mockLifeStorySummary, 
  mockEncouragementMessage,
  resetMocks,
  setupSupabaseMocks 
} from './mocks';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock the hooks with proper factory functions
vi.mock('@/hooks/useAudioRecording', () => ({
  useAudioRecording: vi.fn(),
}));

vi.mock('@/hooks/useRecordings', () => ({
  useRecordings: vi.fn(),
}));

vi.mock('@/hooks/useLifeStorySummary', () => ({
  useLifeStorySummary: vi.fn(),
}));

// Import components after mocking
import { RecordingStudio } from '@/components/RecordingStudio';
import { AuthProvider } from '@/components/AuthProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';
import { useLifeStorySummary } from '@/hooks/useLifeStorySummary';

const mockUseAudioRecording = vi.mocked(useAudioRecording);
const mockUseRecordings = vi.mocked(useRecordings);
const mockUseLifeStorySummary = vi.mocked(useLifeStorySummary);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('Save Workflow Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockSaveToDatabase: ReturnType<typeof vi.fn>;
  let mockRefetchRecordings: ReturnType<typeof vi.fn>;
  let mockGenerateSummary: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user = userEvent.setup();
    resetMocks();
    
    // Setup function mocks
    mockSaveToDatabase = vi.fn();
    mockRefetchRecordings = vi.fn();
    mockGenerateSummary = vi.fn();

    // Mock useAudioRecording hook
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'paused',
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

    // Mock useRecordings hook
    mockUseRecordings.mockReturnValue({
      recordings: [],
      loading: false,
      saveRecording: vi.fn(),
      deleteRecording: vi.fn(),
      getRecordingUrl: vi.fn(),
      transcribeRecording: vi.fn(),
      generateEncouragement: vi.fn(),
      refetch: mockRefetchRecordings,
      encouragementModal: {
        isOpen: false,
        message: null,
      },
      closeEncouragementModal: vi.fn(),
    });

    // Mock useLifeStorySummary hook
    mockUseLifeStorySummary.mockReturnValue({
      summary: null,
      loading: false,
      generating: false,
      generateSummary: mockGenerateSummary,
      refetch: vi.fn() as any,
    });
  });

  it('should display correct sequence of states and update all components during save workflow', async () => {
    // Step 1: Initial state verification
    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Verify initial paused state
    expect(screen.getByText('Recording paused')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();

    // Step 2: Click save button and verify saving state
    let currentRecordingState: 'saving' | 'processing' | 'saved' = 'saving';
    mockUseAudioRecording.mockReturnValue({
      recordingState: currentRecordingState,
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

    await act(async () => {
      await user.click(saveButton);
    });

    // Mock the save process with delays
    mockSaveToDatabase.mockImplementation(async () => {
      // Simulate saving delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update state to processing
      currentRecordingState = 'processing';
      mockUseAudioRecording.mockReturnValue({
        recordingState: currentRecordingState,
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
      
      // Trigger re-render
      await act(async () => {
        render(
          <TestWrapper>
            <RecordingStudio />
          </TestWrapper>
        );
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update to insights generation
      mockUseAudioRecording.mockReturnValue({
        recordingState: currentRecordingState,
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

      // Trigger re-render
      await act(async () => {
        render(
          <TestWrapper>
            <RecordingStudio />
          </TestWrapper>
        );
      });

      // Simulate completion
      await new Promise(resolve => setTimeout(resolve, 100));
      
      currentRecordingState = 'saved';
      mockUseAudioRecording.mockReturnValue({
        recordingState: currentRecordingState,
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

      // Update recordings list to include new recording
      mockUseRecordings.mockReturnValue({
        recordings: [
          {
            ...mockRecording,
            id: '1',
            title: 'Test Recording',
            transcript: 'This is a test transcript',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            duration: 120,
            file_path: 'user123/recording1.webm',
            file_size: 1024,
            encouragement_message: mockEncouragementMessage,
          }
        ],
        loading: false,
        saveRecording: vi.fn(),
        deleteRecording: vi.fn(),
        getRecordingUrl: vi.fn(),
        transcribeRecording: vi.fn(),
        generateEncouragement: vi.fn(),
        refetch: mockRefetchRecordings,
        encouragementModal: {
          isOpen: true,
          message: mockEncouragementMessage,
        },
        closeEncouragementModal: vi.fn(),
      });

      // Update life story summary
      mockUseLifeStorySummary.mockReturnValue({
        summary: {
          ...mockLifeStorySummary,
          id: 'summary-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        loading: false,
        generating: false,
        generateSummary: mockGenerateSummary,
        refetch: vi.fn() as any,
      });
    });

    // Step 3: Verify saving state appears
    await waitFor(() => {
      expect(screen.getByText('Saving your recording...')).toBeInTheDocument();
    });

    // Step 4: Verify processing state transitions
    await waitFor(() => {
      expect(screen.getByText('Transcribing your story...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Generating personalized insights...')).toBeInTheDocument();
    });

    // Step 5: Verify completion state
    await waitFor(() => {
      expect(screen.getByText('Your Story Shines! ✨')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Ready for your next story!')).toBeInTheDocument();
    });

    // Step 6: Verify all components updated correctly
    await waitFor(() => {
      // Check that life story summary is displayed
      expect(screen.getByText('Your Life Story')).toBeInTheDocument();
      expect(screen.getByText(mockLifeStorySummary.summary_text)).toBeInTheDocument();
      
      // Check that recordings list shows the new recording
      expect(screen.getByText('Test Recording')).toBeInTheDocument();
      expect(screen.getByText('This is a test transcript')).toBeInTheDocument();
      
      // Check that encouragement message appears
      expect(screen.getByText(mockEncouragementMessage)).toBeInTheDocument();
    });

    // Step 7: Verify function calls occurred in correct order
    expect(mockSaveToDatabase).toHaveBeenCalledTimes(1);
    expect(mockRefetchRecordings).toHaveBeenCalled();
  });

  it('should handle errors during save workflow gracefully', async () => {
    // Setup error scenario
    mockSaveToDatabase.mockRejectedValue(new Error('Save failed'));
    
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'error',
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
      errorMessage: 'Save failed',
      clearError: vi.fn(),
      processingStep: null,
    });

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Verify error state display
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should allow starting new recording after successful save', async () => {
    const mockStartNewRecording = vi.fn();
    
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
      startNewRecording: mockStartNewRecording,
      errorMessage: null,
      clearError: vi.fn(),
      processingStep: null,
    });

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Verify saved state
    expect(screen.getByText('Your Story Shines! ✨')).toBeInTheDocument();
    
    // Click main button to start new recording
    const recordButton = screen.getByRole('button', { name: /start recording/i });
    await act(async () => {
      await user.click(recordButton);
    });

    expect(mockStartNewRecording).toHaveBeenCalledTimes(1);
  });
});