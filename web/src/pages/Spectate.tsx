import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { config } from '../config';
import { WSClient } from '../net/wsClient';

function Spectate() {
  const { id } = useParams<{ id: string }>();
  const [matchState, setMatchState] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new WSClient(config.wsUrl);

    client.connect().then(() => {
      setConnected(true);
      client.send({ t: 'join', matchId: id!, role: 'spectator' });
    });

    client.onMessage((frame) => {
      if (frame.t === 'state') {
        setMatchState((prev: any) => ({
          ...prev,
          ...frame.diff,
        }));
      }
    });

    return () => {
      client.close();
    };
  }, [id]);

  if (!connected) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Connecting...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Spectating Match: {id}</h1>
      <div style={{ marginTop: '2rem' }}>
        <p>Status: {matchState?.status || 'Loading...'}</p>
        <p>Strikes: {matchState?.strikes || 0}</p>
      </div>
    </div>
  );
}

export default Spectate;
