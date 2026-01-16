import { IModularResponseSchema } from '@modules/shared/schemas/question-form.schema'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

import { FSAResponseAreaTub } from '../src/types/FSA'
import { FSAInput } from '../src/types/FSA/FSA.component'
import { defaultFSA, FSA } from '../src/types/FSA/type'


const tub = new FSAResponseAreaTub()

function Sandbox() {
  const [answer, setAnswer] =
    useState<FSA>(defaultFSA)

  const [, setAllowSave] = useState(true)

  return (
    <>
      <h2>Input</h2>
      <FSAInput
        answer={answer}
        onChange={(val) => console.log("wizard change", val)}
      />

      <hr />

      <h2>Wizard</h2>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sandbox />
  </React.StrictMode>
)
