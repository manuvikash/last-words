import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getItem, updateItem } from '../../lib/ddb.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const lobbyId = event.pathParameters?.id;
  if (!lobbyId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing lobby ID' }),
    };
  }

  const body = JSON.parse(event.body || '{}');
  const userId = body.userId || 'anonymous';

  const lobby = await getItem(`LOBBY#${lobbyId}`, `LOBBY#${lobbyId}`);
  if (!lobby) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Lobby not found' }),
    };
  }

  const players = [...(lobby.players || []), userId];
  await updateItem(`LOBBY#${lobbyId}`, `LOBBY#${lobbyId}`, { players });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lobby: { ...lobby, players } }),
  };
};
