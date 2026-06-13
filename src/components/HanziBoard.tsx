/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { Volume2, RotateCcw, Play, BookOpen, Sparkles, HelpCircle, Trophy, PenTool } from 'lucide-react';
import { speakText } from '../utils/speech';

interface HanziBoardProps {
  character: string;
  pinyin?: string;
  onPracticeComplete?: (character: string, mistakes: number) => void;
}

type PracticeMode = 'animate' | 'trace' | 'quiz';

export const HanziBoard: React.FC<HanziBoardProps> = ({
  character,
  pinyin = '',
  onPracticeComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  const [mode, setMode] = useState<PracticeMode>('animate');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Quiz Stats
  const [quizProgress, setQuizProgress] = useState<number>(0);
  const [totalStrokes, setTotalStrokes] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);

  // Pronounce character
  const handleHearPronunciation = () => {
    if (!character) return;
    speakText(character);
  };

  const speakGuide = (text: string) => {
    speakText(text);
  };

  // Re-initialize Hanzi Writer when character or mode changes
  useEffect(() => {
    if (!character || !containerRef.current) return;

    setLoading(true);
    setLoadError(null);
    setQuizFinished(false);
    setMistakes(0);
    setQuizProgress(0);

    // Wipe out old SVG content inside the target element
    containerRef.current.innerHTML = '';
    writerRef.current = null;

    try {
      const isQuiz = mode === 'quiz';
      const isTrace = mode === 'trace';

      const writer = HanziWriter.create(containerRef.current, character, {
        width: 256,
        height: 256,
        padding: 20,
        showOutline: true,
        showCharacter: !isQuiz, // Hide character inside blank grid quiz
        strokeColor: '#991b1b', // Red-ink brush
        outlineColor: '#fca5a5', // Soft outline guide
        drawingColor: '#2563eb', // Child's drawing ink is royal blue
        drawingWidth: 12,
        strokeWidth: 10,
        highlightColor: '#eab308', // Gold sparkle guides
        radicalColor: '#ea580c', // highlight radical orange
      });

      writerRef.current = writer;

      // Listen on load
      writer.setCharacter(character).then(() => {
        setLoading(false);
        // Get stroke count
        // HanziWriter handles internal character rendering count, we can approximate,
        // or trigger animations
        if (mode === 'animate') {
          writer.animateCharacter();
        } else if (isTrace || isQuiz) {
          startTracingQuiz(writer, isQuiz);
        }
      }).catch((err) => {
        console.error('Error loading writing stats for: ', character, err);
        setLoadError('笔画数据加载较慢或未找到该汉字，可以用手在框框内练习画画哦！');
        setLoading(false);
      });

    } catch (e: any) {
      console.error('Failed to init HanziWriter:', e);
      setLoadError('加载汉字数据失败，请重试');
      setLoading(false);
    }

    // Cleanup on unmount or refresh
    return () => {
      if (writerRef.current) {
        writerRef.current.cancelQuiz();
      }
    };
  }, [character, mode]);

  // Set up the interactive trace or quiz
  const startTracingQuiz = (writer: HanziWriter, isStrictQuiz: boolean) => {
    writer.cancelQuiz();

    let strokeIdx = 0;
    writer.quiz({
      onCorrectStroke(strokeData) {
        setQuizProgress(strokeData.strokeNum + 1);
        setTotalStrokes(strokeData.strokeNum + strokeData.strokesRemaining + 1);

        // Vocal encouragement
        const encList = ['好棒！', '写对啦！', '太厉害了！', '真聪明！', '继续加油！'];
        const randomEncor = encList[Math.floor(Math.random() * encList.length)];
        speakGuide(randomEncor);
      },
      onMistake(strokeData) {
        setMistakes((prev) => prev + 1);
        speakGuide('再试一次，往这边。');
      },
      onComplete(summary) {
        setQuizFinished(true);
        // Calculate stars
        const totalError = summary.totalMistakes;
        let starRating = 5;
        if (totalError > 5) starRating = 3;
        else if (totalError > 2) starRating = 4;
        setRating(starRating);

        // Trigger callback to save history
        if (onPracticeComplete) {
          onPracticeComplete(character, totalError);
        }

        // Celebrate vocally!
        speakGuide(`太棒啦！你在田字格里成功写出了“${character}”字。一共写错了${totalError}次，获得${starRating}颗小星星。你真棒！`);
      }
    });
  };

  const handleRestart = () => {
    if (!writerRef.current) return;
    setQuizFinished(false);
    setMistakes(0);
    setQuizProgress(0);

    if (mode === 'animate') {
      writerRef.current.animateCharacter();
    } else {
      startTracingQuiz(writerRef.current, mode === 'quiz');
    }
  };

  return (
    <div id="hanzi-board-root" className="flex flex-col items-center bg-white rounded-3xl p-6 shadow-xl border border-stone-100 max-w-md w-full mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex flex-col items-center justify-center font-bold relative border-2 border-amber-200">
            <span className="text-sm leading-none">{pinyin || 'pīn'}</span>
            <span className="text-xl font-bold leading-none mt-0.5">{character}</span>
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-base flex items-center gap-1.5">
              字宝宝: {character}
              <button
                id="pronounce-btn"
                onClick={handleHearPronunciation}
                className="p-1 rounded-full text-amber-600 hover:bg-amber-50"
                title="语音播报"
              >
                <Volume2 className="w-4.5 h-4.5" />
              </button>
            </h3>
            <p className="text-xs text-stone-400">大声读出它的声音吧！</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          <button
            id="mode-btn-animate"
            onClick={() => setMode('animate')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'animate' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            看演示
          </button>
          <button
            id="mode-btn-trace"
            onClick={() => setMode('trace')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'trace' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            描红跟写
          </button>
          <button
            id="mode-btn-quiz"
            onClick={() => setMode('quiz')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'quiz' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            闭眼挑战
          </button>
        </div>
      </div>

      {/* Main Tian Zi Ge Board Area */}
      <div className="relative w-72 h-72 bg-[#fffdfa] rounded-2xl border-4 border-amber-700/60 shadow-inner flex items-center justify-center select-none overflow-hidden group">
        {/* Tian Zi Ge Dash Overlay Background */}
        <div className="absolute inset-2 pointer-events-none border border-red-200/50 rounded-lg">
          {/* Main outer border */}
          <div className="absolute inset-0 border-2 border-dashed border-red-500/20"></div>
          {/* Horizontal line */}
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-red-500/30"></div>
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-red-500/30"></div>
          {/* Cross Diagonals */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_49.5%,rgba(239,68,68,0.15)_50%,transparent_50.5%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom_left,transparent_49.5%,rgba(239,68,68,0.15)_50%,transparent_50.5%)]"></div>
        </div>

        {/* Loading / Error Overlays */}
        {loading && (
          <div className="absolute inset-0 bg-stone-50/80 z-10 flex flex-col items-center justify-center">
            <span className="w-8 h-8 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin mb-2"></span>
            <p className="text-xs text-stone-500 font-medium">老师正在黑板上写字...</p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 bg-stone-50/90 z-10 flex flex-col items-center justify-center p-4 text-center">
            <HelpCircle className="w-10 h-10 text-stone-400 mb-2" />
            <p className="text-xs text-stone-600 font-medium">{loadError}</p>
            <div className="mt-3 flex gap-2">
              <button
                id="retry-btn"
                onClick={() => setMode('animate')}
                className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* Dynamic target container for Hanzi writer */}
        <div
          ref={containerRef}
          id="hanzi-writer-container"
          className="relative z-0 touch-none flex items-center justify-center cursor-crosshair scale-100 transition-transform active:scale-[0.99]"
        />

        {/* Success Splash Overlay */}
        {quizFinished && (
          <div className="absolute inset-0 bg-amber-500/90 z-20 flex flex-col items-center justify-center text-white animate-fade-in p-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-300 animate-bounce mb-3 drop-shadow-md" />
            <h4 className="text-2xl font-black mb-1">顺利完成！</h4>
            <p className="text-sm font-semibold opacity-90 mb-4">
              {character} 写得真漂亮！写错：{mistakes} 次。
            </p>

            {/* Stars Rating */}
            <div className="flex gap-1 mb-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Sparkles
                  key={s}
                  className={`w-7 h-7 ${s <= rating ? 'text-yellow-300 fill-yellow-300' : 'text-stone-400 opacity-50'} transition-all`}
                />
              ))}
            </div>

            <div className="flex gap-2.5">
              <button
                id="quiz-retry-btn"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-4.5 py-2 bg-white text-amber-700 font-bold rounded-xl text-xs hover:bg-stone-50 shadow-md transform active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 再写一次
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guidance instructions & triggers */}
      <div className="w-full mt-4 bg-stone-50 rounded-2xl p-3 border border-stone-100 flex flex-col items-center gap-3">
        {mode === 'animate' && (
          <div className="text-center w-full">
            <p className="text-xs text-stone-500 font-medium">请认真看大屏幕下的笔画红点路线示范哦！</p>
            <div className="flex gap-2 justify-center mt-3">
              <button
                id="replay-anim"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5" /> 重新播放
              </button>
            </div>
          </div>
        )}

        {mode === 'trace' && (
          <div className="text-center w-full">
            <p className="text-xs text-stone-500 font-medium">跟着<span className="text-amber-500 font-semibold">黄色箭头画线条</span>，轻轻描出红色的笔画吧！</p>
            <div className="flex gap-2 justify-center mt-3">
              <button
                id="reset-trace"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 擦掉重画
              </button>
            </div>
          </div>
        )}

        {mode === 'quiz' && !quizFinished && (
          <div className="w-full">
            {/* Status indicator */}
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] text-stone-400 flex items-center gap-1 font-bold">
                <PenTool className="w-3 h-3 text-blue-500" />
                进度: {quizProgress} 笔画
              </span>
              <span className="text-[10px] text-stone-400 flex items-center gap-1 font-bold">
                红灯错处: <span className="text-red-500 font-extrabold">{mistakes}</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 text-center font-medium">
              小秘密：背景汉字消失了！考考你的记忆，写出每一个笔画吧！
            </p>
            <div className="flex gap-2 justify-center mt-3">
              <button
                id="reset-quiz"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 重新测试
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
