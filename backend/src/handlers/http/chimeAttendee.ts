import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getItem } from '../../lib/ddb.js';
import { createAttendee } from '../../lib/chime.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const matchId = event.pathParameters?.id;
  if (!matchId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing match ID' }),
    };
  }

  const body = JSON.parse(event.body || '{}');
  const userId = body.userId || 'anonymous';

  const match = await getItem(`MATCH#${matchId}`, `MATCH#${matchId}`);
  if (!match || !match.chimeMeetingId) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Match or meeting not found' }),
    };
  }

  const attendee = await createAttendee(match.chimeMeetingId, userId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attendee }),
  };
};
