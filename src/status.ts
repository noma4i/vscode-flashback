import * as vscode from 'vscode';

export class FlashbackStatus implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'git-flashback.showHistory';
    this.statusBarItem.text = '$(history) Flashback';
    this.statusBarItem.tooltip = 'Show Git file history';
    this.statusBarItem.show();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
