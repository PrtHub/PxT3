export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakText(
  text: string,
  options?: {
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    lang?: string;
    volume?: number;
    onend?: () => void;
    onerror?: (e: SpeechSynthesisErrorEvent) => void;
    onboundary?: (event: SpeechSynthesisEvent) => void;
  }
) {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const utter = new window.SpeechSynthesisUtterance(text);
  if (options?.voice) utter.voice = options.voice;
  if (options?.rate) utter.rate = options.rate;
  if (options?.pitch) utter.pitch = options.pitch;
  if (options?.lang) utter.lang = options.lang;
  if (options?.volume !== undefined) utter.volume = options.volume;
  if (options?.onend) utter.onend = options.onend;
  if (options?.onerror) utter.onerror = options.onerror;
  if (options?.onboundary) utter.onboundary = options.onboundary;
  window.speechSynthesis.speak(utter);
}

export function cancelSpeech() {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function getWordBoundaries(text: string) {
  const words: { word: string; start: number; end: number }[] = [];
  let match;
  const wordRegex = /\b\w+\b/g;
  while ((match = wordRegex.exec(text)) !== null) {
    words.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }
  return words;
} 