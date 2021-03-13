# `esri-loader-typings-helper` Plugin

## coming soon to the VS Code Marketplace!!!

![preview](./previews/plugin-async.gif)

This plugin is designed for usage in TypeScript or JavaScript applications complete with helpers for loading [ArcGIS JavaScript API](https://developers.arcgis.com/javascript/latest/) modules using the [esri-loader](https://github.com/Esri/esri-loader) library.  In addition to creating the `loadModules` syntax for you automatically, it will also create type annotations (based on [@types/arcgis-js-api](https://www.npmjs.com/package/@types/arcgis-js-api)) for the imported modules.  This will attempt to guess what the appropriate types are, and may require some manual tweaking.

> note: When using regular JavaScript, the typings will not be added and will just construct the regular `loadModules()` syntax.

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



> Although Esri recently released the beta version of [arcgis-js-api](https://www.npmjs.com/package/arcgis-js-api) as an npm package, it does not yet appear to have good tree shaking capabilities and therefore any applications that use it have massive bundle files, even if only using a few modules.  Therefore, in the meantime using `esri-loader` will help keep your apps smaller and handle loading the ArcGIS JavaScript API through `<script>` tag lazy loading.

## Features

This plugin will allow you to quickly generate `loadModules()` code by simply providing the string array of modules you wish to import while supporting both the `async / await` pattern or `Promise` based syntax.  An example of each is shown below:

### async/await

![preview](./previews/plugin-async.gif)

### promise 

![preview](./previews/plugin-promise.gif)

### regular JavaScript

![preview-js](./previews/plugin-async-js.gif)


## Requirements

This plugin is designed for usage with the [esri-loader]() package for both JavaScript and TypeScript.  When using TypeScript, you will also want to reference the [@types/arcgis-js-api](https://www.npmjs.com/package/@types/arcgis-js-api) package.

to install the `esri-loader` as a regular dependency, simply use: 

npm:

```
npm i --save esri-loader
```

yarn:
```
yarn add esri-loader
```

to install the `@types/arcgis-js-api` as a dev dependency:

npm:
```
npm i --save-dev @types/arcgis-js-api
```

yarn:
```
yarn add --dev @types/arcgis-js-api
```

And then to reference the typings, add this to the top of a TypeScript file somewhere in your app:
```ts
/// <reference types="@types/arcgis-js-api" />
```

Doing the above will allow you to access esri types via the default declared namespace of `__esri`.  For example, to get the typing for a [FeatureLayer](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-FeatureLayer.html), use:

```ts
const featureLayer: __esri.FeatureLayer = someLayer
```

## Extension Settings

This extension contributes the following settings:

* `esriLoaderTypingsHelper.esriTypesPrefix`: the default prefix alias for the [@types/arcgis-js-api](https://www.npmjs.com/package/@types/arcgis-js-api). This defaults to the default declared namespace esri uses which is `__esri`.  Examples of how to change this are shown below.
* `esriLoaderTypingsHelper.typingFormat`: the desired format for the TypeScript typings (only applicable in TypeScript projects).  The default is `constructor`, which uses will attempt to guess the appropriate type.  This is accurate most of the time, but there may require some manual tweaking in some instances.  The other safer (but more ugly) option is to use `declared-module` which will use the `typeof import("esri/Map")` format.  These typings will always be correct because they use the declared module as defined in the `@types/arcgis-js-api` typings.  See examples below.
* `esriLoaderTypingsHelper.syntaxStyle`: the syntax style.  This defaults to the `async/await` pattern and also supports regular `promise` syntax.  The differences are shown below.

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
