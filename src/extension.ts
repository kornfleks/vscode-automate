// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as _path from "path";

interface Template {
  getFileName: (name: string) => string;
  getContent: (name: string, templateKeys: string[]) => string;
}

const getCurrentWorkspacePath = (): vscode.WorkspaceFolder | undefined => {
  const folders = vscode.workspace.workspaceFolders;
  return folders?.[0];
};

const createWatcher = (
  dir: string,
  templateKeys: string[],
  templates: Record<string, Template>
) => {
  const workspacePath = getCurrentWorkspacePath();
  if (!workspacePath) return;
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspacePath, `${dir.replace(/\/$/, "")}/**`)
  );
  watcher.onDidCreate(({ path }) => {
    const isDirectory = fs.existsSync(path) && fs.lstatSync(path).isDirectory();
    if (!isDirectory) return;
    const match = path.match(/.*\/([A-Z][^\/]*)$/);
    if (!match) return;
    const name = match[1];
    if (!name?.length) return;

    templateKeys.forEach((key) => {
      if (!templates.hasOwnProperty(key)) return;
      const template = templates[key];
      fs.writeFileSync(
        _path.join(path, template.getFileName(name)),
        template.getContent(name, templateKeys)
      );
    });
  });
};

const loadTemplates = async (
  path: string
): Promise<Record<string, Template>> => {
  const workspacePath = getCurrentWorkspacePath();
  if (!workspacePath) throw new Error("Cannot find current workspace");
  const templateDirPath = _path.join(workspacePath.uri.path, path);
  const fileNames = fs.readdirSync(templateDirPath);
  return (
    await Promise.all(
      fileNames.map((fileName) =>
        (import(
          _path.join(templateDirPath, fileName)
        ) as Promise<Template>).then((template): [string, Template] => [
          fileName.replace(".js", ""),
          template,
        ])
      )
    )
  ).reduce(
    (acc, [name, template]) => ({
      ...acc,
      [name]: template,
    }),
    {}
  );
};

export function activate() {
  const workbenchConfig = vscode.workspace.getConfiguration("automate");
  if (!workbenchConfig) return;
  const templatesPath = (workbenchConfig.get("templates") as { path: string })
    .path;
  const dirs = workbenchConfig.get("dirs") as { [key: string]: string[] };
  if (!dirs || !templatesPath) return;
  (async () => {
    const templates = await loadTemplates(templatesPath);
    Object.entries(dirs).forEach(([dir, templateKeys]) =>
      createWatcher(dir, templateKeys, templates)
    );
  })();
  console.log(dirs, Object.entries(dirs));
}

// this method is called when your extension is deactivated
export function deactivate() {}
