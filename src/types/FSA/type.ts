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

// evaluation-types.ts

export type Severity = "error" | "warning" | "info";

export type ElementType =
  | "state"
  | "transition"
  | "initial_state"
  | "accept_state"
  | "alphabet_symbol";

export interface ElementHighlight {
  type: ElementType;
  state_id?: string;
  from_state?: string;
  to_state?: string;
  symbol?: string;
}

export enum ErrorCode {
  INVALID_STATE = "INVALID_STATE",
  INVALID_INITIAL = "INVALID_INITIAL",
  INVALID_ACCEPT = "INVALID_ACCEPT",
  INVALID_SYMBOL = "INVALID_SYMBOL",
  INVALID_TRANSITION_SOURCE = "INVALID_TRANSITION_SOURCE",
  INVALID_TRANSITION_DEST = "INVALID_TRANSITION_DEST",
  INVALID_TRANSITION_SYMBOL = "INVALID_TRANSITION_SYMBOL",
  MISSING_TRANSITION = "MISSING_TRANSITION",
  DUPLICATE_TRANSITION = "DUPLICATE_TRANSITION",
  UNREACHABLE_STATE = "UNREACHABLE_STATE",
  DEAD_STATE = "DEAD_STATE",
  WRONG_AUTOMATON_TYPE = "WRONG_AUTOMATON_TYPE",
  NOT_DETERMINISTIC = "NOT_DETERMINISTIC",
  NOT_COMPLETE = "NOT_COMPLETE",
  NOT_MINIMAL = "NOT_MINIMAL",
  LANGUAGE_MISMATCH = "LANGUAGE_MISMATCH",
  TEST_CASE_FAILED = "TEST_CASE_FAILED",
  EMPTY_STATES = "EMPTY_STATES",
  EMPTY_ALPHABET = "EMPTY_ALPHABET",
  EVALUATION_ERROR = "EVALUATION_ERROR",
}

export interface ValidationError {
  message: string;
  code: ErrorCode;
  severity: Severity;
  highlight?: ElementHighlight;
  suggestion?: string;
}

export interface TestResult {
  input: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
  trace?: string[];
}

export interface StructuralInfo {
  is_deterministic: boolean;
  is_complete: boolean;
  num_states: number;
  num_transitions: number;
  unreachable_states: string[];
  dead_states: string[];
}

export interface LanguageComparison {
  are_equivalent: boolean;
  counterexample?: string;
  counterexample_type?: "should_accept" | "should_reject";
}

export interface FSAFeedback {
  summary: string;
  errors: ValidationError[];
  warnings: ValidationError[];
  structural?: StructuralInfo;
  language?: LanguageComparison;
  test_results: TestResult[];
  hints: string[];
}

// export interface FSA {
//   states: string[];
//   alphabet: string[];
//   transitions: { from_state: string; to_state: string; symbol: string }[];
//   initial_state: string;
//   accept_states: string[];
// }

export interface Result {
  is_correct: boolean;
  feedback: string;
  score?: number; // 0.0 - 1.0
  fsa_feedback?: FSAFeedback;
  input_data?: FSA; // dev/debug only
}
