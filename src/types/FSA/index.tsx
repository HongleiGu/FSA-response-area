// FSAResponseArea.tub.ts

import z from 'zod';

import {
  BaseResponseAreaProps,
  BaseResponseAreaWizardProps,
} from '../base-props.type';
import { ResponseAreaTub } from '../response-area-tub';

import { FSAInput } from './FSA.component';
import { FSA, defaultFSA, fsaAnswerSchema } from './type';

export class FSAResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'FSA';
  public readonly displayWideInput = true;

  // Ignore schema for now (string-based answer)
  // this cannot be undefined or null, or else the response-area-tub give error: Not Implemented
  protected answerSchema = z.unknown();;

  // IMPORTANT: answer is stored as a STRING
  protected answer: string = JSON.stringify(defaultFSA);

  initWithConfig = (config: any) => {
    this.config = config; // config not used for now
    this.answer = JSON.stringify(defaultFSA);
  };

  customCheck = () => {
    // validation will be added later
  };

  /* -------------------- student input -------------------- */

  InputComponent = (props: BaseResponseAreaProps) => {
    // props.answer is expected to be a STRING
    console.log(
      'FSA InputComponent props.answer:',
      props.answer,
      typeof props.answer,
    );

    // Parse string answer into FSA for the UI
    const fsaAnswer: FSA = (() => {
      if (!props.answer || typeof props.answer !== 'string') {
        return defaultFSA;
      }
      try {
        return JSON.parse(props.answer) as FSA;
      } catch {
        return defaultFSA;
      }
    })();

    return (
      <>
        <p>Input Component</p>
        <FSAInput
          {...props}
          answer={props.answer as string}
          onChange={(fsa: string) => {
            // Serialize at the tub boundary
            props.handleChange(fsa);
          }}
        />
      </>
    );
  };

  /* -------------------- wizard (authoring) -------------------- */

  WizardComponent = (props: BaseResponseAreaWizardProps) => {
    // Parse this.answer (string) into FSA for the wizard UI
    const fsaAnswer: FSA = (() => {
      if (!this.answer || typeof this.answer !== 'string') {
        return defaultFSA;
      }
      try {
        return JSON.parse(this.answer) as FSA;
      } catch {
        return defaultFSA;
      }
    })();

    return (
      <>
        <p>Wizard</p>
        <FSAInput
          {...props}
          answer={this.answer}
          onChange={(fsa: string) => {
            const serialized = fsa

            // Persist locally in the tub
            this.answer = serialized;

            // Notify the platform
            props.handleChange({
              responseType: this.responseType,
              answer: serialized,
            });
          }}
        />
      </>
    );
  };
}
