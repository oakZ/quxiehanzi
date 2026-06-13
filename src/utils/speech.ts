/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Speaks Chinese text using the Web Speech Synthesis API.
 * Optimized with parameters (slow rate, sweet pitch) for kindergarten/elementary students.
 */
export function speakText(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Standard cleanup of stale speaking
    window.speechSynthesis.cancel();

    // Remove pinyin-like annotations or parenthesis just in case
    const cleanText = text.replace(/\([^\)]*\)/g, '').replace(/（[^）]*）/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.82; // 0.82 makes it extremely easy for younger children to digest
    utterance.pitch = 1.12; // 1.12 adds a gentle, friendly, bright pitch

    // Attempt to select a clear Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('ZH') || v.lang.includes('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}
