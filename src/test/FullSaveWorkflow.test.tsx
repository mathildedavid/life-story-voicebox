import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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

import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useRecordings } from '@/hooks/useRecordings';

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

describe('Full Save Workflow with Real Hooks', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    resetMocks();
    setupSupabaseMocks();
    
    // Mock console.log to capture our debug messages
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock the saveRecording function to simulate async processing
    const mockSaveRecording = vi.fn().mockImplementation(
      async (blob: Blob, duration: number, title: string | undefined, callbacks?: any) => {
        console.log('saveRecording called - starting async processing');
        
        // Simulate transcription step
        if (callbacks?.onStepChange) {
          setTimeout(() => {
            console.log('Simulating transcription step');
            callbacks.onStepChange('transcribing');
          }, 100);
          
          // Simulate encouragement generation step
          setTimeout(() => {
            console.log('Simulating encouragement step');
            callbacks.onStepChange('analyzing');
          }, 200);
          
          // Simulate completion after processing
          setTimeout(() => {
            console.log('🎉 DISPATCHING recordingProcessingComplete EVENT - This should trigger Your Story Shines!');
            window.dispatchEvent(new CustomEvent('recordingProcessingComplete'));
          }, 300);
        }
        
        return { id: '123', title: 'Test Recording' };
      }
    );

    // Mock the useRecordings hook to return our mock function
    vi.doMock('@/hooks/useRecordings', () => ({
      useRecordings: () => ({
        recordings: [],
        loading: false,
        error: null,
        saveRecording: mockSaveRecording,
        refetch: vi.fn(),
        encouragementModal: { isOpen: false, message: null },
        closeEncouragementModal: vi.fn(),
      })
    }));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should complete the full save workflow and show Your Story Shines message', async () => {
    const { result } = renderHook(() => {
      const recordingsHook = useRecordings();
      return useAudioRecording(recordingsHook);
    }, {
      wrapper: TestWrapper,
    });

    // Initial state should be idle
    expect(result.current.recordingState).toBe('idle');

    // Simulate having a paused recording ready to save
    await act(async () => {
      // Simulate the recording flow - start recording
      await result.current.startRecording();
    });

    // Should be recording
    expect(result.current.recordingState).toBe('recording');

    await act(async () => {
      // Pause the recording
      result.current.pauseRecording();
    });

    // Should be paused
    expect(result.current.recordingState).toBe('paused');

    // Now simulate saving the recording
    await act(async () => {
      await result.current.saveToDatabase();
    });

    // Should immediately go to saving state
    expect(result.current.recordingState).toBe('saving');

    // Wait for processing state
    await waitFor(() => {
      expect(result.current.recordingState).toBe('processing');
    }, { timeout: 2000 });

    // Should show processing
    expect(result.current.recordingState).toBe('processing');

    // Wait for the recordingProcessingComplete event to be dispatched
    // This should happen after ~300ms based on our mock
    await waitFor(() => {
      expect(result.current.recordingState).toBe('saved');
    }, { timeout: 5000 });

    // Final state should be saved - this means "Your Story Shines" should appear
    expect(result.current.recordingState).toBe('saved');

    // Check that our debug logs were called
    expect(consoleSpy).toHaveBeenCalledWith('🔄 Processing started, setting up 30-second timeout fallback');
    expect(consoleSpy).toHaveBeenCalledWith('🎉 DISPATCHING recordingProcessingComplete EVENT - This should trigger Your Story Shines!');
    expect(consoleSpy).toHaveBeenCalledWith('🎉 Processing complete event received');
    expect(consoleSpy).toHaveBeenCalledWith('✅ Setting state to saved - Your Story Shines should appear!');
  });

  it('should timeout and force completion after 30 seconds if event never fires', async () => {
    // Mock saveRecording to never dispatch the completion event
    const mockSaveRecordingNoComplete = vi.fn().mockImplementation(
      async (blob: Blob, duration: number, title: string | undefined, callbacks?: any) => {
        console.log('saveRecording called but will never complete');
        return { id: '123', title: 'Test Recording' };
      }
    );

    vi.doMock('@/hooks/useRecordings', () => ({
      useRecordings: () => ({
        recordings: [],
        loading: false,
        error: null,
        saveRecording: mockSaveRecordingNoComplete,
        refetch: vi.fn(),
        encouragementModal: { isOpen: false, message: null },
        closeEncouragementModal: vi.fn(),
      })
    }));

    const { result } = renderHook(() => {
      const recordingsHook = useRecordings();
      return useAudioRecording(recordingsHook);
    }, {
      wrapper: TestWrapper,
    });

    // Simulate the recording and save process
    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.pauseRecording();
    });

    await act(async () => {
      await result.current.saveToDatabase();
    });

    // Should be in processing state
    expect(result.current.recordingState).toBe('processing');

    // Fast-forward time to trigger timeout (we can't actually wait 30 seconds)
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    // Should be forced to saved state by timeout
    await waitFor(() => {
      expect(result.current.recordingState).toBe('saved');
    });

    expect(consoleSpy).toHaveBeenCalledWith('⏰ Processing timeout reached, forcing completion');
    expect(consoleSpy).toHaveBeenCalledWith('🔧 Timeout: Setting state to saved');
  });
});

describe('Debug Information', () => {
  it('documents the expected console output during save', () => {
    // When you save a recording, you should see this sequence in the console:
    
    const expectedConsoleSequence = [
      '🔄 Processing started, setting up 30-second timeout fallback',
      'Processing step changed to: transcribing',
      'Processing step changed to: analyzing', 
      '🎉 DISPATCHING recordingProcessingComplete EVENT - This should trigger Your Story Shines!',
      '🎉 Processing complete event received',
      'Current recording state in event handler: processing',
      '✅ Setting state to saved - Your Story Shines should appear!'
    ];

    // If you don't see the last few messages, the issue is either:
    // 1. The recordingProcessingComplete event is not being dispatched (Supabase function failing)
    // 2. The event listener is not registered properly (rare)
    // 3. Some other error is interrupting the flow
    
    // The timeout fallback should kick in after 30 seconds if the event never comes:
    const timeoutSequence = [
      '⏰ Processing timeout reached, forcing completion',
      '🔧 Timeout: Setting state to saved'
    ];

    expect(expectedConsoleSequence).toBeDefined();
    expect(timeoutSequence).toBeDefined();
  });
});