// „Pametni alati“: upute za AI i obrada odgovora (plan rada, popunjavanje obrazaca,
// radionice, letci, brifing). Sve što ide AI-ju prethodno prolazi anonimizaciju (ai.ts).

import { PODRUCJA } from './podrucja';
import { parsirajPrikaz } from './datum';
import type { DefinicijaObrasca } from './obrasci';

const JEZIK = 'Piši na bosanskom jeziku (ijekavica), stručno, jasno i bez markdown zvjezdica.';
const PRIVATNOST = 'Učenici su označeni šiframa (npr. U056) ili „[učenik]“, odrasli ulogama (npr. „razrednik 7-1“) – zadrži te oznake i ne izmišljaj imena.';

/** Izvuci prvi JSON niz ili objekat iz odgovora (podnosi ```json ograde i tekst okolo). */
export function izvuciJSON<T = unknown>(tekst: string): T | null {
  const t = (tekst || '').replace(/```(?:json)?/gi, '').trim();
  // prvo oblik koji se u tekstu prvi pojavljuje (objekat s nizom unutra ostaje objekat)
  const redoslijed = ([['[', ']'], ['{', '}']] as const).slice().sort((a, b) => {
    const ia = t.indexOf(a[0]), ib = t.indexOf(b[0]);
    return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
  });
  for (const [o, z] of redoslijed) {
    const a = t.indexOf(o);
    const b = t.lastIndexOf(z);
    if (a >= 0 && b > a) {
      try { return JSON.parse(t.slice(a, b + 1)) as T; } catch { /* probaj drugi oblik */ }
    }
  }
  return null;
}

// ---------- 2. Plan rada iz opisa ----------

export const PLAN_SISTEM = `Ti si iskusan školski psiholog i stručnjak za planiranje rada stručne službe u osnovnim školama Unsko-sanskog kantona. Kolega opisuje dogovore, potrebe škole i svoje obaveze, a ti praviš godišnji program rada psihologa po 11 područja iz Pedagoških standarda USK (čl. 13):
${PODRUCJA.map((p) => `${p.kod}. ${p.naziv} – ${p.sati} h sedmično`).join('\n')}

Vrati ISKLJUČIVO JSON niz (bez ikakvog drugog teksta) objekata oblika:
{"podrucje": broj 1–11, "sadrzaj": "konkretna aktivnost", "mjeseci": [brojevi mjeseci 9,10,11,12,1,2,3,4,5,6 – prazan niz = tokom cijele godine], "saradnici": "s kim (uloge)"}

Pravila:
- Svako od 11 područja mora imati bar 2 stavke; područja 5 i 11 (po 10 h) i 4 (5 h) najviše stavki.
- Uključi sve što je kolega naveo (npr. rad s učenicima s teškoćama, područne škole, podjela rada u stručnoj službi) i uobičajene obaveze (godišnji i mjesečni planovi, dnevnik rada, izvještaji, profesionalna orijentacija 8. i 9. razreda, upis u 1. razred u proljeće, stručni tim, prevencija nasilja, saradnja s roditeljima i institucijama, stručno usavršavanje).
- Ako je kolega počeo raditi tokom godine, planiraj samo od mjeseca dolaska do juna.
- Sadržaji kratki (do 15 riječi), konkretni, u obliku aktivnosti. ${PRIVATNOST}`;

export function porukaPlana(opis: string, godinaNaziv: string, odMjeseca: number | null, postojece: string[]): string {
  return [
    `Školska godina: ${godinaNaziv}.`,
    odMjeseca ? `Psiholog radi od mjeseca ${odMjeseca}. – planiraj od tog mjeseca do juna.` : '',
    '',
    'Opis dogovora i potreba:',
    opis.trim() || '(nije naveden – napravi standardni plan)',
    postojece.length ? `\nU planu već postoje ove stavke (ne ponavljaj ih):\n${postojece.map((p) => `- ${p}`).join('\n')}` : '',
  ].filter((l, i) => l !== '' || i === 2).join('\n');
}

export interface PrijedlogStavke { podrucje: number; sadrzaj: string; mjeseci: number[]; saradnici: string }

/** Provjeri i očisti stavke plana koje je vratio AI. */
export function procitajPlan(odgovor: string): PrijedlogStavke[] {
  const niz = izvuciJSON<unknown[]>(odgovor);
  if (!Array.isArray(niz)) return [];
  const out: PrijedlogStavke[] = [];
  for (const x of niz) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    const podrucje = Number(o.podrucje);
    const sadrzaj = String(o.sadrzaj ?? '').trim();
    if (!Number.isInteger(podrucje) || podrucje < 1 || podrucje > 11 || !sadrzaj) continue;
    const mjeseci = Array.isArray(o.mjeseci) ? [...new Set(o.mjeseci.map(Number).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12))] : [];
    out.push({ podrucje, sadrzaj: sadrzaj.slice(0, 300), mjeseci, saradnici: String(o.saradnici ?? '').trim().slice(0, 120) });
  }
  return out;
}

// ---------- 5. Ispričaj dan ----------

export const DAN_DODATAK = `
Dodatna pravila za ispričan dan:
- Iz opisa napravi SVE unose koji se mogu prepoznati (razgovori, bilješke s hodnika, saradnja, radionice, zamjene, časovi odjeljenske zajednice, sastanci, usavršavanje, priprema za rad).
- Ako je učenik u tekstu označen kao „[učenik]“ ili mu šifra nije poznata, napiši „ucenik: ???“.
- Bilješke i zaključke piši detaljno i stručno, u trećem licu, odvajajući činjenice od izjava.
- Odgovori SAMO blokovima u jednom bloku koda – bez uvoda i objašnjenja.`;

// ---------- 6. Popunjavanje obrasca iz diktata ----------

export function sistemObrasca(def: DefinicijaObrasca): string {
  const polja = def.polja.filter((f) => f.tip !== 'ucenik').map((f) => {
    const tip = f.tip === 'datum' ? 'datum DD.MM.YYYY' : f.tip === 'izbor' ? `jedno od: ${(f.opcije ?? []).join(' | ')}` : f.tip === 'dugi' ? 'duži tekst' : 'kratak tekst';
    return `- "${f.kljuc}": ${f.labela} (${tip})`;
  });
  return `Ti si iskusan školski psiholog i zapisničar. Kolega diktira ili opisuje sadržaj dokumenta „${def.naziv}“. Popuni polja dokumenta iz njegovog opisa.

Vrati ISKLJUČIVO JSON objekat s ovim ključevima (izostavi ključ ako u opisu nema podataka):
${polja.join('\n')}

Pravila: ${JEZIK} Tekst sredi stručno i pregledno (zapisnički stil, treće lice, prošlo vrijeme), ali ništa ne izmišljaj i ne dodaj činjenice kojih nema. Zaključke i zaduženja navedi kao numerisanu listu u tekstu. ${PRIVATNOST}`;
}

/** Iz AI odgovora uzmi samo poznata polja; datume pretvori u ISO, izbor provjeri. */
export function procitajObrazac(def: DefinicijaObrasca, odgovor: string): Record<string, string> {
  const o = izvuciJSON<Record<string, unknown>>(odgovor);
  if (!o || Array.isArray(o) || typeof o !== 'object') return {};
  const out: Record<string, string> = {};
  for (const f of def.polja) {
    if (f.tip === 'ucenik') continue;
    const v = o[f.kljuc];
    if (v == null || v === '') continue;
    const s = Array.isArray(v) ? v.map(String).join('\n') : String(v).trim();
    if (f.tip === 'datum') {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : parsirajPrikaz(s.replace(/\.$/, ''));
      if (iso) out[f.kljuc] = iso;
    } else if (f.tip === 'izbor') {
      const nadjeno = (f.opcije ?? []).find((x) => x.toLowerCase() === s.toLowerCase()) ?? (f.opcije ?? []).find((x) => x.toLowerCase().startsWith(s.toLowerCase().slice(0, 6)));
      if (nadjeno) out[f.kljuc] = nadjeno;
    } else out[f.kljuc] = s;
  }
  return out;
}

// ---------- 8. Priprema za radionicu ----------
// Struktura prema uobičajenoj pisanoj pripremi u školama (BiH): zadaci (obrazovni, odgojni,
// funkcionalni), očekivani ishodi, oblici i metode rada, sredstva, korelacija, tok po etapama
// s vremenom (aktivnosti voditelja i učenika), evaluacija i literatura.

export const RADIONICA_SISTEM = `Ti si iskusan školski psiholog koji vodi psihološke radionice u osnovnoj školi u BiH. Na osnovu razreda, teme i trajanja napiši PISANU PRIPREMU za radionicu primjerenu uzrastu, u obliku uobičajenom za pripreme u školama.

Vrati ISKLJUČIVO JSON objekat:
{
 "tema": "naziv radionice",
 "cilj": "opći cilj, 1–2 rečenice",
 "zadaci": {"obrazovni": "…", "odgojni": "…", "funkcionalni": "…"},
 "ishodi": ["Učenik/ca će moći …", "…"],
 "obliciRada": "npr. frontalni, grupni, rad u paru, individualni",
 "metode": "npr. razgovor, oluja ideja, igra uloga, demonstracija",
 "sredstva": "materijal i pomagala",
 "korelacija": "povezanost s predmetima ili ČOZ-om",
 "tok": [
  {"etapa": "Uvodni dio", "minuta": 5, "voditelj": "šta radi psiholog", "ucenici": "šta rade učenici"},
  {"etapa": "Glavni dio", "minuta": 30, "voditelj": "…", "ucenici": "…"},
  {"etapa": "Završni dio", "minuta": 10, "voditelj": "…", "ucenici": "…"}
 ],
 "evaluacija": "kako se provjerava postignuće ishoda",
 "literatura": "izvori (priručnici, programi) – samo stvarni, opšte poznati; ako nisi siguran, ostavi prazno",
 "napomena": "prilagodbe i savjeti za voditelja"
}

Pravila: ${JEZIK} Zbir minuta u toku mora odgovarati trajanju. Glavni dio može imati više etapa (npr. „Glavni dio – aktivnost 1“). 3–5 konkretnih, provjerljivih ishoda. Aktivnosti izvodive u učionici, bez troškova i bez osjetljivih ličnih otkrivanja pred razredom.`;

export interface EtapaToka { etapa: string; minuta: number; voditelj: string; ucenici: string }
export interface PripremaRadionice {
  tema: string; cilj: string;
  zadaci: { obrazovni: string; odgojni: string; funkcionalni: string };
  ishodi: string[]; obliciRada: string; metode: string; sredstva: string; korelacija: string;
  tok: EtapaToka[]; evaluacija: string; literatura: string; napomena: string;
  /** podaci o realizaciji (popunjava psiholog) */
  razred?: string; grupa?: string; trajanje?: number; datum?: string; listic?: boolean;
}

const tekstPolja = (v: unknown): string => (Array.isArray(v) ? v.map(String).join('\n') : v == null ? '' : String(v)).trim();

export function procitajRadionicu(odgovor: string): PripremaRadionice | null {
  const o = izvuciJSON<Record<string, unknown>>(odgovor);
  if (!o || Array.isArray(o) || !o.tema) return null;
  const z = (o.zadaci && typeof o.zadaci === 'object' && !Array.isArray(o.zadaci) ? o.zadaci : {}) as Record<string, unknown>;
  let tok: EtapaToka[] = Array.isArray(o.tok)
    ? (o.tok as unknown[]).filter((x) => x && typeof x === 'object').map((x) => {
      const e = x as Record<string, unknown>;
      return { etapa: tekstPolja(e.etapa) || 'Etapa', minuta: Math.max(0, Math.round(Number(e.minuta) || 0)), voditelj: tekstPolja(e.voditelj), ucenici: tekstPolja(e.ucenici) };
    })
    : [];
  // stariji oblik odgovora: tok kao tekst
  if (!tok.length && o.tokAktivnosti) tok = [{ etapa: 'Tok radionice', minuta: 0, voditelj: tekstPolja(o.tokAktivnosti), ucenici: '' }];
  const ishodi = Array.isArray(o.ishodi) ? (o.ishodi as unknown[]).map((x) => String(x).trim()).filter(Boolean) : tekstPolja(o.ishodi).split('\n').map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  return {
    tema: tekstPolja(o.tema), cilj: tekstPolja(o.cilj),
    zadaci: { obrazovni: tekstPolja(z.obrazovni), odgojni: tekstPolja(z.odgojni), funkcionalni: tekstPolja(z.funkcionalni) },
    ishodi, obliciRada: tekstPolja(o.obliciRada), metode: tekstPolja(o.metode), sredstva: tekstPolja(o.sredstva ?? o.materijal), korelacija: tekstPolja(o.korelacija),
    tok, evaluacija: tekstPolja(o.evaluacija), literatura: tekstPolja(o.literatura), napomena: tekstPolja(o.napomena),
  };
}

/** Tok kao jedan tekst (za evidenciju održane radionice). */
export const tokKaoTekst = (p: PripremaRadionice) => p.tok.map((e) => `${e.etapa}${e.minuta ? ` (${e.minuta} min)` : ''}: ${[e.voditelj, e.ucenici && `Učenici: ${e.ucenici}`].filter(Boolean).join(' ')}`).join('\n');

/** Sačuvana priprema: JSON u tekstu dokumenta (stare pripreme su običan tekst). */
export function ucitajPripremu(tekst: string): PripremaRadionice | null {
  if (!tekst.trim().startsWith('{')) return null;
  try { const p = JSON.parse(tekst) as PripremaRadionice; return p && p.tema && Array.isArray(p.tok) ? p : null; } catch { return null; }
}

// ---------- 9. Letak za roditelje / nastavnike ----------

export const LETAK_SISTEM = `Ti si školski psiholog koji piše kratke, tople i praktične letke za roditelje, nastavnike ili učenike u osnovnoj školi u BiH.

Napiši letak za jednu A4 stranicu:
- Prvi red: naslov (bez oznaka).
- Kratak uvod (2–3 rečenice) zašto je tema važna.
- 3–5 kratkih odjeljaka s podnaslovima (podnaslov u posebnom redu, završava dvotačkom), u svakom 3–5 konkretnih savjeta kao redovi koji počinju s „• “.
- Završetak: kada potražiti dodatnu pomoć i poziv da se obrate školskom psihologu.
${JEZIK} Jednostavan jezik bez stručnog žargona, pozitivan ton, bez dijagnosticiranja i bez zastrašivanja.`;

// ---------- 1. Brifing ----------

export const BRIFING_SISTEM = `Ti si organizovan i iskusan mentor školskom psihologu. Dobijaš pregled njegovog dana i obaveza (bez imena). Napiši kratak jutarnji plan:
1. Tri najvažnije stvari za danas (prioritet: zaštita djeteta, zakazani kontakti, rokovi koji kasne).
2. Šta još stići ove sedmice.
3. Jedna praktična preporuka (npr. područje rada koje zaostaje).
Najviše 120 riječi, kratke rečenice. ${JEZIK} ${PRIVATNOST}`;
