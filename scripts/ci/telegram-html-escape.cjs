'use strict';

/**
 * Escape text for Telegram HTML parse mode (entities only; not full HTML).
 * @param {unknown} value
 * @returns {string}
 */
function escapeTelegramHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { escapeTelegramHtml };
