import * as path from "path";
import * as vscode from "vscode";
// this dependency have to be imported this way :'(
const minimatch = require("minimatch");
import {
  collectTemplateLocations,
  cook,
  loadTemplates,
  Recipe,
} from "./recipe";
import { getCurrentWorkspacePath, getDirPath, showMesssage } from "./utils";

interface Configuration {
  root: string;
  recipes: Recipe[];
}

export interface CommandHandler {
  (folder?: { fsPath: string }): void;
}

const unconfiguredWorkspaceHandler: CommandHandler = () => {
  return showMesssage("Your current workspace is not configured.", "error");
};

export function getRootPath(config: Configuration): string {
  const currentWorkspacePath = getCurrentWorkspacePath();
  return path.join(currentWorkspacePath, config.root ?? ".vscode/templates");
}

export function getConfiguration(): Configuration | undefined {
  const workbenchConfig = vscode.workspace.getConfiguration("automate");
  if (!workbenchConfig) {
    // doesn't throw error if configuration is not found
    return undefined;
  }
  return {
    root: (workbenchConfig.get("root") as Configuration["root"]) || "",
    recipes: (workbenchConfig.get("recipes") as Configuration["recipes"]) || [],
  };
}

export default async function createAutomate(): Promise<CommandHandler> {
  const config = getConfiguration();
  if (!config) {
    return unconfiguredWorkspaceHandler;
  }
  const workspacePath = getCurrentWorkspacePath();
  const templateLocations = collectTemplateLocations(
    config.recipes,
    path.join(workspacePath, config.root)
  );
  const templates = await loadTemplates(templateLocations);

  return (folder) => {
    try {
      const dirPath = getDirPath(folder);
      const relativeDirPath = path.relative(workspacePath, dirPath);
      const matchingRecipe = config.recipes.filter((recipe) => {
        if (recipe.path && !minimatch(relativeDirPath, recipe.path)) {
          return false;
        }
        return true;
      });
      if (matchingRecipe.length === 0) {
        return showMesssage(
          `No recipe matches the selected path: "${relativeDirPath}"`,
          "info"
        );
      }
      const quickPick = vscode.window.createQuickPick();
      quickPick.items = matchingRecipe.map((recipe) => ({
        label: recipe.name,
      }));
      quickPick.onDidAccept(() => {
        const { label } = quickPick.selectedItems[0];
        const selectedRecipe = matchingRecipe.find(
          ({ name }) => name === label
        );
        if (!selectedRecipe) {
          return showMesssage(
            `An unknown error occured: ${"Could not find matching recipe"}`,
            "error"
          );
        }
        quickPick.dispose();
        cook(selectedRecipe, dirPath, templates);
      });
      quickPick.show();
    } catch (error) {
      return showMesssage(`An error occured: ${error}`, "error");
    }
  };
}
