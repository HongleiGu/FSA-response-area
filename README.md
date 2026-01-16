# Response Area Sandbox

Develop local TypeScript code to create custom response area types, and see them previewed live in the main application. When they're ready, provide your code to the Lambda Feedback team, who will consider including it in the main application after (human) review.

## FSA Response Section

please refer to [FSA.md](./FSA.md)

## Overview

To create a new response area type, you'll need to:

1. **Extend the base class**: Create a new class that extends `ResponseAreaTub`
2. **Define the expected configuration and answer types**: Set `configSchema`, and `answerSchema`
3. **Implement components**: Create `InputComponent` (shown to students and teachers) and `WizardComponent` (for configuration)

**📚 For detailed documentation on the `ResponseAreaTub` class and component props, see the inline code comments in [response-area-tub.ts](src/types/response-area-tub.ts) and [base-props.type.ts](src/types/base-props.type.ts) (they'll also show up in your IDE's autocomplete and hover tooltips).**

Find inspiration with the existing response area types in the repo - it's fine to copy/paste code between types to get started quickly.

## Development

### Setup locally

##### 1. Clone this repository

##### 2. Install Node

Recommended via [Nodenv](https://github.com/nodenv/nodenv) or [NVM](https://github.com/nvm-sh/nvm)

##### 3. Install Yarn and packages

```
npm install --global yarn
yarn
```

##### 4. Run the dev server

```sh
yarn dev 
```

This will serve your new reponse area type as a compiled IIFE bundle.

Note the Local URL (it should be something like `http://localhost:4173/`).

##### 5. (optional) Configure your new type in the code

Find the file at `src/types/Sandbox/index.ts` and set the value of `public readonly responseType` to the name of your type (usually in UPPER_CASE). It must be unique to the project. The default is `SANDBOX`.

##### 6. Configure the sandbox access on the app

Visit [`lambdafeedback.com/settings/sandbox`](https://www.lambdafeedback.com/settings/sandbox) and configure the sandbox with:
- **URL**: the URL found in step 4
- **Name**: the name of your new type. It must be the same as the name chosen in the previous step. `SANDBOX` is the default.

SAVE the configuration. The configuration is automatically saved in your browser.

Continue if:

- If you receive a 'Ready' message. 

Stop if you receive an error. Possible reasons:

- the URL may be incorrect (check and try again)
- the local server may not be running (return to Step 4)
- there may be a problem with the local server (return to Step 4)

##### 7. Check it works, and begin developing

You will need TEACHER access on the main application. Login as a TEACHER and add a response area, select the input and `SANDBOX` should be an option (or whatever you named the type to). 

Try changing the sandbox component, for example edit the placeholder text. You should see the response area update in real time (every 0.5s) in your browser.

Suggestion: find inspiration with the other types already created in the repo to get started quickly (it's fine to copy/paste code between types).

You component will auto-refresh within the app when you edit it.

_Pro tip: setup your text editor to follow the lint, formatting and type configurations set for the project._

### Troubleshooting

##### 1. Sandbox component is not loading

Inspect the browser console and make sure the iife file is found. 

##### 2. Sandbox component stopped refreshing

Reload the page.
If it keeps happening, check the browser console.

##### 3. A `[VOID]` component is shown

The response area type isn't available. This could be because:
- the sandbox isn't available anymore
- the type's name was changed

##### 4. `Error: Could not extract config` or `Error: Could not extract answer`

This is likely caused by a stored config/answer value in a response area that doesn't comply to the schema defined in the new response area tub class.
This can happen if you change the config/answer schema after having created/answered response areas. This isn't allowed.
To fix this, revert to the original schemas and delete the old response area(s) before changing the schemas.

### Note to LLM helpers

This sandbox works as follows. A production application runs in the browser, connected to a cloud-based backend. This sandbox repo runs a local server and serves up compiled js (but not a full web page). 

If the /sandbox/settings page on the app is updated, locally in the broswer, with the correct local URL for the server that this repo creates, then - only on the local machine, in the same browser - the locally-served, compiled js will be used directly within the app. 

Therefore, do not look for locally served web pages when debugging as they shouldn't be there. This repo does not serve a website.
