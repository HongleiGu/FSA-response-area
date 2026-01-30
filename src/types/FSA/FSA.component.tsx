import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import ConfigPanel from './components/ConfigPanel'
import ItemPropertiesPanel from './components/ItemPropertiesPanel'
import { useLocalStyles } from './styles'
import { useSubmitResponsePreviewMutation } from '@api/graphql'

import {
  DEFAULT_FSA_CONFIG,
  FSA,
  FSAConfig,
  FSAFeedback,
  FSAFeedbackSchema,
  ValidationError,
  ValidationErrorSchema,
} from './type'

interface FSAInputProps {
  answer: FSA
  handleChange: (fsa: FSA) => void
  feedback: FSAFeedback | null
  hasPreview?: boolean
  responseAreaId?: string
  universalResponseAreaId?: string
}

export const FSAInput: React.FC<FSAInputProps> = ({
  answer,
  handleChange,
  feedback,
  hasPreview,
  responseAreaId,
  universalResponseAreaId,
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

  const [previewIsLoading, setPreviewIsLoading] = useState<boolean>(false)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [previewFeedback, setPreviewFeedback] = useState<FSAFeedback | null>(null)

  type PreviewSympy = Record<string, unknown>

  const localPreview = useMemo(() => {
    // Always compute a fast local preview as a fallback.
    return validateFsaPreview(answer, config)
  }, [answer, config])

  /* -------------------- debounce preview call -------------------- */
  useEffect(() => {
    // If live preview is off, show normal (check) feedback if any.
    if (!hasPreview) {
      setPreviewIsLoading(false)
      setPreviewText(null)
      setPreviewFeedback(feedback)
      return
    }

    // If we can't call the backend preview, fall back to local validation.
    if (!responseAreaId || !universalResponseAreaId) {
      setPreviewIsLoading(false)
      setPreviewText(null)
      setPreviewFeedback(localPreview)
      return
    }

    const requireDeterministic = config.expected_type === 'DFA'
    const showWarnings = true

    const timeout = setTimeout(async () => {
      setPreviewIsLoading(true)
      try {
        const data = await useSubmitResponsePreviewMutation.fetcher({
          submission: answer,
          additionalParams: {
            require_deterministic: requireDeterministic,
            show_warnings: showWarnings,
          },
          responseAreaId,
          universalResponseAreaId,
        })()

        const res = data.submitResponsePreview

        // Best-effort mapping: the backend returns { preview: { latex, feedback, sympy } }
        const previewObj = res.preview
        if (previewObj && typeof previewObj === 'object') {
          const maybeFeedback = (previewObj as any).feedback
          const maybeSympy = (previewObj as any).sympy as PreviewSympy | undefined

          setPreviewText(typeof maybeFeedback === 'string' ? maybeFeedback : null)
          setPreviewFeedback(
            maybeSympy ? sympyToFsaFeedback(maybeSympy, answer) : localPreview,
          )
        } else {
          // No structured preview; show server string feedback if present
          setPreviewText(res.feedback ?? null)
          setPreviewFeedback(localPreview)
        }
      } catch {
        // If network preview fails (common in sandbox contexts), still give the student useful local feedback.
        setPreviewText(null)
        setPreviewFeedback(localPreview)
      } finally {
        setPreviewIsLoading(false)
      }
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    answer,
    config.expected_type,
    feedback,
    hasPreview,
    localPreview,
    responseAreaId,
    universalResponseAreaId,
  ])

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
        {
          selector: '.preview-error',
          style: {
            'border-width': 4,
            'border-color': '#d32f2f',
            'line-color': '#d32f2f',
            'target-arrow-color': '#d32f2f',
            'background-color': '#ffebee',
          },
        },
        {
          selector: '.preview-warning',
          style: {
            'border-width': 4,
            'border-color': '#ed6c02',
            'line-color': '#ed6c02',
            'target-arrow-color': '#ed6c02',
            'background-color': '#fff3e0',
          },
        },
      ],
    })

    cyRef.current = cy
    return () => cy.destroy()
  }, [])

  /* -------------------- apply preview highlights -------------------- */
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('preview-error preview-warning')

    const fb = previewFeedback
    if (!fb) return

    for (const err of fb.errors) {
      applyHighlight(cy, err, 'preview-error')
    }
    for (const warn of fb.warnings) {
      applyHighlight(cy, warn, 'preview-warning')
    }
  }, [previewFeedback])

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
        feedback={previewFeedback}
        previewText={previewText}
        previewIsLoading={previewIsLoading}
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

function parseTransition(t: string): { from: string; symbol: string; to: string } {
  const [from = '', symbol = '', to = ''] = t.split('|')
  return { from, symbol, to }
}

function sympyToFsaFeedback(sympy: Record<string, unknown>, answer: FSA): FSAFeedback {
  const errorsRaw = Array.isArray(sympy.errors) ? sympy.errors : []
  const warningsRaw = Array.isArray(sympy.warnings) ? sympy.warnings : []

  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  for (const e of errorsRaw) {
    const parsed = ValidationErrorSchema.safeParse(e)
    if (parsed.success) errors.push(parsed.data)
  }
  for (const w of warningsRaw) {
    const parsed = ValidationErrorSchema.safeParse(w)
    if (parsed.success) warnings.push(parsed.data)
  }

  const numStates = readNumber(sympy.num_states, answer.states.length)
  const numTransitions = readNumber(sympy.num_transitions, answer.transitions.length)

  const isDet = readBoolean(sympy.is_deterministic, false)
  const isComplete = readBoolean(sympy.is_complete, false)
  const unreachable = readStringArray(sympy.unreachable_states)
  const dead = readStringArray(sympy.dead_states)

  const stateWord = numStates === 1 ? 'state' : 'states'
  const transWord = numTransitions === 1 ? 'transition' : 'transitions'
  const summary = `${isDet ? 'DFA' : 'NFA'} with ${numStates} ${stateWord} and ${numTransitions} ${transWord}`

  const candidate: FSAFeedback = {
    summary,
    errors,
    warnings,
    structural: {
      is_deterministic: isDet,
      is_complete: isComplete,
      num_states: numStates,
      num_transitions: numTransitions,
      unreachable_states: unreachable,
      dead_states: dead,
    },
    test_results: [],
    hints: [],
  }

  const parsed = FSAFeedbackSchema.safeParse(candidate)
  return parsed.success ? parsed.data : candidate
}

function readBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function readNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function readStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter(x => typeof x === 'string') as string[]
}

function validateFsaPreview(answer: FSA, config: FSAConfig): FSAFeedback {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  const states = new Set(answer.states)
  const alphabet = new Set(answer.alphabet)

  const transitions = answer.transitions.map(parseTransition)

  // Structural errors
  if (answer.states.length === 0) {
    errors.push({
      message: 'No states defined.',
      code: 'EMPTY_STATES',
      severity: 'error',
      highlight: null,
    })
  }

  if (!answer.initial_state || !states.has(answer.initial_state)) {
    errors.push({
      message: 'Initial state is missing or not in the set of states.',
      code: 'INVALID_INITIAL',
      severity: 'error',
      highlight: answer.initial_state
        ? { type: 'initial_state', state_id: answer.initial_state }
        : { type: 'initial_state', state_id: null },
    })
  }

  for (const acc of answer.accept_states) {
    if (!states.has(acc)) {
      errors.push({
        message: `Accept state '${acc}' is not in the set of states.`,
        code: 'INVALID_ACCEPT',
        severity: 'error',
        highlight: { type: 'accept_state', state_id: acc },
      })
    }
  }

  for (const tr of transitions) {
    if (!states.has(tr.from)) {
      errors.push({
        message: `Transition source state '${tr.from}' is not a valid state.`,
        code: 'INVALID_TRANSITION_SOURCE',
        severity: 'error',
        highlight: { type: 'transition', from_state: tr.from, to_state: tr.to, symbol: tr.symbol },
      })
    }
    if (!states.has(tr.to)) {
      errors.push({
        message: `Transition destination state '${tr.to}' is not a valid state.`,
        code: 'INVALID_TRANSITION_DEST',
        severity: 'error',
        highlight: { type: 'transition', from_state: tr.from, to_state: tr.to, symbol: tr.symbol },
      })
    }
    if (!tr.symbol) {
      errors.push({
        message: `A transition is missing its symbol.`,
        code: 'INVALID_TRANSITION_SYMBOL',
        severity: 'error',
        highlight: { type: 'transition', from_state: tr.from, to_state: tr.to, symbol: null },
      })
    } else if (alphabet.size > 0 && !alphabet.has(tr.symbol)) {
      errors.push({
        message: `Transition symbol '${tr.symbol}' is not in the alphabet.`,
        code: 'INVALID_SYMBOL',
        severity: 'error',
        highlight: { type: 'transition', from_state: tr.from, to_state: tr.to, symbol: tr.symbol },
      })
    }
  }

  const requireDeterministic = config.expected_type === 'DFA'

  const keyToTargets = new Map<string, Set<string>>()
  let hasEpsilon = false
  for (const tr of transitions) {
    if (tr.symbol === config.epsilon_symbol) hasEpsilon = true
    const key = `${tr.from}||${tr.symbol}`
    const set = keyToTargets.get(key) ?? new Set<string>()
    set.add(tr.to)
    keyToTargets.set(key, set)
  }

  let isDeterministic = true
  for (const [key, tos] of keyToTargets.entries()) {
    if (tos.size > 1) {
      isDeterministic = false
      const [from, symbol] = key.split('||')
      errors.push({
        message: `Non-determinism detected: multiple transitions from '${from}' on symbol '${symbol}'.`,
        code: 'NOT_DETERMINISTIC',
        severity: requireDeterministic ? 'error' : 'warning',
        highlight: { type: 'state', state_id: from },
      })
    }
  }

  if (hasEpsilon) {
    isDeterministic = false
    if (requireDeterministic) {
      errors.push({
        message: `Epsilon transitions are not allowed in a DFA (epsilon = '${config.epsilon_symbol}').`,
        code: 'NOT_DETERMINISTIC',
        severity: 'error',
        highlight: null,
      })
    }
  }

  // Reachability
  const reachable = new Set<string>()
  if (answer.initial_state && states.has(answer.initial_state)) {
    const stack = [answer.initial_state]
    while (stack.length) {
      const s = stack.pop()!
      if (reachable.has(s)) continue
      reachable.add(s)
      for (const tr of transitions) {
        if (tr.from === s && states.has(tr.to) && !reachable.has(tr.to)) {
          stack.push(tr.to)
        }
      }
    }
  }

  const unreachableStates = answer.states.filter(s => !reachable.has(s))
  if (unreachableStates.length > 0) {
    for (const s of unreachableStates) {
      warnings.push({
        message: `State '${s}' is unreachable from the initial state.`,
        code: 'UNREACHABLE_STATE',
        severity: 'warning',
        highlight: { type: 'state', state_id: s },
      })
    }
  }

  // Dead states: cannot reach any accept state
  const reverse = new Map<string, Set<string>>()
  for (const tr of transitions) {
    const set = reverse.get(tr.to) ?? new Set<string>()
    set.add(tr.from)
    reverse.set(tr.to, set)
  }

  const canReachAccept = new Set<string>()
  const queue: string[] = []
  for (const a of answer.accept_states) {
    if (states.has(a)) {
      canReachAccept.add(a)
      queue.push(a)
    }
  }
  while (queue.length) {
    const cur = queue.shift()!
    const prevs = reverse.get(cur)
    if (!prevs) continue
    for (const p of prevs) {
      if (!canReachAccept.has(p)) {
        canReachAccept.add(p)
        queue.push(p)
      }
    }
  }

  const deadStates = answer.states.filter(s => states.has(s) && !canReachAccept.has(s))
  if (deadStates.length > 0) {
    for (const s of deadStates) {
      warnings.push({
        message: `State '${s}' is a dead state (cannot reach an accept state).`,
        code: 'DEAD_STATE',
        severity: 'warning',
        highlight: { type: 'state', state_id: s },
      })
    }
  }

  // Completeness (only meaningful for DFA)
  let isComplete = false
  if (isDeterministic && alphabet.size > 0 && !alphabet.has(config.epsilon_symbol)) {
    isComplete = true
    for (const s of answer.states) {
      for (const sym of alphabet) {
        const key = `${s}||${sym}`
        if (!keyToTargets.get(key) || (keyToTargets.get(key)?.size ?? 0) !== 1) {
          isComplete = false
          if (requireDeterministic) {
            warnings.push({
              message: `Missing transition from '${s}' on symbol '${sym}'.`,
              code: 'MISSING_TRANSITION',
              severity: 'warning',
              highlight: { type: 'state', state_id: s },
            })
          }
        }
      }
    }
  }

  const numStates = answer.states.length
  const numTransitions = answer.transitions.length
  const stateWord = numStates === 1 ? 'state' : 'states'
  const transWord = numTransitions === 1 ? 'transition' : 'transitions'
  const summary = `${isDeterministic ? 'DFA' : 'NFA'} with ${numStates} ${stateWord} and ${numTransitions} ${transWord}`

  return {
    summary,
    errors,
    warnings,
    structural: {
      is_deterministic: isDeterministic,
      is_complete: isComplete,
      num_states: numStates,
      num_transitions: numTransitions,
      unreachable_states: unreachableStates,
      dead_states: deadStates,
    },
    test_results: [],
    hints: [],
  }
}

function applyHighlight(cy: Core, err: ValidationError, className: string) {
  const h = err.highlight
  if (!h) return

  if ((h.type === 'state' || h.type === 'initial_state' || h.type === 'accept_state') && h.state_id) {
    cy.getElementById(h.state_id).addClass(className)
    return
  }

  if (h.type === 'transition' && h.from_state && h.to_state) {
    const candidates = cy.edges().filter(e => {
      const fromOk = e.source().id() === h.from_state
      const toOk = e.target().id() === h.to_state
      const label = String(e.data('label') ?? '')
      const symOk = h.symbol ? label === h.symbol : true
      return fromOk && toOk && symOk
    })
    candidates.addClass(className)
  }
}
