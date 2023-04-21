import * as vscode from 'vscode';

export const logger = vscode.window.createOutputChannel('esri-loader-typings-helper')

export const log = (...lines: any[]) => lines.forEach(l => logger.appendLine(l))