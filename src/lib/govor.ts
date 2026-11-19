// Diktiranje preko Web Speech API-ja (jezik hr-HR – najbliži bosanskom koji preglednici podržavaju).

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function konstruktor(): (new () => SR) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const diktiranjePodrzano = (): boolean => konstruktor() !== null;

export interface Slusanje {
  zaustavi(): void;
}

export function slusaj(onTekst: (t: string) => void, onKraj: (greska?: string) => void): Slusanje | null {
  const K = konstruktor();
  if (!K) return null;
  const sr = new K();
  sr.lang = 'hr-HR';
  sr.continuous = true;
  sr.interimResults = false;
  sr.maxAlternatives = 1;
  sr.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal && r[0]?.transcript) onTekst(r[0].transcript.trim());
    }
  };
  sr.onerror = (e) => onKraj(e.error);
  sr.onend = () => onKraj();
  try {
    sr.start();
  } catch {
    return null;
  }
  return { zaustavi: () => sr.stop() };
}

/** Dodaje izdiktirani tekst na kraj polja. */
export function dodajNaKraj(postojece: string, novo: string): string {
  if (!novo) return postojece;
  const t = novo.charAt(0).toUpperCase() + novo.slice(1);
  if (!postojece.trim()) return t;
  const sep = /[\s]$/.test(postojece) ? '' : /[.!?]$/.test(postojece.trim()) ? ' ' : '. ';
  return postojece + sep + t;
}
