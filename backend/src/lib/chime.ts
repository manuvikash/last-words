import {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
} from '@aws-sdk/client-chime-sdk-meetings';

const chime = new ChimeSDKMeetingsClient({});

export async function createMeeting(matchId: string) {
  const result = await chime.send(
    new CreateMeetingCommand({
      ClientRequestToken: matchId,
      MediaRegion: process.env.AWS_REGION || 'us-east-1',
      ExternalMeetingId: matchId,
    })
  );
  return result.Meeting;
}

export async function createAttendee(meetingId: string, userId: string) {
  const result = await chime.send(
    new CreateAttendeeCommand({
      MeetingId: meetingId,
      ExternalUserId: userId,
    })
  );
  return result.Attendee;
}
