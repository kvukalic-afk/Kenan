// AI analiza prikupljenih informacija (brze bilješke, razgovori, saradnja) kroz vrijeme.

import { prikaz } from './datum';
import type { BrzaBiljeska, Razgovor, Saradnja } from '../types';

export const ANALIZA_SISTEM = `Ti si iskusan školski psiholog i supervizor u osnovnoj školi u Bosni i Hercegovini. Kolega ti daje svoje bilješke prikupljene kroz vrijeme (razgovori na hodniku, informativni razgovori s nastavnicima, roditeljima i učenicima, zapisi razgovora i saradnje). Tvoj zadatak je da ih stručno analiziraš i pomogneš mu da donese utemeljene zaključke.

Napiši analizu na bosanskom jeziku (ijekavica), stručno, jasno i pregledno, sa ovim dijelovima (naslovi kao kratke linije, bez markdown zvjezdica):
1. Pregled – šta je prikupljeno (period, broj i vrsta zapisa, o kome).
2. Ključna zapažanja i obrasci – teme koje se ponavljaju, učestalost, promjene kroz vrijeme, povezanost između različitih izvora (uz datume).
3. Mogući zaključci – oprezno formulisani, jasno odvojeni od činjenica, uz navođenje na kojim zapisima se zasnivaju.
4. Preporuke i naredni koraci – konkretne, provodljive (sa kim razgovarati, šta pratiti, koga uključiti, šta dokumentovati).
5. Otvorena pitanja – šta još nije jasno i šta treba provjeriti.

Pravila:
- Koristi SAMO informacije iz zapisa. Ništa ne izmišljaj. Ne postavljaj dijagnoze.
- Razlikuj provjerene činjenice od izjava i glasina (npr. „prema navodima nastavnika…“).
- Učenici su označeni šiframa (U056) ili „[učenik]“, razrednici kao „razrednik 7-1“ – zadrži te oznake, ne izmišljaj imena.
- Budi profesionalan i etičan: bez ocjenjivanja ličnosti kolega; fokus je na dobrobiti učenika i kvalitetu odgojno-obrazovnog rada.
- Ako je zapisa premalo za zaključke, reci to otvoreno.`;

export interface IzvoriAnalize {
  biljeske: BrzaBiljeska[];
  razgovori?: Razgovor[];
  saradnja?: Saradnja[];
}

/** Sastavi hronološki tekst svih izvora (prije anonimizacije!). */
export function sastaviIzvore(iz: IzvoriAnalize): { tekst: string; broj: number } {
  type Red = { datum: string; kad: string; tekst: string };
  const redovi: Red[] = [];
  for (const b of iz.biljeske) {
    const o = [b.kategorija, b.sifra && `učenik ${b.sifra}`, b.osobe?.length ? `o/sa: ${b.osobe.join(', ')}` : ''].filter(Boolean).join('; ');
    redovi.push({ datum: b.datum, kad: b.createdAt, tekst: `Bilješka${o ? ` (${o})` : ''}: ${(b.sroceno || b.tekst).trim()}` });
  }
  for (const r of iz.razgovori ?? []) {
    const dio = [r.biljeske && `Bilješke: ${r.biljeske}`, r.zakljucak && `Zaključak: ${r.zakljucak}`, r.preporuke && `Preporuke: ${r.preporuke}`].filter(Boolean).join(' ');
    redovi.push({ datum: r.datum, kad: r.createdAt, tekst: `Razgovor (${[r.vrstaKontakta, `učenik ${r.sifra}`, r.razlog && `razlog: ${r.razlog}`, r.statusSlucaja && `status: ${r.statusSlucaja}`].filter(Boolean).join('; ')}): ${dio || '—'}` });
  }
  for (const s of iz.saradnja ?? []) {
    redovi.push({ datum: s.datum, kad: s.createdAt, tekst: `Saradnja (${[s.ustanovaOsoba, s.nacin, s.sifra && `učenik ${s.sifra}`].filter(Boolean).join('; ')}): ${[s.razlog, s.dogovorIshod].filter(Boolean).join(' – ') || '—'}` });
  }
  redovi.sort((a, b) => a.datum.localeCompare(b.datum) || a.kad.localeCompare(b.kad));
  return { tekst: redovi.map((r) => `[${prikaz(r.datum)}] ${r.tekst}`).join('\n'), broj: redovi.length };
}

export function porukaAnalize(opseg: string, anonimniTekst: string, pitanje?: string): string {
  return [
    `Opseg analize: ${opseg}`,
    pitanje?.trim() ? `Posebno me zanima: ${pitanje.trim()}` : '',
    '',
    'Zapisi (hronološki):',
    anonimniTekst,
  ].filter((l, i) => l !== '' || i === 2).join('\n');
}
