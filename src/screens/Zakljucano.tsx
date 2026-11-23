import { useEffect, useState } from 'react';
import { hashirajPin, jeIspravanPin, provjeriPin } from '../lib/kripto';
import { db } from '../db/db';
import { BrisanjeSvega } from './Postavke';

const RESET_KLJUC = 'pin-uklanjanje-od';
/** Koliko se čeka prije uklanjanja zaboravljenog PIN-a (podaci ostaju). */
export const RESET_CEKANJE_MS = 10 * 60 * 1000;

function ucitajReset(): number {
  try { return Number(localStorage.getItem(RESET_KLJUC)) || 0; } catch { return 0; }
}
function sacuvajReset(v: number) {
  try { if (v) localStorage.setItem(RESET_KLJUC, String(v)); else localStorage.removeItem(RESET_KLJUC); } catch { /* ignore */ }
}

export function Zakljucano({ pinHash, pinDuzina, onOtkljucaj }: { pinHash: string; pinDuzina?: number; onOtkljucaj: () => void }) {
  const [pin, setPin] = useState('');
  const [greska, setGreska] = useState('');
  const [pokusaji, setPokusaji] = useState(0);
  const [blokiranoDo, setBlokiranoDo] = useState(0);
  const [sada, setSada] = useState(Date.now());
  const [zaboravljen, setZaboravljen] = useState(false);
  const [brisanje, setBrisanje] = useState(false);
  const [provjerava, setProvjerava] = useState(false);
  const [resetOd, setResetOd] = useState(ucitajReset);
  const resetPreostalo = resetOd ? Math.max(0, resetOd + RESET_CEKANJE_MS - sada) : 0;
  const blokirano = blokiranoDo > sada;

  useEffect(() => {
    if (!resetOd) return;
    const t = setInterval(() => setSada(Date.now()), 1000);
    return () => clearInterval(t);
  }, [resetOd]);

  const zapocniUklanjanje = () => { const t = Date.now(); sacuvajReset(t); setResetOd(t); setSada(t); setZaboravljen(false); };
  const otkaziUklanjanje = () => { sacuvajReset(0); setResetOd(0); };
  const [novi, setNovi] = useState('');
  const [ponovo, setPonovo] = useState('');
  const postaviNoviPin = async () => {
    if (!jeIspravanPin(novi)) return setGreska('Novi PIN mora imati 4 do 6 cifara.');
    if (novi !== ponovo) return setGreska('PIN-ovi se ne poklapaju.');
    await db.postavke.update('postavke', { pinHash: await hashirajPin(novi), pinDuzina: novi.length });
    sacuvajReset(0);
    onOtkljucaj();
  };

  useEffect(() => {
    if (!blokirano) return;
    const t = setInterval(() => setSada(Date.now()), 500);
    return () => clearInterval(t);
  }, [blokirano]);

  const provjeri = async (p: string) => {
    if (provjerava || p.length < 4) return;
    setProvjerava(true);
    let tacno = false;
    try { tacno = await provjeriPin(p, pinHash); } catch { tacno = false; } finally { setProvjerava(false); }
    if (tacno) {
      // stari PIN-ovi nemaju zapisanu dužinu – zapamti je da se idući put otključa bez „OK“
      if (pinDuzina !== p.length) void db.postavke.update('postavke', { pinDuzina: p.length });
      if (resetOd) otkaziUklanjanje();
      onOtkljucaj();
      return;
    }
    const n = pokusaji + 1;
    setPokusaji(n);
    setPin('');
    if (n % 5 === 0) {
      setBlokiranoDo(Date.now() + 30_000);
      setSada(Date.now());
      setGreska('Previše pogrešnih pokušaja. Sačekaj 30 sekundi.');
    } else setGreska('Pogrešan PIN.');
  };

  const dodaj = (c: string) => {
    if (blokirano || provjerava) return;
    setGreska('');
    const p = (pin + c).slice(0, 6);
    setPin(p);
    // otključaj čim je upisana zadnja cifra
    if (pinDuzina && p.length === pinDuzina) void provjeri(p);
  };

  // Sa tastature računara
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (zaboravljen || brisanje || resetOd) return;
      if (/^\d$/.test(e.key)) dodaj(e.key);
      else if (e.key === 'Backspace' && !provjerava) setPin((p) => p.slice(0, -1));
      else if (e.key === 'Enter' && pin.length >= 4) void provjeri(pin);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  return (
    <div className="zakljucano" role="dialog" aria-modal="true" aria-label="Aplikacija je zaključana">
      <img src="./icon-192.png" alt="" />
      <h1 style={{ margin: 0 }}>Evidencija psihologa</h1>
      {!(resetOd && resetPreostalo === 0) && (<>
      <p style={{ margin: 0 }}>{provjerava ? 'Provjeravam…' : 'Upiši PIN'}</p>
      <div className="pin-tacke" aria-label={`Upisano ${pin.length} cifara`}>
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => <span key={i} className={i < pin.length ? 'puna' : ''} />)}
      </div>
      <div className="greska" role="alert">{blokirano ? `Sačekaj ${Math.ceil((blokiranoDo - sada) / 1000)} s.` : greska}</div>
      <div className="tastatura">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
          <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => dodaj(c)} disabled={blokirano}>{c}</button>
        ))}
        <button type="button" className="tiho" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Obriši cifru">⌫</button>
        <button type="button" onClick={() => dodaj('0')} disabled={blokirano}>0</button>
        <button type="button" className={pin.length >= 4 ? 'ok-spremno' : 'tiho'} onClick={() => void provjeri(pin)} disabled={pin.length < 4 || blokirano || provjerava}>OK</button>
      </div>
      </>)}
      {resetOd ? (
        <div className="reset-pina">
          {resetPreostalo > 0 ? (
            <p style={{ margin: 0 }}>Novi PIN možeš postaviti za <strong>{Math.floor(resetPreostalo / 60000)}:{String(Math.floor((resetPreostalo % 60000) / 1000)).padStart(2, '0')}</strong>. Podaci ostaju. Možeš zatvoriti app i vratiti se.</p>
          ) : (
            <form className="novi-pin" onSubmit={(e) => { e.preventDefault(); void postaviNoviPin(); }}>
              <strong>Postavi novi PIN</strong>
              {greska && <div className="greska" role="alert">{greska}</div>}
              <input type="text" className="pin-polje" inputMode="numeric" autoComplete="off" placeholder="novi PIN (4–6 cifara)" aria-label="Novi PIN" value={novi}
                onChange={(e) => { setNovi(e.target.value.replace(/\D/g, '').slice(0, 6)); setGreska(''); }} />
              <input type="text" className="pin-polje" inputMode="numeric" autoComplete="off" placeholder="ponovi novi PIN" aria-label="Ponovi novi PIN" value={ponovo}
                onChange={(e) => { setPonovo(e.target.value.replace(/\D/g, '').slice(0, 6)); setGreska(''); }} />
              <button type="submit" className="dugme primarno">Sačuvaj PIN i uđi</button>
            </form>
          )}
          <button type="button" className="link" onClick={otkaziUklanjanje}>Otkaži</button>
        </div>
      ) : (
        <button type="button" className="link" onClick={() => setZaboravljen(true)}>Zaboravljen PIN?</button>
      )}
      {zaboravljen && (
        <div className="modal-pozadina">
          <div className="modal" role="dialog" aria-modal="true" style={{ color: 'var(--tekst)', textAlign: 'left' }}>
            <h2>Zaboravljen PIN</h2>
            <p>PIN se ne čuva kao tekst pa se ne može pročitati, ali se može <strong>zamijeniti novim bez brisanja podataka</strong>. Iz sigurnosnih razloga to traje {RESET_CEKANJE_MS / 60000} minuta. Nakon toga ovdje upišeš novi PIN i uđeš.</p>
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={() => setZaboravljen(false)}>Nazad</button>
              <button type="button" className="dugme primarno" onClick={zapocniUklanjanje}>Postavi novi PIN (podaci ostaju)</button>
            </div>
            <p className="malo blijedo" style={{ marginTop: 12 }}>Krajnja mjera, samo ako to stvarno želiš: <button type="button" className="link" style={{ color: 'var(--crvena)' }} onClick={() => { setZaboravljen(false); setBrisanje(true); }}>obriši sve podatke</button>.</p>
          </div>
        </div>
      )}
      {brisanje && <div style={{ color: 'var(--tekst)', textAlign: 'left' }}><BrisanjeSvega onZatvori={() => setBrisanje(false)} /></div>}
    </div>
  );
}
