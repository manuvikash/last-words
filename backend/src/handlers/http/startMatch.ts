import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { putItem } from '../../lib/ddb.js';
import { createMeeting, createAttendee } from '../../lib/chime.js';
import { generateId, now } from '../../lib/util.js';
import { modules } from '../../game/engine/registry.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const userId = body.userId || 'anonymous';
  const matchId = generateId();
  const seed = generateId();

  // Generate modules
  const moduleKeys = ['glyphOrder'];
  const moduleStates: Record<string, any> = {};
  const moduleParams: Record<string, any> = {};

  moduleKeys.forEach((key) => {
    const module = modules[key as keyof typeof modules];
    const { params, init } = module.generate(seed + key);
    moduleParams[key] = params;
    moduleStates[key] = init;
  });

  // Create match
  const match = {
    pk: `MATCH#${matchId}`,
    sk: `MATCH#${matchId}`,
    matchId,
    seed,
    modules: moduleKeys,
    moduleStates,
    moduleParams,
    version: 0,
    status: 'active',
    players: [userId],
    spectators: [],
    strikes: 0,
    maxStrikes: 3,
    startedAt: now(),
    gsi1pk: 'MATCHES#ACTIVE',
    gsi1sk: matchId,
  };

  await putItem(match);

  // Create Chime meeting
  const meeting = await createMeeting(matchId);
  const attendee = await createAttendee(meeting!.MeetingId!, userId);

  const wsUrl = process.env.WS_URL || 'wss://REPLACE';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      matchId,
      wsUrl,
      meeting,
      attendee,
    }),
  };
};
