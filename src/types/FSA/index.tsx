// import React, { useMemo } from 'react'
// import { z } from 'zod'


import {
  BaseResponseAreaProps,
  BaseResponseAreaWizardProps,
} from '../base-props.type'
import { ResponseAreaTub } from '../response-area-tub'

import { FSAInput } from './FSA.component'
import {
  DEFAULT_FSA_CONFIG,
  FSA,
  FSAConfig,
  FSAFeedbackSchema,
  defaultFSA,
  fsaAnswerSchema,
} from './type'

export class FSAResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'FSA'
  public readonly displayWideInput: boolean = true

  protected answerSchema = fsaAnswerSchema
  protected answer: FSA = defaultFSA // Never undefined now
  protected config: FSAConfig = DEFAULT_FSA_CONFIG
  // private feedback: FSAFeedback | null = null

  public readonly delegateFeedback = false // we want to manage our own feedback
  public readonly delegateLivePreview = false // we want live previews

  initWithConfig = (config: any) => { 
      this.config = {
        ...DEFAULT_FSA_CONFIG,
        ...config, // not too sure about this, maybe the opposite so the default config is overwritten?
      }
    } 
    
  customCheck = () => {} // will set this up later

  /* -------------------- Input -------------------- */

public InputComponent = (props: BaseResponseAreaProps): JSX.Element => {
  // Ensure a valid FSA answer
  const parsedAnswer = this.answerSchema.safeParse(props.answer)
  const validAnswer: FSA = parsedAnswer.success ? parsedAnswer.data : defaultFSA

  const checkFeedback = (() => {
    const raw = props.feedback?.feedback
    if (!raw) return null
    try {
      // legacy format sometimes embeds JSON after a <br>
      const jsonPart = raw.split('<br>')[1]?.trim() ?? raw.trim()
      const parsed = FSAFeedbackSchema.safeParse(JSON.parse(jsonPart))
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  })()

  return (
    <FSAInput
      answer={validAnswer}
      handleChange={(val: FSA) => props.handleChange(val)}
      feedback={checkFeedback}
      hasPreview={props.hasPreview}
      responseAreaId={props.responseAreaId}
      universalResponseAreaId={props.universalResponseAreaId}
    />
  )
}


  /* -------------------- Wizard -------------------- */
  public WizardComponent = (
    props: BaseResponseAreaWizardProps,
  ): JSX.Element => {
    return (
      <FSAInput
        feedback={null}
        answer={this.answer} // Guaranteed defined
        handleChange={(val: FSA): void => {
          this.answer = val
          props.handleChange({
            responseType: this.responseType,
            answer: val,
            config: this.config as unknown as Record<string, string | number | boolean | null>
          })
        }}
      />
    )
  }
}
