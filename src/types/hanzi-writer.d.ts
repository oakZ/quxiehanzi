declare module 'hanzi-writer' {
  export interface HanziWriterOptions {
    width?: number;
    height?: number;
    padding?: number;
    showOutline?: boolean;
    showCharacter?: boolean;
    strokeAnimationSpeed?: number;
    delayBetweenStrokes?: number;
    delayBetweenLoops?: number;
    strokeColor?: string;
    outlineColor?: string;
    drawingColor?: string;
    drawingWidth?: number;
    strokeWidth?: number;
    outlineWidth?: number;
    highlightOnHover?: boolean;
    highlightCompleteColor?: string;
    highlightColor?: string;
    radicalColor?: string;
    charDataLoader?: (char: string, onComplete: (data: any) => void) => void;
    onLoadCharDataError?: (error: any) => void;
  }

  export interface QuizOptions {
    onComplete?: (summary: { character: string; totalMistakes: number }) => void;
    onCorrectStroke?: (strokeData: {
      character: string;
      strokeNum: number;
      mistakesOnStroke: number;
      totalMistakes: number;
      strokesRemaining: number;
    }) => void;
    onMistake?: (strokeData: {
      character: string;
      strokeNum: number;
      mistakesOnStroke: number;
      totalMistakes: number;
      strokesRemaining: number;
    }) => void;
  }

  export default class HanziWriter {
    static create(
      element: string | HTMLElement,
      character: string,
      options?: HanziWriterOptions
    ): HanziWriter;
    static loadCharacterData(character: string): Promise<any>;
    constructor(
      element: string | HTMLElement,
      character: string,
      options?: HanziWriterOptions
    );
    setCharacter(character: string): Promise<void>;
    animateCharacter(options?: { onComplete?: () => void }): void;
    animateStroke(
      strokeNum: number,
      options?: { onComplete?: () => void }
    ): void;
    loopCharacterAnimation(): void;
    pauseAnimation(): void;
    resumeAnimation(): void;
    showCharacter(): Promise<void>;
    hideCharacter(): Promise<void>;
    showOutline(): Promise<void>;
    hideOutline(): Promise<void>;
    quiz(options?: QuizOptions): void;
    cancelQuiz(): void;
  }
}
