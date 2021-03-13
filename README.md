# `esri-loader-typings-helper` Plugin

This plugin is designed for usage in TypeScript applications complete with helpers for loading [ArcGIS JavaScript API](https://developers.arcgis.com/javascript/latest/) modules using the [esri-loader](https://github.com/Esri/esri-loader) library.  In addition to creating the `loadModules` syntax for you automatically, it will also create type annotations (based on [@types/arcgis-js-api](https://www.npmjs.com/package/@types/arcgis-js-api)) for the imported modules.  This will attempt to guess what the appropriate types are, and may require some manual tweaking.

Here is an example of how to use the esri loader:

```ts
// to use a specific version of esri-loader, include the @version in the URL for example:
import { loadModules } from "esri-loader";

const main = async () => {
  const [MapView, WebMap] = await loadModules(['esri/views/MapView', 'esri/WebMap']);
  // use MapView and WebMap classes as shown above
}
main();
```

using this plugin, you can simply just provide the array of module names to load and the plugin will do the rest by highlighting the following code:

`['esri/views/MapView', 'esri/WebMap']`

will get automatically converted to this with the appropriate typings: 

```ts
const [MapView, WebMap] = await loadModules<[__esri.MapViewConstructor, __esri.WebMapConstructor]>(["esri/views/MapView", "esri/WebMap"])
```

Just using the `esri-loader` out of the box with TypeScript, you will not actually get type inferences based on the imported modules and you will actually have to set them yourself manually if you want good auto complete help.  By default, all destructured modules will have the `any` type.  See example below:

![map any type](./previews/images/map-any-type.png)

Since this plugin will automatically add the types (or at least a quick and dirty guess), most modules should be properly typed:

![map proper type](./previews/images/map-proper-type.png)


Although Esri recently released the beta version of [arcgis-js-api](https://www.npmjs.com/package/arcgis-js-api) as an npm package, it does not yet appear to have good tree shaking capabilities and therefore any applications that use it have massive bundle files, even if only using a few modules.  Therefore, in the meantime using `esri-loader` will help keep your apps smaller and handle loading the ArcGIS JavaScript API through `<script>` tag lazy loading.

## Features

This plugin will allow you to quickly generate `loadModules()` code by simply providing the string array of modules you wish to import while supporting both the `async / await` pattern or `Promise` based syntax.  An example of each is shown below:

### async/await

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

-----------------------------------------------------------------------------------------------------------
## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

**Note:** You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+CMD+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (macOS) to see a list of Markdown snippets

### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
