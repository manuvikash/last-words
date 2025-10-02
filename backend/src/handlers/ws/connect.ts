import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { putItem } from '../../lib/ddb.js';
import { generateId, now, ttl } from '../../lib/util.js';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const connectedAt = now();

  await putItem({
    pk: `CONN#${connectionId}`,
    sk: `CONN#${connectionId}`,
    connectionId,
    connectedAt,
    ttl: ttl(1), // 1 day TTL
  });

  return { statusCode: 200, body: 'Connected' };
};
