import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Prazno } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { nazivMjeseca, prikaz } from '../lib/datum';

export function Radionice() {
  const [oblast, setOblast] = useState('');
  const [mjesec, setMjesec] = useState('');
  const radionice = useLiveQuery(() => db.radionice.orderBy('datum').reverse().toArray(), []);

  const oblasti = useMemo(() => [...new Set((radionice ?? []).map((r) => r.oblast).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bs')), [radionice]);
  const mjeseci = useMemo(() => [...new Set((radionice ?? []).map((r) => r.datum.slice(0, 7)).filter(Boolean))].sort().reverse(), [radionice]);
  const prikazane = (radionice ?? []).filter((r) => (!oblast || r.oblast === oblast) && (!mjesec || r.datum.startsWith(mjesec)));

  return (
    <>
      <Zaglavlje naslov="Radionice" />
      <main className="sadrzaj sirok">
        <div className="mreza-2" style={{ marginBottom: 12 }}>
          <label>
            <span className="sr-only">Oblast</span>
            <select value={oblast} onChange={(e) => setOblast(e.target.value)}>
              <option value="">Sve oblasti</option>
              {oblasti.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Mjesec</span>
            <select value={mjesec} onChange={(e) => setMjesec(e.target.value)}>
              <option value="">Svi mjeseci</option>
              {mjeseci.map((m) => <option key={m} value={m}>{nazivMjeseca(m)}</option>)}
            </select>
          </label>
        </div>
        {!radionice ? null : radionice.length === 0 ? (
          <Prazno>Još nema radionica. Dodaj prvu preko dugmeta +.</Prazno>
        ) : prikazane.length === 0 ? (
          <Prazno>Nema radionica za izabrani filter.</Prazno>
        ) : (
          <>
            <p className="blijedo malo">{prikazane.length} radionica · {prikazane.reduce((s, r) => s + (r.brojUcesnika ?? 0), 0)} učesnika</p>
            <ul className="lista">
              {prikazane.map((r) => (
                <li key={r.id}>
                  <a className="stavka" href={`#/zapis/radionica/${r.id}`}>
                    <span className="vrsta radionica" aria-hidden />
                    <span className="glavno">
                      <span className="red1">{r.tema || 'Bez teme'}</span>
                      <span className="red2">{[r.razred, r.oblast].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="desno broj">{prikaz(r.datum)}<br />{r.brojUcesnika != null ? `${r.brojUcesnika} uč.` : ''}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
