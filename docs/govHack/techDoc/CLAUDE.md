# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Client (React/Vite)
- `npm run dev` - Start development server
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm test` - Run tests with Vitest
- `npm run codegen` - Generate GraphQL types from schema

### Functions (Firebase/GraphQL Backend)
- `npm run dev` - Start local development server with ts-node
- `npm run start:inspect` - Start with nodemon for hot reloading
- `npm run build` - Compile TypeScript to JavaScript
- `npm run prebuild` - Generate GraphQL types (runs automatically before build)

### Firebase Deployment
- `firebase deploy --only functions` - Deploy backend functions only
- `firebase use dllm-library` - Switch to production project
- Firebase emulators run automatically during local development

## Architecture Overview

### Project Structure
This is a full-stack application with a decentralized, open-source architecture designed for physical copies preservation communities worldwide.

**Core Components:**
- **Client**: React 19 + Vite frontend with Material-UI components
- **Functions**: Firebase Functions with Apollo GraphQL server
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Google Cloud Storage for images
- **Authentication**: Firebase Auth

### Key Architectural Patterns

**GraphQL-First Development:**
- Schema-first approach with `schema.graphql` as the single source of truth
- Automated type generation for both client and server
- Client uses Apollo Client for state management and caching
- Server uses Apollo Server with Firebase Functions

**Firebase Integration:**
- Functions handle GraphQL API, SSR for bots, and image processing
- Firestore for data persistence with geospatial queries using geofire-common
- Firebase Auth for user authentication with custom claims
- Google Cloud Storage for image uploads with signed URLs

**Internationalization:**
- Built-in support for Traditional Chinese (ZH_HK) and English
- Uses react-i18next with locale files in `client/src/locales/`
- GraphQL schema includes Language enum for content localization

**Bot Detection & SSR:**
- Hybrid rendering: CSR for users, SSR for social media bots
- Bot detection in `functions/src/botDetection.ts`
- SEO-friendly URLs with dynamic meta tags for items

### Service Layer Architecture

**Item Management:**
- Categories are dynamic and user-generated
- Geographic search using latitude/longitude with radius
- Image processing pipeline with thumbnail generation
- Support for multiple item conditions and statuses

**Transaction System:**
- Virtual ownership transfer without physical logistics
- Multi-state transaction workflow (PENDING → APPROVED → TRANSFERRED → COMPLETED)
- User-to-user communication handled externally

**Location Services:**
- Google Maps integration for geocoding
- Geospatial queries for location-based item discovery
- Privacy-focused address handling (postcode level only)

## Development Workflow

### GraphQL Schema Changes
1. Modify `graphql/schema.graphql`
2. Run codegen in both client and functions directories
3. Update resolvers in `functions/src/resolver.ts`
4. Update service layer functions accordingly

### Testing Strategy
- Client uses Vitest for unit testing
- Firebase Functions can be tested with the emulator suite
- No specific test commands defined for functions - add them as needed

### Image Handling
- NSFW detection using nsfwjs on client-side
- Server-side image compression with Sharp
- Automatic thumbnail generation for performance
- Google Cloud Storage integration with signed URL uploads

## Important Configuration Files

- `firebase.json` - Defines hosting rewrites for hybrid SSR/CSR routing
- `client/vite.config.ts` - Vite configuration for React development
- `functions/codegen.ts` & `client/codegen.yml` - GraphQL type generation
- `client/src/dllm-client-config.json` - Client-side configuration
- `functions/src/dllm-libray-firebase-adminsdk.json` - Firebase admin credentials (not in repo)

## Security Considerations

- Firebase Admin SDK credentials must be placed manually in functions directory
- User authentication required for most mutations
- Role-based access control (USER, ADMIN, MODERATOR)
- Email verification system for user accounts
- HTTPS-only API endpoints

## Key Libraries & Dependencies

**Client:**
- @apollo/client - GraphQL client and state management
- @mui/material - Material-UI component library
- react-leaflet - Map integration
- nsfwjs - Client-side content filtering
- react-i18next - Internationalization

**Functions:**
- @apollo/server - GraphQL server implementation
- firebase-admin - Firebase backend SDK
- sharp - Image processing and compression
- geofire-common - Geospatial query utilities
- @googlemaps/google-maps-services-js - Geocoding services