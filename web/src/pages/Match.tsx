import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { config } from '../config';
import { WSClient } from '../net/wsClient';
import { useSession } from '../state/useSession';
import GlyphOrderView from '../modules/glyphOrder/GlyphOrderView';

function Match() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useSession();
  const [ws, setWs] = useState<WSClient | null>(null);
  const [matchState, setMatchState] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new WSClient(config.wsUrl);

    client.connect().then(() => {
      setConnected(true);
      client.send({ t: 'join', matchId: id!, role: 'player' });
    });

    const unsubscribe = client.onMessage((frame) => {
      if (frame.t === 'state') {
        setMatchState((prev: any) => ({
          ...prev,
          ...frame.diff,
        }));
      } else if (frame.t === 'event') {
        console.log('Event:', frame.e);
      } else if (frame.t === 'error') {
        console.error('Error:', frame.msg);
      }
    });

    setWs(client);

    return () => {
      unsubscribe();
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
      <h1>Match: {id}</h1>
      <div style={{ marginTop: '2rem' }}>
        {matchState?.modules?.includes('glyphOrder') && ws && (
          <GlyphOrderView
            matchId={id!}
            params={matchState.moduleParams?.glyphOrder}
            state={matchState.moduleStates?.glyphOrder}
            ws={ws}
          />
        )}
      </div>
    </div>
  );
}

export default Match;
