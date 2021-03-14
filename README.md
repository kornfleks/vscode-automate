# vscode-automate

A vscode extension to create recipes of templates using ES module.

## Getting started

### Example

In this configuration, `root` is the path of the directory containing each template es module. There is two recipes named **Smart Component** and **Dumb Component**. Each recipe declares which template file will be used. Extension is not included because the template has to be ES module (`.js`). The recipe path is a `glob` that precises where the recipe are enabled.

```json
{
  "automate": {
    "root": ".vscode/templates",
    "recipes": [
      {
        "name": "Smart Component",
        "templates": ["component", "container", "index", "test"],
        "path": "src/components/app/**/[A-Z]*"
      },
      {
        "name": "Dumb Component",
        "templates": ["component", "css", "index"],
        "path": "src/components/cdk/**/[A-Z]*"
      }
    ]
  }
}
```

A template is an ES module exposing two functions called with a context.

```js
// .vscode/templates/component.js
module.exports = {
  getFileName: ({ name }) => `${name}.tsx`,
  getContent: ({ name }) => `
import { FC } from 'react'
import './${name}.css'

export type ${name}Props = {}

const ${name} : FC<${name}Props> = props => (

)

export default ${name}
`,
};
```

## Configuration

```json
{
  "automate": {
    "properties": {
      "root": {
        "type": "string",
        "default": ".vscode/templates",
        "description": "Root templates path."
      },
      "recipes": {
        "type": "array",
        "default": [],
        "description": "List of recipes.",
        "items": {
          "type": "object",
          "title": "recipe",
          "properties": {
            "name": {
              "type": "string",
              "required": true,
              "description": "Name of the template."
            },
            "templates": {
              "type": "array",
              "required": true,
              "items": {
                "type": "string",
                "required": true,
                "description": "Name of the template file located in the root folder (without extension)."
              }
            },
            "path": {
              "type": "string",
              "required": false,
              "description": "Glob string applied to relative workspace path in order to restrict template usage."
            },
            "root": {
              "type": "string",
              "required": false,
              "description": "Template files root path (joined to global root path)."
            }
          }
        }
      }
    }
  }
}
```

## Template Context

Passed as an argument of the functions exposed by template es module.

```ts
interface TemplateContext {
  name: string & {
    // hosting folderName, ex: /Foo Bar
    camel: string; // fooBar
    capital: string; // Foo Bar
    constant: string; // FOO_BAR
    dot: string; // Foo-Bar
    header: string; // foo bar
    param: string; // foo-bar
    pascal: string; // FooBar
    path: string; // foo/bar
    sentence: string; // Foo bar
    snake: string; // foo_bar
  };
  path: string; // path of the folder that will contains the file
  siblings: string[]; // others templates that will be executed in the recipe
}
```
