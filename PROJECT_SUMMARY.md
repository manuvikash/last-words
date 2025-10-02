# Last Words - Project Summary

## Overview

Last Words is a 2-player + spectators voice-first cooperative puzzle game built with AWS serverless services. Players solve puzzle modules together using voice communication via Amazon Chime SDK while the server maintains authoritative game state.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **PixiJS** for 2D graphics (ready to use)
- **Zustand** for state management
- **Zod** for validation
- **React Router** for routing
- **TanStack Query** for data fetching
- **Amazon Chime SDK** for voice chat
- **Howler.js** for audio effects

### Backend
- **AWS Lambda** (Node 20, TypeScript)
- **API Gateway WebSocket** for realtime communication
- **API Gateway HTTP** for control plane (lobbies, matches)
- **DynamoDB** single-table design
- **Amazon Chime SDK** for voice meetings
- **Zod** for frame validation
- **seedrandom** for deterministic randomness

### Infrastructure
- **AWS CDK** (TypeScript)
- **S3 + CloudFront** for static site hosting
- **IAM** for least-privilege access

## Project Structure

```
last-words/
├── backend/        # Lambda handlers + game engine
├── web/            # React frontend
├── infra/          # AWS CDK stacks
└── [config files]  # ESLint, Prettier, TypeScript, etc.
```

## Key Features Implemented

### ✅ Monorepo Setup
- pnpm workspaces with three packages
- Shared ESLint and Prettier configs
- TypeScript across all packages
- Unified build and deploy scripts

### ✅ Backend Game Engine
- Modular puzzle system with `ModuleSpec` interface
- **Glyph Order** puzzle fully implemented
- Server-authoritative state management
- Unit tests with Vitest

### ✅ WebSocket Realtime Protocol
- Client→Server frames: `join`, `action`, `ping`
- Server→Client frames: `state`, `event`, `error`, `pong`
- Connection lifecycle management
- Broadcast to all clients in a match

### ✅ HTTP Control Plane
- `POST /lobbies` - Create lobby
- `POST /lobbies/{id}/join` - Join lobby
- `POST /matches/start` - Start match with Chime meeting
- `POST /matches/{id}/chime/attendee` - Create attendee

### ✅ Frontend Components
- **Home**: Create lobby button
- **Lobby**: Player list and start match
- **Match**: Main gameplay with WebSocket connection
- **Spectate**: Watch-only mode
- **GlyphOrderView**: Interactive puzzle UI

### ✅ DynamoDB Schema
- Single-table design with pk/sk
- GSI1 for active matches
- GSI2 for connections by match
- TTL for automatic cleanup

### ✅ AWS CDK Infrastructure
- **DataStack**: DynamoDB table
- **ApiStack**: WebSocket + HTTP APIs + Lambdas
- **WebStack**: S3 + CloudFront
- Stack outputs for easy configuration

## Game Flow

```
1. Player creates lobby
   └─> POST /lobbies

2. Other players join lobby
   └─> POST /lobbies/{id}/join

3. Host starts match
   └─> POST /matches/start
   └─> Returns: matchId, wsUrl, Chime meeting + attendee

4. Players connect to WebSocket
   └─> wss://[api-id].execute-api.[region].amazonaws.com/prod

5. Players send join frame
   └─> { t: 'join', matchId, role: 'player' }

6. Server sends initial state
   └─> { t: 'state', matchId, v: 0, diff: {...} }

7. Players join Chime meeting for voice
   └─> Amazon Chime SDK in browser

8. Players solve puzzle modules
   └─> { t: 'action', matchId, moduleId: 'glyphOrder', a: { press: 'alpha' } }
   └─> Server validates, updates state, broadcasts to all
```

## Glyph Order Module

**Objective**: Press 6 glyphs in the correct order according to a manual.

**Gameplay**:
- Server generates a random column from manual + shuffles 6 glyphs
- Operator sees glyphs on screen
- Expert has manual (not implemented in UI yet, but params available)
- Players communicate via voice to determine correct order
- Server validates each press
- Strike if incorrect, solved when all 6 correct

**Implementation**:
- `backend/src/game/modules/glyphOrder.ts` - Game logic
- `web/src/modules/glyphOrder/GlyphOrderView.tsx` - UI
- Full test coverage in `backend/test/glyphOrder.test.ts`

## Data Model

### LOBBY Item
```json
{
  "pk": "LOBBY#01H...",
  "sk": "LOBBY#01H...",
  "lobbyId": "01H...",
  "createdAt": 1234567890,
  "players": ["user1", "user2"],
  "status": "waiting",
  "ttl": 1234654321
}
```

### MATCH Item
```json
{
  "pk": "MATCH#01H...",
  "sk": "MATCH#01H...",
  "matchId": "01H...",
  "seed": "01H...",
  "modules": ["glyphOrder"],
  "moduleStates": {
    "glyphOrder": { "pressed": [], "strikes": 0 }
  },
  "moduleParams": {
    "glyphOrder": { "manualId": "v1", "columnIndex": 2, "shown": [...] }
  },
  "version": 0,
  "status": "active",
  "players": ["user1", "user2"],
  "spectators": [],
  "strikes": 0,
  "maxStrikes": 3,
  "startedAt": 1234567890,
  "gsi1pk": "MATCHES#ACTIVE",
  "gsi1sk": "01H..."
}
```

### CONN Item
```json
{
  "pk": "CONN#abc123",
  "sk": "CONN#abc123",
  "connectionId": "abc123",
  "matchId": "01H...",
  "role": "player",
  "gsi2pk": "CONNS#01H...",
  "gsi2sk": "abc123",
  "connectedAt": 1234567890,
  "ttl": 1234654321
}
```

## API Endpoints

### WebSocket API
- `wss://[api-id].execute-api.[region].amazonaws.com/prod`
- Routes: `$connect`, `$disconnect`, `$default`

### HTTP API
- `https://[api-id].execute-api.[region].amazonaws.com/prod/`
- `POST /lobbies`
- `POST /lobbies/{id}/join`
- `POST /matches/start`
- `POST /matches/{id}/chime/attendee`

## Build Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Build backend only
pnpm --filter backend build

# Build web only
pnpm --filter web build

# Start web dev server
pnpm dev:web

# Run all tests
pnpm test

# Deploy infrastructure
pnpm deploy:infra

# Deploy backend (after code changes)
pnpm deploy:backend

# Lint all code
pnpm lint

# Format all code
pnpm format
```

## What's Ready to Deploy

✅ **Backend**: All Lambda handlers compile and bundle correctly
✅ **Frontend**: React app builds with no errors
✅ **Infrastructure**: CDK stacks synthesize and deploy
✅ **Game Logic**: Glyph Order module with full test coverage
✅ **WebSocket**: Realtime communication protocol implemented
✅ **Voice**: Chime SDK integration ready
✅ **DynamoDB**: Single-table design with GSIs

## What's Next (Post-Deployment)

1. **Add more puzzle modules** (wire cutting, simon says, etc.)
2. **Expert manual view** (read-only PDF or interactive page)
3. **Match timer and scoring**
4. **Replay system** using SNAP items
5. **Leaderboards** with GSI queries
6. **User authentication** (Cognito)
7. **Custom domains** (Route53 + ACM)
8. **Production monitoring** (CloudWatch dashboards)

## Security Considerations

- ✅ S3 bucket with CloudFront OAC (no public access)
- ✅ API Gateway CORS configured
- ✅ Lambda least-privilege IAM roles
- ✅ DynamoDB encryption at rest (default)
- ✅ WebSocket authentication via connection metadata
- ⚠️ Add Cognito for production user auth
- ⚠️ Add WAF for API Gateway in production

## Cost Estimate (AWS)

**Development/Testing** (low usage):
- DynamoDB: ~$0-5/month (on-demand)
- Lambda: ~$0-5/month (free tier)
- API Gateway: ~$0-10/month
- S3 + CloudFront: ~$1-5/month
- Chime: ~$0.0017/min per attendee (voice only)

**Total**: ~$5-30/month for light usage

## File Counts

- Backend: 15 TypeScript files
- Frontend: 13 TypeScript/TSX files  
- Infrastructure: 4 TypeScript files
- Config: 6 files
- **Total**: 38 files

## Lines of Code (Approximate)

- Backend: ~1,200 lines
- Frontend: ~800 lines
- Infrastructure: ~400 lines
- **Total**: ~2,400 lines (excluding node_modules)

## Testing

- ✅ Backend unit tests (Vitest)
- ✅ glyphOrder module test suite
- ⚠️ Frontend tests (skeleton in place, needs implementation)
- ⚠️ E2E tests (not implemented)

## Documentation

- ✅ README.md - Project overview and quickstart
- ✅ FILE_TREE.md - Complete file structure
- ✅ DEPLOYMENT.md - Step-by-step deployment guide
- ✅ Inline code comments
- ✅ TypeScript types for all interfaces

---

**Status**: ✅ Ready to deploy and play!

**Last Updated**: October 1, 2025
