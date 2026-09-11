import type { TranslationKey } from '../i18n';
import type { Block } from '../types';

/** Название блока: пользовательское побеждает встроенный ключ перевода. */
export function blockTitle(block: Block, t: (key: TranslationKey) => string): string {
  if (block.title !== null && block.title.trim().length > 0) return block.title;
  return block.titleKey ? t(block.titleKey) : '';
}
