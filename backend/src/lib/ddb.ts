import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.TABLE_NAME || 'LastWords';

export async function putItem(item: Record<string, any>) {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

export async function getItem(pk: string, sk: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk },
    })
  );
  return result.Item;
}

export async function queryByPk(pk: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': pk },
    })
  );
  return result.Items || [];
}

export async function queryGSI2(gsi2pk: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'gsi2pk = :gsi2pk',
      ExpressionAttributeValues: { ':gsi2pk': gsi2pk },
    })
  );
  return result.Items || [];
}

export async function deleteItem(pk: string, sk: string) {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk },
    })
  );
}

export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, any>
) {
  const updateExpr: string[] = [];
  const attrNames: Record<string, string> = {};
  const attrValues: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value], idx) => {
    const nameKey = `#attr${idx}`;
    const valueKey = `:val${idx}`;
    updateExpr.push(`${nameKey} = ${valueKey}`);
    attrNames[nameKey] = key;
    attrValues[valueKey] = value;
  });

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk },
      UpdateExpression: `SET ${updateExpr.join(', ')}`,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
    })
  );
}
