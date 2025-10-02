import seedrandom from 'seedrandom';
import { ModuleSpec } from '../engine/types.js';

type GlyphOrderParams = {
  manualId: string;
  columnIndex: number;
  shown: string[];
};

type GlyphOrderState = {
  pressed: string[];
  strikes: number;
};

type GlyphOrderAction = {
  press: string;
};

const MANUAL: string[][] = [
  ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta'],
  ['sun', 'moon', 'star', 'comet', 'nova', 'quark', 'boson', 'neutrino'],
  ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'pink'],
  ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'],
];

export const glyphOrder: ModuleSpec<
  GlyphOrderParams,
  GlyphOrderState,
  GlyphOrderAction
> = {
  key: 'glyphOrder',

  generate(seed: string) {
    const rng = seedrandom(seed);
    const manualId = 'v1';
    const columnIndex = Math.floor(rng() * MANUAL.length);
    const col = MANUAL[columnIndex];
    const shown = [...col].slice(0, 6).sort(() => rng() - 0.5);

    return {
      params: { manualId, columnIndex, shown },
      init: { pressed: [], strikes: 0 },
    };
  },

  applyAction(state, action, params) {
    const col = MANUAL[params.columnIndex];
    const next = col[state.pressed.length];

    if (action.press === next) {
      const newState = {
        ...state,
        pressed: [...state.pressed, action.press],
      };
      const solved = newState.pressed.length === 6;
      return { state: newState, solved };
    } else {
      const newState = {
        ...state,
        strikes: state.strikes + 1,
      };
      return { state: newState, strike: true };
    }
  },
};
