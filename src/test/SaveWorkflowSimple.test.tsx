import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  mockRecording, 
  mockLifeStorySummary, 
  mockEncouragementMessage,
  resetMocks 
} from './mocks';

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

// Mock the AuthProvider to always return authenticated user
vi.mock('@/components/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { id: 'user123' }, loading: false }),
}));

// Import components after mocking
import { RecordingStudio } from '@/components/RecordingStudio';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';
import { useLifeStorySummary } from '@/hooks/useLifeStorySummary';

const mockUseAudioRecording = vi.mocked(useAudioRecording);
const mockUseRecordings = vi.mocked(useRecordings);
const mockUseLifeStorySummary = vi.mocked(useLifeStorySummary);

// Simple test wrapper
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

describe('Save Workflow Simple', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockSaveToDatabase: ReturnType<typeof vi.fn>;
  let mockRefetchRecordings: ReturnType<typeof vi.fn>;
  let mockGenerateSummary: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user = userEvent.setup();
    resetMocks();
    
    mockSaveToDatabase = vi.fn();
    mockRefetchRecordings = vi.fn();
    mockGenerateSummary = vi.fn();

    // Setup initial mocks
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

    mockUseLifeStorySummary.mockReturnValue({
      summary: null,
      loading: false,
      generating: false,
      generateSummary: mockGenerateSummary,
      refetch: vi.fn() as any,
    });
  });

  it('should show correct recording states in sequence', async () => {
    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Step 1: Verify initial paused state
    expect(screen.getByText('Recording paused')).toBeInTheDocument();
    
    // The save button appears as a control button with save icon
    const saveButton = screen.getByRole('button', { name: '' });
    expect(saveButton).toHaveClass('control-button');
    expect(saveButton.querySelector('.lucide-save')).toBeInTheDocument();

    // Step 2: Update to saving state
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
      processingStep: null,
    });

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Should show saving message
    expect(screen.getByText('Saving your recording...')).toBeInTheDocument();

    // Step 3: Update to processing state (transcribing)
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

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    expect(screen.getByText('Transcribing your story...')).toBeInTheDocument();

    // Step 4: Update to processing state (generating insights)
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

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    expect(screen.getByText('Generating personalized insights...')).toBeInTheDocument();

    // Step 5: Update to saved state
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

    // Update recordings list to show new recording
    mockUseRecordings.mockReturnValue({
      recordings: [{
        id: '1',
        title: 'Test Recording',
        duration: 120,
        file_path: 'user123/recording1.webm',
        transcript: 'This is a test transcript',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        file_size: 1024,
        encouragement_message: mockEncouragementMessage,
      }],
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

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    // Should show success message
    expect(screen.getByText('Your Story Shines! ✨')).toBeInTheDocument();
    expect(screen.getByText('Ready for your next story!')).toBeInTheDocument();

    // Should show updated life story summary
    expect(screen.getByText('Your Life Story')).toBeInTheDocument();
    expect(screen.getByText(mockLifeStorySummary.summary_text)).toBeInTheDocument();

    // Should show recordings section (may have multiple instances due to re-renders)
    expect(screen.getAllByText('Your Recordings').length).toBeGreaterThan(0);
  });

  it('should not show save button when there is no valid recording data', async () => {
    // Test case: paused state but no recording data (the bug scenario)
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'paused',
      elapsedTime: 0, // No elapsed time
      recording: null, // No recording object
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

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    expect(screen.getByText('Recording paused')).toBeInTheDocument();
    
    // Save button should NOT appear because there's no recording data
    const buttons = screen.getAllByRole('button');
    const saveButton = buttons.find(button => 
      button.querySelector('.lucide-save')
    );
    expect(saveButton).toBeUndefined();
  });

  it('should show save button when there is valid recording data', async () => {
    // Test case: paused state with valid recording data
    mockUseAudioRecording.mockReturnValue({
      recordingState: 'paused',
      elapsedTime: 120, // Has elapsed time
      recording: mockRecording, // Has recording object
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

    render(
      <TestWrapper>
        <RecordingStudio />
      </TestWrapper>
    );

    expect(screen.getByText('Recording paused')).toBeInTheDocument();
    
    // Save button SHOULD appear because there's valid recording data
    const buttons = screen.getAllByRole('button');
    const saveButton = buttons.find(button => 
      button.querySelector('.lucide-save')
    );
    expect(saveButton).toBeDefined();
    expect(saveButton?.querySelector('.lucide-save')).toBeInTheDocument();
  });

  it('should show error state correctly', async () => {
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

    // Should show saved state
    expect(screen.getByText('Your Story Shines! ✨')).toBeInTheDocument();
    
    // Click main button to start new recording
    const recordButton = screen.getByLabelText(/start recording/i);
    await user.click(recordButton);

    expect(mockStartNewRecording).toHaveBeenCalledTimes(1);
  });
});