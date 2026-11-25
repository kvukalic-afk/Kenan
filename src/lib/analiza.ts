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

export type RezimAnalize = 'pregled' | 'priprema' | 'teskoce';

export const PRIPREMA_SISTEM = `Ti si iskusan školski psiholog i mentor mlađem kolegi u osnovnoj školi u Bosni i Hercegovini (Unsko-sanski kanton). Kolega se priprema za razgovor (s učenikom, roditeljem ili nastavnikom). Daje ti ono što se zna o učeniku (zapisi iz evidencije i/ili svoj opis) i cilj razgovora.

Napiši pripremu na bosanskom jeziku (ijekavica), praktično i konkretno, sa ovim dijelovima (naslovi kao kratke linije, bez markdown zvjezdica):
1. Šta već znamo – kratak sažetak činjenica, odvojeno od pretpostavki.
2. Cilj razgovora – šta realno postići u ovom razgovoru.
3. Tok razgovora – uvod i uspostavljanje povjerenja (prilagođeno uzrastu), glavni dio, završetak i dogovor.
4. Ključna pitanja – 8 do 12 otvorenih pitanja, redom kako ih postaviti; po potrebi posebno za učenika i za roditelja.
5. Na šta obratiti pažnju – neverbalni znakovi, rizici, crvene zastavice; kada se razgovor pretvara u postupanje radi zaštite djeteta (nasilje, zlostavljanje, samopovređivanje) i šta tada obavezno uraditi.
6. Šta izbjegavati – formulacije i postupci koji mogu naštetiti odnosu ili djetetu.
7. Poslije razgovora – šta zapisati (činjenice, izjave, dogovor), mogući sljedeći koraci i koga uključiti.

Pravila: koristi samo date informacije, ništa ne izmišljaj o učeniku; ne postavljaj dijagnoze. Učenici su označeni šiframa ili „[učenik]“, odrasli ulogama – zadrži te oznake.`;

export const TESKOCE_SISTEM = `Ti si iskusan školski i razvojni psiholog i supervizor u osnovnoj školi u Bosni i Hercegovini (Unsko-sanski kanton). Kolega opisuje učenika s teškoćama (zapisi iz evidencije, opis sastanka, zapažanja nastavnika i roditelja) i traži pomoć da razumije stanje i planira dalje.

VAŽNO: dijagnozu ne postavljaš ni ti ni školski psiholog. Dijagnozu postavljaju nadležni stručnjaci i ustanove (ljekar, klinički psiholog, psihijatar, logoped, defektolog), a procjenu potreba za obrazovanje u USK vrši Stručno tijelo Ministarstva po MKF (Zakon o osnovnom odgoju i obrazovanju USK, čl. 23). Ti pomažeš da se teškoće jasno opišu, da se postave radne hipoteze i da se planira šta dalje.

Napiši na bosanskom jeziku (ijekavica), stručno i pregledno, sa ovim dijelovima (naslovi kao kratke linije, bez markdown zvjezdica):
1. Opis teškoća po područjima – učenje i kognitivno funkcionisanje, pažnja i aktivnost, govor i jezik, socio-emocionalno, ponašanje, motorika i senzorno, porodične i životne okolnosti (samo ono što piše u podacima; za ostalo „nema podataka“).
2. Radne hipoteze – koje vrste teškoća su u skladu s opisom (npr. specifične teškoće učenja, teškoće pažnje i hiperaktivnost, poremećaji iz autističnog spektra, intelektualne teškoće, teškoće govora i jezika, anksiozne ili depresivne teškoće, posljedice stresa ili traume, senzorne ili zdravstvene teškoće, socijalne i porodične okolnosti). Za svaku: šta u opisu govori ZA, šta PROTIV ili nedostaje. Navedi najvjerovatnije prvo, ali jasno kao hipoteze.
3. Šta još prikupiti i kako – opservacija (gdje, šta pratiti), razvojna anamneza s roditeljima (konkretna pitanja), informacije od nastavnika, uvid u radove, skale i upitnici primjereni školskom psihologu.
4. Kada i kome uputiti – porodični ljekar ili pedijatar, Centar za mentalno zdravlje, logoped, defektolog, Centar za razvoj inkluzivnih praksi (CRIP), Stručno tijelo; šta poslati uz uputnicu (uz saglasnost roditelja).
5. Šta škola može odmah – prilagodbe u nastavi i ocjenjivanju, podrška u razredu, savjeti nastavnicima i roditeljima, individualni program kad su potrebe utvrđene.
6. Crvene zastavice – kada je potrebno hitno postupanje (zaštita djeteta, rizik po zdravlje ili sigurnost).

Pravila: koristi samo date informacije, ništa ne izmišljaj; jasno odvoji činjenice od pretpostavki; ako je podataka premalo, reci šta tačno nedostaje. Učenici su označeni šiframa ili „[učenik]“, odrasli ulogama – zadrži te oznake.`;

export const REZIMI: Record<RezimAnalize, { sistem: string; naslov: string; ikona: string; dugme: string; opisLabela: string; opisPomoc: string; obavezanOpis: boolean }> = {
  pregled: { sistem: ANALIZA_SISTEM, naslov: 'AI pregled', ikona: '🧠', dugme: 'Analiziraj', opisLabela: 'Posebno pitanje (nije obavezno)', opisPomoc: 'npr. „Ima li znakova vršnjačkog nasilja?“ ili „Šta preporučiti razredniku?“', obavezanOpis: false },
  priprema: { sistem: PRIPREMA_SISTEM, naslov: 'Priprema za razgovor', ikona: '🗣', dugme: 'Pripremi me', opisLabela: 'S kim je razgovor, zašto i šta još znaš', opisPomoc: 'npr. „Sutra razgovor s majkom zbog izostanaka. Razrednik 7-1 kaže da se povukla nakon raspusta. Želim saznati šta se dešava kod kuće.“ Bez imena.', obavezanOpis: true },
  teskoce: { sistem: TESKOCE_SISTEM, naslov: 'Procjena teškoća', ikona: '🧩', dugme: 'Pomozi mi razumjeti', opisLabela: 'Opis teškoća i sastanka (šta su rekli nastavnici, roditelji, šta si primijetio/la)', opisPomoc: 'Što konkretnije: kada se javlja, koliko dugo, u kojim situacijama, šta je urađeno do sada. Bez imena.', obavezanOpis: true },
};

export function porukaRezima(rezim: RezimAnalize, opseg: string, anonimniTekst: string, opis: string): string {
  if (rezim === 'pregled') return porukaAnalize(opseg, anonimniTekst, opis);
  return [
    `Učenik: ${opseg}`,
    '',
    rezim === 'priprema' ? 'Razgovor i šta znam:' : 'Opis teškoća i sastanka:',
    opis.trim() || '—',
    '',
    'Zapisi iz evidencije (hronološki):',
    anonimniTekst.trim() || 'Nema ranijih zapisa.',
  ].join('\n');
}
