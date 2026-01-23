import { FSAFeedback } from "../type";

interface FSAFeedbackPanelProps {
  feedback: FSAFeedback;
}

export const FSAFeedbackPanel: React.FC<FSAFeedbackPanelProps> = ({ feedback }) => {
  return (
    <div style={{ marginTop: 16 }}>
      <h4>Detailed Feedback</h4>
      {feedback.summary && <p><strong>Summary:</strong> {feedback.summary}</p>}

      {feedback.errors.length > 0 && (
        <div>
          <strong>Errors:</strong>
          <ul>
            {feedback.errors.map((err, i) => (
              <li key={i}>
                {err.message} ({err.code})
                {err.suggestion && <em> - {err.suggestion}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.warnings.length > 0 && (
        <div>
          <strong>Warnings:</strong>
          <ul>
            {feedback.warnings.map((warn, i) => (
              <li key={i}>{warn.message} ({warn.code})</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.language && !feedback.language.are_equivalent && (
        <div>
          <strong>Language Mismatch:</strong> Counterexample: {feedback.language.counterexample} (
          {feedback.language.counterexample_type})
        </div>
      )}

      {feedback.structural && (
        <div>
          <strong>Structural Info:</strong>
          <p>
            Deterministic: {feedback.structural.is_deterministic ? 'Yes' : 'No'}, Complete:{' '}
            {feedback.structural.is_complete ? 'Yes' : 'No'}
          </p>
          <p>
            States: {feedback.structural.num_states}, Transitions: {feedback.structural.num_transitions}
          </p>
        </div>
      )}

      {feedback.test_results.length > 0 && (
        <div>
          <strong>Test Cases:</strong>
          <ul>
            {feedback.test_results.map((tr, i) => (
              <li key={i}>
                Input: {tr.input} | Expected: {tr.expected ? 'Accept' : 'Reject'} | Actual:{' '}
                {tr.actual ? 'Accept' : 'Reject'} | {tr.passed ? '✅ Passed' : '❌ Failed'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.hints.length > 0 && (
        <div>
          <strong>Hints:</strong>
          <ul>
            {feedback.hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
