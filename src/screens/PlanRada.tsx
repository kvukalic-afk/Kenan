import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisi, sacuvajPlanStavku, uuid } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Modal, Polje, Potvrda, Prazno } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { MJESECI, nazivSkolskeGodine, skolskaGodinaZaDatum } from '../lib/datum';
import { usePostavke } from '../lib/podaci';
import { evidencijaPoPodrucjima, IZVOR_NORME, NAZIVI_MJESECI_SG, PODRUCJA, PRIJEDLOG_PLANA, stavkeDnevnika, uMjesecu, vrijemeRealizacije } from '../lib/podrucja';
import type { PlanStavka } from '../types';

/** "2026-11" za mjesec m (1–12) školske godine koja počinje u `godina`. */
export const mjesecKljucSG = (godina: number, m: number) => `${m >= 9 ? godina : godina + 1}-${String(m).padStart(2, '0')}`;

/** Broj radnih sedmica u mjesecu (radni dani pon–pet / 5, bez praznika). */
export function radnihSedmica(kljuc: string): number {
  const [g, m] = kljuc.split('-').map(Number);
  let dana = 0;
  for (let d = 1; d <= new Date(g, m, 0).getDate(); d++) {
    const w = new Date(g, m - 1, d).getDay();
    if (w !== 0 && w !== 6) dana++;
  }
  return Math.round((dana / 5) * 10) / 10;
}

const kraj = (kljuc: string) => {
  const [g, m] = kljuc.split('-').map(Number);
  return `${kljuc}-${String(new Date(g, m, 0).getDate()).padStart(2, '0')}`;
};

export function PlanRada({ godina: pocGodina, mjesec: pocMjesec }: { godina?: number; mjesec?: string }) {
  const toast = useToast();
  const postavke = usePostavke();
  const [godina, setGodina] = useState(pocGodina ?? postavke.skolskaGodinaPocetak);
  const [mjesec, setMjesec] = useState(pocMjesec ?? ''); // '' = godišnji program
  const [uredi, setUredi] = useState<PlanStavka | null>(null);

  const podaci = useLiveQuery(async () => {
    const [plan, razgovori, radionice, saradnja, aktivnosti] = await Promise.all([
      db.plan.where('skolskaGodina').equals(godina).toArray(),
      db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.aktivnosti.toArray(),
    ]);
    return { plan, razgovori, radionice, saradnja, aktivnosti };
  }, [godina]);

  const evidencija = useMemo(() => {
    if (!podaci || !mjesec) return null;
    return evidencijaPoPodrucjima(stavkeDnevnika(podaci, `${mjesec}-01`, kraj(mjesec)), radnihSedmica(mjesec));
  }, [podaci, mjesec]);

  if (!podaci) return <Zaglavlje naslov="Plan rada" nazadNa="/statistika" />;
  const tekuca = skolskaGodinaZaDatum(new Date());
  const godine = [...new Set([tekuca + 1, tekuca, tekuca - 1, godina])].sort((a, b) => b - a);
  const stavke = podaci.plan.filter((p) => !mjesec || uMjesecu(p.mjeseci, mjesec));

  const popuni = async () => {
    const t = new Date().toISOString();
    await db.plan.bulkAdd(PRIJEDLOG_PLANA.map((p) => ({ ...p, id: uuid(), skolskaGodina: godina, realizovano: [], napomena: '', createdAt: t, updatedAt: t })));
    toast('Plan je popunjen prijedlogom ✓ Prilagodi ga sebi.');
  };

  const prebaciRealizaciju = async (s: PlanStavka) => {
    const r = s.realizovano.includes(mjesec) ? s.realizovano.filter((x) => x !== mjesec) : [...s.realizovano, mjesec];
    await sacuvajPlanStavku({ ...s, realizovano: r });
  };

  const novaStavka = (podrucje: number): PlanStavka => ({
    id: '', skolskaGodina: godina, podrucje, sadrzaj: '', mjeseci: mjesec ? [Number(mjesec.slice(5))] : [], saradnici: '', realizovano: [], napomena: '', createdAt: '', updatedAt: '',
  });

  return (
    <>
      <Zaglavlje naslov="Plan rada" nazadNa="/statistika" />
      <main className="sadrzaj">
        <label>
          <span className="malo blijedo">Školska godina</span>
          <select value={godina} onChange={(e) => { setGodina(Number(e.target.value)); setMjesec(''); }}>
            {godine.map((g) => <option key={g} value={g}>{nazivSkolskeGodine(g)}</option>)}
          </select>
        </label>
        <div className="filteri" style={{ marginTop: 10 }} role="group" aria-label="Godišnji ili mjesečni plan">
          <button type="button" className="chip mali" aria-pressed={!mjesec} onClick={() => setMjesec('')}>Godišnji program</button>
          {NAZIVI_MJESECI_SG.map((m) => {
            const k = mjesecKljucSG(godina, m);
            return <button key={m} type="button" className="chip mali" aria-pressed={mjesec === k} onClick={() => setMjesec(k)}>{MJESECI[m - 1].slice(0, 3)}</button>;
          })}
        </div>

        <div className="red-dugmadi" style={{ margin: '4px 0 12px' }}>
          {!mjesec ? (
            <a className="dugme" href={`#/print/plan/${godina}`}><Ikona ime="print" /> Godišnji program (print)</a>
          ) : (
            <>
              <a className="dugme" href={`#/print/plan/${godina}/${mjesec}`}><Ikona ime="print" /> Mjesečni plan (print)</a>
              <a className="dugme" href={`#/print/dnevnik/${mjesec}`}><Ikona ime="print" /> Dnevnik rada (print)</a>
            </>
          )}
        </div>

        <p className="malo blijedo">Područja i sedmična norma: {IZVOR_NORME}{mjesec ? ` Mjesec ima ≈ ${radnihSedmica(mjesec)} radnih sedmica.` : ''}</p>

        {podaci.plan.length === 0 ? (
          <Prazno>
            Plan za {nazivSkolskeGodine(godina)} je prazan.
            <div className="red-dugmadi" style={{ marginTop: 10, justifyContent: 'center' }}>
              <button type="button" className="dugme primarno" onClick={() => void popuni()}>Popuni prijedlogom ({PRIJEDLOG_PLANA.length} stavki)</button>
            </div>
            <div className="malo" style={{ marginTop: 6 }}>Ili dodaj stavke sam/a dugmetom „+ Dodaj“ u svakom području ispod.</div>
          </Prazno>
        ) : null}

        {PODRUCJA.map((p) => {
          const lista = stavke.filter((s) => s.podrucje === p.kod);
          const ev = evidencija?.find((r) => r.kod === p.kod);
          return (
            <section key={p.kod} className="kartica" style={{ padding: 12 }}>
              <div className="razdvoji" style={{ alignItems: 'flex-start' }}>
                <h2 className="rastegni" style={{ fontSize: '0.98rem', margin: 0 }}>{p.kod}. {p.naziv}</h2>
                <span className="oznaka primarna">{p.sati} h/sed.</span>
              </div>
              {ev && (
                <p className="malo" style={{ margin: '6px 0 0' }}>
                  Evidentirano u mjesecu: <strong>{ev.ostvareno} h</strong> <span className="blijedo">(norma ≈ {Math.round(ev.norma)} h)</span>
                </p>
              )}
              {lista.length > 0 && (
                <ul className="lista" style={{ marginTop: 8 }}>
                  {lista.map((s) => (
                    <li key={s.id} className="razdvoji" style={{ padding: '6px 8px', flexWrap: 'nowrap' }}>
                      {mjesec && (
                        <input type="checkbox" aria-label={`Realizovano: ${s.sadrzaj}`} checked={s.realizovano.includes(mjesec)} onChange={() => void prebaciRealizaciju(s)}
                          style={{ width: 22, height: 22, flex: 'none' }} />
                      )}
                      <button type="button" className="stavka" style={{ padding: '4px 6px', minHeight: 44 }} onClick={() => setUredi(s)}>
                        <span className="glavno">
                          <span className="red1" style={{ fontWeight: 500, textDecoration: mjesec && s.realizovano.includes(mjesec) ? 'line-through' : undefined }}>{s.sadrzaj}</span>
                          <span className="red2">{[vrijemeRealizacije(s.mjeseci), s.saradnici].filter(Boolean).join(' · ')}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="dugme tiho" style={{ marginTop: 4 }} onClick={() => setUredi(novaStavka(p.kod))}><Ikona ime="plus" /> Dodaj</button>
            </section>
          );
        })}
      </main>
      {uredi && <UrediStavku stavka={uredi} onZatvori={() => setUredi(null)} />}
    </>
  );
}

function UrediStavku({ stavka, onZatvori }: { stavka: PlanStavka; onZatvori: () => void }) {
  const toast = useToast();
  const [s, setS] = useState(stavka);
  const [brisanje, setBrisanje] = useState(false);
  const prebaci = (m: number) => setS({ ...s, mjeseci: s.mjeseci.includes(m) ? s.mjeseci.filter((x) => x !== m) : [...s.mjeseci, m] });
  const sacuvaj = async () => {
    if (!s.sadrzaj.trim()) return;
    await sacuvajPlanStavku({ ...s, id: s.id || undefined, sadrzaj: s.sadrzaj.trim() });
    toast('Sačuvano ✓');
    onZatvori();
  };
  return (
    <Modal naslov={stavka.id ? 'Uredi stavku plana' : 'Nova stavka plana'} onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void sacuvaj(); }}>
        <Polje labela="Područje rada" id="pl-podrucje">
          <select id="pl-podrucje" value={s.podrucje} onChange={(e) => setS({ ...s, podrucje: Number(e.target.value) })}>
            {PODRUCJA.map((p) => <option key={p.kod} value={p.kod}>{p.kod}. {p.naziv}</option>)}
          </select>
        </Polje>
        <Polje labela="Sadržaj rada" id="pl-sadrzaj" obavezno>
          <textarea id="pl-sadrzaj" rows={3} value={s.sadrzaj} onChange={(e) => setS({ ...s, sadrzaj: e.target.value })} style={{ overflow: 'auto' }} />
        </Polje>
        <Polje labela="Vrijeme realizacije" id="pl-mj" grupa pomoc="Ništa označeno = tokom cijele godine.">
          <div className="chipovi">
            {NAZIVI_MJESECI_SG.map((m) => (
              <button key={m} type="button" className="chip mali" aria-pressed={s.mjeseci.includes(m)} onClick={() => prebaci(m)}>{MJESECI[m - 1].slice(0, 3)}</button>
            ))}
          </div>
        </Polje>
        <Polje labela="Saradnici" id="pl-sar">
          <input id="pl-sar" type="text" value={s.saradnici} onChange={(e) => setS({ ...s, saradnici: e.target.value })} placeholder="npr. razrednici, pedagog" />
        </Polje>
        <Polje labela="Napomena" id="pl-nap">
          <input id="pl-nap" type="text" value={s.napomena} onChange={(e) => setS({ ...s, napomena: e.target.value })} />
        </Polje>
        <div className="red-dugmadi">
          {stavka.id && <button type="button" className="dugme opasno" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /> Obriši</button>}
          <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
          <button type="submit" className="dugme primarno" disabled={!s.sadrzaj.trim()}>Sačuvaj</button>
        </div>
      </form>
      {brisanje && (
        <Potvrda naslov="Obrisati stavku plana?" tekst={s.sadrzaj} potvrdi="Obriši" opasno onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisi('plan', stavka.id); toast('Obrisano'); onZatvori(); }} />
      )}
    </Modal>
  );
}

