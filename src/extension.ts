import * as vscode from 'vscode';
import { extensionID } from './constants'
import { IEsriLoaderExtensionOptions, EsriLoaderHelper } from './parser';
import { log } from './logger';

export function activate(context: vscode.ExtensionContext) {
	log('activated esri-typings-helper')

	context.subscriptions.push(
		vscode.commands.registerCommand('esriLoaderTypingsHelper.loadModsWithDefaults', loadModsFromConfig)
	)

	context.subscriptions.push(
		vscode.commands.registerCommand('esriLoaderTypingsHelper.loadMods', loadModsOnFly)
	)
}

async function loadModsOnFly(){
	const config = vscode.workspace.getConfiguration(extensionID) as IEsriLoaderExtensionOptions

	// get text editor
	const editor = vscode.window.activeTextEditor
	if (!editor){
		vscode.window.showInformationMessage("Editor does not exist!");
		return;
	}

	const esriHelper = new EsriLoaderHelper(editor)
	
	try {

		// parse into array of desired modules
		const mods = esriHelper.getMods(editor)

		if (!mods.length){
			vscode.window.showErrorMessage('The selected text is not a valid array of esri modules')
			return;
		}

		// create quick pick menu to choose promise or async syntax
		const quickPick = vscode.window.createQuickPick()
		quickPick.title = 'Choose esri-loader Syntax'
		const asyncAwait = 'async/await'
		quickPick.items = [
			{ label: asyncAwait },
			{ label: 'promise' }
		]

		// build code replacement when user chooses syntax preference
		quickPick.onDidChangeSelection(async ([ choice ])=> {
			if (choice){
				// create code signature
				const sig = await esriHelper.setLoadModules({
					mods, 
					async: choice.label === asyncAwait, 
				})

				editor.edit((edit)=> {
					edit.replace(editor.selection, sig)
					vscode.window.showInformationMessage('Successfully set loadModules() function')
				})

				// hide quick pick
				quickPick.dispose()
			}
		})

		// dismiss quickPick on hide
		quickPick.onDidHide(()=> quickPick.dispose())

		// show quick pick menu
		quickPick.show()
	} catch(err){
		throw err;
	}

}

async function loadModsFromConfig(){

	// get text editor
	const editor = vscode.window.activeTextEditor
	if (!editor){
		vscode.window.showErrorMessage("Editor does not exist!");
		return;
	}

	const esriHelper = new EsriLoaderHelper(editor)

	// parse into array of desired modules
	try {
		const mods = esriHelper.getMods(editor)
		if (!mods.length){
			vscode.window.showErrorMessage('The selected text is not a valid array of esri modules')
			return;
		}

		const config = vscode.workspace.getConfiguration(extensionID) as IEsriLoaderExtensionOptions

		// const whitespace = editor.selection.start.character
		const sig = await esriHelper.setLoadModules({
			mods, 
			async: config.syntaxStyle === 'async/await'
		})
		
		editor.edit((edit)=> {
			edit.replace(editor.selection, sig)
			vscode.window.showInformationMessage('Successfully set loadModules() function with defaults')
		})

	} catch(err){
		throw err;
	}

}

// this method is called when your extension is deactivated
export function deactivate() {}
