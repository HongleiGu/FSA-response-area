import { Result } from "../type";

import { FSAFeedbackPanel } from "./FSAFeedbackPanel";

interface ResultProps {
  result: Result;
}

export const ResultPanel: React.FC<ResultProps> = ({ result }) => {
  return (
    <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 6 }}>
      <h3>Evaluation Result</h3>
      <p>
        <strong>Correct:</strong> {result.is_correct ? 'Yes ✅' : 'No ❌'}
      </p>
      <p>
        <strong>Feedback:</strong> {result.feedback || 'No feedback'}
      </p>

      {result.score !== undefined && (
        <p>
          <strong>Score:</strong> {Math.round(result.score * 100)}%
        </p>
      )}

      {result.fsa_feedback && <FSAFeedbackPanel feedback={result.fsa_feedback} />}
    </div>
  );
};
