// this is kind of the compromise for the zod restricts IModularResponseSchema and the backend python schema cannot match that
// see file externals/modules/shared/schemas/question-form.schema.ts for details
// since that is a external module, we should not edit that file

import { z } from 'zod';

export const fsaAnswerSchema = z.object({
  states: z.array(z.string()),
  alphabet: z.array(z.string()),
  // Flattened: Array of "from|symbol|to" strings
  transitions: z.array(z.string()), 
  initial_state: z.string(),
  accept_states: z.array(z.string()),
});

export type FSA = z.infer<typeof fsaAnswerSchema>;

export const defaultFSA: FSA = {
  states: ['q0'],
  alphabet: [],
  transitions: [],
  initial_state: 'q0',
  accept_states: []
};

export interface EvalParams {
  evaluation_mode: 'strict' | 'lenient' | 'partial';
  expected_type: 'DFA' | 'NFA' | 'any';
  feedback_verbosity: 'minimal' | 'standard' | 'detailed';

  check_minimality: boolean;
  check_completeness: boolean;

  highlight_errors: boolean;
  show_counterexample: boolean;

  max_test_length: number;
  is_dev: boolean;
}

export const DEFAULT_EVAL_PARAMS: EvalParams = {
  evaluation_mode: 'lenient',
  expected_type: 'any',
  feedback_verbosity: 'standard',

  check_minimality: false,
  check_completeness: false,

  highlight_errors: true,
  show_counterexample: true,

  max_test_length: 10,
  is_dev: false,
};

/* ------------------------------
   Backend-compatible FSA type
   ------------------------------ */

export interface Transition {
  from_state: string;
  symbol: string;
  to_state: string;
}

export interface FSABackend {
  states: string[];
  alphabet: string[];
  transitions: Transition[];
  initial_state: string;
  accept_states: string[];
}

/**
 * Convert frontend FSA (flattened transitions "from|symbol|to") into
 * backend-compatible FSABackend format.
 */
export const convertToBackendFSA = (frontendFSA: Partial<FSA>): FSABackend => {
  const states = frontendFSA.states || [];
  const alphabet = frontendFSA.alphabet || [];
  const initial_state = frontendFSA.initial_state || 'q0';
  const accept_states = frontendFSA.accept_states || [];

  const flatTransitions = frontendFSA.transitions || [];
  const transitions: Transition[] = [];

  flatTransitions.forEach((t) => {
    const parts = t.split('|');
    if (parts.length !== 3) {
      throw new Error(`Invalid transition format: '${t}'`);
    }
    const [from_state, symbol, to_state] = parts;
    if (from_state && symbol && to_state) {
      transitions.push({ from_state, symbol, to_state });
    }
  });

  return {
    states,
    alphabet,
    transitions,
    initial_state,
    accept_states,
  };
};
