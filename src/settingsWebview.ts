import * as vscode from 'vscode';
import { FlashbackSettings } from './types';

export class SettingsWebviewProvider {
  private context: vscode.ExtensionContext;
  private panel: vscode.WebviewPanel | null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.panel = null;
  }

  show(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'flashbackSettings',
      'Git Flashback Settings',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    this.panel.webview.html = this.getWebviewContent();

    this.panel.onDidDispose(
      () => { this.panel = null; },
      null,
      this.context.subscriptions
    );

    this.panel.webview.onDidReceiveMessage(
      message => {
        if (message.command === 'saveSettings') {
          this.saveSettings(message.settings);
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private saveSettings(settings: FlashbackSettings): void {
    const config = vscode.workspace.getConfiguration('git-flashback');

    try {
      const updatePromises = [
        config.update('useCustomFormat', !!settings.useCustomFormat, vscode.ConfigurationTarget.Global),
        config.update('commitFormat', settings.commitFormat, vscode.ConfigurationTarget.Global),
        config.update('showSubject', settings.showSubject, vscode.ConfigurationTarget.Global),
        config.update('showHash', settings.showHash, vscode.ConfigurationTarget.Global),
        config.update('showAuthor', settings.showAuthor, vscode.ConfigurationTarget.Global),
        config.update('showEmail', settings.showEmail, vscode.ConfigurationTarget.Global),
        config.update('showDate', settings.showDate, vscode.ConfigurationTarget.Global),
        config.update('showRelativeDate', settings.showRelativeDate, vscode.ConfigurationTarget.Global),
        config.update('useExtendedDiff', settings.useExtendedDiff, vscode.ConfigurationTarget.Global)
      ];

      Promise.all(updatePromises).then(() => {
        console.log('Settings saved successfully:', settings);

        const savedConfig = vscode.workspace.getConfiguration('git-flashback');
        const savedMode = savedConfig.get('useCustomFormat');
        console.log('Settings verified - useCustomFormat:', savedMode);

        vscode.window.showInformationMessage('Git Flashback settings updated');
      }).catch(error => {
        console.error('Error saving settings:', error);
        vscode.window.showErrorMessage('Failed to save Git Flashback settings');
      });
    } catch (error) {
      console.error('Error in settings update process:', error);
      vscode.window.showErrorMessage('Failed to process Git Flashback settings');
    }
  }

  private _getDefaultSettings(): FlashbackSettings {
    const config = vscode.workspace.getConfiguration('git-flashback');

    console.log('Reading current configuration:', config);

    return {
      useCustomFormat: this._getConfigValue<boolean>(config, 'useCustomFormat', false),
      commitFormat: this._getConfigValue<string>(config, 'commitFormat', '%s%n[%h] %cN (%ce)%n%cD (%cr)'),
      showSubject: this._getConfigValue<boolean>(config, 'showSubject', true),
      showHash: this._getConfigValue<boolean>(config, 'showHash', true),
      showAuthor: this._getConfigValue<boolean>(config, 'showAuthor', true),
      showEmail: this._getConfigValue<boolean>(config, 'showEmail', true),
      showDate: this._getConfigValue<boolean>(config, 'showDate', true),
      showRelativeDate: this._getConfigValue<boolean>(config, 'showRelativeDate', true),
      useExtendedDiff: this._getConfigValue<boolean>(config, 'useExtendedDiff', false)
    };
  }

  private _getConfigValue<T>(config: vscode.WorkspaceConfiguration, key: string, defaultValue: T): T {
    const value = config.get<T>(key);
    console.log(`Config value for ${key}:`, value, typeof value);
    return value !== undefined ? value : defaultValue;
  }

  private getWebviewContent(): string {
    const settings = this._getDefaultSettings();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Git Flashback Settings</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
            }
            h1, h2, h3 {
                color: var(--vscode-titleBar-activeForeground, var(--vscode-editor-foreground));
                margin-top: 20px;
                margin-bottom: 10px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                color: var(--vscode-foreground);
            }
            input[type="text"] {
                width: 100%;
                padding: 8px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
            }
            .checkbox-group {
                margin-top: 20px;
            }
            .checkbox-item {
                margin-bottom: 15px;
                display: flex;
                align-items: center;
            }
            .checkbox-item input[type="checkbox"] {
                margin-right: 8px;
                width: 16px;
                height: 16px;
            }
            .checkbox-item label {
                display: inline;
                font-size: 14px;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                cursor: pointer;
                margin-top: 15px;
                border-radius: 2px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .preview {
                margin-top: 20px;
                padding: 10px;
                border: 1px solid var(--vscode-panel-border, var(--vscode-input-border));
                border-radius: 4px;
            }
            .preview-item {
                margin-bottom: 6px;
                padding: 2px 0;
                white-space: pre-wrap;
                color: var(--vscode-foreground);
                display: flex;
                align-items: center;
            }
            .preview-item:last-child {
                margin-bottom: 0;
            }
            .preview-item strong {
                color: var(--vscode-editorLineNumber-activeForeground, var(--vscode-foreground));
                margin-right: 8px;
                width: 100px;
                display: inline-block;
                text-align: right;
            }
            .tabs {
                display: flex;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--vscode-panel-border, var(--vscode-input-border));
            }
            .tab {
                padding: 8px 16px;
                cursor: pointer;
                background-color: transparent;
                border: none;
                color: var(--vscode-foreground);
                opacity: 0.7;
                font-size: 14px;
            }
            .tab.active {
                border-bottom: 2px solid var(--vscode-button-background);
                opacity: 1;
                font-weight: bold;
            }
            .tab-content {
                display: none;
            }
            .tab-content.active {
                display: block;
            }
            .placeholders {
                margin-top: 20px;
                font-size: 14px;
                border: 1px solid var(--vscode-panel-border, var(--vscode-input-border));
                border-radius: 4px;
                padding: 10px;
            }
            .placeholder-item {
                margin-bottom: 8px;
                display: flex;
            }
            .placeholder-item strong {
                width: 60px;
                margin-right: 10px;
                color: var(--vscode-editorLineNumber-activeForeground, var(--vscode-foreground));
            }
            .placeholder-desc {
                color: var(--vscode-descriptionForeground, var(--vscode-foreground));
                opacity: 0.8;
            }
            .diff-mode-group {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--vscode-panel-border, var(--vscode-input-border));
            }
        </style>
    </head>
    <body>
        <h1>Git Flashback Settings</h1>

        <div class="tabs">
            <button class="tab active" data-tab="standard">Standard Mode</button>
            <button class="tab" data-tab="advanced">Advanced Mode</button>
        </div>

        <div id="standard-tab" class="tab-content active">
            <h2>Display Options</h2>
            <p>Configure what information is shown in the commit history list.</p>

            <div class="checkbox-group">
                <div class="checkbox-item">
                    <input type="checkbox" id="showSubject" ${settings.showSubject ? 'checked' : ''}>
                    <label for="showSubject">Show commit subject</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="showHash" ${settings.showHash ? 'checked' : ''}>
                    <label for="showHash">Show commit hash</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="showAuthor" ${settings.showAuthor ? 'checked' : ''}>
                    <label for="showAuthor">Show author name</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="showEmail" ${settings.showEmail ? 'checked' : ''}>
                    <label for="showEmail">Show author email</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="showDate" ${settings.showDate ? 'checked' : ''}>
                    <label for="showDate">Show commit date</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="showRelativeDate" ${settings.showRelativeDate ? 'checked' : ''}>
                    <label for="showRelativeDate">Show relative date (e.g., 2 days ago)</label>
                </div>
            </div>

            <div class="preview">
                <h3>Preview</h3>
                <div id="standard-preview">
                    <div class="preview-item"><strong>Subject:</strong> <span id="preview-subject">Fix bug with file navigation</span></div>
                    <div class="preview-item"><strong>Commit info:</strong> <span id="preview-commit">[4a5c3d2] John Doe (john@example.com)</span></div>
                    <div class="preview-item"><strong>Date info:</strong> <span id="preview-date">Thu, 14 Mar 2025 14:30:45 +1100 (3 days ago)</span></div>
                </div>
            </div>

            <div class="diff-mode-group">
                <h3>Comparison Mode</h3>
                <div class="checkbox-item">
                    <input type="checkbox" id="useExtendedDiff" ${settings.useExtendedDiff ? 'checked' : ''}>
                    <label for="useExtendedDiff">Show diff between commits instead of file content when navigating</label>
                </div>
            </div>
        </div>

        <div id="advanced-tab" class="tab-content">
            <h2>Custom Format String</h2>
            <p>Configure a custom git log format string for complete control over the displayed information.</p>

            <div class="checkbox-item">
                <input type="checkbox" id="useCustomFormat" ${settings.useCustomFormat ? 'checked' : ''}>
                <label for="useCustomFormat">Use custom format string</label>
            </div>

            <div class="form-group">
                <label for="commitFormat">Format string:</label>
                <input type="text" id="commitFormat" value="${settings.commitFormat}" ${!settings.useCustomFormat ? 'disabled' : ''}>
            </div>

            <div class="placeholders">
               <div class="format-helper">
                    <h3>Format Help</h3>
                    <p>Common placeholders:</p>
                    <ul>
                        <li><code>%s</code> - Subject (commit message)</li>
                        <li><code>%h</code> - Abbreviated commit hash</li>
                        <li><code>%H</code> - Full commit hash</li>
                        <li><code>%cN</code> - Committer name</li>
                        <li><code>%ce</code> - Committer email</li>
                        <li><code>%cD</code> - Committer date (RFC2822 style)</li>
                        <li><code>%cr</code> - Committer date (relative)</li>
                        <li><code>%n</code> - New line</li>
                    </ul>
                    <p>See <a href="https://git-scm.com/docs/pretty-formats" title="https://git-scm.com/docs/pretty-formats">Git Documentation</a> for full list of placeholders.</p>
                </div>
            </div>
        </div>

        <button id="saveButton">Save Settings</button>

        <script>
            (function() {
                // Tab switching
                const tabs = document.querySelectorAll('.tab');
                const tabContents = document.querySelectorAll('.tab-content');

                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const targetTab = tab.getAttribute('data-tab');

                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(c => c.classList.remove('active'));

                        tab.classList.add('active');
                        document.getElementById(targetTab + '-tab').classList.add('active');
                    });
                });

                // Preview update for standard mode
                function updateStandardPreview() {
                    const showSubject = document.getElementById('showSubject').checked;
                    const showHash = document.getElementById('showHash').checked;
                    const showAuthor = document.getElementById('showAuthor').checked;
                    const showEmail = document.getElementById('showEmail').checked;
                    const showDate = document.getElementById('showDate').checked;
                    const showRelativeDate = document.getElementById('showRelativeDate').checked;

                    document.querySelector('#preview-subject').parentElement.style.display =
                        showSubject ? 'flex' : 'none';

                    let commitInfo = '';
                    if (showHash) commitInfo += '[4a5c3d2]';
                    if (showAuthor) commitInfo += (commitInfo ? ' ' : '') + 'John Doe';
                    if (showEmail) commitInfo += (commitInfo ? ' ' : '') + '(john@example.com)';

                    document.querySelector('#preview-commit').textContent = commitInfo;
                    document.querySelector('#preview-commit').parentElement.style.display =
                        commitInfo ? 'flex' : 'none';

                    let dateInfo = '';
                    if (showDate) dateInfo += 'Thu, 14 Mar 2025 14:30:45 +1100';
                    if (showRelativeDate) dateInfo += (dateInfo ? ' ' : '') + '(3 days ago)';

                    document.querySelector('#preview-date').textContent = dateInfo;
                    document.querySelector('#preview-date').parentElement.style.display =
                        dateInfo ? 'flex' : 'none';
                }

                // Custom format toggle
                const useCustomFormat = document.getElementById('useCustomFormat');
                const commitFormat = document.getElementById('commitFormat');

                useCustomFormat.addEventListener('change', function() {
                    commitFormat.disabled = !this.checked;
                });

                // Standard mode option change listeners
                const standardOptions = ['showSubject', 'showHash', 'showAuthor', 'showEmail',
                                        'showDate', 'showRelativeDate'];
                standardOptions.forEach(id => {
                    document.getElementById(id).addEventListener('change', updateStandardPreview);
                });

                // Initial preview update
                updateStandardPreview();

                // Save button
                document.getElementById('saveButton').addEventListener('click', function() {
                    const settings = {
                        useCustomFormat: document.getElementById('useCustomFormat').checked,
                        commitFormat: document.getElementById('commitFormat').value,
                        showSubject: document.getElementById('showSubject').checked,
                        showHash: document.getElementById('showHash').checked,
                        showAuthor: document.getElementById('showAuthor').checked,
                        showEmail: document.getElementById('showEmail').checked,
                        showDate: document.getElementById('showDate').checked,
                        showRelativeDate: document.getElementById('showRelativeDate').checked,
                        useExtendedDiff: document.getElementById('useExtendedDiff').checked
                    };

                    // Send message to extension
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({
                        command: 'saveSettings',
                        settings: settings
                    });
                });
            })();
        </script>
    </body>
    </html>`;
  }
}
