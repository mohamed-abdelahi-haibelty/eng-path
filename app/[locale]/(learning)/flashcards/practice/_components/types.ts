export type PracticeCard = {
  word: string;
  partOfSpeech: string;
  phonetics: string;
  audioUrl: string;
  arabicTranslation: string | null;
};

export type SentenceFillItem = {
  word: string;
  template: string;
  answer: string;
};

export type SentenceConstraints = {
  word: string;
  context: string;
  grammarRequirement: string;
  collocations: string[];
};

export type EvalResult = {
  score: 0 | 1 | 2 | 3;
  feedback: string;
  corrected: string | null;
  example: string | null;
  grammarScore?: number;
  naturalnessScore?: number;
  contextScore?: number;
  compliance?: { wordUsed: boolean; grammarMet: boolean; contextMet: boolean };
  whatWasGood?: string | null;
  advancedAlternative?: string | null;
};

export type Mode =
  | "multipleChoice"
  | "spell"
  | "match"
  | "sentenceFill"
  | "sentenceWrite";

export type CompletionData = {
  mode: Mode;
  score: number;
  total: number;
  timeMs?: number;
};
