import i18n from './i18n';

export function getApiLang(): string {
  const raw = i18n.language || 'en';
  return raw.split('-')[0].toLowerCase();
}
