import { IModularResponseSchema } from '@modules/shared/schemas/question-form.schema'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

import { FSAResponseAreaTub } from '../src/types/FSA'

const tub = new FSAResponseAreaTub()

function Sandbox() {
  const [answer, setAnswer] =
    useState<IModularResponseSchema['answer']>(null)

  const [allowSave, setAllowSave] = useState(true)

  return (
    <>
      <h2>Input</h2>
      <tub.InputComponent
        config={{}}
        answer={answer}
        handleChange={setAnswer}
        handleSubmit={() => console.log('submit')}
        handleDraftSave={() => console.log('draft save')}
        displayMode="normal"
        hasPreview
      />

      <hr />

      <h2>Wizard</h2>
      <tub.WizardComponent
        handleChange={(val) => console.log('wizard change', val)}
        setAllowSave={setAllowSave}
      />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sandbox />
  </React.StrictMode>
)
