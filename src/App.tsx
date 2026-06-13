/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PRESET_POEMS } from './presetPoems';
import { Poem, CharacterHistoryItem } from './types';
import { HanziBoard } from './components/HanziBoard';
import { PoemList } from './components/PoemList';
import { AiTutor } from './components/AiTutor';
import { CustomPoemForm } from './components/CustomPoemForm';
import { speakText } from './utils/speech';
import {
  Sparkles,
  Trophy,
  History,
  Baby,
  Eraser,
  VolumeX,
} from 'lucide-react';

export default function App() {
  const [poems, setPoems] = useState<Poem[]>(PRESET_POEMS);
  const [selectedPoemId, setSelectedPoemId] = useState<string>('jing-ye-si');
  const [selectedChar, setSelectedChar] = useState<string>('明');
  const [showForm, setShowForm] = useState<boolean>(false);

  // History stats loaded from Local Storage
  const [history, setHistory] = useState<Record<string, CharacterHistoryItem>>({});

  // Pronunciation voice list
  const [pinyinForChar, setPinyinForChar] = useState<string>('míng');

  // Load state from local storage on start
  useEffect(() => {
    // 1. Load custom poems
    try {
      const savedCustom = localStorage.getItem('hanzi_custom_poems');
      if (savedCustom) {
        const parsed: Poem[] = JSON.parse(savedCustom);
        // Deduplicate or append smoothly
        setPoems(prev => [...PRESET_POEMS, ...parsed]);
      }
    } catch (e) {
      console.error('Error reading custom poems from localStorage:', e);
    }

    // 2. Load writing practice history
    try {
      const savedHistory = localStorage.getItem('hanzi_practice_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Error reading writing history from localStorage:', e);
    }

    // Gentle greeting
    speakText('欢迎来到汉字笔顺与古诗学习乐园！点击任意一个古诗，开启你的写字奇妙旅程吧。');
  }, []);

  const selectedPoem = poems.find(p => p.id === selectedPoemId) || poems[0];

  // Dynamically update pinyin of selected character based on standard dictionary or poem context
  useEffect(() => {
    // Look up character in selected poem to find corresponding pinyin syllable if possible
    if (!selectedChar) return;

    let foundPinyin = '';
    selectedPoem.content.forEach((sentence, idx) => {
      const charIndex = sentence.indexOf(selectedChar);
      if (charIndex !== -1) {
        const charPinyinSyllables = (selectedPoem.pinyin[idx] || '')
          .replace(/[，。？！；：、,.\?!;:]/g, '')
          .split(/\s+/);
        if (charPinyinSyllables[charIndex]) {
          foundPinyin = charPinyinSyllables[charIndex];
        }
      }
    });

    // Fallback dictionary
    const fallbackPinyinRecord: Record<string, string> = {
      '静': 'jìng', '夜': 'yè', '思': 'sī', '床': 'chuáng', '前': 'qián',
      '明': 'míng', '月': 'yuè', '光': 'guāng', '疑': 'yí', '是': 'shì',
      '地': 'dì', '上': 'shàng', '霜': 'shuāng', '举': 'jǔ', '头': 'tóu',
      '望': 'wàng', '低': 'dī', '故': 'gù', '乡': 'xiāng',
      '鹅': 'é', '曲': 'qū', '项': 'xiàng', '向': 'xiàng', '天': 'tiān', '歌': 'gē',
      '白': 'bái', '毛': 'máo', '浮': 'fú', '绿': 'lǜ', '水': 'shuǐ', '红': 'hóng',
      '掌': 'zhǎng', '拨': 'bō', '清': 'qīng', '波': 'bō',
      '学': 'xué', '习': 'xí'
    };

    setPinyinForChar(foundPinyin || fallbackPinyinRecord[selectedChar] || 'zì');
  }, [selectedChar, selectedPoemId]);

  // Handle saving new custom poems
  const handleSaveCustomPoem = (newPoem: Poem) => {
    const updated = [...poems, newPoem];
    setPoems(updated);

    // Filter out preset to save only custom ones
    const customOnly = updated.filter(p => p.category === 'custom');
    localStorage.setItem('hanzi_custom_poems', JSON.stringify(customOnly));

    // Select the newly added custom poem
    setSelectedPoemId(newPoem.id);
    if (newPoem.content[0]) {
      // Find first Chinese character
      const firstChar = Array.from(newPoem.content[0]).find(c => !/[，。？！；：、,.\?!;:]/.test(c));
      if (firstChar) {
        setSelectedChar(firstChar);
      }
    }
    speakText(`成功保存自选生字表：${newPoem.title}。快点击练一练里面的生字吧！`);
  };

  // Called when writing session finishes successfully on HanziBoard
  const handlePracticeComplete = (character: string, mistakesCount: number) => {
    const now = Date.now();
    const updatedHistory = { ...history };

    if (updatedHistory[character]) {
      updatedHistory[character] = {
        character,
        practiceCount: updatedHistory[character].practiceCount + 1,
        lastPracticeTime: now,
        bestMistakeCount: Math.min(updatedHistory[character].bestMistakeCount ?? 99, mistakesCount)
      };
    } else {
      updatedHistory[character] = {
        character,
        practiceCount: 1,
        lastPracticeTime: now,
        bestMistakeCount: mistakesCount
      };
    }

    setHistory(updatedHistory);
    localStorage.setItem('hanzi_practice_history', JSON.stringify(updatedHistory));
  };

  // Clear writing history stats
  const handleClearHistory = () => {
    if (confirm('确认要清空宝贝的写字光荣榜记录吗？')) {
      setHistory({});
      localStorage.removeItem('hanzi_practice_history');
      speakText('记录清空啦，我们可以重新开始写字攒星星噢！');
    }
  };

  // Turn off speech synthesis aloud in case of noise
  const handleStopAllSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const historyList = (Object.values(history) as CharacterHistoryItem[]).sort((a, b) => b.lastPracticeTime - a.lastPracticeTime);

  return (
    <div id="app-container" className="min-h-screen bg-stone-50 select-none pb-12">
      {/* Dynamic Grid Background Panel for Playful Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none z-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Hero Kids Header Banner */}
      <header id="main-header" className="relative z-10 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-white shadow-md border-b-4 border-amber-600/35 overflow-hidden">
        {/* Child-friendly bubbly decoration particles */}
        <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-yellow-300 opacity-20"></div>
        <div className="absolute top-1/2 right-12 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div className="absolute -bottom-8 left-1/3 w-28 h-28 rounded-full bg-green-300 opacity-15"></div>

        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-white/10 hover:bg-white/20 transition-all rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/20 animate-wiggle">
              🏫
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wider drop-shadow-sm flex items-center justify-center sm:justify-start gap-2">
                儿童汉字与古诗学习乐园
                <span className="text-xs bg-yellow-300 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full shadow-xs border border-white">
                  启蒙版
                </span>
              </h1>
              <span className="text-xs text-amber-50/90 font-medium mt-1 inline-block">
                笔画动画演示 · 轨迹精细手写练习 · 必背古诗词对照 · AI趣味字形讲解老师
              </span>
            </div>
          </div>

          {/* Top Helpers */}
          <div className="flex items-center gap-2">
            <button
              id="stop-audio-btn"
              onClick={handleStopAllSpeech}
              className="flex items-center gap-1 text-[11px] bg-red-600/40 hover:bg-red-600/60 border border-white/25 hover:border-white/50 text-white font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
              title="暂停朗读"
            >
              <VolumeX className="w-4 h-4" /> 关声音
            </button>
            <div className="hidden md:flex items-center gap-1 text-[11px] bg-white/10 border border-white/15 px-3 py-2 rounded-xl font-bold">
              <Baby className="w-4 h-4 text-yellow-300" />
              <span>当前练习：</span>
              <span className="text-yellow-200 text-xs font-black">{selectedChar}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        
        {/* Left Side: Writing Practice Center (Grid Span 2 on 5 column grid = 40% width, Full on mobile) */}
        <section id="writing-center-section" className="md:col-span-2 space-y-4">
          
          {/* 1. Interactive Handwriting Board */}
          <HanziBoard
            character={selectedChar}
            pinyin={pinyinForChar}
            onPracticeComplete={handlePracticeComplete}
          />

          {/* 2. AI Character Story Explainer */}
          <AiTutor character={selectedChar} />
        </section>

        {/* Right Side: Poetry Map and Reading Desk (Grid Span 3 on 5 column grid = 60% width) */}
        <section id="bookshelf-section" className="md:col-span-3 space-y-4">
          
          {/* 1. Ancient School Poems Module */}
          <PoemList
            poems={poems}
            selectedPoemId={selectedPoemId}
            onSelectPoem={(p) => {
              setSelectedPoemId(p.id);
              // Select first meaningful character automatically
              if (p.content[0]) {
                const first = (Array.from(p.content[0]) as string[]).find(c => !/[，。？！；：、,.\?!;:]/.test(c));
                if (first) setSelectedChar(first);
              }
            }}
            onSelectCharacter={(char) => setSelectedChar(char)}
            onOpenCustomForm={() => setShowForm(true)}
            selectedChar={selectedChar}
          />

          {/* 2. Hall of Fame (Progress & Rewards) */}
          <div id="hall-of-fame-panel" className="bg-white rounded-3xl p-5 shadow-xl border border-stone-100">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-105 flex items-center justify-center text-yellow-600">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-800 text-sm">🏆 宝贝的写字光荣榜</h3>
                  <p className="text-[10px] text-stone-400">写对字可以收获闪亮的星星哦，加油！</p>
                </div>
              </div>
              
              {historyList.length > 0 && (
                <button
                  id="clear-history-btn"
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-red-300 text-stone-400 hover:text-red-500 text-[10px] cursor-pointer bg-white transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" /> 清空记录
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs font-medium">
                <History className="w-8 h-8 text-stone-200 mx-auto mb-1.5" />
                <span>还没有写字记录哦。在右边选择古诗，并在田字格里写完，就能名列前茅啦！</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 max-h-[140px] overflow-y-auto pr-1">
                {historyList.map((item) => {
                  const starsCount = (item.bestMistakeCount ?? 9) <= 2 ? 5 : (item.bestMistakeCount ?? 9) <= 5 ? 4 : 3;
                  return (
                    <div
                      key={item.character}
                      onClick={() => setSelectedChar(item.character)}
                      className="bg-stone-50 hover:bg-amber-50 rounded-2xl p-2.5 border border-stone-100 flex flex-col items-center justify-center relative cursor-pointer group transition-all hover:scale-103"
                    >
                      <span className="text-[10px] text-stone-400 font-bold mb-1">
                        练了: {item.practiceCount} 次
                      </span>
                      <span className="text-lg font-black text-amber-800">
                        {item.character}
                      </span>
                      {/* stars rating */}
                      <div className="flex gap-0.5 mt-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-[9px] ${
                              i < starsCount ? 'text-yellow-400' : 'text-stone-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>
      </main>

      {/* Floating Dialog Add Form overlay */}
      {showForm && (
        <CustomPoemForm
          onSave={handleSaveCustomPoem}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
