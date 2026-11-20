// "Unos iz teksta": pretvara sređen tekst (koji napravi ChatGPT/Claude ili psiholog sam)
// u unose razgovora, radionica, saradnje i ostalih aktivnosti.
//
// Format (blok po aktivnosti):
//   ### RAZGOVOR
//   datum: 20.11.2026
//   ucenik: U056
//   razlog: Izostanci
//   biljeske: Tekst može ići
//   i u više redova.
//
// Parser je tolerantan: ignoriše ``` ograde, **bold**, crtice na početku reda,
// velika/mala slova i naša slova u nazivima polja.

import { dodajDane, parsirajPrikaz } from './datum';
import { jeIspravnaSifra, normalizujRazred, ocistiSifru } from './sifra';
import type { Aktivnost, Kategorija, Radionica, Razgovor, Saradnja, StavkaSifrarnika, Ucenik, VrstaUnosa } from '../types';

type Bez<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type ParsiranUnos =
  | { tip: 'razgovor'; podaci: Bez<Razgovor> } & Meta
  | { tip: 'radionica'; podaci: Bez<Radionica> } & Meta
  | { tip: 'saradnja'; podaci: Bez<Saradnja> } & Meta
  | { tip: 'aktivnost'; podaci: Bez<Aktivnost> } & Meta;

interface Meta {
  red: number; // red u tekstu gdje blok počinje
  greske: string[]; // blokiraju snimanje
  upozorenja: string[]; // ne blokiraju
  noviUcenici: { sifra: string; razred: string }[];
}

export interface Kontekst {
  ucenici: Pick<Ucenik, 'sifra' | 'ime' | 'prezime' | 'razred'>[];
  sifrarnik: Pick<StavkaSifrarnika, 'kategorija' | 'naziv' | 'sakriveno'>[];
  danas: string; // YYYY-MM-DD
}

export const norm = (s: string) =>
  (s || '').toLowerCase().replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- tipovi blokova ----------

function tipBloka(naslov: string): { tip: VrstaUnosa; vrstaAktivnosti?: string } | null {
  const n = norm(naslov);
  if (/^razgovor/.test(n)) return { tip: 'razgovor' };
  if (/^radionic/.test(n)) return { tip: 'radionica' };
  if (/^saradnj/.test(n)) return { tip: 'saradnja' };
  if (/^zamjen/.test(n)) return { tip: 'aktivnost', vrstaAktivnosti: 'Zamjena nastavnika' };
  if (/^(cas )?odjeljensk|^coz$/.test(n)) return { tip: 'aktivnost', vrstaAktivnosti: 'Čas odjeljenske zajednice' };
  if (/^(ostala )?aktivnost/.test(n)) return { tip: 'aktivnost' };
  return null;
}

// ---------- nazivi polja ----------

const POLJA: Record<VrstaUnosa, Record<string, string>> = {
  razgovor: {
    datum: 'datum', ucenik: 'ucenik', sifra: 'ucenik', 'sifra ucenika': 'ucenik', razred: 'razred',
    vrsta: 'vrstaKontakta', 'vrsta kontakta': 'vrstaKontakta', kontakt: 'vrstaKontakta',
    inicirao: 'inicirao', 'ko je inicirao': 'inicirao', razlog: 'razlog',
    biljeske: 'biljeske', biljeska: 'biljeske', zakljucak: 'zakljucak', preporuke: 'preporuke', preporuka: 'preporuke',
    'sljedeci korak': 'sljedeciKorak', 'sljedeci kontakt': 'datumSljedecegKontakta', 'datum sljedeceg kontakta': 'datumSljedecegKontakta',
    status: 'statusSlucaja', 'status slucaja': 'statusSlucaja', trajanje: 'trajanjeMin', 'trajanje min': 'trajanjeMin',
  },
  radionica: {
    datum: 'datum', razred: 'razred', tema: 'tema', oblast: 'oblast', 'ciljna grupa': 'ciljnaGrupa', grupa: 'ciljnaGrupa',
    'broj ucesnika': 'brojUcesnika', ucesnika: 'brojUcesnika', ucesnici: 'brojUcesnika', trajanje: 'trajanjeMin', 'trajanje min': 'trajanjeMin',
    cilj: 'cilj', tok: 'tokAktivnosti', 'tok aktivnosti': 'tokAktivnosti', zapazanja: 'zapazanja',
    'ucenici za pracenje': 'ucenicizaPracenje', pracenje: 'ucenicizaPracenje', evaluacija: 'evaluacija', napomena: 'napomena',
  },
  saradnja: {
    datum: 'datum', ucenik: 'ucenik', sifra: 'ucenik', razred: 'razred', ustanova: 'ustanovaOsoba', 'ustanova osoba': 'ustanovaOsoba', osoba: 'ustanovaOsoba', sa: 'ustanovaOsoba',
    opis: 'opisOsobe', 'opis osobe': 'opisOsobe', nacin: 'nacin', razlog: 'razlog',
    dogovor: 'dogovorIshod', ishod: 'dogovorIshod', 'dogovor ishod': 'dogovorIshod', trajanje: 'trajanjeMin', 'trajanje min': 'trajanjeMin',
  },
  aktivnost: {
    datum: 'datum', vrsta: 'vrsta', razred: 'razred', cas: 'cas', umjesto: 'umjestoKoga', 'umjesto koga': 'umjestoKoga',
    predmet: 'predmet', tema: 'tema', sadrzaj: 'tema', opis: 'tema', zapazanja: 'zapazanja', napomena: 'napomena', trajanje: 'trajanjeMin', 'trajanje min': 'trajanjeMin',
  },
};

const SVA_POLJA = new Set(Object.values(POLJA).flatMap((p) => Object.keys(p)));

// ---------- pomoćne funkcije ----------

function parsirajDatum(v: string, osnova: string): string | null {
  const n = norm(v);
  if (!n) return '';
  if (n === 'danas') return osnova;
  if (n === 'jucer' || n === 'juce') return dodajDane(osnova, -1);
  if (n === 'sutra') return dodajDane(osnova, 1);
  const za = /^(?:za |\+ ?)?(\d{1,3}) ?dan[a]?$/.exec(n) ?? /^\+ ?(\d{1,3})$/.exec(v.trim());
  if (za) return dodajDane(osnova, Number(za[1]));
  if (/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return v.trim();
  return parsirajPrikaz(v.trim().replace(/\.$/, ''));
}

function opcijeKategorije(k: Kontekst, kat: Kategorija): string[] {
  return k.sifrarnik.filter((s) => s.kategorija === kat).map((s) => s.naziv);
}

/** Pronađi stavku šifrarnika: tačno, pa po početku, pa po sadržaju. Vraća [vrijednost, upozorenje?]. */
export function uskladi(vrijednost: string, opcije: string[], naziv: string): [string, string?] {
  const v = norm(vrijednost);
  if (!v) return [''];
  const tacno = opcije.find((o) => norm(o) === v);
  if (tacno) return [tacno];
  const pocetak = opcije.filter((o) => norm(o).startsWith(v) || v.startsWith(norm(o)));
  if (pocetak.length === 1) return [pocetak[0]];
  const sadrzi = opcije.filter((o) => norm(o).includes(v) || v.split(' ').filter((r) => r.length > 3).some((r) => norm(o).includes(r)));
  if (sadrzi.length === 1) return [sadrzi[0]];
  return [vrijednost.trim(), `${naziv} „${vrijednost.trim()}“ nije u šifrarniku – biće sačuvano kako piše.`];
}

function nadjiUcenika(v: string, k: Kontekst): { sifra: string; postoji: boolean; greska?: string } {
  const t = v.trim();
  if (!t) return { sifra: '', postoji: false };
  const s = ocistiSifru(t);
  if (s === t.toUpperCase().replace(/\s/g, '') && jeIspravnaSifra(s)) {
    return { sifra: s, postoji: k.ucenici.some((u) => u.sifra === s) };
  }
  // po imenu (bilo kojim redom), bez obzira na naša slova
  const n = norm(t);
  const pogodci = k.ucenici.filter((u) => {
    const a = norm(`${u.ime ?? ''} ${u.prezime ?? ''}`), b = norm(`${u.prezime ?? ''} ${u.ime ?? ''}`);
    return a === n || b === n;
  });
  if (pogodci.length === 1) return { sifra: pogodci[0].sifra, postoji: true };
  if (pogodci.length > 1) return { sifra: '', postoji: false, greska: `Više učenika se zove „${t}“ – upiši šifru.` };
  return { sifra: '', postoji: false, greska: `Nepoznat učenik „${t}“ – upiši šifru (npr. U056).` };
}

const broj = (v: string): number | null => {
  const m = /\d+/.exec(v || '');
  return m ? Number(m[0]) : null;
};

// ---------- glavni parser ----------

export function parsirajTekst(tekst: string, k: Kontekst): ParsiranUnos[] {
  const linije = (tekst || '').replace(/\r/g, '').split('\n');
  const blokovi: { red: number; tip: VrstaUnosa; vrstaAktivnosti?: string; polja: Record<string, string>; nepoznata: string[] }[] = [];
  let tren: (typeof blokovi)[number] | null = null;
  let zadnjePolje = '';

  linije.forEach((sirova, i) => {
    let l = sirova.trim();
    if (/^```/.test(l) || /^-{3,}$/.test(l)) return;
    l = l.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').replace(/__/g, '').trim();

    const naslov = /^#{1,6}\s*(.+?)\s*#*$/.exec(l) ?? /^\[(.+)\]$/.exec(l) ?? (/^[A-ZČĆŽŠĐ ]{5,}:?$/.test(l) ? [l, l.replace(/:$/, '')] : null);
    if (naslov) {
      const t = tipBloka(naslov[1]);
      if (t) {
        tren = { red: i + 1, ...t, polja: {}, nepoznata: [] };
        blokovi.push(tren);
        zadnjePolje = '';
        return;
      }
    }
    if (!tren) return;
    if (!l) { if (zadnjePolje && tren.polja[zadnjePolje]) tren.polja[zadnjePolje] += '\n'; return; }

    const kv = /^([A-Za-zčćžšđČĆŽŠĐ/ ]{2,40}?)\s*:\s*(.*)$/.exec(l);
    const kljuc = kv ? norm(kv[1]) : '';
    if (kv && POLJA[tren.tip][kljuc]) {
      zadnjePolje = POLJA[tren.tip][kljuc];
      tren.polja[zadnjePolje] = kv[2].trim();
    } else if (kv && SVA_POLJA.has(kljuc)) {
      tren.nepoznata.push(kv[1].trim());
      zadnjePolje = '';
    } else if (zadnjePolje) {
      const prije = tren.polja[zadnjePolje];
      // prazan red između pasusa je već dodan kao '\n' – zadržava se kao razmak između pasusa
      tren.polja[zadnjePolje] = prije ? (prije.endsWith('\n') ? `${prije.replace(/\n+$/, '')}\n\n${l}` : `${prije}\n${l}`) : l;
    }
  });

  return blokovi.map((b) => {
    const p = Object.fromEntries(Object.entries(b.polja).map(([a, v]) => [a, v.replace(/\n+$/, '').trim()]));
    const greske: string[] = [];
    const upozorenja: string[] = b.nepoznata.map((n) => `Polje „${n}“ ne postoji kod ove vrste unosa – preskočeno.`);
    const noviUcenici: { sifra: string; razred: string }[] = [];

    const datum = parsirajDatum(p.datum ?? '', k.danas);
    if (!p.datum) upozorenja.push('Nema datuma – uzet je današnji.');
    else if (datum === null) greske.push(`Neispravan datum „${p.datum}“ (piši DD.MM.YYYY).`);
    const d = datum || k.danas;
    const sel = (kat: Kategorija, polje: string, naziv: string, zadano = '') => {
      if (!p[polje]) return zadano;
      const [v, upoz] = uskladi(p[polje], opcijeKategorije(k, kat), naziv);
      if (upoz) upozorenja.push(upoz);
      return v;
    };
    const ucenikIz = (polje: string, obavezan: boolean, razredZaNovog: string) => {
      if (!p[polje]) {
        if (obavezan) greske.push('Nedostaje učenik (šifra).');
        return '';
      }
      const r = nadjiUcenika(p[polje], k);
      if (r.greska) { greske.push(r.greska); return ''; }
      if (!r.postoji) {
        if (!razredZaNovog) greske.push(`Učenik ${r.sifra} ne postoji – dodaj red „razred: …“ da se kreira.`);
        else { noviUcenici.push({ sifra: r.sifra, razred: razredZaNovog }); upozorenja.push(`Nov učenik ${r.sifra} (${razredZaNovog}) biće kreiran.`); }
      }
      return r.sifra;
    };

    const meta = { red: b.red, greske, upozorenja, noviUcenici };

    if (b.tip === 'razgovor') {
      const razred = normalizujRazred(p.razred ?? '');
      const sifra = ucenikIz('ucenik', true, razred);
      const sljedeci = p.datumSljedecegKontakta ? parsirajDatum(p.datumSljedecegKontakta, d) : '';
      if (sljedeci === null) greske.push(`Neispravan datum sljedećeg kontakta „${p.datumSljedecegKontakta}“.`);
      return {
        tip: 'razgovor', ...meta,
        podaci: {
          datum: d, sifra, razred: razred || k.ucenici.find((u) => u.sifra === sifra)?.razred || '',
          vrstaKontakta: sel('vrstaKontakta', 'vrstaKontakta', 'Vrsta kontakta', 'Individualni razgovor s učenikom'),
          inicirao: sel('inicirao', 'inicirao', 'Inicirao'), razlog: sel('razlog', 'razlog', 'Razlog'),
          biljeske: p.biljeske ?? '', zakljucak: p.zakljucak ?? '', preporuke: p.preporuke ?? '', sljedeciKorak: p.sljedeciKorak ?? '',
          datumSljedecegKontakta: sljedeci || '', statusSlucaja: sel('statusSlucaja', 'statusSlucaja', 'Status', 'Otvoren'),
          trajanjeMin: p.trajanjeMin ? broj(p.trajanjeMin) : 45,
        },
      };
    }
    if (b.tip === 'radionica') {
      if (!p.tema) greske.push('Nedostaje tema radionice.');
      const razred = normalizujRazred(p.razred ?? '');
      const sifre: string[] = [];
      for (const dio of (p.ucenicizaPracenje ?? '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)) {
        const r = nadjiUcenika(dio, k);
        if (r.greska) greske.push(r.greska);
        else {
          sifre.push(r.sifra);
          if (!r.postoji) upozorenja.push(`Nov učenik ${r.sifra} biće kreiran.`);
        }
      }
      const traj = p.trajanjeMin ? broj(p.trajanjeMin) : 45;
      return {
        tip: 'radionica', ...meta,
        podaci: {
          datum: d, razred, tema: p.tema ?? '', oblast: sel('oblast', 'oblast', 'Oblast'), ciljnaGrupa: sel('ciljnaGrupa', 'ciljnaGrupa', 'Ciljna grupa', 'Učenici'),
          brojUcesnika: p.brojUcesnika ? broj(p.brojUcesnika) : null, trajanjeMin: traj,
          cilj: p.cilj ?? '', tokAktivnosti: p.tokAktivnosti ?? '', zapazanja: p.zapazanja ?? '',
          ucenicizaPracenje: [...new Set(sifre)], evaluacija: p.evaluacija ?? '', napomena: p.napomena ?? '',
        },
      };
    }
    if (b.tip === 'saradnja') {
      const sifra = ucenikIz('ucenik', false, normalizujRazred(p.razred ?? ''));
      const ustanova = sel('ustanovaOsoba', 'ustanovaOsoba', 'Ustanova/osoba');
      if (!ustanova) greske.push('Nedostaje „ustanova:“ (npr. Roditelj/staratelj, Centar za socijalni rad).');
      return {
        tip: 'saradnja', ...meta,
        podaci: {
          datum: d, sifra, ustanovaOsoba: ustanova, opisOsobe: p.opisOsobe ?? '', nacin: sel('nacin', 'nacin', 'Način', 'Sastanak'),
          razlog: p.razlog ?? '', dogovorIshod: p.dogovorIshod ?? '', trajanjeMin: p.trajanjeMin ? broj(p.trajanjeMin) : 30,
        },
      };
    }
    const vrsta = p.vrsta ? sel('vrstaAktivnosti', 'vrsta', 'Vrsta aktivnosti') : b.vrstaAktivnosti ?? '';
    if (!vrsta) greske.push('Nedostaje „vrsta:“ aktivnosti.');
    return {
      tip: 'aktivnost', ...meta,
      podaci: {
        datum: d, vrsta, razred: normalizujRazred(p.razred ?? ''), cas: p.cas ? String(broj(p.cas) ?? p.cas) : '',
        umjestoKoga: p.umjestoKoga ?? '', predmet: p.predmet ?? (/odjeljensk/i.test(vrsta) ? 'Čas odjeljenske zajednice' : ''),
        tema: p.tema ?? '', zapazanja: p.zapazanja ?? '', napomena: p.napomena ?? '', trajanjeMin: p.trajanjeMin ? broj(p.trajanjeMin) : 45,
      },
    };
  });
}

// ---------- uputa za ChatGPT / Claude ----------

export function uputaZaAI(k: Pick<Kontekst, 'sifrarnik'>, danasPrikaz: string): string {
  const op = (kat: Kategorija) => k.sifrarnik.filter((s) => s.kategorija === kat && !s.sakriveno).map((s) => s.naziv).join(' | ');
  return `Pomažeš mi da vodim evidenciju rada školskog psihologa. Kad ti opišem šta sam radio/la, pretvori to u unose u TAČNO ovom obliku – jedan blok po aktivnosti, cijeli odgovor u jednom bloku koda (\`\`\`), bez ikakvog drugog teksta.

Pravila:
- Učenike piši SAMO šiframa koje ti dam (npr. U056), nikad imenom. Ne izmišljaj šifre.
- Ne izmišljaj podatke. Ako nešto nisam rekao/la, izostavi taj red.
- Datum piši kao DD.MM.YYYY. Danas je ${danasPrikaz}. Ako ne kažem datum, piši danas.
- Bilješke piši stručno, kratko, u trećem licu, bez imena (ni roditelja ni nastavnika – samo „majka“, „razrednik 7-1“ i sl.).
- Kod polja s ponuđenim vrijednostima koristi jednu od ponuđenih.

### RAZGOVOR
datum: DD.MM.YYYY
ucenik: U000
razred: (samo ako je učenik nov)
vrsta: ${op('vrstaKontakta')}
inicirao: ${op('inicirao')}
razlog: ${op('razlog')}
biljeske: …
zakljucak: …
preporuke: …
sljedeci korak: …
sljedeci kontakt: DD.MM.YYYY
status: ${op('statusSlucaja')}
trajanje: minuta (ako kažem)

### RADIONICA
datum: DD.MM.YYYY
razred: npr. 7-1
tema: …
oblast: ${op('oblast')}
ciljna grupa: ${op('ciljnaGrupa')}
broj ucesnika: broj
trajanje: minuta
cilj: …
tok aktivnosti: …
zapazanja: …
ucenici za pracenje: U001, U002
evaluacija: …

### SARADNJA
datum: DD.MM.YYYY
ucenik: U000 (ako se odnosi na učenika)
razred: (samo ako je učenik nov)
ustanova: ${op('ustanovaOsoba')}
opis: npr. majka / razrednik 7-1
nacin: ${op('nacin')}
razlog: …
dogovor: …

### AKTIVNOST
datum: DD.MM.YYYY
vrsta: ${op('vrstaAktivnosti')}
razred: npr. 7-1
cas: broj časa
umjesto: koga sam mijenjao/la (npr. razrednik 7-1)
predmet: …
tema: …
zapazanja: …
trajanje: minuta (ako kažem)

Potvrdi da si razumio/la, pa čekaj moj opis.`;
}
