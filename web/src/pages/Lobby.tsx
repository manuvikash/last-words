import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config } from '../config';
import { useSession } from '../state/useSession';

function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, setMatchId } = useSession();
  const [lobby, setLobby] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, fetch lobby state here
    setLobby({ lobbyId: id, players: [] });
  }, [id]);

  const startMatch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.httpUrl}/matches/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lobbyId: id }),
      });
      const data = await response.json();
      setMatchId(data.matchId);
      navigate(`/match/${data.matchId}`);
    } catch (err) {
      console.error('Failed to start match:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Lobby</h1>
      <p>Lobby ID: {id}</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>Players</h2>
        <ul>
          {lobby?.players?.map((p: string, i: number) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
      <button
        onClick={startMatch}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '2rem',
        }}
      >
        {loading ? 'Starting...' : 'Start Match'}
      </button>
    </div>
  );
}

export default Lobby;
