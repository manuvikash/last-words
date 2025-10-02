import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Match from './pages/Match';
import Spectate from './pages/Spectate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:id" element={<Lobby />} />
        <Route path="/match/:id" element={<Match />} />
        <Route path="/spectate/:id" element={<Spectate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
