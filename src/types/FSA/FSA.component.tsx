import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  Edge,
  Node,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { TeacherParamsPanel } from './components/TeacherPanel';
import { convertToBackendFSA, DEFAULT_EVAL_PARAMS, EvalParams, FSA } from './type';

import { makeStyles } from '@styles';

/* -------------------- styles -------------------- */

const useLocalStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    height: 600,
    display: 'flex',
    border: '1px solid #ddd',
    fontFamily: 'sans-serif',
  },
  panel: {
    width: 280,
    borderRight: '1px solid #ddd',
    padding: theme.spacing(2),
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  panelTitle: {
    fontWeight: 600,
    fontSize: 16,
    borderBottom: '1px solid #eee',
    paddingBottom: theme.spacing(1),
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  inputField: {
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    cursor: 'pointer',
    padding: '4px 0',
  },
  deleteButton: {
    marginTop: theme.spacing(2),
    padding: '8px',
    backgroundColor: '#fff1f0',
    color: '#cf1322',
    border: '1px solid #ffa39e',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: '#ffa39e',
      color: '#fff',
    },
  },
  flowWrapper: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  },
  toolbar: {
    padding: theme.spacing(1),
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  addButton: {
    padding: '4px 12px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  node: {
    border: '1px solid #777',
    borderRadius: '50%',
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  initialNode: {
    backgroundColor: '#e6fffa',
    borderWidth: 2,
    borderColor: '#38b2ac',
  },
  acceptNode: {
    boxShadow: '0 0 0 4px #fff, 0 0 0 6px #333',
  },
  teacherPanel: {
    position: 'absolute',
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    width: 300,
    maxHeight: '80%',            // 👈 cap height
    overflowY: 'auto',           // 👈 scroll when needed
    backgroundColor: '#fafafa',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: theme.spacing(2),
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  teacherPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
  },

  chevron: {
    fontSize: 14,
    opacity: 0.7,
  },
}));

/* -------------------- component -------------------- */

interface FSAInputProps {
  /** Serialized answer (platform contract) */
  answer: string;
  onChange: (val: string) => void;
  isTeacherMode?: boolean;
}

/**
 * Internal default FSA used when answer is empty or invalid
 */
const EMPTY_FSA: FSA = {
  states: [],
  transitions: [],
  alphabet: [],
  initial_state: '',
  accept_states: [],
};

export const FSAInput: React.FC<FSAInputProps> = ({
  answer,
  onChange,
  isTeacherMode,
}) => {
  const { classes, cx } = useLocalStyles();

  /* -------------------- computed answer -------------------- */
  /**
   * Parsed FSA object derived from the serialized answer.
   * This is the ONLY place JSON.parse happens.
   */
  const fsa: FSA = useMemo(() => {
    if (!answer) return EMPTY_FSA;
    try {
      return JSON.parse(answer) as FSA;
    } catch {
      return EMPTY_FSA;
    }
  }, [answer]);

  /* -------------------- local UI state -------------------- */

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [evalParams, setEvalParams] = useState<EvalParams>(DEFAULT_EVAL_PARAMS);
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(true);

  /* -------------------- CSS fallback -------------------- */

  useEffect(() => {
    const linkId = 'react-flow-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://cdn.jsdelivr.net/npm/reactflow@11.10.4/dist/style.css';
      document.head.appendChild(link);
    }
  }, []);

  /* -------------------- initial graph -------------------- */

  const initialEdges: Edge[] = useMemo(() => {
    return (fsa.transitions || []).reduce((acc: Edge[], tStr: string) => {
      const [from, symbol, to] = tStr.split('|');
      if (from && symbol && to) {
        acc.push({
          id: `e-${from}-${to}-${symbol}-${Date.now()}`,
          source: from,
          target: to,
          label: symbol,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
      return acc;
    }, []);
  }, [fsa.transitions]);

  const initialNodes: Node[] = useMemo(
    () =>
      fsa.states.map((s, i) => ({
        id: s,
        data: { label: s },
        position: { x: i * 120 + 50, y: 150 },
        className: cx(
          classes.node,
          s === fsa.initial_state && classes.initialNode,
          fsa.accept_states.includes(s) && classes.acceptNode,
        ),
      })),
    [fsa, classes, cx],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId),
    [edges, selectedEdgeId],
  );

  /* -------------------- sync helper -------------------- */

  const emitChange = useCallback(
    (next: FSA) => {
      onChange(JSON.stringify(next));
    },
    [onChange],
  );

  const syncChanges = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      emitChange({
        ...fsa,
        states: currentNodes.map((n) => n.id),
        transitions: currentEdges.map(
          (e) => `${e.source}|${e.label || 'ε'}|${e.target}`,
        ),
        alphabet: Array.from(
          new Set(currentEdges.map((e) => String(e.label || 'ε'))),
        ).filter((s) => s !== 'ε'),
      });
    },
    [fsa, emitChange],
  );

  /* -------------------- mutations -------------------- */

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const remainingNodes = nodes.filter((n) => n.id !== selectedNodeId);
    const remainingEdges = edges.filter(
      (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
    );
    setNodes(remainingNodes);
    setEdges(remainingEdges);
    syncChanges(remainingNodes, remainingEdges);
    setSelectedNodeId(null);
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    const remainingEdges = edges.filter((e) => e.id !== selectedEdgeId);
    setEdges(remainingEdges);
    syncChanges(nodes, remainingEdges);
    setSelectedEdgeId(null);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdge: Edge = {
        ...params,
        id: `edge-${Date.now()}`,
        source: params.source,
        target: params.target,
        label: `tran-${Date.now()}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        syncChanges(nodes, updated);
        return updated;
      });
    },
    [nodes, syncChanges],
  );

  const stopPropagation = (e: React.KeyboardEvent) => e.stopPropagation();

  const updateEvalParam = <K extends keyof EvalParams>(
    key: K,
    value: EvalParams[K],
  ) => {
    setEvalParams((prev) => ({ ...prev, [key]: value }));
  };


  /* -------------------- render -------------------- */

  return (
    <div className={classes.container}>
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
                    n.id === oldId
                      ? { ...n, id: newId, data: { label: newId } }
                      : n,
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
                      : fsa.accept_states.filter(
                          (s) => s !== selectedNode.id,
                        ),
                  })
                }
              />
              <label>Accepting State</label>
            </div>

            <button
              className={classes.deleteButton}
              onClick={deleteSelectedNode}
            >
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
                    ed.id === selectedEdgeId
                      ? { ...ed, label: e.target.value }
                      : ed,
                  );
                  setEdges(updatedEdges);
                  syncChanges(nodes, updatedEdges);
                }}
              />
            </div>
            <button
              className={classes.deleteButton}
              onClick={deleteSelectedEdge}
            >
              Delete Transition
            </button>
          </>
        )}

        {!selectedNode && !selectedEdge && (
          <div style={{ color: '#999' }}>Select an element to edit</div>
        )}
      </div>

      <div className={classes.flowWrapper}>
      {isTeacherMode && (
        <div className={classes.teacherPanel}>
          <div
            className={classes.teacherPanelHeader}
            onClick={() => setTeacherPanelOpen((o) => !o)}
          >
            <div className={classes.panelTitle}>Evaluation Parameters</div>
            <span className={classes.chevron}>
              {teacherPanelOpen ? '▾' : '▸'}
            </span>
          </div>

          {teacherPanelOpen && (
            <TeacherParamsPanel
              currentFSA={fsa}
              evalParams={evalParams}
              setEvalParams={setEvalParams}
              classes={classes}
            />
          )}
        </div>
      )}

        <div className={classes.toolbar}>
          <button
            className={classes.addButton}
            onClick={() => {
              const id = `node-${Date.now()}`;
              const newNode = {
                id,
                data: { label: id },
                position: { x: 50, y: 50 },
                className: classes.node,
              };
              setNodes([...nodes, newNode]);
              syncChanges([...nodes, newNode], edges);
            }}
          >
            + Add State
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => {
            setSelectedNodeId(n.id);
            setSelectedEdgeId(null);
          }}
          onEdgeClick={(_, e) => {
            setSelectedEdgeId(e.id);
            setSelectedNodeId(null);
          }}
          deleteKeyCode={null}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};
