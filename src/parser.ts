import { suggestedRenames } from './matching'
import { extensionID } from './constants'
import * as vscode from 'vscode'
import { SSL_OP_NO_TLSv1 } from 'node:constants'

interface ISetModulesOptions {
  mods: string[]; 
  async: boolean; 
}

type EsriTypingFormat = 
  | "constructor"
  | "declared-module"

type SyntaxStyle = 
  | "async/await"
  | "promise"

export interface IEsriLoaderExtensionOptions {
  /** the alias to @types/arcgis-js-api typings */
  esriTypesPrefix: string;
  typingFormat: EsriTypingFormat;
  syntaxStyle: SyntaxStyle;
}


// lazy filter for esri modules ( "esri/*" )
const lazyFilter = (s: string) => /^(esri)\//.test(s)

// get actual module name
const getTail = (s: string) => s.split('/').slice(-1)[0]


export class EsriLoaderHelper {
  private editor: vscode.TextEditor;

  constructor(editor: vscode.TextEditor){
    this.editor = editor
  }

  public getMods(editor: vscode.TextEditor): string[] {
		if (!this.editor){
			const errMsg = "Editor does not exist!"
			vscode.window.showInformationMessage(errMsg);
			throw new Error(errMsg)
		}

		// get selected text
		const text = editor.document.getText(editor.selection);
		
		if (text.length){
			try {
				return JSON.parse(text.replace(/'/g, '"')).filter(lazyFilter) as string[]
			} catch(err){
				// not an array, might be a single string
				return [ text ].filter(lazyFilter)
			}
		} else {
			const errMsg = 'No text has been selected'
			vscode.window.showErrorMessage(errMsg)
			throw new Error(errMsg)
		}
	}

  public setLoadModules({ mods=[], async=true }: ISetModulesOptions): string {
    let sig = ''
    const names = []
    const types: string[] = []
  
    const config: IEsriLoaderExtensionOptions = vscode.workspace.getConfiguration(extensionID)
    const tabSize = typeof this.editor.options.tabSize == 'string' 
				? parseInt(this.editor.options.tabSize as string)
				: this.editor.options.tabSize
				|| 2

    const whitespace = this.editor.selection.start.character
    const defaultNamespace: string = config.esriTypesPrefix || '__esri'
    const typingFormat = config.typingFormat || 'constructor'
  
    // iterate over modules to build signature
    for (const mod of mods){
      const tail = getTail(mod)
      names.push(mod in suggestedRenames ? suggestedRenames[mod]: tail)
  
      // set typing,  example: __esri.FeatureLayer
      // edit: this is NOT the correct type, needs to be typeof import
      if (typingFormat === 'declared-module'){
        types.push(`typeof import("${mod}")`)
      } else {
        // probably not as safe, but seems to work most of the time 🤷
        types.push(`${defaultNamespace}.${tail}${tail.endsWith('Utils') || mod in suggestedRenames ? '': 'Constructor'}`) 
      }
    }
  
    // get formatting
    const multiLine = names.length > 2
    // get line prefix (whitespace)
    const prefix = whitespace ? ' '.repeat(whitespace): ''
    // tab generator
    const getTab = (level=1) => prefix + ' '.repeat(tabSize * level)
    // optional new line: if multiLine, do new line
    const optNL = multiLine ? '\n': ''
    // line wrapping function
    const wrapLine = (s: string, level: number=1) => multiLine 
      ? [optNL, getTab(level), s, optNL, prefix].join('')
      : s
    
    // esri vars, typings and module strings
    const varNames = names.join(multiLine ? `,\n${getTab()}`: ', ')
    const typeNames = types.join(multiLine ? `,\n${getTab()}`: ', ')

    // the formatted import modules
    const impMods = mods
      .map(m => `"${m}"`)
      .join(multiLine ? `,\n${getTab()}`: ', ')
  
    if (async){
      // use async/await pattern
      sig += `const [${wrapLine(varNames)}] = await loadModules<[${wrapLine(typeNames)}]>`
      sig += `([${wrapLine(impMods)}])`
    } else {
      // use regular promise
      const comment = `\n${getTab()}// esri related code here\n\n`
      sig += `loadModules<[${wrapLine(typeNames)}]>`
      sig += `([${wrapLine(impMods)}]).then(([${'\n' + getTab(1) + (wrapLine(varNames, 2).trimLeft())}]) => {${comment + prefix}})`
    }
    return sig
  }
}