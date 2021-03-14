import * as vscode from "vscode";
import * as path from "path";

export const getCurrentWorkspacePath = (): string => {
  const folders = vscode.workspace.workspaceFolders;
  const currentWorkspacePath = folders?.[0]?.uri.path;
  if (!currentWorkspacePath) {
    throw new Error("Cannot find current workspace path");
  }
  return currentWorkspacePath;
};

export const getDirPath = (folder: any) =>
  folder?.fsPath ??
  path.dirname(vscode.window.activeTextEditor?.document?.fileName ?? "");

export const getFolderName = (path: string): string | undefined => {
  const parts = path.replace(/\/$/, "").split("/");
  return parts[parts.length - 1];
};

export const showMesssage = (message: string, type: "info" | "error") => {
  const formattedMessage = `[Automate] ${message}`;
  if (type === "info") {
    vscode.window.showInformationMessage(formattedMessage);
  }
  vscode.window.showErrorMessage(formattedMessage);
};
