import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { putItem } from '../../lib/ddb.js';
import { generateId, now, ttl } from '../../lib/util.js';

export const handler: APIGatewayProxyHandlerV2 = async () => {
  const lobbyId = generateId();

  const lobby = {
    pk: `LOBBY#${lobbyId}`,
    sk: `LOBBY#${lobbyId}`,
    lobbyId,
    createdAt: now(),
    players: [],
    status: 'waiting',
    ttl: ttl(1),
  };

  await putItem(lobby);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lobby }),
  };
};
