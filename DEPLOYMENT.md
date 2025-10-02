# Deployment Guide - Last Words

## Prerequisites

1. **Node.js 20+**: Install from [nodejs.org](https://nodejs.org/) or use nvm: `nvm use`
2. **pnpm**: `npm install -g pnpm`
3. **AWS CLI**: Configured with credentials (`aws configure`)
4. **AWS CDK**: `npm install -g aws-cdk`

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
pnpm install
```

This will install dependencies for all workspaces (root, backend, web, infra).

### 2. Build Backend

```bash
pnpm --filter backend build
```

This runs `esbuild.mjs` which bundles all Lambda handlers into `backend/dist/`.

**Expected output**:
```
✓ Built 7 handlers
```

### 3. Bootstrap CDK (First Time Only)

If you haven't used CDK in this AWS account/region before:

```bash
cd infra
npx cdk bootstrap
cd ..
```

### 4. Deploy Infrastructure

```bash
pnpm deploy:infra
```

This deploys three CDK stacks:
- **LastWordsDataStack**: DynamoDB table with GSIs
- **LastWordsApiStack**: WebSocket API, HTTP API, and Lambda functions
- **LastWordsWebStack**: S3 bucket and CloudFront distribution

**Expected outputs**:
```
LastWordsApiStack.WebSocketURL = wss://abc123.execute-api.us-east-1.amazonaws.com/prod
LastWordsApiStack.HTTPURL = https://xyz789.execute-api.us-east-1.amazonaws.com/prod/
LastWordsWebStack.DistributionURL = https://d1234567890abc.cloudfront.net
LastWordsWebStack.ConfigJS = window.__CONFIG__ = { WS_URL: "...", HTTP_URL: "..." };
```

### 5. Update Frontend Configuration

Copy the `ConfigJS` output from the deployment and replace the contents of `web/public/config.js`:

**Before**:
```javascript
window.__CONFIG__ = {
  WS_URL: 'wss://REPLACE',
  HTTP_URL: 'https://REPLACE',
};
```

**After** (using actual URLs from CDK output):
```javascript
window.__CONFIG__ = {
  WS_URL: 'wss://abc123.execute-api.us-east-1.amazonaws.com/prod',
  HTTP_URL: 'https://xyz789.execute-api.us-east-1.amazonaws.com/prod/',
};
```

### 6. Build and Deploy Frontend

Build the React app:
```bash
pnpm --filter web build
```

Upload to S3 (replace `BUCKET_NAME` with the actual bucket name from CDK output):
```bash
cd web
aws s3 sync dist/ s3://BUCKET_NAME --delete
cd ..
```

Invalidate CloudFront cache (replace `DISTRIBUTION_ID`):
```bash
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

### 7. Access the Application

Open the CloudFront Distribution URL in your browser:
```
https://d1234567890abc.cloudfront.net
```

## Development Workflow

### Local Frontend Development

Start Vite dev server:
```bash
pnpm dev:web
```

Access at `http://localhost:3000`. Make sure `web/public/config.js` has the deployed API URLs.

### Backend Changes

After modifying backend code:
```bash
pnpm deploy:backend
```

This rebuilds handlers and redeploys the API stack.

### Infrastructure Changes

After modifying CDK stacks:
```bash
pnpm deploy:infra
```

### Run Tests

```bash
# All tests
pnpm test

# Backend only
pnpm --filter backend test

# Watch mode
pnpm --filter backend test:watch
```

## Useful Commands

### View CDK Synthesized CloudFormation
```bash
pnpm synth
```

### Destroy Infrastructure
```bash
cd infra
npx cdk destroy --all
cd ..
```

⚠️ **Warning**: This will delete all data in DynamoDB!

### Check Backend Build Output
```bash
ls backend/dist/
```

Should see:
```
ws/
  connect.mjs
  disconnect.mjs
  default.mjs
http/
  createLobby.mjs
  joinLobby.mjs
  startMatch.mjs
  chimeAttendee.mjs
```

### Tail Lambda Logs
```bash
# WebSocket default handler
aws logs tail /aws/lambda/LastWordsApiStack-WSDefaultHandler --follow

# Start match handler
aws logs tail /aws/lambda/LastWordsApiStack-StartMatchHandler --follow
```

## Troubleshooting

### Lambda Functions Can't Find Modules

**Problem**: Import errors in Lambda logs.

**Solution**: Verify esbuild bundled everything:
```bash
pnpm --filter backend build
```

Check that `.mjs` files exist in `backend/dist/`.

### WebSocket Connection Fails

**Problem**: Browser console shows WebSocket connection refused.

**Solution**: 
1. Verify `web/public/config.js` has correct WebSocket URL
2. Check API Gateway deployment in AWS Console
3. Ensure Lambda has DynamoDB permissions

### CORS Errors

**Problem**: HTTP API calls fail with CORS errors.

**Solution**: API Stack already configures CORS. Verify:
```typescript
defaultCorsPreflightOptions: {
  allowOrigins: apigateway.Cors.ALL_ORIGINS,
  allowMethods: apigateway.Cors.ALL_METHODS,
}
```

### DynamoDB Access Denied

**Problem**: Lambda logs show AccessDeniedException.

**Solution**: Verify Lambda has table permissions in `api-stack.ts`:
```typescript
table.grantReadWriteData(handler);
```

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌────────────┐    ┌──────────────┐
│ CloudFront │    │ API Gateway  │
│    (CDN)   │    │   (WS+HTTP)  │
└─────┬──────┘    └──────┬───────┘
      │                  │
      ▼                  ▼
┌────────────┐    ┌──────────────┐
│  S3 Bucket │    │   Lambda     │
│  (Static)  │    │  (Handlers)  │
└────────────┘    └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  DynamoDB    │
                  │ (Single-Table)│
                  └──────────────┘
```

## Next Steps

1. **Add More Modules**: Create new puzzle modules in `backend/src/game/modules/`
2. **Customize Styling**: Update CSS in `web/src/index.css` or add styled-components
3. **Add Authentication**: Integrate Cognito for user auth
4. **Add Monitoring**: Set up CloudWatch dashboards and alarms
5. **Production Hardening**: 
   - Change DynamoDB RemovalPolicy to RETAIN
   - Add custom domain with Route53
   - Configure WAF for CloudFront
   - Add proper error boundaries in React
