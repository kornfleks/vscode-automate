import * as fs from "fs";
import * as path from "path";
import * as changeCase from "change-case";
import { getCurrentWorkspacePath, getFolderName, showMesssage } from "./utils";

interface TemplateContext {
  name: string & {
    camel: string;
    capital: string;
    constant: string;
    dot: string;
    header: string;
    param: string;
    pascal: string;
    path: string;
    sentence: string;
    snake: string;
  };
  path: string;
  siblings: string[];
}

interface Template {
  getFileName: (context: TemplateContext) => string;
  getContent: (context: TemplateContext) => string;
}

interface TemplateLocation {
  name: string;
  path: string;
}

export interface Recipe {
  name: string;
  templates: string[];
  root?: string;
  path?: string;
}

export const cook = (
  recipe: Recipe,
  dirPath: string,
  templates: Record<string, Template>
) => {
  const isDirectory =
    fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
  if (!isDirectory) {
    throw new Error("Selection is not a directory");
  }
  const name = getFolderName(dirPath);
  if (!name?.length) {
    throw new Error("Cannot extract directory name");
  }
  const context = {
    path: dirPath,
    siblings: recipe.templates,
    name: Object.assign(`${name}`, {
      camel: changeCase.camelCase(name),
      capital: changeCase.capitalCase(name),
      constant: changeCase.constantCase(name),
      dot: changeCase.dotCase(name),
      header: changeCase.headerCase(name),
      param: changeCase.paramCase(name),
      pascal: changeCase.pascalCase(name),
      path: changeCase.pathCase(name),
      sentence: changeCase.sentenceCase(name),
      snake: changeCase.snakeCase(name),
    }),
  };
  recipe.templates.forEach((key) => {
    if (!templates.hasOwnProperty(key)) {
      return;
    }
    const template = templates[key];
    try {
      const filePath = path.join(dirPath, template.getFileName(context));
      if (fs.existsSync(filePath)) {
        showMesssage(`File already exists: ${filePath}`, "error");
        return;
      }
      fs.writeFileSync(
        filePath,
        template.getContent(context).trim().concat("\n")
      );
    } catch {
      showMesssage("An unknown error occured", "error");
    }
  });
};

export const loadTemplates = async (
  templateLocations: TemplateLocation[]
): Promise<Record<string, Template>> => {
  const workspacePath = getCurrentWorkspacePath();
  if (!workspacePath) {
    throw new Error("Cannot find current workspace");
  }
  return (
    await Promise.all(
      templateLocations.map((location) =>
        (import(location.path) as Promise<Template>).then((template): [
          string,
          Template
        ] => [location.name, template])
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

export const collectTemplateLocations = (
  recipes: Recipe[],
  rootPath: string
): TemplateLocation[] =>
  recipes
    // build template location
    .map((recipe) => {
      const templateRootPath = path.join(rootPath, recipe.root ?? "");
      return recipe.templates.map((fileName) => ({
        name: fileName,
        path: path.join(templateRootPath, `${fileName}.js`),
      }));
    })
    // flatten array
    .reduce((acc, templateFilePaths) => [...acc, ...templateFilePaths], [])
    // remove duplicate
    .filter(
      (location, index, arr) =>
        arr.findIndex((item) => location.path === item.path) === index
    );
