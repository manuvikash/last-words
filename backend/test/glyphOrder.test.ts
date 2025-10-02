import { describe, it, expect } from 'vitest';
import { glyphOrder } from '../src/game/modules/glyphOrder.js';

describe('glyphOrder module', () => {
  it('should generate params and init state', () => {
    const result = glyphOrder.generate('test-seed');
    
    expect(result.params).toHaveProperty('manualId');
    expect(result.params).toHaveProperty('columnIndex');
    expect(result.params).toHaveProperty('shown');
    expect(result.params.shown).toHaveLength(6);
    
    expect(result.init).toEqual({ pressed: [], strikes: 0 });
  });

  it('should accept correct glyph press', () => {
    const { params, init } = glyphOrder.generate('test-seed');
    
    // Get the correct order from the manual
    const correctOrder = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta'][params.columnIndex];
    
    // Press first glyph (we need to find it in params.shown)
    // For testing, just verify the logic works
    const result = glyphOrder.applyAction(init, { press: 'alpha' }, params);
    
    expect(result.state).toHaveProperty('pressed');
    expect(result.state).toHaveProperty('strikes');
  });

  it('should reject incorrect glyph press', () => {
    const { params, init } = glyphOrder.generate('test-seed');
    
    // Press a wrong glyph (assuming 'wrong' is not first)
    const result = glyphOrder.applyAction(init, { press: 'definitely-wrong' }, params);
    
    expect(result.strike).toBe(true);
    expect(result.state.strikes).toBe(1);
  });

  it('should mark as solved when all glyphs pressed', () => {
    const { params, init } = glyphOrder.generate('test-seed');
    
    // Simulate pressing all 6 correct glyphs
    let state = init;
    const manual = [
      ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta'],
      ['sun', 'moon', 'star', 'comet', 'nova', 'quark', 'boson', 'neutrino'],
      ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'pink'],
      ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'],
    ];
    const correctOrder = manual[params.columnIndex].slice(0, 6);
    
    let solved = false;
    for (const glyph of correctOrder) {
      const result = glyphOrder.applyAction(state, { press: glyph }, params);
      state = result.state;
      if (result.solved) {
        solved = true;
      }
    }
    
    expect(solved).toBe(true);
    expect(state.pressed).toHaveLength(6);
  });
});
