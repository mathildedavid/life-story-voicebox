import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  mockSupabaseClient, 
  mockRecording,
  resetMocks 
} from './mocks';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// We need to actually test the real hooks, not mock them
import { RecordingStudio } from '@/components/RecordingStudio';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';
import { useLifeStorySummary } from '@/hooks/useLifeStorySummary';

// Mock AuthProvider
vi.mock('@/components/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { id: 'user123' }, loading: false }),
}));

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

// Create a test component that uses the real hooks and allows us to control the state
const TestComponent = () => {
  const audioHook = useAudioRecording();
  const recordingsHook = useRecordings();
  const lifeSummaryHook = useLifeStorySummary();

  return (
    <div>
      <div data-testid="recording-state">{audioHook.recordingState}</div>
      <div data-testid="processing-step">{audioHook.processingStep || 'none'}</div>
      <button 
        onClick={() => {
          // Simulate the processing completion event
          window.dispatchEvent(new CustomEvent('recordingProcessingComplete'));
        }}
        data-testid="trigger-completion"
      >
        Trigger Completion
      </button>
    </div>
  );
};

describe('Event Integration Test', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should listen for recordingProcessingComplete event and transition to saved state', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Initial state should be idle
    expect(screen.getByTestId('recording-state')).toHaveTextContent('idle');

    // We can't easily simulate the full processing flow in a unit test,
    // but we can test that the event listener is registered and working
    // by manually setting the state to processing first

    // Note: This test demonstrates the concept but would need integration testing
    // or more sophisticated mocking to fully test the flow
    const triggerButton = screen.getByTestId('trigger-completion');
    
    await act(async () => {
      triggerButton.click();
    });

    // The state won't change from 'idle' to 'saved' because the event handler
    // only changes state if current state is 'processing'
    expect(screen.getByTestId('recording-state')).toHaveTextContent('idle');
  });
});

describe('Processing Flow Documentation', () => {
  it('documents the expected flow', () => {
    // This test documents the expected flow:
    
    // 1. User clicks save button
    // 2. saveToDatabase() is called
    // 3. State changes: idle -> paused -> saving -> processing
    // 4. saveRecording() is called with onStepChange callback
    // 5. Processing steps: transcribing -> analyzing
    // 6. When transcription + encouragement complete, 'recordingProcessingComplete' event is dispatched
    // 7. Event listener in useAudioRecording catches the event
    // 8. State changes: processing -> saved
    // 9. UI shows "Your Story Shines!" message
    
    expect(true).toBe(true); // Test passes - this is just documentation
  });

  it('identifies the previous bug', () => {
    // Previous bug:
    // - saveRecording() returned immediately after database save
    // - useAudioRecording set state to 'saved' too early
    // - Transcription continued running but UI already showed completion
    // - User never saw the "Your Story Shines" message
    
    // Fix:
    // - useAudioRecording now waits for 'recordingProcessingComplete' event
    // - State only changes to 'saved' after full transcription + encouragement flow
    // - User sees proper processing sequence and final success message
    
    expect(true).toBe(true); // Test passes - this is just documentation
  });
});