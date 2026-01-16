// FSA.converter.ts
// this is for the inconsistency between the backend pydantic models and the frontend compromsise
import { FSA } from './type';

/**
 * Backend representation of an FSA transition
 */
export interface BackendTransition {
  from_state: string;
  to_state: string;
  symbol: string;
}

/**
 * Backend representation of the full FSA
 */
export interface BackendFSA {
  states: string[];
  alphabet: string[];
  transitions: BackendTransition[];
  initial_state: string;
  accept_states: string[];
}

export const FSAConverter = {
  /**
   * Converts frontend FSA (flat transitions) to Backend FSA (object transitions)
   */
  toBackend(frontendFsa: FSA): BackendFSA {
    return {
      ...frontendFsa,
      transitions: frontendFsa.transitions.map((tStr) => {
        const [from, symbol, to] = tStr.split('|');
        return {
          from_state: from || '',
          to_state: to || '',
          symbol: symbol || '',
        };
      }),
    };
  },

  /**
   * Converts Backend FSA (object transitions) to frontend FSA (flat transitions)
   */
  toFrontend(backendFsa: BackendFSA): FSA {
    return {
      ...backendFsa,
      transitions: backendFsa.transitions.map(
        (t) => `${t.from_state}|${t.symbol}|${t.to_state}`
      ),
    };
  },
};