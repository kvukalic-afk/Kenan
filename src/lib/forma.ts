import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../db/db';
import type { Nacrt, VrstaUnosa } from '../types';

export const kljucNacrta = (vrsta: VrstaUnosa, editId?: string) => `${vrsta}:${editId || 'novi'}`;

/**
 * Stanje forme s automatskim čuvanjem nacrta svake 2 sekunde.
 * Ako za formu postoji nedovršeni nacrt, `nacrt` je postavljen pa forma može ponuditi nastavak.
 */
export function useForma<T extends Record<string, unknown>>(vrsta: VrstaUnosa, editId: string | undefined, ucitaj: () => Promise<T | undefined>, odmahNacrt: boolean) {
  const kljuc = kljucNacrta(vrsta, editId);
  const [podaci, setPodaci] = useState<T | null>(null);
  const [nacrt, setNacrt] = useState<Nacrt | null>(null);
  const pocetno = useRef<string>('');
  const zadnjeSnimljeno = useRef<string>('');
  const trenutno = useRef<T | null>(null);
  const aktivno = useRef(true);
  trenutno.current = podaci;

  useEffect(() => {
    let ziv = true;
    (async () => {
      const [osnova, n] = await Promise.all([ucitaj(), db.nacrti.get(kljuc)]);
      if (!ziv || !osnova) return;
      pocetno.current = JSON.stringify(osnova);
      if (n && odmahNacrt) {
        setPodaci({ ...osnova, ...(n.podaci as T) });
        zadnjeSnimljeno.current = JSON.stringify({ ...osnova, ...(n.podaci as T) });
      } else {
        setPodaci(osnova);
        zadnjeSnimljeno.current = pocetno.current;
        if (n && JSON.stringify({ ...osnova, ...(n.podaci as T) }) !== pocetno.current) setNacrt(n);
      }
    })();
    return () => { ziv = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kljuc]);

  const snimiNacrt = useCallback(async () => {
    const p = trenutno.current;
    if (!p || !aktivno.current) return;
    const json = JSON.stringify(p);
    if (json === zadnjeSnimljeno.current) return;
    zadnjeSnimljeno.current = json;
    if (json === pocetno.current) {
      await db.nacrti.delete(kljuc);
      return;
    }
    await db.nacrti.put({ kljuc, vrsta, editId: editId ?? '', podaci: p, updatedAt: new Date().toISOString() });
  }, [kljuc, vrsta, editId]);

  // svake 2 sekunde + odmah kad se app sakrije/zatvori
  useEffect(() => {
    const t = window.setInterval(snimiNacrt, 2000);
    const sakrij = () => { if (document.visibilityState === 'hidden') void snimiNacrt(); };
    document.addEventListener('visibilitychange', sakrij);
    window.addEventListener('pagehide', snimiNacrt);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', sakrij);
      window.removeEventListener('pagehide', snimiNacrt);
      void snimiNacrt();
    };
  }, [snimiNacrt]);

  const postavi = useCallback(<K extends keyof T>(polje: K, vrijednost: T[K]) => {
    setPodaci((p) => (p ? { ...p, [polje]: vrijednost } : p));
  }, []);

  const nastaviNacrt = () => {
    if (nacrt && podaci) setPodaci({ ...podaci, ...(nacrt.podaci as T) });
    setNacrt(null);
  };
  const odbaciNacrt = async () => {
    setNacrt(null);
    await db.nacrti.delete(kljuc);
  };
  /** Poslije snimanja ili odustajanja: nacrt se briše i više se ne čuva. */
  const zavrsi = async () => {
    aktivno.current = false;
    await db.nacrti.delete(kljuc);
  };

  const izmijenjeno = podaci !== null && JSON.stringify(podaci) !== pocetno.current;

  return { podaci, setPodaci, postavi, nacrt, nastaviNacrt, odbaciNacrt, zavrsi, izmijenjeno };
}
