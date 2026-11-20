import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Prazno } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { nazivMjeseca, prikaz } from '../lib/datum';
import { idi } from '../lib/router';

type Prikaz = 'radionice' | 'aktivnosti';

export function Radionice({ pocetniPrikaz = 'radionice' }: { pocetniPrikaz?: Prikaz }) {
  const [prikazTip, setPrikazTip] = useState<Prikaz>(pocetniPrikaz);
  const [filter, setFilter] = useState('');
  const [mjesec, setMjesec] = useState('');
  const podaci = useLiveQuery(async () => {
    const [radionice, aktivnosti] = await Promise.all([
      db.radionice.orderBy('datum').reverse().toArray(),
      db.aktivnosti.orderBy('datum').reverse().toArray(),
    ]);
    return { radionice, aktivnosti };
  }, []);

  const jeRad = prikazTip === 'radionice';
  const zapisi = useMemo(
    () => (jeRad ? (podaci?.radionice ?? []).map((r) => ({ ...r, grupa: r.oblast })) : (podaci?.aktivnosti ?? []).map((a) => ({ ...a, grupa: a.vrsta }))),
    [podaci, jeRad],
  );
  const grupe = useMemo(() => [...new Set(zapisi.map((r) => r.grupa).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bs')), [zapisi]);
  const mjeseci = useMemo(() => [...new Set(zapisi.map((r) => r.datum.slice(0, 7)).filter(Boolean))].sort().reverse(), [zapisi]);

  const promijeni = (p: Prikaz) => {
    setPrikazTip(p);
    setFilter('');
    setMjesec('');
    idi(p === 'aktivnosti' ? '/radionice?prikaz=aktivnosti' : '/radionice', true);
  };

  const radionice = (podaci?.radionice ?? []).filter((r) => (!filter || r.oblast === filter) && (!mjesec || r.datum.startsWith(mjesec)));
  const aktivnosti = (podaci?.aktivnosti ?? []).filter((a) => (!filter || a.vrsta === filter) && (!mjesec || a.datum.startsWith(mjesec)));

  return (
    <>
      <Zaglavlje naslov={jeRad ? 'Radionice' : 'Ostale aktivnosti'} />
      <main className="sadrzaj sirok">
        <div className="filteri" role="tablist" aria-label="Prikaz">
          <button type="button" role="tab" className="chip" aria-pressed={jeRad} aria-selected={jeRad} onClick={() => promijeni('radionice')}>Radionice</button>
          <button type="button" role="tab" className="chip" aria-pressed={!jeRad} aria-selected={!jeRad} onClick={() => promijeni('aktivnosti')}>Ostale aktivnosti</button>
        </div>
        <div className="mreza-2" style={{ marginBottom: 12 }}>
          <label>
            <span className="sr-only">{jeRad ? 'Oblast' : 'Vrsta'}</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">{jeRad ? 'Sve oblasti' : 'Sve vrste'}</option>
              {grupe.map((o) => <option key={o}>{o}</option>)}
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

        {!podaci ? null : jeRad ? (
          podaci.radionice.length === 0 ? (
            <Prazno>Još nema radionica. Dodaj prvu preko dugmeta +.</Prazno>
          ) : radionice.length === 0 ? (
            <Prazno>Nema radionica za izabrani filter.</Prazno>
          ) : (
            <>
              <p className="blijedo malo">{radionice.length} radionica · {radionice.reduce((s, r) => s + (r.brojUcesnika ?? 0), 0)} učesnika</p>
              <ul className="lista">
                {radionice.map((r) => (
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
          )
        ) : podaci.aktivnosti.length === 0 ? (
          <Prazno>Još nema ostalih aktivnosti (zamjene, čas odjeljenske zajednice, dežurstvo…). Dodaj prvu preko dugmeta + → Ostala aktivnost.</Prazno>
        ) : aktivnosti.length === 0 ? (
          <Prazno>Nema aktivnosti za izabrani filter.</Prazno>
        ) : (
          <>
            <p className="blijedo malo">{aktivnosti.length} aktivnosti</p>
            <ul className="lista">
              {aktivnosti.map((a) => (
                <li key={a.id}>
                  <a className="stavka" href={`#/zapis/aktivnost/${a.id}`}>
                    <span className="vrsta aktivnost" aria-hidden />
                    <span className="glavno">
                      <span className="red1">{a.vrsta}</span>
                      <span className="red2">{[a.razred, a.cas && `${a.cas}. čas`, a.umjestoKoga && `umjesto: ${a.umjestoKoga}`, a.predmet, a.tema].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="desno broj">{prikaz(a.datum)}</span>
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
