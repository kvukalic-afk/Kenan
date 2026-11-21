import { useEffect, useState } from 'react';
import { Modal } from './Polja';
import { Ikona } from './Ikona';
import { AIGreska, imaKljuc, sroci, tekstZaKopiranje, type VrstaTeksta } from '../lib/ai';

/** Dugme "✨ Sroči" – otvara prozor u kojem AI pretvara sirov tekst u stručan. */
export function SrociDugme({ tekst, vrsta, kontekst, onPrihvati, mali }: {
  tekst: string; vrsta: VrstaTeksta; kontekst?: string; onPrihvati: (t: string) => void; mali?: boolean;
}) {
  const [otvoreno, setOtvoreno] = useState(false);
  return (
    <>
      <button type="button" className={`chip ${mali ? 'mali' : ''} ai-chip`} disabled={!tekst.trim()} onClick={() => setOtvoreno(true)}
        title="Umjetna inteligencija sroči tekst stručnim jezikom">
        ✨ Sroči stručno
      </button>
      {otvoreno && <SrocavanjeModal tekst={tekst} vrsta={vrsta} kontekst={kontekst} onZatvori={() => setOtvoreno(false)} onPrihvati={(t) => { onPrihvati(t); setOtvoreno(false); }} />}
    </>
  );
}

export function SrocavanjeModal({ tekst, vrsta, kontekst, onZatvori, onPrihvati }: {
  tekst: string; vrsta: VrstaTeksta; kontekst?: string; onZatvori: () => void; onPrihvati: (t: string) => void;
}) {
  const automatski = imaKljuc();
  const [faza, setFaza] = useState<'salje' | 'gotovo' | 'greska' | 'rucno'>(automatski ? 'salje' : 'rucno');
  const [rezultat, setRezultat] = useState('');
  const [greska, setGreska] = useState('');
  const [kopirano, setKopirano] = useState(false);
  const [pokusaj, setPokusaj] = useState(0);

  useEffect(() => {
    if (!automatski) return;
    let ziv = true;
    setFaza('salje');
    sroci(tekst, vrsta, kontekst)
      .then((r) => { if (ziv) { setRezultat(r); setFaza('gotovo'); } })
      .catch((e) => { if (ziv) { setGreska(e instanceof AIGreska ? e.message : String(e)); setFaza('greska'); } });
    return () => { ziv = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokusaj]);

  const kopiraj = async () => {
    const t = await tekstZaKopiranje(tekst, vrsta, kontekst);
    try { await navigator.clipboard.writeText(t); setKopirano(true); } catch { setRezultat(t); setKopirano(false); }
  };

  return (
    <Modal naslov="✨ Stručno sročeno" onZatvori={onZatvori}>
      <details style={{ marginBottom: 10 }}>
        <summary className="malo blijedo" style={{ cursor: 'pointer', minHeight: 32 }}>Tvoj originalni tekst</summary>
        <div className="blok-teksta malo" style={{ marginTop: 6 }}>{tekst}</div>
      </details>

      {faza === 'salje' && <p className="ai-cekanje">AI sročava tekst…</p>}

      {faza === 'greska' && (
        <>
          <p style={{ color: 'var(--crvena)', fontWeight: 600 }}>{greska}</p>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => setPokusaj((p) => p + 1)}>Pokušaj ponovo</button>
            <button type="button" className="dugme" onClick={() => setFaza('rucno')}>Preko ChatGPT-a (ručno)</button>
          </div>
        </>
      )}

      {faza === 'rucno' && (
        <>
          <ol className="malo" style={{ paddingLeft: 20, margin: '0 0 10px' }}>
            <li>Klikni <strong>Kopiraj za AI</strong> (imena učenika se zamjenjuju šiframa).</li>
            <li>Zalijepi u ChatGPT ili Claude i pošalji.</li>
            <li>Odgovor zalijepi ispod i klikni <strong>Prihvati</strong>.</li>
          </ol>
          <div className="red-dugmadi" style={{ marginBottom: 10 }}>
            <button type="button" className="dugme" onClick={() => void kopiraj()}><Ikona ime="razgovor" /> {kopirano ? 'Kopirano ✓' : 'Kopiraj za AI'}</button>
            <a className="dugme" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Otvori ChatGPT</a>
          </div>
          {!automatski && <p className="malo blijedo">Savjet: upiši AI ključ u Postavkama pa će ovo raditi jednim klikom, bez kopiranja.</p>}
        </>
      )}

      {(faza === 'gotovo' || faza === 'rucno') && (
        <>
          <label className="labela" htmlFor="ai-rez" style={{ fontWeight: 600, display: 'block', margin: '6px 0' }}>
            {faza === 'gotovo' ? 'Prijedlog (možeš ga urediti)' : 'Zalijepi odgovor'}
          </label>
          <textarea id="ai-rez" rows={8} value={rezultat} onChange={(e) => setRezultat(e.target.value)} style={{ overflow: 'auto' }} />
          <p className="malo blijedo">Pročitaj i provjeri prije prihvatanja – AI može pogriješiti.</p>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={onZatvori}>Odbaci</button>
            {faza === 'gotovo' && <button type="button" className="dugme" onClick={() => setPokusaj((p) => p + 1)}>Drugi prijedlog</button>}
            <button type="button" className="dugme primarno" disabled={!rezultat.trim()} onClick={() => onPrihvati(rezultat.trim())}>Prihvati</button>
          </div>
        </>
      )}
    </Modal>
  );
}
