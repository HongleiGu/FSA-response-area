import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';

import { FSA, FSABackend, EvalParams, convertToBackendFSA, Result } from '../type';

import { FSAFeedbackPanel } from './FSAFeedbackPanel';
import { ResultPanel } from './ResultPanel';

interface ItemsPanelProps {
  fsa: FSA;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedEdgeId: React.Dispatch<React.SetStateAction<string | null>>;
  syncChanges: (nodes: Node[], edges: Edge[]) => void;
  emitChange: (next: FSA) => void;
  deleteSelectedNode: () => void;
  deleteSelectedEdge: () => void;
  classes: Record<string, string>;
  stopPropagation: (e: React.KeyboardEvent) => void;

  // Teacher mode props
  evalParams: EvalParams;
  // setEvalParams: React.Dispatch<React.SetStateAction<EvalParams>>;
  referenceAnswer: string, 
  // setReferenceAnswer: (s: string) => void

  result: Result | null; 
  setResult: (res: Result | null) => void
}

export const ItemsPanel: React.FC<ItemsPanelProps> = ({
  fsa,
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  setNodes,
  setEdges,
  setSelectedNodeId,
  setSelectedEdgeId,
  syncChanges,
  emitChange,
  deleteSelectedNode,
  deleteSelectedEdge,
  classes,
  stopPropagation,
  evalParams,
  // setEvalParams,
  referenceAnswer, 
  // setReferenceAnswer,
  result, 
  setResult
}) => {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // const [referenceAnswer, setReferenceAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    console.log(evalParams)
    try {
      const payload = {
        response: convertToBackendFSA(fsa),
        answer: convertToBackendFSA(JSON.parse(referenceAnswer || '{}')),
        params: {
          ...evalParams,
          is_latex: false,
          simplify: false,
          symbols: {}
        },
      };

      const res = await fetch('http://localhost:8080/evaluate/fsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Unknown error');
      }

      const data: Result = await res.json();
      setResult(data);
      console.log(data)
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.panel}>
      <div className={classes.panelTitle}>Item Properties</div>

      {selectedNode && (
        <>
          <div className={classes.field}>
            <label>State Name</label>
            <input
              className={classes.inputField}
              value={selectedNode.id}
              onKeyDown={stopPropagation}
              onChange={(e) => {
                const newId = e.target.value.trim();
                if (!newId || nodes.some((n) => n.id === newId)) return;
                const oldId = selectedNode.id;
                const updatedNodes = nodes.map((n) =>
                  n.id === oldId ? { ...n, id: newId, data: { label: newId } } : n
                );
                const updatedEdges = edges.map((ed) => ({
                  ...ed,
                  source: ed.source === oldId ? newId : ed.source,
                  target: ed.target === oldId ? newId : ed.target,
                }));
                setNodes(updatedNodes);
                setEdges(updatedEdges);
                setSelectedNodeId(newId);
                syncChanges(updatedNodes, updatedEdges);
              }}
            />
          </div>

          <div className={classes.checkboxRow}>
            <input
              type="checkbox"
              checked={fsa.initial_state === selectedNode.id}
              onChange={(e) =>
                emitChange({
                  ...fsa,
                  initial_state: e.target.checked ? selectedNode.id : '',
                })
              }
            />
            <label>Initial State</label>
          </div>

          <div className={classes.checkboxRow}>
            <input
              type="checkbox"
              checked={fsa.accept_states.includes(selectedNode.id)}
              onChange={(e) =>
                emitChange({
                  ...fsa,
                  accept_states: e.target.checked
                    ? [...fsa.accept_states, selectedNode.id]
                    : fsa.accept_states.filter((s) => s !== selectedNode.id),
                })
              }
            />
            <label>Accepting State</label>
          </div>

          <button className={classes.deleteButton} onClick={deleteSelectedNode}>
            Delete State
          </button>
        </>
      )}

      {selectedEdge && (
        <>
          <div className={classes.field}>
            <label>Transition Symbol</label>
            <input
              className={classes.inputField}
              value={String(selectedEdge.label || '')}
              onKeyDown={stopPropagation}
              onChange={(e) => {
                const updatedEdges = edges.map((ed) =>
                  ed.id === selectedEdgeId ? { ...ed, label: e.target.value } : ed
                );
                setEdges(updatedEdges);
                syncChanges(nodes, updatedEdges);
              }}
            />
          </div>
          <button className={classes.deleteButton} onClick={deleteSelectedEdge}>
            Delete Transition
          </button>
        </>
      )}

      {!selectedNode && !selectedEdge && (
        <div style={{ color: '#999' }}>Select an element to edit</div>
      )}

      {/* ---------------- Submit Section ---------------- */}
      {/* <div className={classes.field}>
        <label>Reference Answer (dev/debug only)</label>
        <textarea
          className={classes.inputField}
          value={referenceAnswer}
          onChange={(e) => setReferenceAnswer(e.target.value)}
          rows={4}
        />
      </div> */}

      <button
        className={classes.addButton}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>

      {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}

      {result && (
        <>
          <ResultPanel result={result} />
          {result.fsa_feedback && <FSAFeedbackPanel feedback={result.fsa_feedback} />}
        </>
      )}
    </div>
  );
};
