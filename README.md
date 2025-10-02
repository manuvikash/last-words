# Last Words

A 2-player + spectators voice-first puzzle game built with AWS serverless services.

## Architecture

- **Frontend**: React + Vite + TypeScript + PixiJS
- **Backend**: AWS Lambda (Node 20, TypeScript)
- **Infrastructure**: AWS CDK (TypeScript)
- **Transport**: API Gateway WebSocket (realtime) + HTTP (control)
- **Persistence**: DynamoDB (single-table)
- **Voice**: Amazon Chime SDK

## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Build backend bundles**:
   ```bash
   pnpm --filter backend build
   ```

3. **Deploy infrastructure**:
   ```bash
   pnpm deploy:infra
   ```

4. **Update frontend config**:
   Copy stack outputs into `web/public/config.js`:
   ```javascript
   window.__CONFIG__ = {
     WS_URL: "wss://your-ws-url",
     HTTP_URL: "https://your-http-url"
   };
   ```

5. **Start development server**:
   ```bash
   pnpm dev:web
   ```

## Project Structure

```
last-words/
├── backend/          # Lambda handlers + game engine
├── web/              # React frontend
├── infra/            # AWS CDK infrastructure
└── package.json      # Monorepo root
```

## Game Flow

1. Create lobby via HTTP API
2. Start match (creates Chime meeting, returns WS URL)
3. Connect to WebSocket
4. Join Chime meeting for voice
5. Play cooperative puzzle modules

## Development Commands

- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all packages
- `pnpm dev:web` - Start web dev server
- `pnpm deploy:infra` - Deploy infrastructure
- `pnpm deploy:backend` - Build and deploy backend
- `pnpm deploy:web` - Deploy web to S3

## Data Model

Single DynamoDB table `LastWords` with:
- `USER#<id>`
- `LOBBY#<lobbyId>`
- `MATCH#<matchId>`
- `CONN#<connectionId>`
- `SNAP#<matchId>#<ts>`

Primary key: `pk` + `sk`
GSIs: `gsi1pk+gsi1sk` (active matches), `gsi2pk+gsi2sk` (connections by match)
