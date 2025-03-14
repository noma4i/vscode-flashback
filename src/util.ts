import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class Util {
  static findGitRoot(filePath: string): string | null {
    let currentDir = path.dirname(filePath);

    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, '.git'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  static getRelativePath(gitRoot: string, filePath: string): string {
    return path.relative(gitRoot, filePath);
  }

  static replaceContent(editor: vscode.TextEditor, content: string, languageId?: string): Thenable<boolean> {
    const fullRange = new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length)
    );

    return editor.edit(editBuilder => {
      editBuilder.replace(fullRange, content);
    }).then(() => {
      if (languageId) {
        vscode.languages.setTextDocumentLanguage(editor.document, languageId);
        return true;
      }
      return true;
    });
  }
}
