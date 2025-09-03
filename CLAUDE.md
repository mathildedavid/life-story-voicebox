# Life Story Voicebox - Claude.md

## Overview
Life Story Voicebox is an AI-powered web application for recording, transcribing, and preserving personal life stories. Users can record audio memories, receive AI-generated transcriptions and encouragement messages, and build evolving autobiographical summaries.

## Quickstart
```bash
# Install dependencies
npm install

# Start development server
npm run dev        # Runs on http://localhost:8080

# Run tests
npm run test

# Build for production
npm run build
```

## Product Features
- **Audio Recording Studio**: Advanced web recording with pause/resume functionality and real-time timer
- **AI Transcription**: OpenAI Whisper API integration for speech-to-text conversion
- **Personalized Encouragement**: AI-generated motivational messages after each recording
- **Life Story Summaries**: Evolving AI-powered autobiographies that update with new recordings
- **Story Prompts**: 76 curated questions to inspire storytelling across different life themes
- **Recording Management**: Complete CRUD operations for saved recordings
- **Audio Export**: Download recordings as WebM files
- **User Authentication**: Secure user accounts with Supabase Auth

## Architecture
- **Frontend**: React 18 + TypeScript, Vite build system, Tailwind CSS
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI Services**: OpenAI Whisper (transcription) + GPT-4o-mini (content generation)
- **State Management**: React Query for server state + custom hooks for recording logic
- **Testing**: Vitest + React Testing Library + jsdom environment

## Routes
```
/ (Index)           - Main recording studio interface
/404 (NotFound)     - 404 error page
```

## Folder Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui component library (30+ components)
│   ├── AuthProvider.tsx       # Authentication context wrapper
│   ├── ErrorBoundary.tsx      # Error handling boundary
│   ├── RecordingStudio.tsx    # Main recording interface (primary component)
│   ├── RecordingsList.tsx     # Recording management and playback
│   └── LifeStorySummary.tsx   # AI-generated summary display
├── hooks/
│   ├── useAudioRecording.ts   # Core recording state management (456 lines)
│   ├── useRecordings.ts       # Database operations and API calls
│   ├── useLifeStorySummary.ts # Summary generation and management
│   └── use-mobile.tsx         # Responsive utilities
├── pages/
│   ├── Index.tsx             # Main application page
│   └── NotFound.tsx          # 404 page
├── integrations/supabase/
│   ├── client.ts             # Supabase configuration
│   └── types.ts              # Generated TypeScript types
├── lib/
│   └── utils.ts              # Utility functions (cn helper, etc.)
└── test/                     # Comprehensive test suite
    ├── setup.ts              # Test environment setup with Web API mocks
    ├── mocks.ts              # Supabase and test data mocks
    └── *.test.tsx            # Integration and unit tests

supabase/
├── functions/                # Deno Edge Functions
│   ├── transcribe-audio/     # OpenAI Whisper integration
│   ├── generate-life-summary/ # Autobiography generation
│   └── generate-encouragement/ # Personalized encouragement messages
├── migrations/               # Database schema versioning
└── config.toml              # Supabase configuration
```

## Build Commands
```bash
# Development
npm run dev         # Start dev server with hot reload
npm run build:dev   # Development build

# Production
npm run build       # Optimized production build
npm run preview     # Preview production build locally

# Quality Assurance
npm run lint        # Run ESLint code analysis
npm run test        # Run test suite with Vitest
npm run test:ui     # Interactive test runner UI
npm run test:coverage # Generate test coverage reports

# Dependencies
npm install         # Install all dependencies
```

## Code Style
- **TypeScript**: Strict typing with generated Supabase types
- **ESLint**: Modern flat config with React hooks and TypeScript rules
- **Prettier**: Not configured (relies on ESLint formatting)
- **Import patterns**: Relative imports with `@/` alias for src
- **Component structure**: Functional components with custom hooks
- **Naming conventions**: 
  - Components: PascalCase
  - Hooks: camelCase with `use` prefix
  - Types/Interfaces: PascalCase
  - Constants: SCREAMING_SNAKE_CASE

### Key Patterns
- **Custom hooks** for complex state management (recording, API calls)
- **Event-driven architecture** with custom DOM events for coordination
- **Comprehensive error handling** with user-friendly messages
- **Extensive logging** with emoji markers for debugging

## Testing
### Framework
- **Vitest 3.2.4**: Fast test runner with jsdom environment
- **React Testing Library 16.3.0**: Component testing utilities
- **Jest DOM matchers**: Extended assertions for DOM testing

### Test Structure
```bash
src/test/
├── setup.ts              # Global test configuration and Web API mocks
├── mocks.ts              # Supabase client mocks and test data
├── SaveWorkflow*.test.tsx # Recording save workflow validation
├── EventFlow.test.tsx    # Event-driven state management tests
└── ProcessingSteps.test.tsx # UI state and processing step tests
```

### Testing Philosophy
- **Integration testing focus**: Test complete user workflows
- **Web API mocking**: Mock MediaRecorder, Audio, URL, and Supabase APIs
- **Event testing**: Verify custom event coordination between components
- **State management validation**: Ensure proper state transitions
- **Error scenario coverage**: Test fallback behaviors and error states

### Running Tests
```bash
npm run test           # Watch mode for active development
npm run test:run       # Single run for CI/CD
npm run test:ui        # Interactive visual test runner
npm run test:coverage  # Generate coverage reports
```

### Key Test Areas
- Recording workflow validation (start → record → pause → save)
- API integration with proper error handling
- Event-driven state coordination between hooks
- UI state transitions and visual feedback
- Fallback behavior when services fail

The application demonstrates production-ready testing practices with comprehensive coverage of critical user workflows and edge cases.