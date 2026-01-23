import React, { useState } from "react";

import { EvalParams, FSABackend, convertToBackendFSA } from "../type";
import { FSA } from "../type";

interface TeacherParamsPanelProps {
  evalParams: EvalParams;
  setEvalParams: React.Dispatch<React.SetStateAction<EvalParams>>;
  classes: Record<string, string>;
  currentFSA: FSA;
  referenceAnswer: string
  setReferenceAnswer: (s: string) => void;
}

export const TeacherParamsPanel: React.FC<TeacherParamsPanelProps> = ({
  evalParams,
  setEvalParams,
  classes,
  currentFSA,
  referenceAnswer, 
  setReferenceAnswer
}) => {
  // const [referenceAnswer, setReferenceAnswer] = useState<string>("");
  // const [evaluationResult, setEvaluationResult] = useState<any>(null);
  // const [loading, setLoading] = useState(false);

  const update = <K extends keyof EvalParams>(key: K, value: EvalParams[K]) => {
    setEvalParams((prev) => ({ ...prev, [key]: value }));
  };

  // const handleSubmit = async () => {
  //   setLoading(true);
  //   try {
  //     const responseFSA: FSABackend = convertToBackendFSA(currentFSA);
  //     const answerFSA: FSABackend = referenceAnswer
  //       ? convertToBackendFSA(JSON.parse(referenceAnswer))
  //       : { states: [], alphabet: [], transitions: [], initial_state: "q0", accept_states: [] };

  //     const res = await fetch("http://localhost:8080/evaluate/fsa", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         response: responseFSA,
  //         answer: answerFSA,
  //         params: {
  //           ...evalParams,
  //           is_latex: false,
  //           simplify: false,
  //           symbols: {}
  //         }
  //       }),
  //     });

  //     const data = await res.json();
  //     setEvaluationResult(data);
  //     console.log("Evaluation result:", data);
  //   } catch (err) {
  //     console.error("Evaluation failed:", err);
  //     setEvaluationResult({ error: (err as Error).message });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Eval parameter controls */}
      <div className={classes.field}>
        <label>Evaluation Mode</label>
        <select
          className={classes.inputField}
          value={evalParams.evaluation_mode}
          onChange={(e) =>
            update("evaluation_mode", e.target.value as EvalParams["evaluation_mode"])
          }
        >
          <option value="strict">Strict</option>
          <option value="lenient">Lenient</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div className={classes.field}>
        <label>Expected Automaton</label>
        <select
          className={classes.inputField}
          value={evalParams.expected_type}
          onChange={(e) =>
            update("expected_type", e.target.value as EvalParams["expected_type"])
          }
        >
          <option value="any">Any</option>
          <option value="DFA">DFA</option>
          <option value="NFA">NFA</option>
        </select>
      </div>

      <div className={classes.field}>
        <label>Feedback Verbosity</label>
        <select
          className={classes.inputField}
          value={evalParams.feedback_verbosity}
          onChange={(e) =>
            update(
              "feedback_verbosity",
              e.target.value as EvalParams["feedback_verbosity"]
            )
          }
        >
          <option value="minimal">Minimal</option>
          <option value="standard">Standard</option>
          <option value="detailed">Detailed</option>
        </select>
      </div>

      {(
        [
          ["check_minimality", "Check minimality"],
          ["check_completeness", "Check DFA completeness"],
          ["highlight_errors", "Highlight errors"],
          ["show_counterexample", "Show counterexample"],
          ["is_dev", "Development mode"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className={classes.checkboxRow}>
          <input
            type="checkbox"
            checked={evalParams[key]}
            onChange={(e) => update(key, e.target.checked)}
          />
          <label>{label}</label>
        </div>
      ))}

      <div className={classes.field}>
        <label>Max Test Length</label>
        <input
          type="number"
          min={1}
          max={50}
          className={classes.inputField}
          value={evalParams.max_test_length}
          onChange={(e) => update("max_test_length", Number(e.target.value))}
        />
      </div>

      {/* Reference answer input (debug only) */}
      <div className={classes.field}>
        <label>Reference Answer (debug only)</label>
        <textarea
          style={{ width: "100%", height: 80 }}
          value={referenceAnswer}
          onChange={(e) => setReferenceAnswer(e.target.value)}
          placeholder="Paste reference answer JSON here"
        />
      </div>

      {/* Submit button
      <button
        style={{
          marginTop: 12,
          padding: "8px 16px",
          cursor: "pointer",
          backgroundColor: "#1890ff",
          color: "#fff",
          border: "none",
          borderRadius: 4,
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit FSA"}
      </button>

      {evaluationResult && (
        <pre
          style={{
            marginTop: 12,
            padding: 8,
            backgroundColor: "#f5f5f5",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(evaluationResult, null, 2)}
        </pre>
      )} */}
    </div>
  );
};
