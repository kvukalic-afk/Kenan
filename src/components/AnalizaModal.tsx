import { useEffect, useState } from 'react';
import { Modal, Polje } from './Polja';
import { Ikona } from './Ikona';
import { useToast } from './Toast';
import { db } from '../db/db';
import { uuid } from '../db/repo';
import { AIGreska, anonimizujSve, generisi, imaKljuc, nazivAI } from '../lib/ai';
import { porukaRezima, REZIMI, type RezimAnalize } from '../lib/analiza';
import { danasIso } from '../lib/datum';
import { idi } from '../lib/router';

/**
 * AI analiza: 1) pregled TAČNO onoga što ide AI-ju (anonimizovano, može se urediti),
 * 2) slanje, 3) rezultat → sačuvaj kao analizu.
 */
export function AnalizaModal({ naslov, opseg, sifra = '', izvorniTekst, brojIzvora, onZatvori, rezim = 'pregled' }: {
  naslov: string; opseg: string; sifra?: string; izvorniTekst: string; brojIzvora: number; onZatvori: () => void; rezim?: RezimAnalize;
}) {
  const R = REZIMI[rezim];
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

  // i opis koji psiholog upiše prolazi kroz anonimizaciju (imena učenika i razrednika)
  const poruka = async () => porukaRezima(rezim, opseg, tekst, await anonimizujSve(pitanje));

  const posalji = async () => {
    setFaza('salje');
    try {
      const r = await generisi({ sistem: R.sistem, poruke: [{ uloga: 'user', tekst: await poruka() }], napor: rezim === 'pregled' ? 'medium' : 'high', maxTokens: 12000 });
      setRezultat(r);
      setFaza('gotovo');
    } catch (e) {
      setGreska(e instanceof AIGreska ? e.message : String(e));
      setFaza('greska');
    }
  };

  const kopiraj = async () => {
    const t = `${R.sistem}\n\n${await poruka()}`;
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
    <Modal naslov={`${R.ikona} ${naslov}`} onZatvori={onZatvori}>
      {faza === 'priprema' && <p className="ai-cekanje">Pripremam zapise i uklanjam imena…</p>}

      {faza === 'pregled' && (
        <>
          {rezim !== 'pregled' && (
            <Polje labela={R.opisLabela} id="an-pitanje" pomoc={R.opisPomoc}>
              <textarea id="an-pitanje" rows={6} value={pitanje} onChange={(e) => setPitanje(e.target.value)} style={{ overflow: 'auto' }} />
            </Polje>
          )}
          <p className="malo"><strong>{brojIzvora}</strong> zapisa iz evidencije · {opseg}</p>
          <Polje labela="Zapisi koji idu AI-ju (imena su zamijenjena – provjeri i po potrebi obriši osjetljive dijelove)" id="an-tekst">
            <textarea id="an-tekst" rows={rezim === 'pregled' ? 9 : 5} value={tekst} onChange={(e) => setTekst(e.target.value)} style={{ overflow: 'auto', fontSize: '0.85rem' }} placeholder="Nema ranijih zapisa – AI će raditi samo iz tvog opisa." />
          </Polje>
          {rezim === 'pregled' && (
            <Polje labela={R.opisLabela} id="an-pitanje" pomoc={R.opisPomoc}>
              <input id="an-pitanje" type="text" value={pitanje} onChange={(e) => setPitanje(e.target.value)} />
            </Polje>
          )}
          {rezim === 'teskoce' && <p className="malo blijedo">AI ne postavlja dijagnozu – daje opis po područjima, radne hipoteze, šta još prikupiti i kome uputiti. Dijagnozu postavljaju nadležni stručnjaci, a procjenu za školu Stručno tijelo (čl. 23 Zakona USK).</p>}
          {automatski ? (
            <div className="red-dugmadi">
              <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
              <button type="button" className="dugme primarno" disabled={R.obavezanOpis ? !pitanje.trim() : !tekst.trim()} onClick={() => void posalji()}>{R.dugme} ({nazivAI()})</button>
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
          <p className="ai-cekanje">{rezim === 'pregled' ? `${nazivAI()} analizira ${brojIzvora} zapisa…` : `${nazivAI()} razmišlja…`}</p>
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
          <Polje labela={`${R.naslov} (možeš urediti)`} id="an-rez">
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
