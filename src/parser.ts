import { suggestedRenames } from './matching'
import { extensionID, typescript_language_ids } from './constants'
import { StringBuilder } from './builder'
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

const DEFAULT_PLACEHOLDER = '// work with esri modules here'
const DEFAULT_ERROR_COMMENT = '// handle any script or module loading errors'


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
		const text = this.editor.document.getText(this.editor.selection);
		
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
   * @returns boolean value to deterimin if editor is using typescript
   */
  public get isTypeScript(): boolean {
    const langId = this.editor.document.languageId
    //console.log('LANGUAGE ID: ', langId)

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

  private _addPlaceholder(sb: StringBuilder, indent=0, placeholderText=DEFAULT_PLACEHOLDER){ 
    // empty line
    sb.addLine('')
    sb.addLine(placeholderText, { indent })
    sb.addLine('')
  }

  private _addCatchBlock(sb: StringBuilder, useAsync=true){
    const consoleErr = 'console.error(error)'
    if (useAsync){
      // catch block
      sb.addLine('} catch (error) { ')
      sb.addLine(DEFAULT_ERROR_COMMENT, { indent: 1 })
      sb.addLine(consoleErr, { indent: 1 })
      sb.addLine('}')
    } else {
      // promise rejection catch
      sb.addLine('.catch((error) => {')
      sb.addLine(DEFAULT_ERROR_COMMENT, { indent: 1 })
      sb.addLine(consoleErr, { indent: 1 })
      sb.addLine('})')
    }
  }

  /**
   * creates the loadModules() code snippet
   * @param {ISetModulesOptions} options - options for creating the code snippet
   * @returns the generated snippet
   */
  public setLoadModules({ mods=[], async=true }: ISetModulesOptions): string {

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
        types.push(`${defaultNamespace}.${tail}${
          tail.endsWith('Utils') || mod in suggestedRenames 
            ? ''
            : 'Constructor'
        }`) 
      }
    }
  
    // make sure we are starting on a true tabbed position
    const adjustment = whitespace % tabSize

    // check for TypeScript, if so add typings
    let isTS = false
    try {
      isTS = this.isTypeScript
    } catch(err){
      console.warn(err)
    }

    // get formatting
    const modNames = mods.map(m => `"${m}"`)
    const multiLine = names.length > (isTS ? 1: 3)

    // create string builder
    const sb = new StringBuilder(whitespace + adjustment, tabSize)

    if (async){
      // use async/await syntax
      // set baseIndent
      let baseIndent = 0
      if (config.catchError){
        sb.addLine('try {')
        baseIndent = 1
      }
      // set async syntax
      if (multiLine){
        sb.addLine('const [', { indent: baseIndent })
        // destructure var names over multiple lines
        names.forEach(v => {
          sb.addLine(v + ',', { indent: baseIndent + 1 })
        })
        // close off var names and call loadModules
        sb.addLine(`] = await loadModules${isTS ? '<[': '(['}`, { indent: baseIndent })
        if (isTS){
          // add typings
          if (multiLine){
            types.forEach(t => {
              sb.addLine(t + ',', { indent: baseIndent + 1 })
            })
          }

          // close off typings
          sb.addLine(']>([', { indent: baseIndent })
        } 

        // add module names
        modNames.forEach(m => {
          sb.addLine(m + ',', { indent: baseIndent + 1 })
        })

        // close imported modules
        sb.addLine('])', { indent: baseIndent })
        // add placeholder
        this._addPlaceholder(sb, baseIndent)
       
      } else {
        // destructure into single line
        const varNames = names.join(', ')
        const typings = isTS ? `<[${types.join(', ')}]>`: ''
        const modArray = `[${modNames.join(', ')}]`
        const parts = [
          `const [${varNames}]`,
          `= await loadModules${typings}(${modArray})`
        ].join(' ')

        // add joined string
        sb.addLine(parts, { indent: baseIndent })

        // add placeholder
        this._addPlaceholder(sb, baseIndent)
      }

      // add catch block
      if (config.catchError){
        this._addCatchBlock(sb, async)
      }

      return sb.text
      
    } else {
      // use regular promise
      if (multiLine){

        sb.addLine(`loadModules${isTS ? '<[': '(['}`)

        if (isTS){
          // add typings
          types.forEach(t => {
            sb.addLine(t + ',', { indent: 1 })
          })
  
          // close off typings
          sb.addLine(']>([')
        } 

        // add module names
        modNames.forEach(m => {
          sb.addLine(m + ',', { indent: 1 })
        })
        sb.addLine('])')

        // add destructured vars
        sb.addLine('.then(([')
        names.forEach(n => {
          sb.addLine(n + ',', { indent: 1 })
        })

        // close vars
        sb.addLine(']) => {')

        // promise callback
        this._addPlaceholder(sb, 1)
        sb.addLine('})')

      } else {
        // single line
        const typings = isTS ? `<[${types.join(', ')}]>`: ''
        const modArray = `[${modNames.join(', ')}]`
        
        sb.addLine(`loadModules${typings}(${modArray})`)
        // promise callback
        sb.addLine(`.then(([${names.join(', ')}]) => {`)
        this._addPlaceholder(sb, 1)
        sb.addLine('})')
      }

      // catch block
      if (config.catchError){
        this._addCatchBlock(sb, async)
      }

      return sb.text
    }
  }
}