import { describe, expect, it } from 'vitest';
import { parsirajTekst, uputaZaAI, uskladi, type Kontekst } from '../src/lib/unosIzTeksta';
import { pocetneStavke } from '../src/db/defaults';

const k: Kontekst = {
  ucenici: [
    { sifra: 'U056', ime: 'Petar', prezime: 'Petrović', razred: '7-1' },
    { sifra: 'U057', ime: 'Ana', prezime: 'Anić', razred: '7-1' },
    { sifra: 'U058', ime: 'Ana', prezime: 'Anić', razred: '8-1' },
  ],
  sifrarnik: pocetneStavke(),
  danas: '2026-11-20',
};

describe('unos iz teksta', () => {
  it('čita više blokova s ogradama, boldom i višerednim tekstom', () => {
    const t = [
      '```',
      '### RAZGOVOR',
      'datum: 19.11.2026',
      '**učenik:** U056',
      'vrsta: individualni',
      'razlog: izostanci',
      'bilješke: Učenik navodi umor.',
      'Dogovoren plan ustajanja.',
      '',
      'Drugi pasus.',
      'sljedeći kontakt: za 7 dana',
      'status: u praćenju',
      '',
      '### ZAMJENA',
      'razred: 7/1',
      'čas: 3. čas',
      'umjesto: razrednik 7-1',
      'predmet: Matematika',
      '```',
    ].join('\n');
    const r = parsirajTekst(t, k);
    expect(r).toHaveLength(2);
    const [a, b] = r;
    expect(a.tip).toBe('razgovor');
    expect(a.greske).toEqual([]);
    expect(a.podaci).toMatchObject({
      datum: '2026-11-19', sifra: 'U056', razred: '7-1', vrstaKontakta: 'Individualni razgovor s učenikom', razlog: 'Izostanci',
      biljeske: 'Učenik navodi umor.\nDogovoren plan ustajanja.\n\nDrugi pasus.', datumSljedecegKontakta: '2026-11-26', statusSlucaja: 'U praćenju',
    });
    expect(b.tip).toBe('aktivnost');
    expect(b.podaci).toMatchObject({ datum: '2026-11-20', vrsta: 'Zamjena nastavnika', razred: '7-1', cas: '3', predmet: 'Matematika' });
    expect(b.upozorenja).toContain('Nema datuma – uzet je današnji.');
  });

  it('prepoznaje učenika po imenu, javlja dvosmislena i nepoznata imena', () => {
    const r = parsirajTekst('### RAZGOVOR\nucenik: Petrović Petar\n### RAZGOVOR\nucenik: Ana Anić\n### RAZGOVOR\nucenik: Marko Markić', k);
    expect(r[0].podaci).toMatchObject({ sifra: 'U056' });
    expect(r[1].greske[0]).toContain('Više učenika');
    expect(r[2].greske[0]).toContain('Nepoznat učenik');
  });

  it('nov učenik traži razred', () => {
    const r = parsirajTekst('### RAZGOVOR\nucenik: U900\n### RAZGOVOR\nucenik: U901\nrazred: 6-2', k);
    expect(r[0].greske[0]).toContain('ne postoji');
    expect(r[1].greske).toEqual([]);
    expect(r[1].noviUcenici).toEqual([{ sifra: 'U901', razred: '6-2' }]);
    const sar = parsirajTekst('### SARADNJA\nucenik: U902\nrazred: 6-2\nustanova: roditelj', k)[0];
    expect(sar.greske).toEqual([]);
    expect(sar.noviUcenici).toEqual([{ sifra: 'U902', razred: '6-2' }]);
  });

  it('radionica, saradnja, čas odjeljenske zajednice i greške', () => {
    const r = parsirajTekst([
      '## Radionica', 'datum: 18.11.2026', 'tema: Emocije', 'oblast: socio emocionalno', 'broj učesnika: 22', 'učenici za praćenje: U056, Petar Petrović, U057',
      '## Saradnja', 'ucenik: U056', 'ustanova: centar za socijalni', 'način: telefon', 'dogovor: Sastanak u ponedjeljak.',
      '## Čas odjeljenske zajednice', 'razred: 8-2', 'tema: Sukobi',
      '## Saradnja', 'datum: 32.11.2026',
    ].join('\n'), k);
    expect(r[0].podaci).toMatchObject({ tema: 'Emocije', oblast: 'Socio-emocionalno učenje', brojUcesnika: 22, trajanjeMin: 45, ucenicizaPracenje: ['U056', 'U057'] });
    expect(r[1].podaci).toMatchObject({ sifra: 'U056', ustanovaOsoba: 'Centar za socijalni rad', nacin: 'Telefon' });
    expect(r[2].podaci).toMatchObject({ vrsta: 'Čas odjeljenske zajednice', predmet: 'Čas odjeljenske zajednice', razred: '8-2' });
    expect(r[3].greske.join(' ')).toMatch(/Neispravan datum.*Nedostaje „ustanova/);
  });

  it('nepoznata vrijednost šifrarnika se čuva uz upozorenje', () => {
    expect(uskladi('nešto sasvim drugo', ['Izostanci', 'Darovitost'], 'Razlog')).toEqual(['nešto sasvim drugo', 'Razlog „nešto sasvim drugo“ nije u šifrarniku – biće sačuvano kako piše.']);
    expect(uskladi('IZOSTANCI', ['Izostanci', 'Darovitost'], 'Razlog')).toEqual(['Izostanci']);
  });

  it('uputa za AI sadrži format i ponuđene vrijednosti', () => {
    const u = uputaZaAI(k, '20.11.2026');
    expect(u).toContain('### RAZGOVOR');
    expect(u).toContain('Zamjena nastavnika | Čas odjeljenske zajednice');
    expect(u).toContain('Danas je 20.11.2026');
    // uputa iz appa mora se moći pročitati vlastitim parserom (bez grešaka u strukturi)
    expect(parsirajTekst(u, k).map((x) => x.tip)).toEqual(['biljeska', 'razgovor', 'radionica', 'saradnja', 'aktivnost']);
  });
  it('bilješka s hodnika: vrsta, učenik, osobe, zapis i stručno sročen tekst', () => {
    const r = parsirajTekst(`### BILJEŠKA
datum: jučer
vrsta: hodnik
ucenik: U056
osobe: razrednik 7-1, majka
tekst: kaže razrednik da često kasni
sroceno: Razrednik je informisao psihologa da učenik učestalo kasni na nastavu.

### HODNIK
tekst: grupa djece se svađala`, k);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ tip: 'biljeska', greske: [], podaci: { datum: '2026-11-19', sifra: 'U056', kategorija: 'Hodnik / u prolazu', osobe: ['razrednik 7-1', 'majka'], tekst: 'kaže razrednik da često kasni', obradjena: false } });
    expect((r[0].podaci as { sroceno: string }).sroceno).toContain('učestalo kasni');
    expect(r[1]).toMatchObject({ tip: 'biljeska', greske: [], podaci: { kategorija: 'Hodnik / u prolazu', sifra: '' } });
    expect(parsirajTekst('### BILJEŠKA\nvrsta: Opservacija', k)[0].greske[0]).toContain('tekst');
  });
  it('aktivnost: područje rada se može zadati', () => {
    const [a, b] = parsirajTekst('### AKTIVNOST\nvrsta: Ostalo\npodrucje: 5\ntema: Razgovor s odjeljenjem\n\n### AKTIVNOST\nvrsta: Ostalo\npodrucje: dvanaest\ntema: x', k);
    expect(a.podaci).toMatchObject({ vrsta: 'Ostalo', podrucje: 5 });
    expect((b.podaci as { podrucje?: number }).podrucje).toBeUndefined();
    expect(b.upozorenja.join(' ')).toContain('nije broj');
  });
});
