// import React, { useMemo } from 'react'
// import { z } from 'zod'


import {
  BaseResponseAreaProps,
  BaseResponseAreaWizardProps,
} from '../base-props.type'
import { ResponseAreaTub } from '../response-area-tub'

import { FSAInput } from './FSA.component'
import { fsaAnswerSchema, FSA, defaultFSA, DEFAULT_FSA_CONFIG, FSAConfig, FSAFeedback } from './type'

export class FSAResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'FSA'
  public readonly displayWideInput: boolean = true

  protected answerSchema = fsaAnswerSchema
  protected answer: FSA = defaultFSA // Never undefined now
  protected config: FSAConfig = DEFAULT_FSA_CONFIG
  // private feedback: FSAFeedback | null = null

  public readonly delegateFeedback = false // we want to manage our own feedback
  public readonly delegateLivePreview = true// we want live previews

  initWithConfig = (config: any) => { 
      this.config = {
        ...DEFAULT_FSA_CONFIG,
        ...config, // not too sure about this, maybe the opposite so the default config is overwritten?
      }
    } 
    
  // customCheck = () => {} // will set this up later

  /* -------------------- Input -------------------- */

public InputComponent = (props: BaseResponseAreaProps): JSX.Element => {
  // Ensure a valid FSA answer
  const validAnswer: FSA = this.answerSchema.safeParse(props.answer).success
    ? this.answerSchema.safeParse(props.answer).data ?? defaultFSA
    : defaultFSA

  // // Parse feedback safely and memoize so it updates when props.feedback changes
  // const feedback: FSAFeedback | null = useMemo(() => {
  //   if (!props.feedback?.feedback) return null
  //   try {
  //     return JSON.parse(props.feedback.feedback)
  //   } catch {
  //     return null
  //   }
  // }, [props.feedback?.feedback])

  return (
    <FSAInput
      {...props}
      feedback={(() => {
        const raw = props.feedback?.feedback
        if (!raw) return {}
        try {
          // split by <br> and take the second part, trim whitespace
          const jsonPart = raw.split('<br>')[1]?.trim() ?? '{}'
          return JSON.parse(jsonPart)
        } catch {
          return {} // fallback to empty object if parsing fails
        }
      })()}
      answer={validAnswer}
      handleChange={(val: FSA) => props.handleChange(val)}
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
        feedback={null} // the wizard should not have feedback
        answer={this.answer} // Guaranteed defined
        handleChange={(val: FSA): void => {
          this.answer = val
          console.log('Wizard val:', val)
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
