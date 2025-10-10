Here is a step-by-step path to wrap your existing Copilot server into a VS Code Chat extension so that it appears in the “@” picker in Copilot Chat.

---

## 1. Scaffold a VS Code Extension

1. Install the Yeoman generator for VS Code:

   ```bash
   npm install -g yo generator-code
   ```

2. Run the generator and choose **New Extension (TypeScript)**:

   ```bash
   yo code
   ```

   * Name: `agentic-copilot-vscode`
   * Identifier: `agentic-copilot`
   * Add TypeScript support

3. Open the generated folder in VS Code. You will see:

   * `package.json`
   * `src/extension.ts`
   * `tsconfig.json`

---

## 2. Define Copilot-Chat Plugin Contribution

In your `package.json`, add a `contributes.copilotPlugins` section that points to your server’s chat endpoint. For example:

```jsonc
{
  "name": "agentic-copilot-vscode",
  "displayName": "Agentic Copilot",
  "publisher": "your-publisher",
  "version": "0.1.0",
  "engines": { "vscode": "^1.93.0" },
  "categories": [ "Other" ],
  "activationEvents": [ "onCommand:agenticCopilot.start" ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "agenticCopilot.start",
        "title": "Start Agentic Copilot"
      }
    ],
    "copilotPlugins": [
      {
        "id": "agentic-co-pilot",
        "displayName": "Agentic Copilot",
        "description": "Your custom server-backed Copilot plugin",
        "url": "https://your-server.com/",
        "scopes": [ "chat" ],
        "auth": {
          "type": "gitHubToken"
        }
      }
    ]
  }
}
```

Key fields

* **id** must match your GitHub App plugin id
* **url** is your `server.js` base URL (ensure it supports CORS)
* **auth.type** set to `gitHubToken` so VS Code reuses the user’s Copilot login

---

## 3. Wire Up Extension Activation

In `src/extension.ts`, you need only register a dummy command. Copilot Chat will discover your plugin automatically from the manifest:

```ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('agenticCopilot.start', () => {
    vscode.window.showInformationMessage('Agentic Copilot is ready in the @ picker');
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}
```

* Build with `npm run compile`
* Run the “Launch Extension” debug configuration in VS Code

---

## 4. Enable Editor Preview Features

1. Ensure your VS Code is at least **1.93** or Insiders
2. Install the **GitHub Copilot Chat** extension
3. If you are on Copilot Business/Enterprise, have your org owner enable “Editor preview features” under **Settings → Copilot → Policies**

After that, restart VS Code.

---

## 5. Test Your Plugin

1. Open any file and invoke **Copilot Chat**
2. Type `@` then space – you should see **Agentic Copilot** in the list
3. Select it, send a message, and ensure it hits your `/` POST endpoint

---

## 6. Package & Publish

1. Update the `publisher` field in `package.json`
2. Run `vsce package` to create a `.vsix`
3. Publish to the VS Code Marketplace with `vsce publish` (you will need a publisher token)

---

### Templates & Examples

* **package.json snippet** above shows the minimal Copilot plugin registration
* **extension.ts** is the standard activation stub
* **server.js** remains unchanged – just ensure CORS and token forwarding

---

**Next steps**

* Add any custom configuration UI under `contributes.configuration` if you need user-settable options
* Handle retries and streaming in your server so that Copilot Chat shows progressive updates
* Benchmark cold start latency and optimize your endpoint for sub-second responses

Let me know if you need a runnable sample repo or more detail on any step.
