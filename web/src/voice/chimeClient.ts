import {
  DefaultMeetingSession,
  MeetingSessionConfiguration,
  ConsoleLogger,
  LogLevel,
  DefaultDeviceController,
} from 'amazon-chime-sdk-js';

export interface ChimeMeeting {
  Meeting: {
    MeetingId: string;
    MediaPlacement: any;
  };
}

export interface ChimeAttendee {
  Attendee: {
    AttendeeId: string;
    ExternalUserId: string;
  };
}

export async function createChimeSession(
  meeting: ChimeMeeting,
  attendee: ChimeAttendee,
  listenOnly: boolean = false
) {
  const logger = new ConsoleLogger('ChimeSession', LogLevel.WARN);
  const deviceController = new DefaultDeviceController(logger);

  const configuration = new MeetingSessionConfiguration(
    meeting.Meeting,
    attendee.Attendee
  );

  const session = new DefaultMeetingSession(
    configuration,
    logger,
    deviceController
  );

  // Get audio devices
  const audioInputs = await session.audioVideo.listAudioInputDevices();
  const audioOutputs = await session.audioVideo.listAudioOutputDevices();

  if (audioInputs.length > 0 && !listenOnly) {
    await session.audioVideo.startAudioInput(audioInputs[0].deviceId);
  }

  if (audioOutputs.length > 0) {
    await session.audioVideo.chooseAudioOutput(audioOutputs[0].deviceId);
  }

  // Start session
  session.audioVideo.start();

  if (listenOnly) {
    session.audioVideo.realtimeMuteLocalAudio();
  }

  return session;
}
