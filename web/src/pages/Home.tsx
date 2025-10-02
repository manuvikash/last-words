import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { useSession } from '../state/useSession';

function Home() {
  const navigate = useNavigate();
  const { userId, setLobbyId } = useSession();
  const [loading, setLoading] = useState(false);

  const createLobby = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.httpUrl}/lobbies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      setLobbyId(data.lobby.lobbyId);
      navigate(`/lobby/${data.lobby.lobbyId}`);
    } catch (err) {
      console.error('Failed to create lobby:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Last Words</h1>
      <p>A voice-first cooperative puzzle game</p>
      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={createLobby}
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create Lobby'}
        </button>
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#999' }}>
        User ID: {userId}
      </div>
    </div>
  );
}

export default Home;
