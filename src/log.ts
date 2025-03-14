import * as vscode from 'vscode';
import { execSync } from 'child_process';
import * as path from 'path';
import { HistoryItem } from './types';
import { Config } from './config';

export class Log {
  static async getHistoryItems(gitRoot: string, filePath: string): Promise<HistoryItem[]> {
    const relativePath = path.relative(gitRoot, filePath);
    const format = Config.getCommitFormat();
    const command = `git log --pretty=format:"${format}---" "${relativePath}"`;

    try {
      const output = execSync(command, { cwd: gitRoot, encoding: 'utf8' });
      const logs = output.split('---');

      return logs
        .map(log => {
          const parts = log.trim().split('\n');
          if (parts.length < 1) return null;

          let subject = '';
          let commitLine = '';
          let dateLine = '';

          if (parts.length >= 1) {
            subject = parts[0].replace(/^"|"$/g, '');
          }

          if (parts.length >= 2) {
            commitLine = parts[1].replace(/^"|"$/g, '');
          }

          if (parts.length >= 3) {
            dateLine = parts[2].replace(/^"|"$/g, '');
          }

          const commitMatch = commitLine.match(/\[([^\]]+)\]/);
          const subjectMatch = subject.match(/\[([^\]]+)\]/);
          const commit = commitMatch?.[1] || subjectMatch?.[1];

          if (!commit) return null;

          return {
            label: subject || commitLine,
            description: commitLine || dateLine,
            detail: dateLine || '',
            commit
          };
        })
        .filter(Boolean) as HistoryItem[];
    } catch (error) {
      throw new Error(`Can't get git log: ${(error as Error).message}`);
    }
  }

  static showDiff(editor: vscode.TextEditor, gitRoot: string, relativePath: string, commit: string, previousCommit?: string): void {
    try {
      const useExtendedDiff = Config.getUseExtendedDiff();

      console.log('Extended diff in showDiff:', useExtendedDiff, typeof useExtendedDiff);

      if (useExtendedDiff === true && previousCommit) {
        const command = `git diff --encoding=utf8 ${previousCommit} ${commit} -- "${relativePath}"`;
        const output = execSync(command, { cwd: gitRoot, encoding: 'utf8' });
        this.replaceContent(editor, output || 'No differences found', 'diff');
      } else {
        const command = `git show --encoding=utf8 ${commit}:"${relativePath}"`;
        const output = execSync(command, { cwd: gitRoot, encoding: 'utf8' });
        this.replaceContent(editor, output);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error showing diff: ${(error as Error).message}`);
    }
  }

  private static replaceContent(editor: vscode.TextEditor, content: string, languageId?: string): void {
    const fullRange = new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length)
    );

    editor.edit(editBuilder => {
      editBuilder.replace(fullRange, content);
    }).then(() => {
      if (languageId) {
        vscode.languages.setTextDocumentLanguage(editor.document, languageId);
      }
    });
  }
}
