import { IModularResponseSchema } from '@modules/shared/schemas/question-form.schema'
import { z } from 'zod'

import { CodeResponseAreaTub } from './Code'
import { EssayResponseAreaTub } from './Essay'
import { FSAResponseAreaTub } from './FSA'
import { MatrixResponseAreaTub } from './Matrix'
import { MultipleChoiceResponseAreaTub } from './MultipleChoice'
import { NumberResponseAreaTub } from './NumberInput'
import { NumericUnitsResponseAreaTub } from './NumericUnits'
import { ResponseAreaTub } from './response-area-tub'
import { TableResponseAreaTub } from './Table'
import { TextResponseAreaTub } from './TextInput'
import { TrueFalseResponseAreaTub } from './TrueFalse'

export const supportedResponseTypes = [
  'BOOLEAN',
  'TEXT',
  'NUMBER',
  'NUMERIC_UNITS',
  'MATRIX',
  'TABLE',
  'MULTIPLE_CHOICE',
  'GRAPH',
  'EXPRESSION',
  'ESSAY',
  'CODE',
  'MILKDOWN',
  'FSA'
]

if (typeof window !== 'undefined') {
  const TUBIFY_NAME = localStorage.getItem('tubify-name')
  const TUBIFY_URL = localStorage.getItem('tubify-url')
  if (TUBIFY_NAME && TUBIFY_URL) {
    console.debug('ENABLING TUBIFY', {
      name: TUBIFY_NAME,
      url: TUBIFY_URL,
    })
    const loadComponent = async () => {
      const response = await fetch(`${JSON.parse(TUBIFY_URL)}/tubify.iife.js`)
      const componentCode = await response.text()

      const script = document.createElement('script')
      script.textContent = componentCode
      document.head.appendChild(script)
    }
    loadComponent().then(() => {
      supportedResponseTypes.push(TUBIFY_NAME)
    })
  }
}

class VoidResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'VOID'

  protected answerSchema = z.any()

  toResponse = (): IModularResponseSchema => {
    return {
      responseType: '',
      answer: null,
    }
  }

  InputComponent = () => {
    return null
  }

  WizardComponent = () => {
    return null
  }
}

const createReponseAreaTub = (type: string): ResponseAreaTub => {
  if (
    type ===
      (JSON.parse(localStorage.getItem('tubify-name') ?? '') as string) &&
    'TubifyComponent' in window
  ) {
    return new (window.TubifyComponent as new () => ResponseAreaTub)()
  }

  switch (type) {
    case 'BOOLEAN':
      return new TrueFalseResponseAreaTub()
    case 'TEXT':
      return new TextResponseAreaTub()
    case 'NUMBER':
      return new NumberResponseAreaTub()
    case 'NUMERIC_UNITS':
      return new NumericUnitsResponseAreaTub()
    case 'MATRIX':
      return new MatrixResponseAreaTub()
    case 'TABLE':
      return new TableResponseAreaTub()
    case 'MULTIPLE_CHOICE':
      return new MultipleChoiceResponseAreaTub()
    case 'ESSAY':
      return new EssayResponseAreaTub()
    case 'CODE':
      return new CodeResponseAreaTub()
    case 'FSA':
      return new FSAResponseAreaTub()
    case 'VOID':
      return new VoidResponseAreaTub()
    default:
      console.error('Unknown response area Tub type: ' + type)
      return new VoidResponseAreaTub()
  }
}

export { createReponseAreaTub }
