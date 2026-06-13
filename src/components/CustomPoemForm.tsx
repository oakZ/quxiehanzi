/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Save, Sparkles, AlertCircle } from 'lucide-react';
import { Poem } from '../types';

interface CustomPoemFormProps {
  onSave: (newPoem: Poem) => void;
  onClose: () => void;
  initialPoem?: Poem;
}

export const CustomPoemForm: React.FC<CustomPoemFormProps> = ({ onSave, onClose, initialPoem }) => {
  const [title, setTitle] = useState<string>(initialPoem ? initialPoem.title : '');
  const [author, setAuthor] = useState<string>(initialPoem ? initialPoem.author : '小聪明');
  const [dynasty, setDynasty] = useState<string>(initialPoem ? initialPoem.dynasty : '生字本');
  const [contentInput, setContentInput] = useState<string>(
    initialPoem ? initialPoem.content.join('\n') : ''
  );
  const [errorWord, setErrorWord] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !contentInput.trim()) {
      setErrorWord('小家长，请填写标题和学习的汉字/诗词内容哦！');
      return;
    }

    // Process Content
    // Clean up carriage returns, split into paragraphs/sentences
    const rawLines = contentInput.split(/[\n]/);
    const contentList: string[] = [];
    const pinyinList: string[] = [];

    rawLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        contentList.push(trimmed);

        // Simple placeholder for pinyin (they will be read out singly or by character click)
        // We output space-separated characters to fit nicely above the sentence
        const characters = Array.from(trimmed) as string[];
        const placeholderPinyinArray = characters.map(c => {
          if (/[，。？！；：、,.\?!;:]/.test(c)) return c;
          // Return placeholder spacing
          return '·  ';
        });
        pinyinList.push(placeholderPinyinArray.join('  '));
      }
    });

    if (contentList.length === 0) {
      setErrorWord('内容不能为空白，输入一个词也可以哦。');
      return;
    }

    const uniqueId = initialPoem ? initialPoem.id : `custom-poem-${Date.now()}`;
    const newPoem: Poem = {
      id: uniqueId,
      title: title.trim(),
      author: author.trim() || '我',
      dynasty: dynasty.trim() || '自创',
      category: 'custom',
      content: contentList,
      pinyin: pinyinList,
      translation: '这是我添加的个性化学习卡片，每个汉字都可以点击放大练习哦。',
      appreciation: '这是宝贝的专属字表与诗词卡，老师在这里陪着你，加油写字、每天进步！'
    };

    onSave(newPoem);
    onClose();
  };

  return (
    <div id="custom-form-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-amber-300 md:p-6 p-5 overflow-hidden relative">
        {/* Close Button */}
        <button
          id="close-form-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-800 text-base">
              {initialPoem ? '编辑自选古诗/字表' : '添加自选古诗/字表'}
            </h3>
            <p className="text-[10px] text-stone-400">为你的孩子定制今天专属的学习任务吧！</p>
          </div>
        </div>

        {errorWord && (
          <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100 mb-4 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorWord}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              字表标题 / 古诗名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="input-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：生字本、春日古词、课后生词"
              className="w-full text-xs p-3 border border-stone-200 focus:border-amber-400 rounded-xl outline-hidden focus:ring-2 focus:ring-amber-100 transition-all font-semibold"
            />
          </div>

          {/* Double Column Dynasty/Author */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                分组 / 朝代
              </label>
              <input
                id="input-dynasty"
                type="text"
                value={dynasty}
                onChange={(e) => setDynasty(e.target.value)}
                placeholder="例如：第一单元、暑假作业"
                className="w-full text-xs p-3 border border-stone-200 focus:border-amber-400 rounded-xl outline-hidden focus:ring-2 focus:ring-amber-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                作者 / 宝贝姓名
              </label>
              <input
                id="input-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="例如：李白、宝贝姓名"
                className="w-full text-xs p-3 border border-stone-200 focus:border-amber-400 rounded-xl outline-hidden focus:ring-2 focus:ring-amber-200 transition-all"
              />
            </div>
          </div>

          {/* Main content typing box */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              文字内容 (支持汉字、句点换行) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="input-contents"
              required
              rows={4}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="输入你想让孩子练习的汉字：&#10;每一个汉字都可以被点击练习噢。如果你输入生字词，可以用空格或者逗号，比如：&#10;我 爱 学 中 文&#10;或者输入：床前明月光"
              className="w-full text-xs p-3 border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 font-mono tracking-wider rounded-xl outline-hidden transition-all leading-normal"
            />
          </div>

          <div className="bg-stone-50 p-3 rounded-2xl text-[10px] text-stone-400 leading-normal border border-stone-100">
            💡 <strong className="text-stone-500">小提示</strong>：提交保存后，字表将会保存在你们的浏览器本里不丢失。孩子一点击里面的字，就能自动开始玩笔画游戏示范并播报发音啦！
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-1.5">
            <button
              id="btn-cancel-custom-form"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-stone-200 text-stone-500 hover:text-stone-700 font-bold rounded-xl text-xs text-center hover:bg-stone-50 select-none cursor-pointer"
            >
              取消
            </button>
            <button
              id="btn-submit-custom-form"
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 font-bold rounded-xl text-xs text-white flex items-center justify-center gap-1 shadow-md select-none cursor-pointer active:scale-98 transition-transform"
            >
              <Save className="w-4 h-4" /> {initialPoem ? '保存修改' : '放入生字宝库'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
