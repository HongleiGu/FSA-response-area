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
import { ItemsPanel } from './components/ItemsPanel';
import { TeacherParamsPanel } from './components/TeacherPanel';
import { useLocalStyles } from './styles';
import { DEFAULT_EVAL_PARAMS, EvalParams, FSA, Result } from './type';

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


type HighlightKind = 'error' | 'warning' | 'info';

const buildHighlightMaps = (result: Result | null) => {
  const states = new Map<string, HighlightKind>();
  const transitions = new Map<string, HighlightKind>();

  if (!result?.fsa_feedback) return { states, transitions };

  const issues = [
    ...(result.fsa_feedback.errors ?? []),
    ...(result.fsa_feedback.warnings ?? []),
  ];

  for (const issue of issues) {
    const severity = issue.severity ?? 'error';
    const h = issue.highlight;
    if (!h) continue;

    if (h.type === 'state' && h.state_id) {
      states.set(h.state_id, severity);
    }

    if (
      h.type === 'transition' &&
      h.from_state &&
      h.to_state &&
      h.symbol
    ) {
      const id = `${h.from_state}|${h.symbol}|${h.to_state}`;
      transitions.set(id, severity);
    }
  }

  return { states, transitions };
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

  const [result, setResult] = useState<Result | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [evalParams, setEvalParams] = useState<EvalParams>(DEFAULT_EVAL_PARAMS);
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(true);
  const [referenceAnswer, setReferenceAnswer] = useState<string>("");

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

/* -------------------- highlights -------------------- */

  const highlightMaps = useMemo(
    () => {
      console.log(result)
      return buildHighlightMaps(result)
    },
    [result],
  );

  const highlightedNodes = useMemo(() => {
    return nodes.map((node) => {
      const severity = highlightMaps.states.get(node.id);

      return {
        ...node,
        className: cx(
          classes.node,
          node.id === fsa.initial_state && classes.initialNode,
          fsa.accept_states.includes(node.id) && classes.acceptNode,
          severity === 'error' && classes.errorNode,
          severity === 'warning' && classes.warningNode,
        ),
      };
    });
  }, [nodes, highlightMaps, fsa, classes, cx]);

  const highlightedEdges = useMemo(() => {
    return edges.map((edge) => {
      const severity = highlightMaps.transitions.get(edge.id);

      if (!severity) return edge;

      return {
        ...edge,
        style:
          severity === 'error'
            ? { stroke: '#cf1322', strokeWidth: 3 }
            : { stroke: '#faad14', strokeWidth: 2 },
        labelStyle: {
          fill: severity === 'error' ? '#cf1322' : '#faad14',
          fontWeight: 600,
        },
      };
    });
  }, [edges, highlightMaps]);

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
      <ItemsPanel
        fsa={fsa}
        // nodes={nodes}
        // edges={edges}
        nodes={highlightedNodes}
        edges={highlightedEdges}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        setNodes={setNodes}
        setEdges={setEdges}
        setSelectedNodeId={setSelectedNodeId}
        setSelectedEdgeId={setSelectedEdgeId}
        syncChanges={syncChanges}
        emitChange={emitChange}
        deleteSelectedNode={deleteSelectedNode}
        deleteSelectedEdge={deleteSelectedEdge}
        classes={classes}
        stopPropagation={stopPropagation}
        evalParams={evalParams}
        // setEvalParams={setEvalParams}
        referenceAnswer={referenceAnswer}
        result={result}
        setResult={setResult}
      />

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
              referenceAnswer={referenceAnswer}
              setReferenceAnswer={setReferenceAnswer}
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
