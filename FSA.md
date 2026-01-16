# FSA Module Documentation

This module provides a visual editor for Finite State Automata (FSA) built with **React Flow**. It is designed to bridge the gap between a **Python-style backend** (deeply nested objects) and a **TypeScript/Zod frontend** (restricted to 2-level JSON nesting).

## 1. The Core Data Structures

### Frontend Schema (`FSA`)

To satisfy the `jsonNestedSchema` (which permits only 2 levels of nesting), we use a "flattened" string format for transitions.

```typescript
// level 1: Object properties
// level 2: String arrays
export interface FSA {
  states: string[];
  alphabet: string[];
  transitions: string[]; // Format: "from_state|symbol|to_state"
  initial_state: string;
  accept_states: string[];
}

```

### Backend Schema (`BackendFSA`)

The Python backend uses standard object-oriented nesting for transitions.

```typescript
export interface BackendFSA {
  states: string[];
  alphabet: string[];
  transitions: Array<{
    from_state: string;
    to_state: string;
    symbol: string;
  }>;
  initial_state: string;
  accept_states: string[];
}

```

---

## 2. Key Components

### `FSAInput.component.tsx`

The primary visual editor.

* **State Management**: Uses `useNodesState` and `useEdgesState` from React Flow.
* **Syncing**: Every change (adding a node, connecting an edge, deleting) triggers a `syncChanges` function that converts the visual graph back into the flattened `FSA` interface.
* **User Interactions**:
* **Add State**: Prompt-based creation of new nodes.
* **Connections**: Dragging from one node to another prompts for a transition symbol (defaults to `ε`).
* **Deletion**: Selecting a node/edge and pressing **Backspace** or **Delete** removes the element and cleans up orphaned transitions.



### `FSAResponseAreaTub.ts`

The controller class that integrates the editor into the application wizard.

* **Resilience**: Uses `defaultFSA` to prevent `undefined` errors.
* **Validation**: Uses `fsaAnswerSchema.safeParse()` to guard against corrupted data.

---

## 3. Transformation Logic (`FSAConverter`)

Since the frontend and backend see the data differently, the `FSAConverter` utility is used at the network boundary.

| Method | Source | Target | Reason |
| --- | --- | --- | --- |
| `toFrontend()` | `BackendFSA` | `FSA` | Unpacks objects into `"q0 |
| `toBackend()` | `FSA` | `BackendFSA` | Packs strings back into objects for the Python service logic. |

---

## 4. Usage in the Pipeline

1. **Load**: Data is fetched from the backend (`BackendFSA`).
2. **Convert**: `FSAConverter.toFrontend()` is called.
3. **Edit**: The user interacts with `FSAInput`. The `answer` state stays in the flattened `FSA` format.
4. [TODO] **Save**: On `onSubmit` or `onChange`, `FSAConverter.toBackend()` is called to transform the data back to the format the server expects.

---

## 5. Important Implementation Notes

* **Unique Identifiers**: Edge IDs in React Flow are generated as ``e-${from}-${symbol}-${to}``. If the automaton is Non-Deterministic (NFA), ensure symbol uniqueness or add a UUID to the ID string.
* **Visual Cues**:
* **Initial State**: Nodes matching `initial_state` are colored with a light teal background.
* **Accept States**: Nodes in `accept_states` are rendered with a double-border (4px double).


* **Alphabet Consistency**: The `alphabet` array is automatically derived from the unique labels present in the transitions during the sync process.