/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  category: 'primary' | 'middle' | 'custom';
  content: string[]; // List of sentences, e.g. ["床前明月光，", "疑是地上霜。"]
  pinyin: string[]; // Pre-computed or corresponding reading sentences
  translation: string;
  appreciation?: string; // Children-friendly meaning analysis
}

export interface CustomPoem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  content: string;
  pinyin?: string;
  addedAt: number;
}

export interface CharacterDetail {
  character: string;
  pinyin: string;
  meaning: string;
  story: string;     // 童话风的字源小故事
  strokeTip: string; // 书写秘诀，笔画难点提示
  words: Array<{
    word: string;
    pinyin: string;
    explanation: string;
  }>;
}

export interface CharacterHistoryItem {
  character: string;
  practiceCount: number;
  lastPracticeTime: number;
  bestMistakeCount?: number;
}
