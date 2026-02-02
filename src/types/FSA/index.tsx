// import React, { useMemo } from 'react'
import { z } from 'zod'


import {
  BaseResponseAreaProps,
  BaseResponseAreaWizardProps,
} from '../base-props.type'
import { ResponseAreaTub } from '../response-area-tub'

import { FSAInput } from './FSA.component'
import { fsaAnswerSchema, FSA, defaultFSA, DEFAULT_FSA_CONFIG, FSAConfig, FSAFeedback, ValidationError, CheckPhase, FSAFeedbackSchema, fsaConfigSchema } from './type'
import { validateFSA } from './validateFSA'

export class FSAResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'FSA'
  public readonly displayWideInput = true

  protected answerSchema = fsaAnswerSchema
  protected answer: FSA = defaultFSA

  private previewFeedback: FSAFeedback | null = null
  private phase: CheckPhase = CheckPhase.Idle
  private response: FSA | null = null

  public readonly delegateFeedback = false
  public readonly delegateLivePreview = true

  initWithConfig = () => {}

  /* -------------------- Custom Check -------------------- */

  customCheck = () => {
    // Block submission if preview validation fails
    if (this.previewFeedback) {
      throw new Error('preview failed')
    }

    // Preview passed — ensure it's cleared
    this.previewFeedback = null
    // this.phase = CheckPhase.Idle
  }

  /* -------------------- Input -------------------- */

  public InputComponent = (props: BaseResponseAreaProps): JSX.Element => {
    // Ensure a valid FSA answer
    const parsed = this.answerSchema.safeParse(props.answer)
    const validAnswer = parsed.success ? parsed.data : defaultFSA

    this.response = validAnswer

    /* ---------- Extract submitted feedback ---------- */

    const submittedFeedback: FSAFeedback | null = (() => {
      const raw = props.feedback?.feedback
      if (!raw) return null

      try {
        const jsonPart = raw.split('<br>')[1]?.trim()
        if (!jsonPart) return null
        return JSON.parse(jsonPart)
      } catch {
        return null
      }
    })()

    /* ---------- Effective feedback ---------- */

    const effectiveFeedback =
      this.previewFeedback ?? submittedFeedback

    return (
      <FSAInput
        {...props}
        answer={validAnswer}
        feedback={effectiveFeedback}
        previewFeedback={null} // 🔥 PREVIEW IS AN OVERLAY, NOT A PEER
        phase={this.phase}
        handleChange={(val: FSA) => {
          props.handleChange(val)

          const preview = validateFSA(val)

          if (preview.errors.length > 0) {
            this.previewFeedback = preview
            this.phase = CheckPhase.PreviewError
          } else {
            this.previewFeedback = null   // 🔥 THIS IS THE KEY
            this.phase = CheckPhase.Idle
          }
        }}
      />
    )
  }

  /* -------------------- Wizard -------------------- */

  public WizardComponent = (
    props: BaseResponseAreaWizardProps,
  ): JSX.Element => {
    return (
      <FSAInput
        {...props}
        feedback={null}
        answer={this.answer}
        phase={CheckPhase.Evaluated}
        previewFeedback={null}
        handleChange={(val: FSA) => {
          this.answer = val
          props.handleChange({
            responseType: this.responseType,
            answer: val,
          })
        }}
      />
    )
  }
}
