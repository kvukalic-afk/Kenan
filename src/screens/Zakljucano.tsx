import { useEffect, useState } from 'react';
import { provjeriPin } from '../lib/kripto';
import { BrisanjeSvega } from './Postavke';

export function Zakljucano({ pinHash, onOtkljucaj }: { pinHash: string; onOtkljucaj: () => void }) {
  const [pin, setPin] = useState('');
  const [greska, setGreska] = useState('');
  const [pokusaji, setPokusaji] = useState(0);
  const [blokiranoDo, setBlokiranoDo] = useState(0);
  const [sada, setSada] = useState(Date.now());
  const [zaboravljen, setZaboravljen] = useState(false);
  const [brisanje, setBrisanje] = useState(false);
  const blokirano = blokiranoDo > sada;

  useEffect(() => {
    if (!blokirano) return;
    const t = setInterval(() => setSada(Date.now()), 500);
    return () => clearInterval(t);
  }, [blokirano]);

  const provjeri = async (p: string) => {
    if (await provjeriPin(p, pinHash)) {
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
    if (blokirano) return;
    setGreska('');
    const p = (pin + c).slice(0, 6);
    setPin(p);
  };

  // Sa tastature računara
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (zaboravljen || brisanje) return;
      if (/^\d$/.test(e.key)) dodaj(e.key);
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
      else if (e.key === 'Enter' && pin.length >= 4) void provjeri(pin);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  return (
    <div className="zakljucano" role="dialog" aria-modal="true" aria-label="Aplikacija je zaključana">
      <img src="./icon-192.png" alt="" />
      <h1 style={{ margin: 0 }}>Evidencija psihologa</h1>
      <p style={{ margin: 0 }}>Upiši PIN</p>
      <div className="pin-tacke" aria-label={`Upisano ${pin.length} cifara`}>
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => <span key={i} className={i < pin.length ? 'puna' : ''} />)}
      </div>
      <div className="greska" role="alert">{blokirano ? `Sačekaj ${Math.ceil((blokiranoDo - sada) / 1000)} s.` : greska}</div>
      <div className="tastatura">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
          <button key={c} type="button" onClick={() => dodaj(c)} disabled={blokirano}>{c}</button>
        ))}
        <button type="button" className="tiho" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Obriši cifru">⌫</button>
        <button type="button" onClick={() => dodaj('0')} disabled={blokirano}>0</button>
        <button type="button" className="tiho" onClick={() => void provjeri(pin)} disabled={pin.length < 4 || blokirano}>OK</button>
      </div>
      <button type="button" className="link" onClick={() => setZaboravljen(true)}>Zaboravljen PIN?</button>
      {zaboravljen && (
        <div className="modal-pozadina">
          <div className="modal" role="dialog" aria-modal="true" style={{ color: 'var(--tekst)', textAlign: 'left' }}>
            <h2>Zaboravljen PIN</h2>
            <p>PIN se ne čuva kao tekst i ne može se vratiti. Jedini izlaz je brisanje svih podataka na ovom uređaju, a zatim vraćanje iz rezervne kopije (Postavke → Uvezi rezervnu kopiju).</p>
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={() => setZaboravljen(false)}>Nazad</button>
              <button type="button" className="dugme opasno" onClick={() => { setZaboravljen(false); setBrisanje(true); }}>Obriši sve podatke</button>
            </div>
          </div>
        </div>
      )}
      {brisanje && <div style={{ color: 'var(--tekst)', textAlign: 'left' }}><BrisanjeSvega onZatvori={() => setBrisanje(false)} /></div>}
    </div>
  );
}
