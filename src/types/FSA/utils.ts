import { CheckPhase, FSAFeedback } from "./type"

export function mergeFeedback(
  feedback: FSAFeedback | null,
  previewFeedback: FSAFeedback | null,
  phase: CheckPhase,
): FSAFeedback | null {
  if (phase === CheckPhase.PreviewError) {
    return previewFeedback
  }

  return feedback
}