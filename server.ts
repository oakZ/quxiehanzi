/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not configured or left as default. Using fallback static Chinese Tutor.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback Chinese character database for kids (keeps it functioning if no API key is specified)
const FALLBACK_DATABASE: Record<string, {
  character: string;
  pinyin: string;
  meaning: string;
  story: string;
  strokeTip: string;
  words: Array<{ word: string; pinyin: string; explanation: string }>;
}> = {
  '静': {
    character: '静',
    pinyin: 'jìng',
    meaning: '安安静静、没有声音',
    story: '“静”字左边是青色的“青”，右边是争夺的“争”。组合在一起，就像是在绿油油、青翠的大自然中，大家都停止了争吵，变得安安静静，能听到微风和小草说话的声音哦！',
    strokeTip: '左边的“青”要写得紧凑修长，给右边不服输的“争”腾出小温室哦！最后一笔横画要像平稳的桌子一样舒展。',
    words: [
      { word: '安静', pinyin: 'ān jìng', explanation: '就像小动物们都睡着了，树林里温和没有杂音的状态。' },
      { word: '静悄悄', pinyin: 'jìng qiāo qiāo', explanation: '形容非常非常寂静，连一片叶子落下来都能听清呢！' }
    ]
  },
  '月': {
    character: '月',
    pinyin: 'yuè',
    meaning: '月亮、月球',
    story: '它是一张美丽的“象形图”！在很久以前，人们抬头看见天上弯弯的月亮，就把它画成了一个弯弯的香蕉月，中间加了两道光芒。渐渐地，它就变成了我们现在写的“月”字啦！',
    strokeTip: '外围的撇折折钩要像一根弯弯的小香蕉，里面的两横要像月亮里住着温顺的小玉兔跟小仙女一样，距离分得匀称才好看！',
    words: [
      { word: '月亮', pinyin: 'yuè liang', explanation: '夜空里温柔发光的小银盘，会变大变圆，也会像小船一样弯弯的。' },
      { word: '月饼', pinyin: 'yuè bǐng', explanation: '中秋节和爸爸妈妈一起分享的、圆圆的、香喷喷的甜点。' }
    ]
  },
  '鹅': {
    character: '鹅',
    pinyin: 'é',
    meaning: '大雁的一种，家禽白鹅',
    story: '“鹅”是由左边的“我”和右边的“鸟”组成的！大白鹅可是一只非常骄傲、有个性、走路一摇一摆、喜欢自我介绍的“鸟儿”哦，当它仰着脖子唱歌时，就好像在说：“我是高贵的鸟，我是‘鹅’！”',
    strokeTip: '右边“鸟”的小头要写在横中线上，底下的四个小点（横折弯钩里的折点及四点底）就像大白鹅拨水前行的小船桨，要写平稳。',
    words: [
      { word: '白鹅', pinyin: 'bái é', explanation: '穿着雪白外衣、红红的小脚掌和红红的脑壳、喜欢在池塘里游来游去的大白鸟。' },
      { word: '鹅毛', pinyin: 'é máo', explanation: '白鹅身上暖和又松软的羽毛。冬天下的好大好可爱的雪也叫“鹅毛大雪”哦！' }
    ]
  },
  '明': {
    character: '明',
    pinyin: 'míng',
    meaning: '亮、明亮、明白',
    story: '“明”字是个超级神奇的组合！左边是散发万丈光芒的太阳“日”公公，右边是散发温柔白光的月亮“月”姐姐。两个宇宙中最亮的天体手拉手站在一起，就把整个世界都照耀得无比“明亮”了！',
    strokeTip: '“日”公公做左旁，要写得苗条可爱一些；“月”姐姐做右边，要写得身材高挑，这样他们手拉手才最协调最美观！',
    words: [
      { word: '明天', pinyin: 'míng tiān', explanation: '睡一觉起来，红红的太阳再次升起的下一个清晨！' },
      { word: '明白', pinyin: 'míng bái', explanation: '脑子里的小路突然亮堂起来，懂得了问题怎么解决！' }
    ]
  },
  '学': {
    character: '学',
    pinyin: 'xué',
    meaning: '学习、读书、模仿',
    story: '在古代字形里，“学”字最上面像是一双大手，正在教小孩子数数桌上亮晶晶的小贝壳；中间是温馨的屋顶“冖”保护着孩子；屋檐下的小“子”就是代表正在认真读书的你啦！',
    strokeTip: '顶部的三个点（“门”字头或三点偏旁）要像落在屋顶上的小雨点，均匀可爱；底下的“子”字，那一横要写得极具支撑感，像张开的手臂把知识都拥抱进怀里。',
    words: [
      { word: '学习', pinyin: 'xué xí', explanation: '像小鸟练习飞翔一样，去了解和练习不知道的新知识和新本领！' },
      { word: '学校', pinyin: 'xué xiào', explanation: '有超级多的好朋友、温柔老师和课本游戏的快乐城堡。' }
    ]
  }
};

// API: Explain character using Gemini
app.post('/api/gemini/explain-character', async (req, res) => {
  const { character } = req.body;
  if (!character || typeof character !== 'string') {
    res.status(400).json({ error: 'Please provide a valid single Chinese character.' });
    return;
  }

  const cleanChar = character.trim().substring(0, 1);
  const client = getGeminiClient();

  if (!client) {
    // If no client, return custom generated structures or standard fallback
    const fallback = FALLBACK_DATABASE[cleanChar];
    if (fallback) {
      res.json(fallback);
      return;
    }

    // Dynamic generation when offline/nokey using basic rules
    res.json({
      character: cleanChar,
      pinyin: 'hàn zì',
      meaning: '汉字字符',
      story: `这是一个很特别的汉字“${cleanChar}”。它的左边和右边住着不同的偏旁部首，就像是不同的神秘拼图。等你去握着神笔，把它一笔一画写在“田字格”里，你就会慢慢开启汉字的城堡啦！`,
      strokeTip: '书写时要注意，先写左边再写右边，从上到下写，每一笔都要平平稳稳，像在积木！',
      words: [
        { word: '快乐', pinyin: 'kuài lè', explanation: '小脑瓜里开满鲜花，非常非常开心的感觉！' },
        { word: '生字', pinyin: 'shēng zì', explanation: '我们第一次见面的、充满魔力的新汉字朋友。' }
      ]
    });
    return;
  }

  try {
    const prompt = `分析单个汉字: "${cleanChar}"。请详细解析这个汉字，为5-8岁学写字的小朋友生成童话小故事和汉字记忆。`;
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `你是一位深受小朋友喜爱、温柔耐心的儿童汉字启回老师。你的任务是对给定的汉字进行趣味说文解字。你需要用充满童趣、温柔亲切、活感多样的中文（适合5-8岁儿童，多用富有画面感的比喻、拟人手法），编写该汉字的字形记忆童话故事，写出汉字各个部分的组合意义（例如“月”像弯香蕉月亮，“日”是红通通太阳公公），并解答它的拼音、含义（简单的儿童释义）、针对儿童容易写错和笔顺的要领写下“书写口诀或小提示”，最后生成2个儿童常用又富有表现力的词组。
请严格输出一个符合以下 JSON 架构的响应，不要返回 markdown 代码块，直接返回纯 JSON：
{
  "character": "汉字本身",
  "pinyin": "声调拼音，如 míng",
  "meaning": "简单好懂的儿童解释，如“代表光明，天亮了”",
  "story": "生动有趣的看图说故事（200字以内），用拟人和想象力，将字形结构偏旁拟人化，帮助小朋记忆字形",
  "strokeTip": "教孩子写好它的秘诀或避坑难点，一句话口诀，比如：‘左边日公公写得瘦瘦的，右边月姐姐才会住得舒服哦！’",
  "words": [
    { "word": "词组(两个字)", "pinyin": "词组拼音, 如 míng tiān", "explanation": "儿童好理解的词组意义解释" }
  ]
}
`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            character: { type: Type.STRING },
            pinyin: { type: Type.STRING, description: 'Single character phonetic transcription with tones' },
            meaning: { type: Type.STRING, description: 'Child-friendly semantic description' },
            story: { type: Type.STRING, description: 'Imaginative mnemonic fairy-tale story explaining glyph construction' },
            strokeTip: { type: Type.STRING, description: 'A cute writing advice or mnemonic rule for kids' },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['word', 'pinyin', 'explanation']
              }
            }
          },
          required: ['character', 'pinyin', 'meaning', 'story', 'strokeTip', 'words']
        }
      }
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      res.json(data);
    } else {
      throw new Error('Received empty response from Gemini API');
    }
  } catch (err: any) {
    console.error('Gemini API Error in explain-character:', err);
    // Graceful recovery with fallback database
    const cleanChar = character.trim().substring(0, 1);
    const fallback = FALLBACK_DATABASE[cleanChar] || {
      character: cleanChar,
      pinyin: 'hàn zì',
      meaning: '有趣的汉字字宝宝',
      story: `这是一个神奇的汉字偏旁组合。在汉字王国里，万物都有自己的图形小秘密。快拿起手中的画笔，让这个字在田字格里跳起欢快的舞蹈吧！`,
      strokeTip: '写字的时候，肩膀要放松，小铅笔轻轻握，笔画要一笔一笔写工整哦。',
      words: [
        { word: '汉字', pinyin: 'hàn zì', explanation: '承载着几千年奇妙故事和画作的中华汉字组合。' },
        { word: '铅笔', pinyin: 'qiān bǐ', explanation: '帮助我们在白纸上画出美丽文字和图案的神奇魔法棒！' }
      ]
    };
    res.json(fallback);
  }
});

// Serve frontend SPA or configure dev server based on node env
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chinese Writing App Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
