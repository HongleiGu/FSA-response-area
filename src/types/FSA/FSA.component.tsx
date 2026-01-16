import React, { useCallback, useMemo } from 'react';
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
  OnNodesDelete
} from 'reactflow';

import 'reactflow/dist/style.css';
import { FSA } from './type';

interface FSAInputProps {
  answer: FSA;
  onChange: (val: FSA) => void;
}

export const FSAInput: React.FC<FSAInputProps> = ({ answer, onChange }) => {
  // 1. Unpack flattened strings into React Flow Edges
  // we could use the convertor, but lets just keep this here
  const initialEdges: Edge[] = useMemo(() => {
    return (answer.transitions || []).reduce((acc: Edge[], tStr: string) => {
      const [from, symbol, to] = tStr.split('|');
      if (from && symbol && to) {
        acc.push({
          id: `e-${from}-${to}-${symbol}`,
          source: from,
          target: to,
          label: symbol,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
      return acc;
    }, []);
  }, [answer.transitions]);

  const initialNodes: Node[] = useMemo(() => 
    answer.states.map((s, i) => ({
      id: s,
      data: { label: s },
      position: { x: i * 150, y: 100 },
      style: {
        border: answer.accept_states.includes(s) ? '4px double #333' : '1px solid #777',
        background: s === answer.initial_state ? '#e6fffa' : '#fff',
        borderRadius: '50%', width: 50, height: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }
    })), [answer]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync helper to convert current Flow state back to FSA format
  const syncChanges = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const updatedFSA: FSA = {
      ...answer,
      states: currentNodes.map(n => n.id),
      transitions: currentEdges.map(e => `${e.source}|${e.label}|${e.target}`),
      alphabet: Array.from(new Set(currentEdges.map(e => String(e.label))))
    };
    onChange(updatedFSA);
  }, [answer, onChange]);

  // Handle Adding Nodes
  const addState = useCallback(() => {
    const id = prompt("Enter state name (e.g. q2):");
    if (!id || nodes.find(n => n.id === id)) return;

    const newNode: Node = {
      id,
      data: { label: id },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      style: { border: '1px solid #777', borderRadius: '50%', width: 50, height: 50 }
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    syncChanges(updatedNodes, edges);
  }, [nodes, edges, setNodes, syncChanges]);

  // Handle Deleting Nodes (triggered by Backspace/Delete key by default in React Flow)
  const onNodesDelete: OnNodesDelete = useCallback((deletedNodes) => {
    const deletedIds = new Set(deletedNodes.map(n => n.id));
    const remainingNodes = nodes.filter(n => !deletedIds.has(n.id));
    // React Flow handles edge cleanup internally in the 'edges' state, 
    // but we need to ensure our sync uses the filtered edges.
    const remainingEdges = edges.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target));
    
    syncChanges(remainingNodes, remainingEdges);
  }, [nodes, edges, syncChanges]);

  const onConnect = useCallback((params: Connection) => {
    const symbol = prompt("Transition symbol:") || 'ε';
    const newEdge = { ...params, label: symbol, markerEnd: { type: MarkerType.ArrowClosed } };
    
    setEdges((eds) => {
      const updatedEdges = addEdge(newEdge, eds);
      syncChanges(nodes, updatedEdges);
      return updatedEdges;
    });
  }, [nodes, syncChanges, setEdges]);

  return (
    <div style={{ width: '100%', height: '500px', display: 'flex', flexDirection: 'column', border: '1px solid #ddd' }}>
      <div style={{ padding: '8px', borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
        <button onClick={addState} style={{ padding: '4px 12px', cursor: 'pointer' }}>
          + Add State
        </button>
        <small style={{ marginLeft: '12px', color: '#666' }}>
          Select a node/edge and press <b>Backspace</b> to delete.
        </small>
      </div>
      
      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};