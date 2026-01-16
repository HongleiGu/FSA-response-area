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
import { FSA } from './type';

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
}));

/* -------------------- component -------------------- */

interface FSAInputProps {
  answer: FSA;
  onChange: (val: FSA) => void;
  isTeacherMode?: boolean;
}

export const FSAInput: React.FC<FSAInputProps> = ({
  answer,
  onChange,
  isTeacherMode,
}) => {
  const { classes, cx } = useLocalStyles();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  useEffect(() => { 
    // import the css, since the import 'reactflow/dist/style.css'; dont seems to work 
    // the css is on the cdn anyway 
    const linkId = 'react-flow-css'; 
    if (!document.getElementById(linkId)) { 
      const link = document.createElement('link'); 
      link.id = linkId; link.rel = 'stylesheet'; 
      link.href = 'https://cdn.jsdelivr.net/npm/reactflow@11.10.4/dist/style.css'; 
      // Use a CDN fallback 
      document.head.appendChild(link); 
    } 
  }, []);

  const initialEdges: Edge[] = useMemo(() => {
    return (answer.transitions || []).reduce((acc: Edge[], tStr: string) => {
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
  }, [answer.transitions]);

  const initialNodes: Node[] = useMemo(
    () =>
      answer.states.map((s, i) => ({
        id: s,
        data: { label: s },
        position: { x: i * 120 + 50, y: 150 },
        className: cx(
          classes.node,
          s === answer.initial_state && classes.initialNode,
          answer.accept_states.includes(s) && classes.acceptNode,
        ),
      })),
    [answer.states, answer.initial_state, answer.accept_states, classes, cx],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((e) => e.id === selectedEdgeId), [edges, selectedEdgeId]);

  const syncChanges = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      onChange({
        ...answer,
        states: currentNodes.map((n) => n.id),
        transitions: currentEdges.map((e) => `${e.source}|${e.label || 'ε'}|${e.target}`),
        alphabet: Array.from(new Set(currentEdges.map((e) => String(e.label || 'ε')))).filter(s => s !== 'ε'),
      });
    },
    [answer, onChange],
  );

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const remainingNodes = nodes.filter((n) => n.id !== selectedNodeId);
    const remainingEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
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
      const symbol = `tran-${Date.now()}`
      const newEdge: Edge = {
        ...params,
        id: `edge-${Date.now()}`,
        source: params.source,
        target: params.target,
        label: symbol,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        syncChanges(nodes, updated);
        return updated;
      });
    },
    [nodes, syncChanges, setEdges],
  );

  // Prevent backspace in input from deleting node/edge in React Flow
  const stopPropagation = (e: React.KeyboardEvent) => e.stopPropagation();

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
                  if (!newId || nodes.some(n => n.id === newId)) return;
                  const oldId = selectedNode.id;
                  const updatedNodes = nodes.map(n => n.id === oldId ? { ...n, id: newId, data: { label: newId } } : n);
                  const updatedEdges = edges.map(e => ({
                    ...e,
                    source: e.source === oldId ? newId : e.source,
                    target: e.target === oldId ? newId : e.target
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
                checked={answer.initial_state === selectedNode.id}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Only one initial state allowed
                    onChange({
                      ...answer,
                      initial_state: selectedNode.id,
                    });
                  } else {
                    if (answer.initial_state === selectedNode.id){
                      onChange({
                        ...answer,
                        initial_state: '',
                      });
                    }
                  }
                }}
              />
              <label>Initial State</label>
            </div>

            <div className={classes.checkboxRow}>
              <input
                type="checkbox"
                checked={answer.accept_states.includes(selectedNode.id)}
                onChange={(e) => {
                  const isChecked = e.target.checked;

                  onChange({
                    ...answer,
                    accept_states: isChecked
                      ? [...answer.accept_states, selectedNode.id]
                      : answer.accept_states.filter(
                          (s) => s !== selectedNode.id,
                        ),
                  });
                }}
              />
              <label>Accepting State</label>
            </div>
            <button className={classes.deleteButton} onClick={deleteSelectedNode}>Delete State</button>
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
                  const updatedEdges = edges.map(ed => ed.id === selectedEdgeId ? { ...ed, label: e.target.value } : ed);
                  setEdges(updatedEdges);
                  syncChanges(nodes, updatedEdges);
                }}
              />
            </div>
            <button className={classes.deleteButton} onClick={deleteSelectedEdge}>Delete Transition</button>
          </>
        )}

        {!selectedNode && !selectedEdge && <div style={{ color: '#999' }}>Select an element to edit</div>}
      </div>

      <div className={classes.flowWrapper}>
        <div className={classes.toolbar}>
          <button className={classes.addButton} onClick={() => {
            const id = `node-${Date.now()}`;
            const newNode = { id, data: { label: id }, position: { x: 50, y: 50 }, className: classes.node };
            setNodes([...nodes, newNode]);
            syncChanges([...nodes, newNode], edges);
          }}>+ Add State</button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => { setSelectedNodeId(n.id); setSelectedEdgeId(null); }}
          onEdgeClick={(_, e) => { setSelectedEdgeId(e.id); setSelectedNodeId(null); }}
          deleteKeyCode={null} // Disables keyboard delete to prevent conflicts
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};