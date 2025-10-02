import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { getItem, updateItem, putItem } from '../../lib/ddb.js';
import { broadcastToMatch, sendToConnection } from '../../lib/ws.js';
import { modules } from '../../game/engine/registry.js';
import { ClientFrame, ServerFrame } from '../../game/engine/types.js';

const ClientFrameSchema = z.union([
  z.object({ t: z.literal('join'), matchId: z.string(), role: z.enum(['player', 'spectator']) }),
  z.object({ t: z.literal('action'), matchId: z.string(), moduleId: z.string(), a: z.any() }),
  z.object({ t: z.literal('ping') }),
]);

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

  try {
    const body = JSON.parse(event.body || '{}');
    const frame = ClientFrameSchema.parse(body) as ClientFrame;

    if (frame.t === 'ping') {
      await sendToConnection(connectionId, { t: 'pong' }, callbackUrl);
      return { statusCode: 200, body: 'Pong' };
    }

    if (frame.t === 'join') {
      // Update connection with match and role
      await putItem({
        pk: `CONN#${connectionId}`,
        sk: `CONN#${connectionId}`,
        connectionId,
        matchId: frame.matchId,
        role: frame.role,
        gsi2pk: `CONNS#${frame.matchId}`,
        gsi2sk: connectionId,
      });

      // Get current match state
      const match = await getItem(`MATCH#${frame.matchId}`, `MATCH#${frame.matchId}`);
      if (match) {
        await sendToConnection(
          connectionId,
          { t: 'state', matchId: frame.matchId, v: match.version, diff: match },
          callbackUrl
        );
      }

      return { statusCode: 200, body: 'Joined' };
    }

    if (frame.t === 'action') {
      // Load match
      const match = await getItem(`MATCH#${frame.matchId}`, `MATCH#${frame.matchId}`);
      if (!match) {
        await sendToConnection(
          connectionId,
          { t: 'error', code: 'MATCH_NOT_FOUND', msg: 'Match not found' },
          callbackUrl
        );
        return { statusCode: 404, body: 'Match not found' };
      }

      // Get module
      const module = modules[frame.moduleId as keyof typeof modules];
      if (!module) {
        await sendToConnection(
          connectionId,
          { t: 'error', code: 'MODULE_NOT_FOUND', msg: 'Module not found' },
          callbackUrl
        );
        return { statusCode: 404, body: 'Module not found' };
      }

      // Apply action
      const currentState = match.moduleStates[frame.moduleId];
      const params = match.moduleParams[frame.moduleId];
      const result = module.applyAction(currentState, frame.a, params);

      // Update match
      const newVersion = match.version + 1;
      const newModuleStates = { ...match.moduleStates, [frame.moduleId]: result.state };

      await updateItem(`MATCH#${frame.matchId}`, `MATCH#${frame.matchId}`, {
        moduleStates: newModuleStates,
        version: newVersion,
      });

      // Broadcast state diff
      await broadcastToMatch(
        frame.matchId,
        {
          t: 'state',
          matchId: frame.matchId,
          v: newVersion,
          diff: { moduleStates: { [frame.moduleId]: result.state } },
        },
        callbackUrl
      );

      // Broadcast events if any
      if (result.strike) {
        await broadcastToMatch(
          frame.matchId,
          { t: 'event', matchId: frame.matchId, e: { type: 'strike', moduleId: frame.moduleId } },
          callbackUrl
        );
      }

      if (result.solved) {
        await broadcastToMatch(
          frame.matchId,
          { t: 'event', matchId: frame.matchId, e: { type: 'solved', moduleId: frame.moduleId } },
          callbackUrl
        );
      }

      return { statusCode: 200, body: 'Action applied' };
    }

    return { statusCode: 400, body: 'Unknown frame type' };
  } catch (err: any) {
    console.error('Error processing message:', err);
    await sendToConnection(
      connectionId,
      { t: 'error', code: 'INTERNAL_ERROR', msg: err.message },
      callbackUrl
    );
    return { statusCode: 500, body: 'Internal error' };
  }
};
