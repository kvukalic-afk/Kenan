// Kad korisnik namjerno otvori sistemski prozor (izbor fajla, štampa), app privremeno
// „izlazi u pozadinu“. To se ne smatra izlaskom iz appa pa se PIN tada ne traži.

let izuzetoDo = 0;

/** Narednih `ms` milisekundi odlazak u pozadinu ne zaključava app. */
export function dozvoliKratakIzlazak(ms = 3 * 60 * 1000) {
  izuzetoDo = Date.now() + ms;
}

export function izlazakJeDozvoljen(): boolean {
  return Date.now() < izuzetoDo;
}

export function ponistiIzuzetak() {
  izuzetoDo = 0;
}

export const OPCIJE_ZAKLJUCAVANJA: { sek: number; naziv: string }[] = [
  { sek: 0, naziv: 'Odmah' },
  { sek: 60, naziv: 'Nakon 1 min' },
  { sek: 300, naziv: 'Nakon 5 min' },
];
