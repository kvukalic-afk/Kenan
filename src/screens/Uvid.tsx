import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { Zaglavlje } from '../components/Okvir';
import { danasIso, MJESECI, prikaz } from '../lib/datum';
import { usePostavke } from '../lib/podaci';
import { uMjesecu } from '../lib/podrucja';

// Dokumenti koje školski pedagog (ili direktor) uobičajeno traži na uvid od psihologa.
// Sve se štampa bez povjerljivog sadržaja razgovora i sa šiframa umjesto imena.

const mjesecOd = (iso: string) => iso.slice(0, 7);
const prethodni = (m: string) => {
  const [g, mj] = m.split('-').map(Number);
  return mj === 1 ? `${g - 1}-12` : `${g}-${String(mj - 1).padStart(2, '0')}`;
};
const nazivMjeseca = (m: string) => `${MJESECI[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}.`;

export function Uvid() {
  const postavke = usePostavke();
  const g = postavke.skolskaGodinaPocetak;
  const danas = danasIso();
  const [mjesec, setMjesec] = useState(mjesecOd(danas));
  const pocetak = [`${g}-09-01`, postavke.pocetakRada ?? ''].sort().pop()!;
  const podaci = useLiveQuery(async () => {
    const [plan, razgovori, radionice, saradnja, aktivnosti, obrasci] = await Promise.all([
      db.plan.where('skolskaGodina').equals(g).toArray(), db.razgovori.toArray(), db.radionice.toArray(),
      db.saradnja.toArray(), db.aktivnosti.toArray(), db.obrasci.toArray(),
    ]);
    return { plan, razgovori, radionice, saradnja, aktivnosti, obrasci };
  }, [g]);
  if (!podaci) return <Zaglavlje naslov="Za uvid pedagogu" nazadNa="/dokumentacija" />;

  const uMj = (d: string) => d?.startsWith(mjesec);
  const brojMj = podaci.razgovori.filter((r) => uMj(r.datum)).length + podaci.radionice.filter((r) => uMj(r.datum)).length
    + podaci.saradnja.filter((r) => uMj(r.datum)).length + podaci.aktivnosti.filter((r) => uMj(r.datum)).length;
  const planMj = podaci.plan.filter((s) => uMjesecu(s.mjeseci, mjesec)).length;
  const ucenika = new Set(podaci.razgovori.filter((r) => r.datum >= pocetak).map((r) => r.sifra)).size;
  const usavrs = podaci.aktivnosti.filter((a) => /usavršavanj/i.test(a.vrsta) && a.datum >= `${g}-09-01`).length;
  const zapisnika = podaci.obrasci.filter((o) => ['strucni-tim', 'nasilje', 'plan-podrske'].includes(o.vrsta) && o.datum >= `${g}-09-01`).length;
  const polugodiste = danas >= `${g}-12-15`;

  const stavke: { naziv: string; opis: string; stanje: string; ok: boolean; href: string }[] = [
    { naziv: 'Godišnji program rada psihologa', opis: 'Po 11 područja rada i 40-satnoj sedmici (Pedagoški standardi USK, čl. 13).',
      stanje: podaci.plan.length ? `${podaci.plan.length} stavki` : 'nije unesen – Izvještaji → Plan rada', ok: podaci.plan.length > 0, href: `#/print/plan/${g}` },
    { naziv: `Mjesečni plan rada – ${nazivMjeseca(mjesec)}`, opis: 'Izvod iz godišnjeg programa za izabrani mjesec.',
      stanje: planMj ? `${planMj} stavki` : 'nema stavki za ovaj mjesec', ok: planMj > 0, href: `#/print/plan/${g}/${mjesec}` },
    { naziv: `Dnevnik rada i evidencija 40-satne sedmice – ${nazivMjeseca(mjesec)}`, opis: 'Hronološki šta je rađeno i koliko sati po područjima. Za uvid: šifre učenika, bez imena i bez sadržaja razgovora.',
      stanje: brojMj ? `${brojMj} unosa` : 'nema unosa u ovom mjesecu', ok: brojMj > 0, href: `#/print/dnevnik/${mjesec}?uvid=1` },
    { naziv: 'Evidencija rada s učenicima – zbirno', opis: `Od ${prikaz(pocetak)}: šifra, razred, broj kontakata, razlog i status. Bez bilješki i zaključaka.`,
      stanje: ucenika ? `učenika: ${ucenika}` : 'još nema razgovora', ok: ucenika > 0, href: `#/print/uvid-ucenici/${pocetak}/${danas}` },
    { naziv: 'Evidencija stručnog usavršavanja', opis: 'Seminari i edukacije (Zakon USK čl. 119). Uz nju certifikati.',
      stanje: `evidentirano: ${usavrs}`, ok: usavrs > 0, href: `#/print/usavrsavanje/${g}` },
    { naziv: 'Zapisnici: stručni tim, nasilje, planovi podrške', opis: 'Popunjeni obrasci iz appa (arhiva).',
      stanje: `u appu: ${zapisnika}`, ok: true, href: '#/dokumentacija?tab=obrasci' },
    { naziv: 'Pregled obavezne dokumentacije', opis: 'Tabela sa rokovima i pravnim osnovom – prva strana registratora.',
      stanje: 'uvijek spremno', ok: true, href: `#/print/dokumentacija/${g}` },
    ...(polugodiste ? [{ naziv: 'Polugodišnji izvještaj o radu', opis: 'Za I polugodište.', stanje: 'od 15.12.', ok: true, href: `#/print/izvjestaj/${g}/I` }] : []),
  ];

  const mjeseci = [mjesecOd(danas), prethodni(mjesecOd(danas)), prethodni(prethodni(mjesecOd(danas)))]
    .filter((m) => m >= mjesecOd(pocetak));

  return (
    <>
      <Zaglavlje naslov="Za uvid pedagogu" nazadNa="/dokumentacija" />
      <main className="sadrzaj">
        <p className="malo blijedo" style={{ marginTop: 0 }}>Ono što pedagog ili direktor obično traže na uvid. Odštampaj, potpiši i drži u registratoru „Dokumentacija psihologa“.</p>
        <div className="chipovi" style={{ marginBottom: 12 }}>
          {mjeseci.map((m) => <button key={m} type="button" className="chip mali" aria-pressed={m === mjesec} onClick={() => setMjesec(m)}>{nazivMjeseca(m)}</button>)}
        </div>
        <ul className="kontrolna">
          {stavke.map((s) => (
            <li key={s.naziv} className={s.ok ? '' : 'kasni'}>
              <span className={`kvacica-dugme status ${s.ok ? "" : "prazna"}`} aria-hidden>{s.ok ? '✓' : '!'}</span>
              <div className="rastegni">
                <strong>{s.naziv}</strong>
                <div className="malo blijedo">{s.opis}</div>
                <div className="malo" style={{ marginTop: 4 }}><span className={`oznaka ${s.ok ? 'zelena' : 'narandzasta'}`}>{s.stanje}</span></div>
              </div>
              <a className="ikona-dugme" href={s.href} aria-label={`Štampaj: ${s.naziv}`}><Ikona ime="print" /></a>
            </li>
          ))}
        </ul>
        <section className="kartica" style={{ marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>🔒 Šta ostaje povjerljivo</h2>
          <p className="malo">Pedagog ima pravo vidjeti <strong>da je rad obavljen</strong>: kada, s kim (šifra), zbog čega i koliko je trajalo. <strong>Sadržaj</strong> onoga što su ti učenik ili roditelj povjerili, bilješke iz razgovora, rezultati testova i nalazi ne daju se na uvid. Izuzetak je kad je to potrebno radi zaštite djeteta (nasilje, stručni tim) i tada samo onoliko koliko treba.</p>
          <p className="malo blijedo" style={{ marginBottom: 0 }}>Osnov: Etički kodeks psihologa (povjerljivost) i propisi o zaštiti ličnih podataka. Ako pedagog traži više, pokaži zbirnu evidenciju i dogovori se s direktorom.</p>
        </section>
      </main>
    </>
  );
}
