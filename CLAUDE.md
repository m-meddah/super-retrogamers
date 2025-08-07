# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Super Retrogamers is a modern Next.js 15 application showcasing retro gaming consoles and their classic games. The site features comprehensive user collection management, authentication, dynamic data from Screenscraper API, and AI-enhanced content. Built in French, it focuses on documenting the history of legendary gaming machines from the 1980s-2000s era with advanced collection tracking capabilities.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint and check for code issues
- `npx prisma migrate dev` - Create and apply database migrations
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Push schema changes to database (dev only)

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better-auth with session management
- **External API**: Screenscraper.fr for game data
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui components (New York style)
- **Icons**: Lucide React
- **Font**: Inter from Google Fonts
- **Package Manager**: pnpm (lock file present)

### Directory Structure
```
app/
├── api/
│   ├── auth/[...all]/    # Better-auth API routes
│   └── scraping/         # Data scraping endpoints
│       ├── consoles/     # Sync all consoles from Screenscraper
│       └── consoles-limited/ # Sync limited number of consoles
├── collection/           # User collection management
├── consoles/
│   ├── page.tsx          # Console listing page
│   └── [slug]/
│       ├── page.tsx      # Individual console details
│       └── jeux/
│           └── page.tsx  # Games for specific console
├── jeux/
│   └── [slug]/
│       └── page.tsx      # Individual game details
├── login/                # Authentication pages
├── register/
├── layout.tsx            # Root layout with Header
├── page.tsx              # Homepage with hero, featured consoles
└── globals.css           # Tailwind styles and CSS variables

components/
├── header.tsx          # Site navigation
├── console-card.tsx    # Console display component
├── game-card.tsx       # Game display component
└── ui/                 # shadcn/ui components

lib/
├── actions/
│   ├── collection-actions.ts # Server Actions for collection management
│   └── scraping-actions.ts   # Server Actions for data scraping
├── hooks/
│   ├── use-collection.ts     # Collection state management hook
│   └── use-scraping.ts       # Scraping progress hook
├── stores/
│   ├── app-store.ts          # Global app state (notifications, etc.)
│   ├── collection-store.ts   # User collection state
│   └── scraping-store.ts     # Scraping progress state
├── prisma.ts                 # Prisma client singleton
├── auth.ts                   # Better-auth server configuration
├── auth-client.ts            # Better-auth client utilities
├── auth-server.ts            # Server-side session helpers
├── screenscraper.ts          # Screenscraper API client
├── screenscraper-service.ts  # Data synchronization service
├── data-prisma.ts            # Database query functions
└── utils.ts                  # Utility functions (cn helper)

prisma/
├── schema.prisma       # Database schema with auth & game models
└── migrations/         # Database migration files
```

### Database Schema
PostgreSQL database managed through Prisma with comprehensive collection management:

**Core Models:**
- **User**: Authentication with Better-auth (id, email, name, role, etc.)
- **Account/Session**: OAuth and session management
- **Console**: Gaming systems with AI-enhanced descriptions and technical specs
- **Game**: Individual games with AI-enhanced content and screenshots
- **ConsoleVariant/GameVariant**: Different releases, regions, special editions

**Collection Management:**
- **UserConsoleCollection**: User's console collection with condition, value tracking
- **UserGameCollection**: User's game collection with completion status, playtime
- **UserCollectionStats**: Aggregated statistics (total value, rare items, etc.)
- **UserWishlist**: Wanted items with priority and price limits
- **GameReview**: Detailed game reviews with category ratings

**Enums:**
- **Region**: EUROPE, NORTH_AMERICA, JAPAN, PAL, NTSC variants
- **ItemCondition**: SEALED, MINT, CIB, LOOSE, etc.
- **CollectionStatus**: OWNED, WANTED, SOLD, LOANED, FOR_SALE

### UI Design System
- **Color Scheme**: Gray-based with dark mode support
- **Components**: Uses shadcn/ui with "new-york" style variant
- **Layout**: Responsive grid layouts, container-based spacing
- **Typography**: Inter font, large headings with proper hierarchy
- **Images**: Next.js Image component with placeholder SVGs

### Routing Pattern
- `/` - Homepage with hero section and featured consoles
- `/consoles` - All consoles listing with filtering
- `/consoles/[slug]` - Individual console page with technical specs
- `/consoles/[slug]/jeux` - Games for specific console
- `/jeux/[slug]` - Individual game page with screenshots and reviews
- `/login` & `/register` - Authentication pages
- `/collection` - User collection management
- `/api/auth/[...all]` - Better-auth API routes
- `/api/scraping/*` - Screenscraper synchronization endpoints

### Key Features
- **Advanced Collection Management**: Track owned items, condition, value, completion status
- **AI-Enhanced Content**: Rich descriptions and analysis for consoles and games
- **User Authentication**: Better-auth with email/password and OAuth providers
- **Dynamic Content**: Real-time data from Screenscraper API with rate limiting
- **Comprehensive Reviews**: Multi-category game ratings (graphics, sound, gameplay, story)
- **Wishlist System**: Priority-based wanted items with price tracking
- **Statistics Dashboard**: Collection value, completion rates, rare items tracking
- **Responsive Design**: Mobile-first approach with dark/light theme support
- **Type Safety**: Full TypeScript coverage with Prisma schema

### Authentication System
- **Better-auth**: Modern authentication library with Prisma adapter
- **Email/Password**: Primary authentication method with optional email verification
- **Session Management**: 7-day expiry, 1-day update age, secure cookies
- **User Roles**: Role-based access control with default "user" role
- **Configuration**: Custom cookie prefix "super-retrogamers"

### Screenscraper Integration
- **API Client**: Rate-limited client with 1.2s throttling (`lib/screenscraper.ts`)
- **System IDs**: Predefined mappings for NES, SNES, PlayStation, Game Boy, etc.
- **Authentication**: Dev credentials required, optional user credentials for higher limits
- **Game Data**: Fetches metadata, genres, media, ROM information
- **Error Handling**: Comprehensive error handling with fallbacks
- **Media Types**: Support for screenshots, box art, logos, and other assets

### Environment Variables
Required environment variables in `.env`:
```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Better-auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Screenscraper API
SCREENSCRAPER_DEV_ID="your-dev-id"
SCREENSCRAPER_DEV_PASSWORD="your-dev-password"
SCREENSCRAPER_USERNAME="your-username" # Optional
SCREENSCRAPER_PASSWORD="your-password" # Optional
```

## Development Workflow

### Database Setup
1. Configure PostgreSQL connection in `.env`
2. Run `npx prisma migrate dev` to apply migrations
3. Generate Prisma client with `npx prisma generate`
4. Use `npx prisma studio` for database management

### Data Synchronization
- `POST /api/scraping/consoles` - Sync all console information from Screenscraper
- `POST /api/scraping/consoles-limited` - Sync limited number of consoles (default: 10)
- Rate-limited to respect Screenscraper API limits (1.2s throttling)
- Automatic media download and processing
- Progress tracking through Zustand stores

### Content Management
1. **Console Data**: Add mappings in `lib/screenscraper-service.ts` CONSOLE_MAPPINGS
2. **Game Content**: Use scraping endpoints or direct Prisma operations
3. **User Collections**: Full CRUD through collection management system
4. **AI Enhancement**: Planned integration for rich content descriptions

### Code Architecture

**Data Layer:**
- `lib/data-prisma.ts` - All database queries and operations using Prisma
- Uses typed functions like `getAllConsoles()`, `getGameBySlug()`, `getGamesByConsole()`
- Consistent return types: `Console[]`, `Game[]`, `GameWithConsole`, `ConsoleWithGames`

**Authentication Flow:**
- `lib/auth.ts` - Better-auth server configuration with Prisma adapter
- `lib/auth-client.ts` - Client-side utilities (`useSession`, `signIn`, `signOut`)
- `components/auth-provider.tsx` - React context using `useSession` from better-auth
- **IMPORTANT**: Use `useSession` from better-auth client, not custom auth hooks

**State Management:**
- **Zustand Stores**: Global state for notifications, collection, scraping progress
- **Better-auth Session**: Authentication state management
- **Server Actions**: Form handling and server-side operations in `lib/actions/`

**Component Architecture:**
- Components use Prisma types (`Game`, `Console` from `@prisma/client`)
- GameCard supports `GameWithConsole` type for console relationship
- ConsoleCard uses base `Console` type from Prisma

## Critical Development Patterns

### Authentication
- **Always use** `useSession` from `@/lib/auth-client` for client-side auth
- **Never create** custom auth hooks - authentication is handled by better-auth
- For server-side auth, use helpers from `@/lib/auth-server.ts`

### Data Fetching
- **All database operations** go through `lib/data-prisma.ts` functions
- **Never import** Prisma client directly in components or pages
- Use proper TypeScript types from the data layer (`GameWithConsole`, etc.)

### Component Patterns
- Components expect Prisma types, not legacy data structures
- Use `game.console?.name` and `game.console?.slug` for relationships
- Always handle nullable relationships with optional chaining

### API Endpoints
- Scraping endpoints are in `/api/scraping/` directory
- Rate limiting is built into Screenscraper client (1.2s throttling)
- Use Server Actions in `lib/actions/` for form handling