import { WSClient } from '../../net/wsClient';

interface GlyphOrderViewProps {
  matchId: string;
  params: {
    shown: string[];
    columnIndex: number;
    manualId: string;
  };
  state: {
    pressed: string[];
    strikes: number;
  };
  ws: WSClient;
}

function GlyphOrderView({ matchId, params, state, ws }: GlyphOrderViewProps) {
  if (!params || !state) {
    return <div>Loading module...</div>;
  }

  const handlePress = (glyph: string) => {
    ws.send({
      t: 'action',
      matchId,
      moduleId: 'glyphOrder',
      a: { press: glyph },
    });
  };

  const solved = state.pressed.length === 6;

  return (
    <div
      style={{
        padding: '2rem',
        background: '#2a2a2a',
        borderRadius: '8px',
        maxWidth: '600px',
      }}
    >
      <h2>Glyph Order</h2>
      <div style={{ marginBottom: '1rem' }}>
        <p>Pressed: {state.pressed.join(', ') || 'None'}</p>
        <p>Strikes: {state.strikes}</p>
        {solved && <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓ SOLVED</p>}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
        }}
      >
        {params.shown.map((glyph) => (
          <button
            key={glyph}
            onClick={() => handlePress(glyph)}
            disabled={solved}
            style={{
              padding: '1.5rem',
              fontSize: '1.2rem',
              background: state.pressed.includes(glyph)
                ? '#4CAF50'
                : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: solved ? 'not-allowed' : 'pointer',
              opacity: solved ? 0.5 : 1,
            }}
          >
            {glyph}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GlyphOrderView;
