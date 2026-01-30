import { makeStyles } from '@styles'
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape'
import React, { useEffect, useRef, useState } from 'react'

import ConfigPanel from './components/ConfigPanel'
import ItemPropertiesPanel from './components/ItemPropertiesPanel'
import { useLocalStyles } from './styles'
import { DEFAULT_FSA_CONFIG, FSA, FSAConfig, FSAFeedback } from './type'

interface FSAInputProps {
  answer: FSA
  handleChange: (fsa: FSA) => void
  feedback: FSAFeedback | null
}

export const FSAInput: React.FC<FSAInputProps> = ({
  answer,
  handleChange,
  feedback
}) => {
  const { classes } = useLocalStyles()

  const cyRef = useRef<Core | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<EdgeSingular | null>(null)
  const [drawMode, setDrawMode] = useState<boolean>(false)
  const [fromNode, setFromNode] = useState<string | null>(null)
  const [config, setConfig] = useState<FSAConfig>(DEFAULT_FSA_CONFIG)
  const [configOpen, setConfigOpen] = useState<boolean>(true)

  /* -------------------- init cytoscape -------------------- */
  useEffect(() => {
    if (!containerRef.current) return

    const cy: Core = cytoscape({
      container: containerRef.current,
      layout: { name: 'preset' },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(displayLabel)',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 50,
            height: 50,
            'background-color': '#fff',
            'border-width': 1,
            'border-color': '#555',
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'line-color': '#555',
            'target-arrow-color': '#555',
            'text-background-color': '#fff',
            'text-background-opacity': 1,
            'text-background-padding': '3px',
          },
        },
      ],
    })

    cyRef.current = cy
    return () => cy.destroy()
  }, [])

  /* -------------------- node/edge handlers -------------------- */
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    const tapNode = (e: cytoscape.EventObject): void => {
      const node = e.target as NodeSingular
      if (drawMode) {
        if (!fromNode) {
          setFromNode(node.id())
          node.addClass('edge-source')
        } else {
          cy.add({
            group: 'edges',
            data: {
              id: `e-${fromNode}-${node.id()}-${Date.now()}`,
              source: fromNode,
              target: node.id(),
              label: config.epsilon_symbol,
            },
          })
          cy.nodes().removeClass('edge-source')
          setDrawMode(false)
          setFromNode(null)
          syncToBackend()
        }
        return
      }

      setSelectedNode(node)
      setSelectedEdge(null)
    }

    const tapEdge = (e: cytoscape.EventObject): void => {
      setSelectedEdge(e.target as EdgeSingular)
      setSelectedNode(null)
    }

    cy.on('tap', 'node', tapNode)
    cy.on('tap', 'edge', tapEdge)

    return () => {
      cy.off('tap', 'node', tapNode)
      cy.off('tap', 'edge', tapEdge)
    }
  }, [drawMode, fromNode, config.epsilon_symbol])

  /* -------------------- sync to backend -------------------- */
  const syncToBackend = (): void => {
    const cy = cyRef.current
    if (!cy) return

    const fsa: FSA = {
      states: cy.nodes().map((n) => n.id()),
      transitions: cy.edges().map(
        (e) =>
          `${e.source().id()}|${e.data('label') || config.epsilon_symbol}|${e.target().id()}`,
      ),
      initial_state: answer.initial_state,
      accept_states: answer.accept_states,
      alphabet: Array.from(new Set(cy.edges().map((e) => String(e.data('label'))))),
    }

    handleChange(fsa) // Only FSA, not config
  }

  /* -------------------- add state -------------------- */
  const addState = (): void => {
    const cy = cyRef.current
    if (!cy) return

    const id = `q${cy.nodes().length}`
    cy.add({
      group: 'nodes',
      data: { id, displayLabel: id },
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
    })

    syncToBackend()
  }

  return (
    <div className={classes.container}>
      <ItemPropertiesPanel
        cyRef={cyRef}
        classes={classes}
        addState={addState}
        drawMode={drawMode}
        setDrawMode={setDrawMode}
        setFromNode={setFromNode}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        selectedEdge={selectedEdge}
        setSelectedEdge={setSelectedEdge}
        syncToBackend={syncToBackend}
        handleChange={handleChange}
        answer={answer}
        feedback={feedback}
      />

      <div ref={containerRef} className={classes.cyWrapper} />

      <ConfigPanel
        config={config}
        setConfig={setConfig}
        configOpen={configOpen}
        setConfigOpen={setConfigOpen}
        classes={classes}
      />
    </div>
  )
}
