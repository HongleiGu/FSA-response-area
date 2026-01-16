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

  InputComponent = (props: BaseResponseAreaProps) => {
    const parsedAnswer = this.answerSchema.safeParse(props.answer);
    return (
      <FSAInput
        {...props}
        answer={parsedAnswer.success ? parsedAnswer.data : defaultFSA}
        onChange={(val) => props.handleChange(val)}
      />
    );
  }

  WizardComponent = (props: BaseResponseAreaWizardProps) => {
    return (
      <FSAInput
        answer={this.answer}
        onChange={answer => {
          props.handleChange({
            responseType: this.responseType,
            answer,
          });
        }}
      />
    );
  }
}