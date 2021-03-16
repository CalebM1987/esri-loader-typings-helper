import { suggestedRenames } from './matching'
import { extensionID, typescript_language_ids } from './constants'
import * as vscode from 'vscode'

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

export interface IEsriLoaderExtensionOptions extends vscode.WorkspaceConfiguration  {
  /** the alias to @types/arcgis-js-api typings */
  esriTypesPrefix: string;
  typingFormat: EsriTypingFormat;
  syntaxStyle: SyntaxStyle;
  catchError: boolean;
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

  /**
   * test for TypeScript, any special cases should be handled here
   * @returns 
   */
  public get isTypeScript(): boolean {
    const langId = this.editor.document.languageId
    console.log('LANGUAGE ID: ', langId)

    // strict handler for single file vue components (.vue file)
    if (langId === 'vue'){
      const range  = new vscode.Range(
        new vscode.Position(0, 0),
        this.editor.selection.start
      )
      const docText = this.editor.document.getText(range)
      // check for <script lang="ts"> tag 
      const scriptTs = /(\<script)(.*)(lang\=\"ts\")(.*)(\>)/
      return scriptTs.test(docText)
    }

    // any other "special" handlers here


    // default typescript ids
    return typescript_language_ids.includes(this.editor.document.languageId)
  }

  public setLoadModules({ mods=[], async=true }: ISetModulesOptions): string {
    // string builder
    let sb = ''
    const names = []
    const types: string[] = []
  
    const config = vscode.workspace.getConfiguration(extensionID) as IEsriLoaderExtensionOptions
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
    let prefix = whitespace ? ' '.repeat(whitespace): ''
    // make sure we are starting on a true tabbed position
    const adjustment = ' '.repeat(prefix.length % tabSize)
    prefix += adjustment

    // tab generator
    const getTab = (level=1) => prefix + ' '.repeat(tabSize * level)
    
    // optional new line: if multiLine, do new line
    const optNL = multiLine ? '\n': ''
    // optional tab, only use when multiline and/or async
    const optTB = config.catchError && multiLine && async
      ? getTab(0)
      : ''

    console.log(`optTB: "${optTB}"`)
    
    // line wrapping function
    const wrapLine = (s: string, level: number=1) => multiLine 
      ? [optNL, getTab(level), s, optNL, prefix].join('')
      : s
    
    // esri vars, typings and module strings
    const tabLevel = async && config.catchError ? 2: 1
    const varNames = names.join(multiLine ? `,\n${multiLine 
      ? getTab(async ? tabLevel: 2)
      : ''
    }`: ', ')
    const typeNames = types.join(multiLine ? `,\n${getTab(tabLevel)}`: ', ')

    // the formatted import modules
    const impMods = mods
      .map(m => `"${m}"`)
      .join(multiLine ? `,\n${getTab(tabLevel)}`: ', ')

    // check for TypeScript, if so add typings
    let isTS = false
    try {
      isTS = this.isTypeScript
    } catch(err){
      console.warn(err)
    }
    
    const typings = isTS
      ? `<[${multiLine ? getTab(): ''}${wrapLine(typeNames, tabLevel)}${optTB}]>`
      : ''
  
    const placeholder = 'work with esri modules here'
    const errComment = 'handle any script or module loading errors'

    // return loadModules() string builder code
    if (async){
      sb += adjustment
      sb += config.catchError ? `try {\n${getTab()}`: ''
      sb += `const [${wrapLine(varNames, tabLevel)}${optTB}] = await loadModules`
      sb += typings
      sb += `([${wrapLine(impMods, tabLevel)}${optTB}])\n\n`
      sb += `${getTab(config.catchError ? 1: 0)}// ${placeholder}`
      if (config.catchError){
        sb += `\n\n${getTab(0)}} catch (err) {\n${getTab()}// ${errComment}\n`
        sb += `${getTab()}console.error(err);\n${getTab(0)}}`
      }
    } else {
      // use regular promise
      const vars = `${(multiLine ? getTab(1): '') + (wrapLine(varNames, 2))}${multiLine ? getTab(0): ''}`
      const comment = `\n\n${getTab()}// ${placeholder}\n\n`

      // build string
      sb += `${adjustment}loadModules`
      sb += typings
      sb += `([${wrapLine(impMods)}])\n`
      sb += `${getTab(0)}.then(${multiLine ? '\n' + getTab(): ''}`
      sb += `([${vars}]) => {${comment + prefix}})\n`
      if (config.catchError){
        sb += `${getTab(0)}.catch((err) => {\n${getTab()}// ${errComment}\n`
        sb += `${getTab()}console.error(err);\n${getTab(0)}})`
      }
    }
    return sb
  }
}