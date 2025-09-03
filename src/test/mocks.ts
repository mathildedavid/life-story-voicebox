import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
  functions: {
    invoke: vi.fn(),
  },
};

// Mock recordings data
export const mockRecordings = [
  {
    id: '1',
    title: 'Test Recording',
    duration: 120,
    file_path: 'user123/recording1.webm',
    transcript: 'This is a test transcript',
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user123',
  },
];

// Mock life story summary
export const mockLifeStorySummary = {
  summary_text: 'This is a test life story summary that captures the essence of the recordings.',
  themes: {
    selfReflection: 'Active',
    storytelling: 'Developing',
    memoryPreservation: 'Active',
    personalGrowth: 'Beginning',
  },
  statistics: {
    totalRecordings: 1,
    totalDuration: 120,
    recordingSpan: 0,
    avgDuration: 120,
    firstRecording: '2024-01-01T00:00:00Z',
    latestRecording: '2024-01-01T00:00:00Z',
  },
};

// Mock encouragement message
export const mockEncouragementMessage = 'Your story is beautiful and meaningful! Keep sharing your memories.';

// Mock audio recording
export const mockRecording = {
  url: 'blob:mock-url',
  duration: 120,
  blob: new Blob(['mock audio data'], { type: 'audio/webm' }),
};

// Mock function responses
export const mockSupabaseFunctionResponses = {
  'transcribe-audio': {
    data: { transcript: 'This is a test transcript', recordingId: '1' },
    error: null,
  },
  'generate-life-summary': {
    data: mockLifeStorySummary,
    error: null,
  },
  'generate-encouragement': {
    data: { message: mockEncouragementMessage },
    error: null,
  },
};

// Helper to setup mock implementations
export const setupSupabaseMocks = () => {
  // Mock successful authentication
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user123' } },
    error: null,
  });
  
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'user123' } } },
    error: null,
  });

  // Mock recordings query with proper typing
  mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
    if (table === 'recordings') {
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: mockRecordings[0], error: null }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRecordings, error: null }),
        single: vi.fn().mockResolvedValue({ data: mockRecordings[0], error: null }),
      };
    }
    if (table === 'life_story_summaries') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLifeStorySummary, error: null }),
      };
    }
    return mockSupabaseClient.from();
  });

  // Mock storage operations
  mockSupabaseClient.storage.from.mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: { path: 'user123/recording1.webm' }, error: null }),
    download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
  });

  // Mock function invocations
  mockSupabaseClient.functions.invoke.mockImplementation((functionName: string) => {
    const response = mockSupabaseFunctionResponses[functionName as keyof typeof mockSupabaseFunctionResponses];
    return Promise.resolve(response);
  });
};

// Reset all mocks
export const resetMocks = () => {
  vi.clearAllMocks();
  setupSupabaseMocks();
};