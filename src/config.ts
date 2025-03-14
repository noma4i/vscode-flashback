import * as vscode from 'vscode';

export class Config {
  static getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('git-flashback');
  }

  static getConfigValue<T>(key: string, defaultValue: T): T {
    const config = this.getConfig();
    const value = config.get<T>(key);
    return value !== undefined ? value : defaultValue;
  }

  static getBooleanConfig(key: string, defaultValue = false): boolean {
    return this.getConfigValue<boolean>(key, defaultValue);
  }

  static getCommitFormat(): string {
    const useCustomFormat = this.getBooleanConfig('useCustomFormat');
    const customFormat = this.getConfigValue<string>('commitFormat', '%s%n[%h] %cN (%ce)%n%cD (%cr)');

    if (useCustomFormat && customFormat) {
      return customFormat;
    }

    const config = this.getConfig();
    const formatParts: string[] = [];
    const defaultFormat = '%s%n[%h] %cN (%ce)%n%cD (%cr)';

    if (config.get('showSubject')) {
      formatParts.push('%s');
    }

    const sections: Array<{ condition: string, components: string[] }> = [
    {
        condition: '',
        components: [
          { key: 'showHash', value: '[%h]' },
          { key: 'showAuthor', value: '%cN' },
          { key: 'showEmail', value: '(%ce)' }
        ].filter(item => config.get(item.key)).map(item => item.value)
      },
    {
        condition: '',
        components: [
          { key: 'showDate', value: '%cD' },
          { key: 'showRelativeDate', value: '(%cr)' }
        ].filter(item => config.get(item.key)).map(item => item.value)
      }
    ];

    sections.forEach(section => {
      if (section.components.length > 0) {
        formatParts.push(section.components.join(' '));
      }
    });

    const format = formatParts.join('%n');
    return format || defaultFormat;
  }

  static getUseExtendedDiff(): boolean {
    return this.getBooleanConfig('useExtendedDiff');
  }
}
