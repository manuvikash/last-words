import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { queryGSI2 } from './ddb.js';
import { ServerFrame } from '../game/engine/types.js';

export async function broadcastToMatch(
  matchId: string,
  frame: ServerFrame,
  callbackUrl: string
) {
  const connections = await queryGSI2(`CONNS#${matchId}`);

  const client = new ApiGatewayManagementApiClient({
    endpoint: callbackUrl,
  });

  const sends = connections.map(async (conn) => {
    try {
      await client.send(
        new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: Buffer.from(JSON.stringify(frame)),
        })
      );
    } catch (err: any) {
      if (err.statusCode === 410) {
        console.log(`Stale connection: ${conn.connectionId}`);
      } else {
        console.error(`Failed to send to ${conn.connectionId}:`, err);
      }
    }
  });

  await Promise.allSettled(sends);
}

export async function sendToConnection(
  connectionId: string,
  frame: ServerFrame,
  callbackUrl: string
) {
  const client = new ApiGatewayManagementApiClient({
    endpoint: callbackUrl,
  });

  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(frame)),
      })
    );
  } catch (err: any) {
    if (err.statusCode === 410) {
      console.log(`Stale connection: ${connectionId}`);
    } else {
      throw err;
    }
  }
}
