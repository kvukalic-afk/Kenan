// Umjetna inteligencija za sročavanje bilješki (Claude, Anthropic).
//
// - API ključ unosi psiholog u Postavkama; čuva se SAMO na ovom uređaju (localStorage),
//   ne ide u rezervnu kopiju ni bilo gdje drugo osim direktno na api.anthropic.com.
// - Prije slanja se poznata imena učenika zamjenjuju šiframa (anonimizuj).
// - Bez ključa radi rezervni način: "kopiraj za AI" → zalijepi u ChatGPT/Claude → zalijepi odgovor.

import { anonimizuj } from './periodIzvjestaj';
import { db } from '../db/db';

export const AI_MODEL = 'claude-opus-5-5';
const KLJUC = 'ai-api-kljuc';

export function ucitajKljuc(): string {
  try { return localStorage.getItem(KLJUC) ?? ''; } catch { return ''; }
}
export function sacuvajKljuc(k: string) {
  try {
    if (k.trim()) localStorage.setItem(KLJUC, k.trim());
    else localStorage.removeItem(KLJUC);
  } catch { /* privatni način rada */ }
}
export const imaKljuc = () => ucitajKljuc().length > 0;

export type VrstaTeksta = 'biljeska' | 'biljeske' | 'zakljucak' | 'preporuke' | 'opste';

const ZADATAK: Record<VrstaTeksta, string> = {
  biljeska:
    'Ovo je brza bilješka psihologa zapisana u hodu (npr. na hodniku, u prolazu, nakon neplaniranog susreta). Sroči je u kratku, uređenu službenu bilješku: kontekst/situacija, opažanja, i – samo ako proizlazi iz teksta – procjena i naredni korak.',
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
- Učenici su označeni šiframa (npr. U056) ili „[učenik]“ – zadrži ih tačno tako; ne izmišljaj imena.
- Ne dodaji naslov, datum, potpis, uvodne ni završne napomene. Vrati SAMO sročeni tekst, bez navodnika i bez objašnjenja šta si promijenio.
- Dužina: približno kao original ili malo duže zbog jasnoće; nikad esej.`;

export function porukaZaAI(tekst: string, vrsta: VrstaTeksta, kontekst?: string): string {
  return [ZADATAK[vrsta], kontekst ? `Kontekst: ${kontekst}` : '', '', 'Originalni tekst:', '"""', tekst.trim(), '"""'].filter((l, i) => l !== '' || i === 2).join('\n');
}

/** Anonimizovana poruka: spisak učenika se UVIJEK čita iz baze neposredno prije slanja. */
async function anonimnaPoruka(tekst: string, vrsta: VrstaTeksta, kontekst?: string): Promise<string> {
  const ucenici = await db.ucenici.toArray();
  return porukaZaAI(anonimizuj(tekst, ucenici), vrsta, kontekst ? anonimizuj(kontekst, ucenici) : undefined);
}

/** Tekst za ručno kopiranje u ChatGPT/Claude (kad nema API ključa). */
export async function tekstZaKopiranje(tekst: string, vrsta: VrstaTeksta, kontekst?: string): Promise<string> {
  return `${SISTEM}\n\n${await anonimnaPoruka(tekst, vrsta, kontekst)}`;
}

export class AIGreska extends Error {}

/** Pošalji tekst Claudeu i vrati sročenu verziju. */
export async function sroci(tekst: string, vrsta: VrstaTeksta, kontekst?: string): Promise<string> {
  const kljuc = ucitajKljuc();
  if (!kljuc) throw new AIGreska('AI nije podešen. Upiši API ključ u Postavkama.');
  if (!navigator.onLine) throw new AIGreska('Nema interneta. AI radi samo uz internet – bilješka je sačuvana, sroči je kasnije.');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: kljuc, dangerouslyAllowBrowser: true, maxRetries: 1 });
  const poruka = await anonimnaPoruka(tekst, vrsta, kontekst);
  try {
    const odgovor = await client.beta.messages.create({
      model: AI_MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SISTEM,
      messages: [{ role: 'user', content: poruka }],
    });
    if (odgovor.stop_reason === 'refusal') throw new AIGreska('AI je odbio obradu ovog teksta. Preformuliši ga ili ga uredi ručno.');
    const rezultat = odgovor.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
    if (!rezultat) throw new AIGreska('AI nije vratio tekst. Pokušaj ponovo.');
    return rezultat;
  } catch (e) {
    if (e instanceof AIGreska) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AIGreska('API ključ nije ispravan. Provjeri ga u Postavkama.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new AIGreska('Ključ nema dozvolu za ovaj model. Provjeri račun na console.anthropic.com.');
    if (e instanceof Anthropic.RateLimitError) throw new AIGreska('Previše zahtjeva ili nema kredita na računu. Pokušaj za minut ili provjeri račun.');
    if (e instanceof Anthropic.APIConnectionError) throw new AIGreska('Nema veze sa AI servisom. Provjeri internet.');
    if (e instanceof Anthropic.APIError) throw new AIGreska(`AI greška (${e.status ?? '?'}): ${e.message}`);
    throw new AIGreska('AI greška: ' + (e as Error).message);
  }
}
