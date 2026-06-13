/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Poem } from '../types';
import { BookOpen, Volume2, Sparkles, Plus, Eye, EyeOff, ClipboardList, PenTool, X, Library } from 'lucide-react';
import { speakText } from '../utils/speech';

interface PoemListProps {
  poems: Poem[];
  selectedPoemId: string;
  onSelectPoem: (poem: Poem) => void;
  onSelectCharacter: (char: string) => void;
  onOpenCustomForm: () => void;
  selectedChar?: string;
}

export const PoemList: React.FC<PoemListProps> = ({
  poems,
  selectedPoemId,
  onSelectPoem,
  onSelectCharacter,
  onOpenCustomForm,
  selectedChar = ''
}) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'middle' | 'custom'>('primary');
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // Filter poems according to active category tab
  const filteredPoems = poems.filter(p => p.category === activeTab);

  const selectedPoem = poems.find(p => p.id === selectedPoemId) || poems[0];

  // Loudly read the entire poem
  const handleReadEntirePoem = (poem: Poem) => {
    const speechContent = `${poem.title}。${poem.dynasty}，${poem.author}。${poem.content.join('。')}`;
    speakText(speechContent);
  };

  /**
   * Perfectly aligns each Chinese character with its specific pinyin syllable.
   * Keeps punctuation separate and properly positioned.
   */
  const parseSentenceWithPinyin = (sentence: string, pinyinStr: string) => {
    const characters = Array.from(sentence) as string[];
    const rawSyllables = pinyinStr.trim().split(/\s+/).filter(s => s.length > 0);
    
    const zipped: { char: string; pinyin: string; isPunctuation: boolean }[] = [];
    let pinyinIdx = 0;

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const isPunct = /[，。？！；：、,.\?!;:]/.test(char);

      if (isPunct) {
        zipped.push({
          char,
          pinyin: '',
          isPunctuation: true
        });
      } else {
        let pySyllable = rawSyllables[pinyinIdx] || '';
        // Clean any accidental punctuation stuck to the syllable
        pySyllable = pySyllable.replace(/[，。？！；：、,.\?!;:]/g, '');
        zipped.push({
          char,
          pinyin: pySyllable,
          isPunctuation: false
        });
        pinyinIdx++;
      }
    }
    return zipped;
  };

  return (
    <div id="poem-list-root" className="bg-white rounded-3xl p-4 sm:p-5 lg:p-4 shadow-xl border border-stone-100 flex flex-col h-full relative">
      
      {/* Primary Visible Reading Desk (Poem Details) */}
      <div id="poem-detail-container" className="bg-amber-50/45 rounded-2xl p-4 sm:p-5 lg:p-4 border border-amber-200/50 flex flex-col h-full relative">
        
        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/40 pb-3 mb-4">
          <div className="flex items-center gap-2">
            {/* Library Opener Button */}
            <button
              id="open-library-btn"
              onClick={() => {
                setIsLibraryOpen(true);
                speakText('打开古诗藏书阁。');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Library className="w-4 h-4" />
              <span>📚 选古诗 / 生字本</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Pinyin Switch */}
            <button
              id="toggle-pinyin-btn"
              onClick={() => setShowPinyin(!showPinyin)}
              className="flex items-center gap-1.2 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-[10px] text-stone-500 hover:text-stone-800 hover:bg-stone-50 font-bold transition-all shadow-xs cursor-pointer"
            >
              {showPinyin ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-stone-400" /> 隐藏拼音
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-500" /> 显示拼音
                </>
              )}
            </button>

            {/* Speak whole poem */}
            <button
              id="read-poem-full-btn"
              onClick={() => handleReadEntirePoem(selectedPoem)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[10px] font-bold shadow-sm transition-all cursor-pointer"
              title="阅读全诗"
            >
              <Volume2 className="w-3.5 h-3.5" /> 语音朗读
            </button>
          </div>
        </div>

        {/* Aligned Interactive Poetry Workspace */}
        <div className="text-center py-4 flex-1 flex flex-col justify-center">
          {/* Title */}
          <h2 className="text-xl md:text-2xl font-black text-amber-800 tracking-wider mb-1.5 animate-fade-in">
            《{selectedPoem.title}》
          </h2>
          {/* Elegant traditional Author & Dynasty subtitle directly below the title */}
          <div className="text-[10px] sm:text-xs text-amber-700 font-bold bg-amber-100/50 px-2.5 py-0.5 rounded-full w-fit mx-auto mb-4.5 select-none font-sans animate-fade-in">
            〔{selectedPoem.dynasty}〕 {selectedPoem.author}
          </div>

          {/* Verses body */}
          <div className="space-y-5 font-serif">
            {selectedPoem.content.map((sentence, idx) => {
              const py = selectedPoem.pinyin[idx] || '';
              return (
                <div key={idx} className="flex flex-wrap justify-center items-end gap-x-2.5 gap-y-3.5 px-2">
                  {parseSentenceWithPinyin(sentence, py).map((item, charIdx) => {
                    // Punctuation is rendered as elegant large text inline
                    if (item.isPunctuation) {
                      return (
                        <span key={charIdx} className="text-xl md:text-2xl font-serif text-stone-400 self-end -mb-0.5 px-0.5 select-none">
                          {item.char}
                        </span>
                      );
                    }

                    const isSelected = selectedChar === item.char;

                    return (
                      <div key={charIdx} className="flex flex-col items-center gap-1">
                        {/* Pinyin Syllable is locked & aligned directly on top of each char button */}
                        {showPinyin && (
                          <span className="text-[10px] md:text-xs text-stone-400 font-mono tracking-normal leading-none h-4 flex items-center justify-center font-bold">
                            {item.pinyin}
                          </span>
                        )}

                        {/* Interactive Character block */}
                        <button
                          key={charIdx}
                          id={`char-interactive-${item.char}`}
                          onClick={() => {
                            onSelectCharacter(item.char);
                            speakText(item.char);
                          }}
                          className={`w-9.5 h-9.5 md:w-11.5 md:h-11.5 rounded-xl border flex items-center justify-center font-bold text-lg md:text-xl relative transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 scale-110 shadow-md ring-2 ring-amber-300 ring-offset-1 z-10'
                              : 'bg-white text-stone-800 border-amber-200/60 hover:bg-amber-100 hover:border-amber-300 hover:scale-105'
                          }`}
                          title={`点击在田字格里写 “${item.char}” 字`}
                        >
                          {item.char}
                          {!isSelected && (
                            <span className="absolute bottom-0 right-0 p-0.5 text-[7px] text-stone-300">
                              ✎
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Child-friendly heart warm tip */}
        {selectedPoem.appreciation && (
          <div className="mt-4 bg-white/70 rounded-2xl p-3 border border-amber-200/30">
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" /> 小葵花古诗心语
            </span>
            <p className="text-[11px] text-stone-500 leading-relaxed text-justify">
              {selectedPoem.appreciation}
            </p>
          </div>
        )}

        <div className="mt-3.5 pt-2.5 border-t border-amber-200/40 text-center">
          <span className="text-[10px] text-stone-400 font-medium flex items-center justify-center gap-1 select-none">
            💡 宝藏技巧：点击任意字，左侧就会变出来对应的“田字格笔画”！
          </span>
        </div>
      </div>

      {/* =========================================
          Overlay Drawer Modal: "藏书阁" Poem Library
          ========================================= */}
      {isLibraryOpen && (
        <div id="library-drawer-overlay" className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] shadow-2xl border-4 border-amber-300 flex flex-col overflow-hidden animate-[zoom-in_0.15s_ease-out]">
            
            {/* Header */}
            <div className="bg-amber-500 text-white p-4 flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">古诗宝贝藏书阁</h3>
                  <p className="text-[10px] text-amber-50">点击下方分类，挑选你想练习的汉字和古诗</p>
                </div>
              </div>
              <button
                id="close-library-btn"
                onClick={() => setIsLibraryOpen(false)}
                className="p-1.5 bg-amber-600/40 hover:bg-amber-600/75 rounded-full transition-colors cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Categories (Sticky Tab) */}
            <div className="bg-stone-50 border-b border-stone-100 p-3 flex gap-1.5 shrink-0 select-none">
              <button
                id="drawer-tab-primary"
                onClick={() => setActiveTab('primary')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'primary' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800 bg-white border border-stone-200'
                }`}
              >
                🎒 小学必背
              </button>
              <button
                id="drawer-tab-middle"
                onClick={() => setActiveTab('middle')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'middle' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800 bg-white border border-stone-200'
                }`}
              >
                🎓 初中必背
              </button>
              <button
                id="drawer-tab-custom"
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'custom' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800 bg-white border border-stone-200'
                }`}
              >
                📝 我的生字本
              </button>
            </div>

            {/* List items area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredPoems.length === 0 ? (
                <div className="text-center py-10 bg-stone-50 border border-dashed border-stone-200 rounded-2xl">
                  <ClipboardList className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-400 font-bold">这里还没有任何内容哦！</p>
                  {activeTab === 'custom' && (
                    <button
                      id="drawer-empty-add"
                      onClick={() => {
                        setIsLibraryOpen(false);
                        onOpenCustomForm();
                      }}
                      className="mt-3 px-3.5 py-1.5 bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 mx-auto shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> 添加生字本
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredPoems.map((p) => {
                    const isPoemSelected = selectedPoemId === p.id;
                    return (
                      <button
                        key={p.id}
                        id={`drawer-poem-${p.id}`}
                        onClick={() => {
                          onSelectPoem(p);
                          setIsLibraryOpen(false);
                        }}
                        className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                          isPoemSelected
                            ? 'bg-amber-55/90 border-amber-300 shadow-sm ring-1 ring-amber-200'
                            : 'bg-white border-stone-150 hover:bg-stone-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isPoemSelected ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-500'
                          }`}>
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-stone-800 text-xs text-ellipsis overflow-hidden line-clamp-1">《{p.title}》</h4>
                            <p className="text-[10px] text-stone-400 mt-0.5">{p.dynasty} · {p.author}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all select-none">
                          开启 ➜
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom additions action at bottom of drawer */}
            {activeTab === 'custom' && filteredPoems.length > 0 && (
              <div className="p-3 bg-stone-50 border-t border-stone-100 shrink-0">
                <button
                  id="drawer-add-poem-btn"
                  onClick={() => {
                    setIsLibraryOpen(false);
                    onOpenCustomForm();
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs text-white font-bold flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 新增生字表 / 诗词内容
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

