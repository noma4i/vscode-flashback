import * as vscode from 'vscode';

import { SettingsWebviewProvider } from './settingsWebview';
import { FlashbackStatus } from './status';
import { Util } from './util';
import { Log } from './log';
import { HistoryItem } from './types';

export async function activate(context: vscode.ExtensionContext) {
  const settingsProvider = new SettingsWebviewProvider(context);
  const statusBar = new FlashbackStatus();

  let settingsCommand = vscode.commands.registerCommand('git-flashback.openSettings', () => {
    settingsProvider.show();
  });

  let disposable = vscode.commands.registerCommand('git-flashback.showHistory', async function () {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const gitRoot = Util.findGitRoot(filePath);

    if (!gitRoot) {
      vscode.window.showErrorMessage('This file is not in a git repository');
      return;
    }

    const relativePath = Util.getRelativePath(gitRoot, filePath);

    const originalLanguageId = editor.document.languageId;

    try {
      const items = await Log.getHistoryItems(gitRoot, filePath);

      const currentEditorContent = editor.document.getText();

      const allItems: HistoryItem[] = [
        { label: 'Current State', description: 'Uncommitted changes', detail: '', commit: 'CURRENT' },
        ...items
      ];

      let firstRender = true;

      const originalContent = editor.document.getText();

      let previousItem: HistoryItem | null = null;
      let currentItem: HistoryItem | null = null;

      const picked = await vscode.window.showQuickPick(allItems, {
        placeHolder: 'Select a commit to view',
        onDidSelectItem: (item: HistoryItem) => {
          if (firstRender) {
            firstRender = false;
            return;
          }

          previousItem = currentItem;
          currentItem = item;

          const config = vscode.workspace.getConfiguration('git-flashback');
          const useExtendedDiff = config.get('useExtendedDiff');

          console.log('Extended diff mode active:', useExtendedDiff, typeof useExtendedDiff);

          if (useExtendedDiff !== true || !previousItem) {
            if (item.commit === 'CURRENT') {
              Util.replaceContent(editor, currentEditorContent);
            } else {
              Log.showDiff(editor, gitRoot, relativePath, item.commit);
            }
          } else {
            let prevCommit = previousItem.commit === 'CURRENT' ? 'HEAD' : previousItem.commit;
            let currentCommit = item.commit === 'CURRENT' ? 'HEAD' : item.commit;

            if (item.commit === 'CURRENT' || previousItem.commit === 'CURRENT') {
              try {
                const command = `git diff -- "${relativePath}"`;
                const output = require('child_process').execSync(command, { cwd: gitRoot, encoding: 'utf8' });
                Util.replaceContent(editor, output || 'No differences found', 'diff');
              } catch (error) {
                vscode.window.showErrorMessage(`Error showing diff: ${(error as Error).message}`);
              }
            } else {
              Log.showDiff(editor, gitRoot, relativePath, currentCommit, prevCommit);
            }
          }
        }
      });

      if (!picked) {
        Util.replaceContent(editor, originalContent, originalLanguageId);
      } else if (picked.commit === 'CURRENT') {
        Util.replaceContent(editor, currentEditorContent, originalLanguageId);
      } else {
        Log.showDiff(editor, gitRoot, relativePath, picked.commit);
        vscode.languages.setTextDocumentLanguage(editor.document, originalLanguageId);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${(error as Error).message}`);
    }
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(settingsCommand);
  context.subscriptions.push(statusBar);
}

export function deactivate() { }
