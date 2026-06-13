/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Volume2, Megaphone, Loader2 } from 'lucide-react';
import { CharacterDetail } from '../types';
import { speakText } from '../utils/speech';

interface AiTutorProps {
  character: string;
}

export const AiTutor: React.FC<AiTutorProps> = ({ character }) => {
  const [detail, setDetail] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  // Clear or load detail when character changes
  useEffect(() => {
    setDetail(null);
    setError(null);
  }, [character]);

  const handleFetchExplanation = async () => {
    if (!character) return;
    setLoading(true);
    setError(null);
    setIsCollapsed(false); // Automatically expand to show loading state and incoming story!

    try {
      const response = await fetch('/api/gemini/explain-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character })
      });

      if (!response.ok) {
        throw new Error('网络请求有一些慢，汉字王国的小火车正在加速，请再点一次吧。');
      }

      const data = await response.json();
      setDetail(data);

      // Auto read aloud the story to guide the child!
      const vocalIntro = `字宝宝“${data.character}”开始上课啦！拼音读作“${data.pinyin}”，意思是“${data.meaning}”。听老师给你讲个故事：${data.story}。宝贝记住书写秘诀：${data.strokeTip}`;
      speakText(vocalIntro);

    } catch (err: any) {
      console.error(err);
      setError(err.message || '获取汉字解说失败，请刷新或重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (!detail) return;
    const narration = `字宝宝“${detail.character}”读作“${detail.pinyin}”。它的意思是“${detail.meaning}”。这个字的故事 is 这样的：${detail.story}。书写秘诀是：${detail.strokeTip}。常用词组有：“${detail.words[0]?.word}”，读作“${detail.words[0]?.pinyin}”，意思是“${detail.words[0]?.explanation}”；还有“${detail.words[1]?.word}”，读作“${detail.words[1]?.pinyin}”，意思是“${detail.words[1]?.explanation}”。`;
    speakText(narration);
  };

  return (
    <div id="ai-tutor-root" className="bg-gradient-to-br from-emerald-50 to-teal-100/40 rounded-3xl p-4 md:p-5 shadow-lg border border-teal-100 max-w-md w-full mx-auto transition-all duration-250">
      {/* Teacher avatar header with collapse toggle */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white relative shadow-md shrink-0">
            <span className="text-xl md:text-2xl">🦉</span>
            {/* Badge */}
            <span className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 text-stone-900 border border-white text-[8px] font-black px-1 rounded-full">
              AI
            </span>
          </div>
          <div>
            <h4 className="font-extrabold text-stone-800 text-xs md:text-sm">小葵花汉字故事老师</h4>
            <p className="text-[10px] text-stone-400 font-semibold">字偏旁背后的魔法历史讲解</p>
          </div>
        </div>

        {/* Manual Expand / Collapse Trigger */}
        <button
          id="toggle-tutor-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/90 hover:text-emerald-800 rounded-xl transition-colors cursor-pointer shrink-0 select-none"
        >
          {isCollapsed ? '展开说文字 ➜' : '收起故事 ✖'}
        </button>
      </div>

      {error && !isCollapsed && (
        <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-2xl mt-3 text-center border border-rose-100 font-semibold animate-shake">
          {error}
        </div>
      )}

      {/* Expandable Body */}
      {!isCollapsed && (
        <div className="mt-4 pt-3.5 border-t border-emerald-100/50 space-y-4 animate-fade-in">
          {/* State A: Loading */}
          {loading && (
            <div className="min-h-[140px] flex flex-col items-center justify-center bg-white/70 rounded-2xl p-5 border border-teal-100/30">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mb-2.5" />
              <p className="text-xs text-stone-600 font-semibold">正在询问字词宇宙，请稍等...</p>
              <p className="text-[9px] text-stone-400 mt-1 italic">“每个汉字，都是有生命的动画片哦”</p>
            </div>
          )}

          {/* State B: Not fetched yet */}
          {!detail && !loading && (
            <div className="text-center py-6 bg-white/50 rounded-2xl p-4 border border-teal-100/45 flex flex-col items-center gap-2.5">
              <div className="text-2xl animate-bounce">✨</div>
              <p className="text-xs text-stone-600 leading-relaxed font-semibold px-2">
                想知道字宝宝 <span className="text-emerald-700 text-base font-black bg-emerald-100/60 px-1.5 py-0.5 rounded-md">“{character}”</span> 是怎么生出来的，还有什么魔法故事吗？
              </p>
              <button
                id="tutor-ask-btn"
                onClick={handleFetchExplanation}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 hover:shadow-md animate-pulse text-white text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer mt-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> 开启说文解字小课堂
              </button>
            </div>
          )}

          {/* State C: Successfully loaded */}
          {detail && !loading && (
            <div className="space-y-3">
              {/* Main Content card */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-stone-100 relative">
                <button
                  id="read-aloud-btn"
                  onClick={handleReadAloud}
                  className="absolute top-3 right-3 flex items-center gap-1 text-[9px] bg-amber-500 text-white font-black px-2 py-1 rounded-full shadow-xs hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
                  title="语音朗读整篇故事"
                >
                  <Megaphone className="w-2.5 h-2.5" /> 听故事
                </button>

                {/* Pinyin and Translation banner */}
                <div className="mb-2">
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    释义
                  </span>
                  <p className="text-stone-800 text-xs font-bold mt-1.5">
                    【拼音】: <span className="text-emerald-700">{detail.pinyin}</span>
                  </p>
                  <p className="text-stone-800 text-xs font-bold mt-0.5">
                    【字义】: <span className="text-stone-700 font-medium">{detail.meaning}</span>
                  </p>
                </div>

                {/* Story with small quotation style */}
                <div className="border-t border-stone-100 pt-2 mb-2">
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    字宝宝的故事
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed mt-1.5 text-justify select-text italic">
                    “{detail.story}”
                  </p>
                </div>

                {/* Writing advice tip */}
                <div className="border-t border-dashed border-stone-100 pt-1.5 bg-amber-50/50 p-2.5 rounded-xl">
                  <span className="text-[9px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                    ✍️ 书写小秘诀
                  </span>
                  <p className="text-xs text-stone-700 font-bold mt-1 select-text">
                    {detail.strokeTip}
                  </p>
                </div>
              </div>

              {/* Children Vocabulary Associations */}
              <div className="grid grid-cols-2 gap-2.5">
                {detail.words.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 rounded-xl p-2.5 border border-stone-100 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="font-extrabold text-stone-800 text-xs flex items-baseline gap-1">
                        <span className="text-emerald-600">{item.word}</span>
                        <span className="text-[9px] text-stone-400 font-bold font-mono">[{item.pinyin}]</span>
                      </h5>
                      <p className="text-[10px] text-stone-500 leading-relaxed mt-1 pt-1 border-t border-stone-50">
                        {item.explanation}
                      </p>
                    </div>
                    {/* Speaking trigger for vocabulary */}
                    <button
                      id={`vocab-speak-${idx}`}
                      onClick={() => speakText(`${item.word}，拼音是 ${item.pinyin}，代表的意思是 ${item.explanation}`)}
                      className="mt-2 self-end p-1 rounded-full bg-stone-50 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
