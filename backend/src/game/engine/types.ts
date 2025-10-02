export interface ModuleSpec<P = any, S = any, A = any, E = any> {
  key: string;
  generate(seed: string): { params: P; init: S };
  applyAction(
    state: S,
    action: A,
    params: P
  ): { state: S; events?: E[]; strike?: boolean; solved?: boolean };
}

export interface MatchState {
  id: string;
  seed: string;
  modules: string[];
  moduleStates: Record<string, any>;
  moduleParams: Record<string, any>;
  version: number;
  status: 'active' | 'completed' | 'failed';
  players: string[];
  spectators: string[];
  strikes: number;
  maxStrikes: number;
  startedAt: number;
  completedAt?: number;
}

export type ClientFrame =
  | { t: 'join'; matchId: string; role: 'player' | 'spectator' }
  | { t: 'action'; matchId: string; moduleId: string; a: any }
  | { t: 'ping' };

export type ServerFrame =
  | { t: 'state'; matchId: string; v: number; diff: any }
  | { t: 'event'; matchId: string; e: any }
  | { t: 'error'; code: string; msg: string }
  | { t: 'pong' };
