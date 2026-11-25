import { useState, type ReactNode } from 'react';
import { Ikona } from './Ikona';
import { Polje } from './Polja';
import { AIGreska, generisi, imaKljuc, nazivAI, type ZahtjevAI } from '../lib/ai';

export type FazaAI = 'unos' | 'salje' | 'gotovo' | 'greska';

/** Zajedničko stanje jednog AI poziva (unos → slanje → rezultat ili greška). */
export function useAIPoziv() {
  const [faza, setFaza] = useState<FazaAI>('unos');
  const [rezultat, setRezultat] = useState('');
  const [greska, setGreska] = useState('');
  const posalji = async (z: ZahtjevAI): Promise<string | null> => {
    setFaza('salje');
    setGreska('');
    try {
      const r = await generisi(z);
      setRezultat(r);
      setFaza('gotovo');
      return r;
    } catch (e) {
      setGreska(e instanceof AIGreska ? e.message : String(e));
      setFaza('greska');
      return null;
    }
  };
  return { faza, setFaza, rezultat, setRezultat, greska, posalji, automatski: imaKljuc() };
}

export function AIRazmislja({ tekst }: { tekst?: string }) {
  return (
    <div className="ai-razmislja" role="status">
      <div className="ai-tacke"><span /><span /><span /></div>
      <p className="ai-cekanje">{tekst ?? `${nazivAI()} razmišlja…`}</p>
    </div>
  );
}

export function AIGreskaBlok({ greska, onNazad, onPonovo }: { greska: string; onNazad: () => void; onPonovo: () => void }) {
  return (
    <>
      <p className="ai-greska" role="alert">{greska}</p>
      <div className="red-dugmadi">
        <button type="button" className="dugme" onClick={onNazad}>Nazad</button>
        <button type="button" className="dugme primarno" onClick={onPonovo}>Pokušaj ponovo</button>
      </div>
    </>
  );
}

/**
 * Bez AI ključa: kopiraj cijelu uputu (već bez imena) za ChatGPT ili Claude, pa zalijepi odgovor.
 * `pripremi` vraća tekst za kopiranje; `onOdgovor` dobija zalijepljeni odgovor.
 */
export function RucniAI({ pripremi, onOdgovor, dugme = 'Koristi odgovor', dodatno }: {
  pripremi: () => Promise<string>; onOdgovor: (t: string) => void; dugme?: string; dodatno?: ReactNode;
}) {
  const [kopirano, setKopirano] = useState(false);
  const [odgovor, setOdgovor] = useState('');
  const kopiraj = async () => {
    const t = await pripremi();
    try { await navigator.clipboard.writeText(t); setKopirano(true); } catch { setOdgovor(t); }
  };
  return (
    <div className="rucni-ai">
      <p className="malo blijedo" style={{ marginTop: 0 }}>Nema AI ključa u Postavkama – radi preko ChatGPT-a ili Claudea: kopiraj, zalijepi tamo, pa odgovor zalijepi ovdje.</p>
      <div className="red-dugmadi">
        <button type="button" className="dugme" onClick={() => void kopiraj()}><Ikona ime="razgovor" /> {kopirano ? 'Kopirano ✓' : 'Kopiraj za AI'}</button>
        <a className="dugme" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT</a>
        <a className="dugme" href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Claude</a>
      </div>
      {dodatno}
      <Polje labela="Zalijepi odgovor" id="rucni-odg">
        <textarea id="rucni-odg" rows={6} value={odgovor} onChange={(e) => setOdgovor(e.target.value)} style={{ overflow: 'auto' }} />
      </Polje>
      <div className="red-dugmadi">
        <button type="button" className="dugme primarno" disabled={!odgovor.trim()} onClick={() => onOdgovor(odgovor)}>{dugme}</button>
      </div>
    </div>
  );
}
