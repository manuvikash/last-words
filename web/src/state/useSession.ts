import { create } from 'zustand';

interface SessionState {
  userId: string;
  lobbyId: string | null;
  matchId: string | null;
  role: 'player' | 'spectator' | null;
  setUserId: (id: string) => void;
  setLobbyId: (id: string | null) => void;
  setMatchId: (id: string | null) => void;
  setRole: (role: 'player' | 'spectator' | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  userId: `user-${Math.random().toString(36).substr(2, 9)}`,
  lobbyId: null,
  matchId: null,
  role: null,
  setUserId: (userId) => set({ userId }),
  setLobbyId: (lobbyId) => set({ lobbyId }),
  setMatchId: (matchId) => set({ matchId }),
  setRole: (role) => set({ role }),
}));
