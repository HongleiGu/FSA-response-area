// FSAResponseArea.tub.ts
import { BaseResponseAreaProps, BaseResponseAreaWizardProps } from '../base-props.type';
import { ResponseAreaTub } from '../response-area-tub';

import { FSAInput } from './FSA.component';
import { fsaAnswerSchema, FSA, defaultFSA } from './type';

export class FSAResponseAreaTub extends ResponseAreaTub {
  public readonly responseType = 'FSA';
  public readonly displayWideInput = true;
  protected answerSchema = fsaAnswerSchema;
  protected answer: FSA = defaultFSA;

  initWithConfig = (config: any) => {
    this.config = config // config is not used for now
    this.answer = defaultFSA
  }

  customCheck = () => {} // will set this up later

  InputComponent = (props: BaseResponseAreaProps) => {
    // Always derive a local FSA value
    console.log('FSA InputComponent props.answer:', props.answer, typeof props.answer);
    const fsaAnswer: FSA = (() => {
      if (!props.answer) return defaultFSA;
      if (typeof props.answer === 'string') {
        try {
          return JSON.parse(props.answer);
        } catch {
          return defaultFSA;
        }
      }

      return props.answer as FSA;
    })();

    return (
      <>
        <p>Input Component</p>
        <FSAInput
          {...props}
          answer={fsaAnswer}
          onChange={(answer) => {
            props.handleChange(JSON.stringify(answer));
          }}
        />
      </>
    );
  };

  WizardComponent = (props: BaseResponseAreaWizardProps) => {
    return (
      <FSAInput
        {...props}
        answer={this.answer}
        onChange={answer => {
          this.answer = answer
          props.handleChange({
            responseType: this.responseType,
            answer,
          });
        }}
      />
    );
  }
}