import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { deleteItem } from '../../lib/ddb.js';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  await deleteItem(`CONN#${connectionId}`, `CONN#${connectionId}`);

  return { statusCode: 200, body: 'Disconnected' };
};
