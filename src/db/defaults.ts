import type { Kategorija, Postavke, StavkaSifrarnika } from '../types';
import { skolskaGodinaZaDatum } from '../lib/datum';

export const KATEGORIJE: { kljuc: Kategorija; naziv: string }[] = [
  { kljuc: 'vrstaKontakta', naziv: 'Vrsta kontakta' },
  { kljuc: 'inicirao', naziv: 'Ko je inicirao' },
  { kljuc: 'razlog', naziv: 'Razlog' },
  { kljuc: 'statusSlucaja', naziv: 'Status slučaja' },
  { kljuc: 'oblast', naziv: 'Oblast radionice' },
  { kljuc: 'ciljnaGrupa', naziv: 'Ciljna grupa' },
  { kljuc: 'ustanovaOsoba', naziv: 'Ustanova / osoba' },
  { kljuc: 'nacin', naziv: 'Način kontakta' },
  { kljuc: 'vrstaAktivnosti', naziv: 'Vrsta ostale aktivnosti' },
];

export const POCETNI_SIFRARNIK: Record<Kategorija, string[]> = {
  vrstaKontakta: [
    'Individualni razgovor s učenikom',
    'Razgovor s roditeljem',
    'Razgovor s razrednikom/nastavnikom',
    'Opservacija na času',
    'Grupni razgovor',
    'Telefonski kontakt',
    'Ostalo',
  ],
  inicirao: ['Učenik sam', 'Razrednik', 'Nastavnik', 'Roditelj', 'Pedagog/direktor', 'Psiholog', 'Vanjska ustanova'],
  razlog: [
    'Problemi u učenju',
    'Problemi u ponašanju',
    'Emocionalne teškoće',
    'Odnosi s vršnjacima / nasilje',
    'Porodične okolnosti',
    'Izostanci',
    'Prilagođavanje (novi učenik / 1. razred)',
    'Profesionalna orijentacija',
    'Darovitost',
    'Teškoće u razvoju / IOP',
    'Savjetovanje roditelja',
    'Ostalo',
  ],
  statusSlucaja: ['Otvoren', 'U praćenju', 'Zatvoren', 'Upućen dalje'],
  oblast: [
    'Socio-emocionalno učenje',
    'Prevencija nasilja',
    'Tehnike učenja',
    'Profesionalna orijentacija',
    'Prevencija ovisnosti',
    'Zdravi stilovi života',
    'Komunikacija i saradnja',
    'Rad s roditeljima',
    'Edukacija nastavnika',
    'Ostalo',
  ],
  ciljnaGrupa: ['Učenici', 'Roditelji', 'Nastavnici'],
  ustanovaOsoba: [
    'Roditelj/staratelj',
    'Razrednik',
    'Nastavnik',
    'Pedagog',
    'Direktor',
    'Centar za socijalni rad',
    'Centar za mentalno zdravlje',
    'Dom zdravlja / ljekar',
    'Policija',
    'Ministarstvo / Pedagoški zavod',
    'Ostalo',
  ],
  nacin: ['Sastanak', 'Telefon', 'Dopis', 'E-mail', 'Online'],
  vrstaAktivnosti: [
    'Zamjena nastavnika',
    'Čas odjeljenske zajednice',
    'Dežurstvo',
    'Sjednica vijeća / aktiva',
    'Stručno usavršavanje',
    'Ostalo',
  ],
};

/** Statusi koji znače da je slučaj završen (ne prikazuju se u "Zakazano"). */
export const ZAVRSENI_STATUSI = ['Zatvoren', 'Upućen dalje'];

/**
 * Početne stavke imaju stalne ID-eve (npr. "def-razlog-03"), pa se pri uvozu
 * rezervne kopije s drugog uređaja ne dupliraju.
 */
export function pocetneStavke(sada = new Date().toISOString()): StavkaSifrarnika[] {
  const out: StavkaSifrarnika[] = [];
  for (const kat of Object.keys(POCETNI_SIFRARNIK) as Kategorija[]) {
    POCETNI_SIFRARNIK[kat].forEach((naziv, i) => {
      out.push({
        id: `def-${kat}-${String(i + 1).padStart(2, '0')}`,
        kategorija: kat,
        naziv,
        redoslijed: i,
        sakriveno: false,
        createdAt: sada,
        updatedAt: sada,
      });
    });
  }
  return out;
}

export function pocetnePostavke(danas = new Date()): Postavke {
  return {
    id: 'postavke',
    nazivSkole: 'JU Osnovna škola Stijena',
    imePsihologa: '',
    skolskaGodinaPocetak: skolskaGodinaZaDatum(danas),
    pinHash: '',
    zadnjaKopija: '',
    updatedAt: new Date(0).toISOString(),
  };
}
