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