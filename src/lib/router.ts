import { useEffect, useState } from 'react';

// Rute preko hash-a (#/ucenici/U014) – rade na GitHub Pages i offline bez podešavanja servera.

export interface Ruta {
  putanja: string; // npr. "/ucenici/U014"
  dijelovi: string[]; // ["ucenici", "U014"]
  upit: URLSearchParams;
}

export function trenutnaRuta(): Ruta {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [p, q = ''] = hash.split('?');
  const putanja = p.startsWith('/') ? p : `/${p}`;
  return { putanja, dijelovi: putanja.split('/').filter(Boolean).map(decodeURIComponent), upit: new URLSearchParams(q) };
}

export function idi(putanja: string, zamijeni = false) {
  const url = `#${putanja}`;
  if (zamijeni) {
    history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else window.location.hash = putanja;
}

export function nazad(rezerva = '/') {
  if (history.length > 1) history.back();
  else idi(rezerva, true);
}

export function useRuta(): Ruta {
  const [ruta, setRuta] = useState(trenutnaRuta);
  useEffect(() => {
    const f = () => {
      setRuta(trenutnaRuta());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return ruta;
}
