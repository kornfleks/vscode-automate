import * as vscode from "vscode";
import automate, { CommandHandler } from "./automate";
import { showMesssage } from "./utils";

async function createAutomate(): Promise<CommandHandler | undefined> {
  try {
    return await automate();
  } catch (error) {}
}

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  let subscription: vscode.Disposable;

  const attach = async () => {
    try {
      const handler = await automate();
      subscription = vscode.commands.registerCommand(
        "automate.recipes",
        handler
      );
      context.subscriptions.push(subscription);
    } catch (error) {
      showMesssage(`An error occured: ${error}.`, "error");
    }
  };

  attach();

  vscode.workspace.onDidChangeConfiguration(async () => {
    subscription?.dispose();
    attach();
    showMesssage("Configuration reloaded", "info");
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
