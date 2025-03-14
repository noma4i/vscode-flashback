export interface HistoryItem {
  label: string;
  description: string;
  detail: string;
  commit: string;
}

export interface FlashbackSettings {
  useCustomFormat: boolean;
  commitFormat: string;
  showSubject: boolean;
  showHash: boolean;
  showAuthor: boolean;
  showEmail: boolean;
  showDate: boolean;
  showRelativeDate: boolean;
  useExtendedDiff: boolean;
}
