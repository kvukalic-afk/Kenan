import { useEffect, useState } from 'react';
import { Modal, Polje } from './Polja';
import { Ikona } from './Ikona';
import { useToast } from './Toast';
import { db } from '../db/db';
import { uuid } from '../db/repo';
import { AIGreska, anonimizujSve, generisi, imaKljuc, nazivAI } from '../lib/ai';
import { ANALIZA_SISTEM, porukaAnalize } from '../lib/analiza';
import { danasIso } from '../lib/datum';
import { idi } from '../lib/router';

/**
 * AI analiza: 1) pregled TAČNO onoga što ide AI-ju (anonimizovano, može se urediti),
 * 2) slanje, 3) rezultat → sačuvaj kao analizu.
 */
export function AnalizaModal({ naslov, opseg, sifra = '', izvorniTekst, brojIzvora, onZatvori }: {
  naslov: string; opseg: string; sifra?: string; izvorniTekst: string; brojIzvora: number; onZatvori: () => void;
}) {
  const toast = useToast();
  const automatski = imaKljuc();
  const [faza, setFaza] = useState<'priprema' | 'pregled' | 'salje' | 'gotovo' | 'greska'>('priprema');
  const [tekst, setTekst] = useState('');
  const [pitanje, setPitanje] = useState('');
  const [rezultat, setRezultat] = useState('');
  const [greska, setGreska] = useState('');
  const [kopirano, setKopirano] = useState(false);

  useEffect(() => {
    anonimizujSve(izvorniTekst).then((t) => { setTekst(t); setFaza('pregled'); });
  }, [izvorniTekst]);

  const posalji = async () => {
    setFaza('salje');
    try {
      const r = await generisi({ sistem: ANALIZA_SISTEM, poruke: [{ uloga: 'user', tekst: porukaAnalize(opseg, tekst, pitanje) }], napor: 'medium', maxTokens: 12000 });
      setRezultat(r);
      setFaza('gotovo');
    } catch (e) {
      setGreska(e instanceof AIGreska ? e.message : String(e));
      setFaza('greska');
    }
  };

  const kopiraj = async () => {
    const t = `${ANALIZA_SISTEM}\n\n${porukaAnalize(opseg, tekst, pitanje)}`;
    try { await navigator.clipboard.writeText(t); setKopirano(true); } catch { setRezultat(t); }
  };

  const sacuvaj = async () => {
    const t = new Date().toISOString();
    const id = uuid();
    await db.analize.add({ id, datum: danasIso(), naslov, opseg, sifra, tekst: rezultat.trim(), brojIzvora, createdAt: t, updatedAt: t });
    toast('Analiza sačuvana ✓');
    onZatvori();
    idi(`/analiza/${id}`);
  };

  return (
    <Modal naslov={`🧠 ${naslov}`} onZatvori={onZatvori}>
      {faza === 'priprema' && <p className="ai-cekanje">Pripremam zapise i uklanjam imena…</p>}

      {faza === 'pregled' && (
        <>
          <p className="malo"><strong>{brojIzvora}</strong> zapisa · {opseg}</p>
          <Polje labela="Šta tačno ide AI-ju (imena su zamijenjena – provjeri i po potrebi obriši osjetljive dijelove)" id="an-tekst">
            <textarea id="an-tekst" rows={9} value={tekst} onChange={(e) => setTekst(e.target.value)} style={{ overflow: 'auto', fontSize: '0.85rem' }} />
          </Polje>
          <Polje labela="Posebno pitanje (nije obavezno)" id="an-pitanje" pomoc="npr. „Ima li znakova vršnjačkog nasilja?“ ili „Šta preporučiti razredniku?“">
            <input id="an-pitanje" type="text" value={pitanje} onChange={(e) => setPitanje(e.target.value)} />
          </Polje>
          {automatski ? (
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
              <button type="button" className="dugme primarno" disabled={!tekst.trim()} onClick={() => void posalji()}>Analiziraj ({nazivAI()})</button>
            </div>
          ) : (
            <>
              <div className="red-dugmadi">
                <button type="button" className="dugme" onClick={() => void kopiraj()}><Ikona ime="razgovor" /> {kopirano ? 'Kopirano ✓' : 'Kopiraj za ChatGPT'}</button>
                <a className="dugme" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Otvori ChatGPT</a>
              </div>
              <Polje labela="Zalijepi odgovor" id="an-rucno">
                <textarea id="an-rucno" rows={6} value={rezultat} onChange={(e) => setRezultat(e.target.value)} style={{ overflow: 'auto' }} />
              </Polje>
              <div className="red-dugmadi">
                <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
                <button type="button" className="dugme primarno" disabled={!rezultat.trim()} onClick={() => void sacuvaj()}>Sačuvaj analizu</button>
              </div>
              <p className="malo blijedo">Savjet: sa AI ključem u Postavkama ovo radi jednim klikom.</p>
            </>
          )}
        </>
      )}

      {faza === 'salje' && (
        <div className="ai-razmislja">
          <div className="ai-tacke"><span /><span /><span /></div>
          <p className="ai-cekanje">{nazivAI()} analizira {brojIzvora} zapisa…</p>
        </div>
      )}

      {faza === 'greska' && (
        <>
          <p style={{ color: 'var(--crvena)', fontWeight: 600 }}>{greska}</p>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => setFaza('pregled')}>Nazad</button>
            <button type="button" className="dugme primarno" onClick={() => void posalji()}>Pokušaj ponovo</button>
          </div>
        </>
      )}

      {faza === 'gotovo' && (
        <>
          <Polje labela="Analiza (možeš je urediti)" id="an-rez">
            <textarea id="an-rez" rows={14} value={rezultat} onChange={(e) => setRezultat(e.target.value)} style={{ overflow: 'auto' }} />
          </Polje>
          <p className="malo blijedo">AI daje prijedlog – zaključke donosiš ti. Provjeri prije čuvanja.</p>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={onZatvori}>Odbaci</button>
            <button type="button" className="dugme" onClick={() => void posalji()}>Ponovi</button>
            <button type="button" className="dugme primarno" disabled={!rezultat.trim()} onClick={() => void sacuvaj()}>Sačuvaj analizu</button>
          </div>
        </>
      )}
    </Modal>
  );
}
