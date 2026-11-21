// Umjetna inteligencija u appu: Claude (Anthropic) ili ChatGPT (OpenAI) – psiholog bira u Postavkama.
//
// - API ključevi se čuvaju SAMO na ovom uređaju (localStorage), ne idu u rezervnu kopiju
//   i šalju se samo direktno odgovarajućem servisu (api.anthropic.com / api.openai.com).
// - Prije slanja se imena učenika zamjenjuju šiframa, a imena razrednika sa "razrednik 7-1"
//   (anonimizujSve). Spisak se uvijek čita iz baze neposredno prije slanja.
// - Bez ključa radi rezervni način: "kopiraj za AI" → zalijepi u ChatGPT/Claude → zalijepi odgovor.

import { anonimizuj, obrazacImena } from './periodIzvjestaj';
import { db } from '../db/db';

// ---------- postavke ----------

export type Provajder = 'claude' | 'chatgpt';
export type Diktiranje = 'preglednik' | 'chatgpt';

export const CLAUDE_MODEL = 'claude-opus-5-5';
/** @deprecated zadržano zbog kompatibilnosti */
export const AI_MODEL = CLAUDE_MODEL;

export const CHATGPT_MODELI = [
  { id: 'gpt-6.2-sol', naziv: 'Sol', opis: 'najbolji kvalitet' },
  { id: 'gpt-6.1-terra', naziv: 'Terra', opis: 'brži i jeftiniji' },
  { id: 'gpt-6-luna', naziv: 'Luna', opis: 'najjeftiniji' },
];
/** Ako izabrani model više ne postoji, probaju se ovi redom. */
export const CHATGPT_REZERVNI = ['gpt-6.1-sol', 'gpt-5.6-sol', 'gpt-5.5'];
export const TRANSKRIPCIJA_MODELI = ['gpt-transcribe', 'gpt-4o-transcribe'];

const K = {
  claude: 'ai-api-kljuc',
  openai: 'openai-api-kljuc',
  provajder: 'ai-provajder',
  model: 'openai-model',
  diktiranje: 'ai-diktiranje',
} as const;

const citaj = (k: string) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
const pisi = (k: string, v: string) => {
  try { if (v.trim()) localStorage.setItem(k, v.trim()); else localStorage.removeItem(k); } catch { /* privatni način */ }
};

export interface AIPostavke {
  provajder: Provajder;
  claudeKljuc: string;
  openaiKljuc: string;
  openaiModel: string;
  diktiranje: Diktiranje;
}

export function aiPostavke(): AIPostavke {
  const claudeKljuc = citaj(K.claude), openaiKljuc = citaj(K.openai);
  const sacuvan = citaj(K.provajder) as Provajder;
  const provajder: Provajder = sacuvan === 'claude' || sacuvan === 'chatgpt' ? sacuvan : openaiKljuc && !claudeKljuc ? 'chatgpt' : 'claude';
  return {
    provajder,
    claudeKljuc,
    openaiKljuc,
    openaiModel: citaj(K.model) || CHATGPT_MODELI[0].id,
    diktiranje: citaj(K.diktiranje) === 'chatgpt' ? 'chatgpt' : 'preglednik',
  };
}

export function sacuvajAIPostavke(p: Partial<AIPostavke>) {
  if (p.claudeKljuc !== undefined) pisi(K.claude, p.claudeKljuc);
  if (p.openaiKljuc !== undefined) pisi(K.openai, p.openaiKljuc);
  if (p.provajder !== undefined) pisi(K.provajder, p.provajder);
  if (p.openaiModel !== undefined) pisi(K.model, p.openaiModel);
  if (p.diktiranje !== undefined) pisi(K.diktiranje, p.diktiranje);
}

// stare funkcije (Claude ključ)
export const ucitajKljuc = () => citaj(K.claude);
export const sacuvajKljuc = (k: string) => pisi(K.claude, k);

/** Ima li izabrani AI servis ključ (pa radi jednim klikom). */
export function imaKljuc(): boolean {
  const p = aiPostavke();
  return p.provajder === 'claude' ? !!p.claudeKljuc : !!p.openaiKljuc;
}

export function nazivAI(): string {
  const p = aiPostavke();
  if (p.provajder === 'claude') return 'Claude';
  return `ChatGPT ${CHATGPT_MODELI.find((m) => m.id === p.openaiModel)?.naziv ?? p.openaiModel}`;
}

export const diktiranjeChatGPT = () => {
  const p = aiPostavke();
  return p.diktiranje === 'chatgpt' && !!p.openaiKljuc;
};

// ---------- anonimizacija ----------

/** Imena učenika → šifre; imena razrednika → "razrednik 7-1". Spisak se čita iz baze. */
export async function anonimizujSve(tekst: string): Promise<string> {
  if (!tekst) return tekst;
  const [ucenici, razredi] = await Promise.all([db.ucenici.toArray(), db.razredi.toArray()]);
  let t = tekst;
  const granica = (src: string) => `(?<!\\p{L})${src}(?!\\p{L})`;
  for (const r of [...razredi].sort((a, b) => b.razrednik.length - a.razrednik.length)) {
    const dijelovi = (r.razrednik || '').trim().split(/\s+/).filter(Boolean);
    if (dijelovi.length < 2) continue;
    const ime = dijelovi[0], prezime = dijelovi.slice(1).join(' ');
    const zamjena = `razrednik ${r.razred}`;
    t = t.replace(new RegExp(granica(`${obrazacImena(ime)}\\s+${obrazacImena(prezime)}`), 'giu'), zamjena);
    t = t.replace(new RegExp(granica(`${obrazacImena(prezime)}\\s+${obrazacImena(ime)}`), 'giu'), zamjena);
    if (prezime.length > 2) t = t.replace(new RegExp(granica(obrazacImena(prezime)), 'giu'), zamjena);
  }
  return anonimizuj(t, ucenici);
}

// ---------- sročavanje ----------

export type VrstaTeksta = 'biljeska' | 'biljeske' | 'zakljucak' | 'preporuke' | 'opste';

const ZADATAK: Record<VrstaTeksta, string> = {
  biljeska:
    'Ovo je brza bilješka psihologa zapisana u hodu (npr. na hodniku, u prolazu, nakon neplaniranog susreta ili informativnog razgovora). Sroči je u kratku, uređenu službenu bilješku: kontekst/situacija, opažanja, i – samo ako proizlazi iz teksta – procjena i naredni korak.',
  biljeske: 'Ovo su bilješke iz razgovora. Sroči ih u jasan, stručan opis toka razgovora i zapažanja.',
  zakljucak: 'Ovo je zaključak razgovora. Sroči ga kao kratak, precizan stručni zaključak.',
  preporuke: 'Ovo su preporuke. Sroči ih kao jasne, provodljive stručne preporuke (po potrebi kao kratke stavke).',
  opste: 'Sroči ovaj tekst stručnim jezikom.',
};

/** Sistemska uputa: stil iskusnog školskog psihologa, bez izmišljanja. */
export const SISTEM = `Ti si iskusan, visoko educiran školski psiholog u osnovnoj školi u Bosni i Hercegovini. Pomažeš kolegi da njegove sirove, brzo zapisane bilješke pretvori u uredan, stručan i elokventan tekst za službenu psihološku dokumentaciju.

Pravila:
- Piši na bosanskom jeziku, ijekavicom, gramatički i pravopisno ispravno.
- Stil: stručan, smiren, objektivan i precizan; treće lice; prošlo vrijeme za opis događaja. Bez patetike i bez suvišnih riječi.
- Zadrži SVE činjenice iz originala i NIŠTA ne izmišljaj: ne dodaji događaje, citate, dijagnoze, testove, imena, datume ni preporuke kojih nema u tekstu. Ako nešto nije jasno, piši opreznije (npr. „prema navodima učenika“), ne pretpostavljaj.
- Razdvoji opažanja (šta je viđeno/rečeno) od tumačenja; tumačenja formuliši oprezno („moguće je“, „upućuje na“).
- Vulgarne, kolokvijalne ili grube izraze (npr. „gole slike“) zamijeni odgovarajućim stručnim terminima (npr. „slikovni materijal eksplicitnog sadržaja“), uz očuvanje značenja.
- Učenici su označeni šiframa (npr. U056) ili „[učenik]“, a razrednici kao „razrednik 7-1“ – zadrži ih tačno tako; ne izmišljaj imena.
- Ne dodaji naslov, datum, potpis, uvodne ni završne napomene. Vrati SAMO sročeni tekst, bez navodnika i bez objašnjenja šta si promijenio.
- Dužina: približno kao original ili malo duže zbog jasnoće; nikad esej.`;

export function porukaZaAI(tekst: string, vrsta: VrstaTeksta, kontekst?: string): string {
  return [ZADATAK[vrsta], kontekst ? `Kontekst: ${kontekst}` : '', '', 'Originalni tekst:', '"""', tekst.trim(), '"""'].filter((l, i) => l !== '' || i === 2).join('\n');
}

async function anonimnaPoruka(tekst: string, vrsta: VrstaTeksta, kontekst?: string): Promise<string> {
  return porukaZaAI(await anonimizujSve(tekst), vrsta, kontekst ? await anonimizujSve(kontekst) : undefined);
}

/** Tekst za ručno kopiranje u ChatGPT/Claude (kad nema API ključa). */
export async function tekstZaKopiranje(tekst: string, vrsta: VrstaTeksta, kontekst?: string): Promise<string> {
  return `${SISTEM}\n\n${await anonimnaPoruka(tekst, vrsta, kontekst)}`;
}

export class AIGreska extends Error {}

/** Pošalji tekst AI-ju i vrati sročenu verziju. */
export async function sroci(tekst: string, vrsta: VrstaTeksta, kontekst?: string): Promise<string> {
  return generisi({ sistem: SISTEM, poruke: [{ uloga: 'user', tekst: await anonimnaPoruka(tekst, vrsta, kontekst) }], napor: 'low' });
}

// ---------- opšti poziv (Claude ili ChatGPT) ----------

export interface AIPoruka {
  uloga: 'user' | 'assistant';
  tekst: string;
}

export interface AIDokument {
  naziv: string;
  tip: string; // MIME
  base64: string;
}

export interface ZahtjevAI {
  sistem: string;
  poruke: AIPoruka[]; // tekst mora biti VEĆ anonimizovan
  dokumenti?: AIDokument[]; // prilažu se uz prvu poruku korisnika
  napor?: 'low' | 'medium' | 'high';
  maxTokens?: number;
}

export async function generisi(z: ZahtjevAI): Promise<string> {
  const p = aiPostavke();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AIGreska('Nema interneta. AI radi samo uz internet – podaci su sačuvani, pokušaj kasnije.');
  if (p.provajder === 'chatgpt') {
    if (!p.openaiKljuc) throw new AIGreska('ChatGPT nije podešen. Upiši OpenAI API ključ u Postavkama.');
    const { generisiOpenAI } = await import('./openai');
    return generisiOpenAI(z, p.openaiKljuc, p.openaiModel);
  }
  if (!p.claudeKljuc) throw new AIGreska('AI nije podešen. Upiši API ključ u Postavkama (Claude ili ChatGPT).');
  return generisiClaude(z, p.claudeKljuc);
}

async function generisiClaude(z: ZahtjevAI, kljuc: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: kljuc, dangerouslyAllowBrowser: true, maxRetries: 1 });
  const prvaKorisnicka = z.poruke.findIndex((m) => m.uloga === 'user');
  const poruke = z.poruke.map((m, i) => {
    if (i === prvaKorisnicka && z.dokumenti?.length) {
      return {
        role: m.uloga,
        content: [
          ...z.dokumenti.map((d) =>
            d.tip === 'application/pdf'
              ? { type: 'document' as const, title: d.naziv, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: d.base64 } }
              : { type: 'document' as const, title: d.naziv, source: { type: 'text' as const, media_type: 'text/plain' as const, data: dekodirajTekst(d.base64) } },
          ),
          { type: 'text' as const, text: m.tekst },
        ],
      };
    }
    return { role: m.uloga, content: m.tekst };
  });
  try {
    const odgovor = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: z.maxTokens ?? 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: z.napor ?? 'low' },
      system: z.sistem,
      messages: poruke,
    });
    if (odgovor.stop_reason === 'refusal') throw new AIGreska('AI je odbio obradu ovog teksta. Preformuliši ga ili ga uredi ručno.');
    const rezultat = odgovor.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
    if (!rezultat) throw new AIGreska('AI nije vratio tekst. Pokušaj ponovo.');
    return rezultat;
  } catch (e) {
    if (e instanceof AIGreska) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AIGreska('Claude API ključ nije ispravan. Provjeri ga u Postavkama.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new AIGreska('Ključ nema dozvolu za ovaj model. Provjeri račun na console.anthropic.com.');
    if (e instanceof Anthropic.RateLimitError) throw new AIGreska('Previše zahtjeva ili nema kredita na računu. Pokušaj za minut ili provjeri račun.');
    if (e instanceof Anthropic.APIConnectionError) throw new AIGreska('Nema veze sa AI servisom. Provjeri internet.');
    if (e instanceof Anthropic.APIError) throw new AIGreska(`AI greška (${e.status ?? '?'}): ${e.message}`);
    throw new AIGreska('AI greška: ' + (e as Error).message);
  }
}

export function dekodirajTekst(b64: string): string {
  try {
    const s = atob(b64);
    const b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return new TextDecoder().decode(b);
  } catch {
    return '';
  }
}

// ---------- diktiranje preko ChatGPT-a ----------

export async function transkribuj(audio: Blob): Promise<string> {
  const p = aiPostavke();
  if (!p.openaiKljuc) throw new AIGreska('Za ChatGPT diktiranje upiši OpenAI API ključ u Postavkama.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AIGreska('Nema interneta – koristi mikrofon na tastaturi.');
  const { transkribujOpenAI } = await import('./openai');
  return transkribujOpenAI(audio, p.openaiKljuc);
}
