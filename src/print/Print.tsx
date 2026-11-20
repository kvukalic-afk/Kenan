import { useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { TabelaMjeseci, TabelaRaspodjele } from '../components/StatTabele';
import { danasIso, MJESECI, nazivSkolskeGodine, prikaz } from '../lib/datum';
import { nazad } from '../lib/router';
import { useImenik, usePostavke } from '../lib/podaci';
import { izracunajStatistiku, sazetak, type Period, type Statistika } from '../lib/statistika';
import { zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { evidencijaPoPodrucjima, IZVOR_NORME, PODRUCJA, satiTekst, stavkeDnevnika, uMjesecu, vrijemeRealizacije, zaokruzi, type RedEvidencije } from '../lib/podrucja';
import { radnihSedmica } from '../screens/PlanRada';
import { brojPerioda, nazivDana, naslovIzvjestaja, opisPerioda, sazetakPerioda, stavkePerioda, vrstaPerioda } from '../lib/periodIzvjestaj';
import { procitajTekst } from '../screens/IzvjestajPeriod';
import { punoIme, type Aktivnost, type Postavke, type Radionica, type Razgovor, type Saradnja } from '../types';
import './print.css';

function Dokument({ naslov, podnaslov, nazivFajla, postavke, children }: {
  naslov: string; podnaslov?: string; nazivFajla: string; postavke: Postavke; children: ReactNode;
}) {
  useEffect(() => {
    const stari = document.title;
    document.title = nazivFajla; // preglednici ga nude kao naziv PDF-a
    return () => { document.title = stari; };
  }, [nazivFajla]);

  return (
    <div className="print-omot">
      <div className="print-alati">
        <button type="button" className="dugme" onClick={() => nazad('/')}><Ikona ime="nazad" /> Nazad</button>
        <button type="button" className="dugme primarno" style={{ background: '#fff', color: '#17556b' }} onClick={() => window.print()}>
          <Ikona ime="print" /> Štampaj / Sačuvaj kao PDF
        </button>
        <span className="napomena">Na mobitelu: Štampaj → izaberi štampač ili „Sačuvaj kao PDF“ / Dijeli.</span>
      </div>
      <div className="print-pozadina">
        <article className="print-stranica">
          <table className="dokument">
            <thead>
              <tr><td>
                <div className="dok-zaglavlje">
                  <span className="skola">{postavke.nazivSkole}</span>
                  <span className="povjerljivo">POVJERLJIVO</span>
                </div>
              </td></tr>
            </thead>
            <tfoot>
              <tr><td>
                <div className="dok-podnozje">
                  <div>
                    Datum: {prikaz(danasIso())}<br />
                    <span className="povjerljivo">POVJERLJIVO</span>
                  </div>
                  <div className="potpis">
                    Psiholog: {postavke.imePsihologa || '______________________'}<br />
                    <span className="linija" aria-label="Potpis" />
                  </div>
                </div>
              </td></tr>
            </tfoot>
            <tbody>
              <tr><td>
                <h1>{naslov}</h1>
                {podnaslov && <p className="podnaslov">{podnaslov}</p>}
                {children}
              </td></tr>
            </tbody>
          </table>
        </article>
      </div>
    </div>
  );
}

function Red({ o, v }: { o: string; v: ReactNode }) {
  return <tr><th scope="row">{o}</th><td className="tekst-celija">{v === '' || v == null ? '—' : v}</td></tr>;
}

function Blok({ naslov, tekst }: { naslov: string; tekst: string }) {
  return (
    <div className="blok">
      <h2>{naslov}</h2>
      <div className="sadrzaj-bloka">{tekst?.trim() || '—'}</div>
    </div>
  );
}

/** Ime i razrednik učenika za dokumente (ako je u Postavkama uključeno). */
function useUcenikZaDokument(sifra: string) {
  const postavke = usePostavke();
  const { poSifri, razrednik } = useImenik();
  const imena = postavke.imenaUDokumentima !== false;
  const u = poSifri.get(sifra);
  return {
    imena,
    ime: imena ? punoIme(u) : '',
    razrednik: u?.razred ? razrednik.get(u.razred) ?? '' : '',
    imeZa: (s: string) => (imena && punoIme(poSifri.get(s)) ? `${punoIme(poSifri.get(s))} (${s})` : s),
  };
}

function Ucitavanje() {
  return <p style={{ padding: 24 }}>Učitavam…</p>;
}

// ---------- 1. Razgovor ----------

export function PrintRazgovor({ id }: { id: string }) {
  const postavke = usePostavke();
  const r = useLiveQuery(() => db.razgovori.get(id), [id], null as Razgovor | null | undefined);
  const uc = useUcenikZaDokument(r?.sifra ?? '');
  if (r === null) return <Ucitavanje />;
  if (!r) return <p style={{ padding: 24 }}>Razgovor ne postoji.</p>;
  return (
    <Dokument naslov="IZVJEŠTAJ O OBAVLJENOM RAZGOVORU" nazivFajla={`Razgovor_${uc.ime ? uc.ime.replace(/\s+/g, '_') + '_' : ''}${r.sifra}_${r.datum}`} postavke={postavke}>
      <table className="podaci-tab">
        <tbody>
          <Red o="Datum razgovora" v={prikaz(r.datum)} />
          {uc.imena && <Red o="Ime i prezime učenika" v={<strong>{uc.ime}</strong>} />}
          <Red o="Šifra učenika" v={uc.imena ? r.sifra : <strong>{r.sifra}</strong>} />
          <Red o="Razred" v={r.razred} />
          <Red o="Razrednik" v={uc.razrednik} />
          <Red o="Vrsta kontakta" v={r.vrstaKontakta} />
          <Red o="Kontakt inicirao" v={r.inicirao} />
          <Red o="Razlog" v={r.razlog} />
          <Red o="Status slučaja" v={r.statusSlucaja} />
          <Red o="Sljedeći korak" v={r.sljedeciKorak} />
          <Red o="Datum sljedećeg kontakta" v={prikaz(r.datumSljedecegKontakta)} />
        </tbody>
      </table>
      <Blok naslov="Bilješke" tekst={r.biljeske} />
      <Blok naslov="Zaključak" tekst={r.zakljucak} />
      <Blok naslov="Preporuke" tekst={r.preporuke} />
    </Dokument>
  );
}

// ---------- 2. Radionica ----------

export function PrintRadionica({ id }: { id: string }) {
  const postavke = usePostavke();
  const r = useLiveQuery(() => db.radionice.get(id), [id], null as Radionica | null | undefined);
  const uc = useUcenikZaDokument('');
  if (r === null) return <Ucitavanje />;
  if (!r) return <p style={{ padding: 24 }}>Radionica ne postoji.</p>;
  return (
    <Dokument naslov="ZAPISNIK SA RADIONICE" nazivFajla={`Radionica_${r.datum}`} postavke={postavke}>
      <table className="podaci-tab">
        <tbody>
          <Red o="Datum" v={prikaz(r.datum)} />
          <Red o="Razred / grupa" v={r.razred} />
          <Red o="Tema" v={<strong>{r.tema}</strong>} />
          <Red o="Oblast" v={r.oblast} />
          <Red o="Ciljna grupa" v={r.ciljnaGrupa} />
          <Red o="Broj učesnika" v={r.brojUcesnika ?? ''} />
          <Red o="Trajanje" v={r.trajanjeMin ? `${r.trajanjeMin} min` : ''} />
          <Red o="Učenici za praćenje" v={(r.ucenicizaPracenje ?? []).map(uc.imeZa).join(', ')} />
        </tbody>
      </table>
      <Blok naslov="Cilj" tekst={r.cilj} />
      <Blok naslov="Tok aktivnosti" tekst={r.tokAktivnosti} />
      <Blok naslov="Zapažanja" tekst={r.zapazanja} />
      <Blok naslov="Evaluacija" tekst={r.evaluacija} />
      <Blok naslov="Napomena" tekst={r.napomena} />
    </Dokument>
  );
}

// ---------- Saradnja ----------

export function PrintAktivnost({ id }: { id: string }) {
  const postavke = usePostavke();
  const a = useLiveQuery(() => db.aktivnosti.get(id), [id], null as Aktivnost | null | undefined);
  if (a === null) return <Ucitavanje />;
  if (!a) return <p style={{ padding: 24 }}>Zapis ne postoji.</p>;
  const naslov = /zamjena/i.test(a.vrsta) ? 'EVIDENCIJA O ZAMJENI' : /odjeljensk/i.test(a.vrsta) ? 'ZAPISNIK SA ČASA ODJELJENSKE ZAJEDNICE' : 'ZAPISNIK O AKTIVNOSTI';
  return (
    <Dokument naslov={naslov} nazivFajla={`Aktivnost_${a.datum}`} postavke={postavke}>
      <table className="podaci-tab">
        <tbody>
          <Red o="Datum" v={prikaz(a.datum)} />
          <Red o="Vrsta aktivnosti" v={<strong>{a.vrsta}</strong>} />
          <Red o="Razred" v={a.razred} />
          <Red o="Čas" v={a.cas ? `${a.cas}. čas` : ''} />
          <Red o="Umjesto koga" v={a.umjestoKoga} />
          <Red o="Predmet" v={a.predmet} />
        </tbody>
      </table>
      <Blok naslov="Tema / sadržaj" tekst={a.tema} />
      <Blok naslov="Zapažanja" tekst={a.zapazanja} />
      <Blok naslov="Napomena" tekst={a.napomena} />
    </Dokument>
  );
}

export function PrintSaradnja({ id }: { id: string }) {
  const postavke = usePostavke();
  const s = useLiveQuery(() => db.saradnja.get(id), [id], null as Saradnja | null | undefined);
  const uc = useUcenikZaDokument(s?.sifra ?? '');
  if (s === null) return <Ucitavanje />;
  if (!s) return <p style={{ padding: 24 }}>Zapis ne postoji.</p>;
  return (
    <Dokument naslov="ZAPISNIK O SARADNJI" nazivFajla={`Saradnja_${s.datum}`} postavke={postavke}>
      <table className="podaci-tab">
        <tbody>
          <Red o="Datum" v={prikaz(s.datum)} />
          <Red o="Učenik" v={s.sifra ? uc.imeZa(s.sifra) : ''} />
          {s.sifra && <Red o="Razrednik" v={uc.razrednik} />}
          <Red o="Ustanova / osoba" v={s.ustanovaOsoba} />
          <Red o="Opis osobe" v={s.opisOsobe} />
          <Red o="Način kontakta" v={s.nacin} />
        </tbody>
      </table>
      <Blok naslov="Razlog" tekst={s.razlog} />
      <Blok naslov="Dogovor / ishod" tekst={s.dogovorIshod} />
    </Dokument>
  );
}

// ---------- 3. Karton učenika ----------

export function PrintKarton({ sifra }: { sifra: string }) {
  const postavke = usePostavke();
  const p = useLiveQuery(async () => {
    const [ucenik, razgovori, saradnja, radionice] = await Promise.all([
      db.ucenici.where('sifra').equals(sifra).first(),
      db.razgovori.where('sifra').equals(sifra).toArray(),
      db.saradnja.where('sifra').equals(sifra).toArray(),
      db.radionice.where('ucenicizaPracenje').equals(sifra).toArray(),
    ]);
    return { ucenik, razgovori, saradnja, radionice };
  }, [sifra]);
  const uc = useUcenikZaDokument(sifra);
  if (!p) return <Ucitavanje />;
  if (!p.ucenik) return <p style={{ padding: 24 }}>Učenik ne postoji.</p>;
  const u = p.ucenik;
  const poDatumu = <T extends { datum: string; createdAt: string }>(a: T, b: T) => a.datum.localeCompare(b.datum) || a.createdAt.localeCompare(b.createdAt);
  const razg = [...p.razgovori].sort(poDatumu);
  const zadnji = zadnjiRazgovorPoUceniku(razg).get(sifra);

  return (
    <Dokument naslov="KARTON UČENIKA" nazivFajla={`Karton_${uc.ime ? uc.ime.replace(/\s+/g, '_') + '_' : ''}${u.sifra}`} postavke={postavke}>
      <table className="podaci-tab">
        <tbody>
          {uc.imena && <Red o="Ime i prezime" v={<strong>{uc.ime}</strong>} />}
          <Red o="Šifra učenika" v={uc.imena ? u.sifra : <strong>{u.sifra}</strong>} />
          <Red o="Razred" v={u.razred} />
          <Red o="Razrednik" v={uc.razrednik} />
          <Red o="Status" v={u.status} />
          <Red o="U praćenju" v={u.uPracenju ? 'Da' : 'Ne'} />
          <Red o="Status zadnjeg slučaja" v={zadnji?.statusSlucaja ?? ''} />
          <Red o="Broj razgovora" v={razg.length} />
          <Red o="Napomena" v={u.napomena} />
        </tbody>
      </table>

      <h2>Razgovori</h2>
      {razg.length === 0 ? <p>Nema evidentiranih razgovora.</p> : (
        <table className="lista-tab">
          <thead>
            <tr><th style={{ width: '11%' }}>Datum</th><th style={{ width: '13%' }}>Vrsta</th><th style={{ width: '13%' }}>Razlog</th><th>Bilješke</th><th style={{ width: '17%' }}>Preporuke</th><th style={{ width: '9%' }}>Status</th></tr>
          </thead>
          <tbody>
            {razg.map((r) => (
              <tr key={r.id}>
                <td>{prikaz(r.datum)}</td>
                <td>{r.vrstaKontakta}</td>
                <td>{r.razlog}</td>
                <td className="tekst-celija">{[r.biljeske, r.zakljucak && `Zaključak: ${r.zakljucak}`].filter(Boolean).join('\n\n')}</td>
                <td className="tekst-celija">{r.preporuke}</td>
                <td>{r.statusSlucaja}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Saradnja</h2>
      {p.saradnja.length === 0 ? <p>Nema evidentiranih kontakata saradnje.</p> : (
        <table className="lista-tab">
          <thead><tr><th style={{ width: '12%' }}>Datum</th><th style={{ width: '22%' }}>Ustanova / osoba</th><th style={{ width: '11%' }}>Način</th><th>Razlog</th><th>Dogovor / ishod</th></tr></thead>
          <tbody>
            {[...p.saradnja].sort(poDatumu).map((s) => (
              <tr key={s.id}>
                <td>{prikaz(s.datum)}</td>
                <td>{s.ustanovaOsoba}{s.opisOsobe ? ` (${s.opisOsobe})` : ''}</td>
                <td>{s.nacin}</td>
                <td className="tekst-celija">{s.razlog}</td>
                <td className="tekst-celija">{s.dogovorIshod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Radionice</h2>
      {p.radionice.length === 0 ? <p>Učenik nije naveden ni u jednoj radionici.</p> : (
        <table className="lista-tab">
          <thead><tr><th style={{ width: '12%' }}>Datum</th><th>Tema</th><th style={{ width: '25%' }}>Oblast</th><th style={{ width: '14%' }}>Razred</th></tr></thead>
          <tbody>
            {[...p.radionice].sort(poDatumu).map((r) => (
              <tr key={r.id}><td>{prikaz(r.datum)}</td><td>{r.tema}</td><td>{r.oblast}</td><td>{r.razred}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </Dokument>
  );
}

// ---------- 4. Godišnji / polugodišnji izvještaj ----------

function TabelaPolugodista({ s, period }: { s: Statistika; period: 'I' | 'II' }) {
  const mjeseci = s.mjeseci.filter((m) => (period === 'I' ? Number(m.kljuc.slice(5)) >= 9 : Number(m.kljuc.slice(5)) <= 6));
  const z = period === 'I' ? s.polugodisteI : s.polugodisteII;
  return (
    <table className="tabela">
      <thead><tr><th>Mjesec</th><th className="n">Razgovori</th><th className="n">Radionice</th><th className="n">Učesnici rad.</th><th className="n">Saradnja</th><th className="n">Ost. aktivnosti</th></tr></thead>
      <tbody>
        {mjeseci.map((m) => (
          <tr key={m.kljuc}><td>{m.naziv} {m.kljuc.slice(0, 4)}.</td><td className="n">{m.razgovori}</td><td className="n">{m.radionice}</td><td className="n">{m.ucesnici}</td><td className="n">{m.saradnja}</td><td className="n">{m.aktivnosti}</td></tr>
        ))}
        <tr className="zbir ukupno"><td>{z.naziv}</td><td className="n">{z.razgovori}</td><td className="n">{z.radionice}</td><td className="n">{z.ucesnici}</td><td className="n">{z.saradnja}</td><td className="n">{z.aktivnosti}</td></tr>
      </tbody>
    </table>
  );
}

export function PrintIzvjestaj({ godina, period }: { godina: number; period: Period }) {
  const postavke = usePostavke();
  const ulaz = useLiveQuery(async () => {
    const [ucenici, razgovori, radionice, saradnja, aktivnosti] = await Promise.all([db.ucenici.toArray(), db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.aktivnosti.toArray()]);
    return { ucenici, razgovori, radionice, saradnja, aktivnosti };
  }, []);
  if (!ulaz) return <Ucitavanje />;
  const s = izracunajStatistiku(ulaz, godina, period);
  const naslov = period === 'godina' ? 'GODIŠNJI IZVJEŠTAJ O RADU PSIHOLOGA' : 'POLUGODIŠNJI IZVJEŠTAJ O RADU PSIHOLOGA';
  const podnaslov = `${period === 'godina' ? 'Školska godina' : period === 'I' ? 'I polugodište, školska godina' : 'II polugodište, školska godina'} ${nazivSkolskeGodine(godina)}.`;

  return (
    <Dokument naslov={naslov} podnaslov={podnaslov} nazivFajla={`Izvjestaj_${period === 'godina' ? 'godisnji' : `${period}_polugodiste`}_${godina}-${godina + 1}`} postavke={postavke}>
      <h2>Sažetak</h2>
      <p className="sazetak">{sazetak(s)}</p>

      <h2>Osnovni pokazatelji</h2>
      <table className="tabela">
        <tbody>
          <tr><td>Broj različitih učenika s kojima je rađeno</td><td className="n">{s.razlicitihUcenika}</td></tr>
          <tr><td>Broj učenika s kojima su obavljeni razgovori</td><td className="n">{s.ucenikaURazgovorima}</td></tr>
          <tr><td>Učenici u praćenju (na dan izvještaja)</td><td className="n">{s.uPracenju}</td></tr>
          <tr><td>Ukupno učenika u evidenciji (aktivni)</td><td className="n">{s.aktivnihUcenika}</td></tr>
        </tbody>
      </table>

      <h2>Pregled po mjesecima</h2>
      {period === 'godina' ? <TabelaMjeseci s={s} /> : <TabelaPolugodista s={s} period={period} />}

      <h2>Razgovori po razlogu</h2>
      <TabelaRaspodjele naslov="Razlog" podaci={s.poRazlogu} />
      <h2>Razgovori po vrsti kontakta</h2>
      <TabelaRaspodjele naslov="Vrsta kontakta" podaci={s.poVrstiKontakta} />
      <h2>Status slučajeva</h2>
      <TabelaRaspodjele naslov="Status (zadnji razgovor po učeniku)" podaci={s.statusSlucajeva} />
      <h2>Radionice po oblasti</h2>
      <TabelaRaspodjele naslov="Oblast" podaci={s.radionicePoOblasti} />
      <h2>Saradnja po ustanovi / osobi</h2>
      <TabelaRaspodjele naslov="Ustanova / osoba" podaci={s.saradnjaPoUstanovi} />
      <h2>Ostali poslovi psihologa</h2>
      <TabelaRaspodjele naslov="Vrsta aktivnosti (zamjene, čas odjeljenske zajednice…)" podaci={s.aktivnostiPoVrsti} />
    </Dokument>
  );
}

// ---------- 5. Dnevni / sedmični / mjesečni izvještaj (period) ----------

export function PrintPeriod({ od, do: doDatum, biljeske }: { od: string; do: string; biljeske: boolean }) {
  const postavke = usePostavke();
  const { poSifri } = useImenik();
  const ulaz = useLiveQuery(async () => {
    const [ucenici, razgovori, radionice, saradnja, aktivnosti] = await Promise.all([
      db.ucenici.toArray(), db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.aktivnosti.toArray(),
    ]);
    return { ucenici, razgovori, radionice, saradnja, aktivnosti };
  }, []);
  if (!ulaz) return <Ucitavanje />;
  const stavke = stavkePerioda(ulaz, od, doDatum);
  const b = brojPerioda(ulaz, od, doDatum);
  const tekst = procitajTekst(od, doDatum).trim();
  const imena = postavke.imenaUDokumentima !== false;
  const ucenik = (s: string) => {
    if (!s) return '';
    const u = poSifri.get(s);
    const ime = imena ? punoIme(u) : '';
    return `${ime ? `${ime} (${s})` : s}${u?.razred ? `, ${u.razred}` : ''}`;
  };
  const vrsta = vrstaPerioda(od, doDatum);

  return (
    <Dokument naslov={naslovIzvjestaja(od, doDatum)} podnaslov={opisPerioda(od, doDatum)}
      nazivFajla={`Izvjestaj_${vrsta === 'dan' ? od : `${od}_${doDatum}`}`} postavke={postavke}>
      <h2>{tekst ? 'Izvještaj' : 'Sažetak'}</h2>
      <p className="sazetak" style={{ whiteSpace: 'pre-wrap' }}>{tekst || sazetakPerioda(b, od, doDatum)}</p>

      <h2>Pregled</h2>
      <table className="tabela">
        <tbody>
          <tr><td>Razgovori (broj učenika)</td><td className="n">{b.razgovori} ({b.ucenika})</td></tr>
          <tr><td>Radionice (broj učesnika)</td><td className="n">{b.radionice} ({b.ucesnici})</td></tr>
          <tr><td>Kontakti saradnje</td><td className="n">{b.saradnja}</td></tr>
          <tr><td>Zamjene nastavnika</td><td className="n">{b.zamjene}</td></tr>
          <tr><td>Časovi odjeljenske zajednice</td><td className="n">{b.casoviOZ}</td></tr>
          <tr><td>Ostale aktivnosti</td><td className="n">{b.aktivnosti - b.zamjene - b.casoviOZ}</td></tr>
        </tbody>
      </table>

      {vrsta === 'sedmica' && (
        <>
          <h2>Evidencioni list 40-satne radne sedmice</h2>
          <TabelaEvidencije redovi={evidencijaPoPodrucjima(stavkeDnevnika(ulaz, od, doDatum), 1)} napomena="Norma za jednu sedmicu." />
        </>
      )}

      <h2>Hronološki pregled aktivnosti</h2>
      {stavke.length === 0 ? <p>U ovom periodu nema evidentiranih aktivnosti.</p> : (
        <table className="lista-tab">
          <thead>
            <tr>
              <th style={{ width: vrsta === 'dan' ? '0' : '14%', display: vrsta === 'dan' ? 'none' : undefined }}>Datum</th>
              <th style={{ width: '28%' }}>Aktivnost</th>
              <th style={{ width: '22%' }}>Učenik / razred</th>
              <th>Opis</th>
            </tr>
          </thead>
          <tbody>
            {stavke.map((s) => (
              <tr key={s.id}>
                <td style={{ display: vrsta === 'dan' ? 'none' : undefined }}>{nazivDana(s.datum).slice(0, 3)}, {prikaz(s.datum)}</td>
                <td>{s.naslov}</td>
                <td>{ucenik(s.ucenik) || s.detalji.find((d) => d.startsWith('razred'))?.replace('razred ', '') || ''}</td>
                <td className="tekst-celija">
                  {[s.umjesto && `umjesto: ${s.umjesto}`, ...s.detalji.filter((d) => !d.startsWith('razred'))].filter(Boolean).join('; ')}
                  {biljeske && s.tekst ? `\n${s.tekst}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Dokument>
  );
}

// ---------- 6. Godišnji program / mjesečni plan rada psihologa ----------

export function PrintPlan({ godina, mjesec }: { godina: number; mjesec?: string }) {
  const postavke = usePostavke();
  const plan = useLiveQuery(() => db.plan.where('skolskaGodina').equals(godina).toArray(), [godina]);
  if (!plan) return <Ucitavanje />;
  const stavke = plan.filter((s) => !mjesec || uMjesecu(s.mjeseci, mjesec));
  const naziv = mjesec ? `${MJESECI[Number(mjesec.slice(5)) - 1]} ${mjesec.slice(0, 4)}.` : '';
  let rb = 0;
  return (
    <Dokument naslov={mjesec ? 'MJESEČNI PLAN RADA PSIHOLOGA' : 'GODIŠNJI PROGRAM RADA PSIHOLOGA'}
      podnaslov={mjesec ? `${naziv[0].toUpperCase()}${naziv.slice(1)} – školska ${nazivSkolskeGodine(godina)}. godina` : `Školska ${nazivSkolskeGodine(godina)}. godina`}
      nazivFajla={mjesec ? `Mjesecni_plan_${mjesec}` : `Godisnji_program_rada_${godina}-${godina + 1}`} postavke={postavke}>
      {!mjesec && (
        <>
          <h2>Struktura 40-satne radne sedmice</h2>
          <table className="tabela">
            <thead><tr><th>R. br.</th><th>Područje rada</th><th className="n">Sati sedmično</th></tr></thead>
            <tbody>
              {PODRUCJA.map((p) => <tr key={p.kod}><td className="n">{p.kod}.</td><td>{p.naziv}</td><td className="n">{p.sati}</td></tr>)}
              <tr className="zbir ukupno"><td></td><td>UKUPNO</td><td className="n">40</td></tr>
            </tbody>
          </table>
          <p className="malo" style={{ fontSize: '9pt' }}>Izvor: {IZVOR_NORME}</p>
        </>
      )}
      <h2>{mjesec ? 'Planirani sadržaji rada' : 'Sadržaji rada po područjima'}</h2>
      {stavke.length === 0 ? <p>Plan još nije unesen.</p> : (
        <table className="lista-tab">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>R. br.</th>
              <th>Sadržaj rada</th>
              {!mjesec && <th style={{ width: '18%' }}>Vrijeme realizacije</th>}
              <th style={{ width: '20%' }}>Saradnici</th>
              {mjesec && <th style={{ width: '13%' }}>Realizovano</th>}
            </tr>
          </thead>
          <tbody>
            {PODRUCJA.map((p) => {
              const lista = stavke.filter((s) => s.podrucje === p.kod);
              if (!lista.length) return null;
              return [
                <tr key={`h${p.kod}`}><td colSpan={mjesec ? 4 : 4} style={{ background: '#eee', fontWeight: 'bold' }}>{p.kod}. {p.naziv} ({p.sati} h sedmično)</td></tr>,
                ...lista.map((s) => (
                  <tr key={s.id}>
                    <td className="n">{++rb}.</td>
                    <td className="tekst-celija">{s.sadrzaj}{s.napomena ? ` (${s.napomena})` : ''}</td>
                    {!mjesec && <td>{vrijemeRealizacije(s.mjeseci)}</td>}
                    <td>{s.saradnici}</td>
                    {mjesec && <td>{s.realizovano.includes(mjesec) ? 'da' : ''}</td>}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      )}
    </Dokument>
  );
}

// ---------- 7. Dnevnik rada psihologa (mjesec) ----------

export function PrintDnevnik({ mjesec }: { mjesec: string }) {
  const postavke = usePostavke();
  const { poSifri } = useImenik();
  const ulaz = useLiveQuery(async () => {
    const [razgovori, radionice, saradnja, aktivnosti] = await Promise.all([db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray(), db.aktivnosti.toArray()]);
    return { razgovori, radionice, saradnja, aktivnosti };
  }, []);
  if (!ulaz) return <Ucitavanje />;
  const [g, m] = mjesec.split('-').map(Number);
  const od = `${mjesec}-01`, doD = `${mjesec}-${String(new Date(g, m, 0).getDate()).padStart(2, '0')}`;
  const stavke = stavkeDnevnika(ulaz, od, doD);
  const sedmica = radnihSedmica(mjesec);
  const ev = evidencijaPoPodrucjima(stavke, sedmica);
  const imena = postavke.imenaUDokumentima !== false;
  const ucenik = (s: string) => (s ? (imena && punoIme(poSifri.get(s)) ? `${punoIme(poSifri.get(s))} (${s})` : s) : '');
  const ukupnoMin = stavke.reduce((s, x) => s + x.minuta, 0);
  const naziv = `${MJESECI[m - 1]} ${g}.`;
  return (
    <Dokument naslov="DNEVNIK RADA PSIHOLOGA" podnaslov={`${naziv[0].toUpperCase()}${naziv.slice(1)}`} nazivFajla={`Dnevnik_rada_${mjesec}`} postavke={postavke}>
      {stavke.length === 0 ? <p>U ovom mjesecu nema evidentiranog rada.</p> : (
        <table className="lista-tab">
          <thead>
            <tr><th style={{ width: '13%' }}>Datum</th><th style={{ width: '7%' }}>Pod.</th><th>Opis rada</th><th style={{ width: '20%' }}>Učenik</th><th style={{ width: '9%' }} className="n">Trajanje</th></tr>
          </thead>
          <tbody>
            {stavke.map((s, i) => (
              <tr key={s.id}>
                <td>{i === 0 || stavke[i - 1].datum !== s.datum ? `${nazivDana(s.datum).slice(0, 3)}, ${prikaz(s.datum)}` : ''}</td>
                <td className="n">{s.podrucje || '–'}</td>
                <td className="tekst-celija">{s.opis}</td>
                <td>{ucenik(s.sifra)}</td>
                <td className="n">{satiTekst(s.minuta)}</td>
              </tr>
            ))}
            <tr className="zbir"><td colSpan={4}>Ukupno evidentirano</td><td className="n">{satiTekst(ukupnoMin)}</td></tr>
          </tbody>
        </table>
      )}
      <h2>Evidencija 40-satne radne sedmice za mjesec</h2>
      <TabelaEvidencije redovi={ev} napomena={`Norma = sedmična norma × ${sedmica} radnih sedmica (bez praznika). „Pod.“ u dnevniku je broj područja rada.`} />
    </Dokument>
  );
}

function TabelaEvidencije({ redovi, napomena }: { redovi: RedEvidencije[]; napomena: string }) {
  const n = redovi.reduce((s, r) => s + r.norma, 0), o = redovi.reduce((s, r) => s + r.ostvareno, 0);
  return (
    <>
      <table className="tabela">
        <thead><tr><th>Područje rada</th><th className="n">Norma (h)</th><th className="n">Evidentirano (h)</th></tr></thead>
        <tbody>
          {redovi.map((r) => (
            <tr key={r.kod}><td>{r.kod ? `${r.kod}. ` : ''}{r.naziv}</td><td className="n">{r.norma ? zaokruzi(r.norma) : '–'}</td><td className="n">{r.ostvareno || '–'}</td></tr>
          ))}
          <tr className="zbir ukupno"><td>UKUPNO</td><td className="n">{zaokruzi(n)}</td><td className="n">{zaokruzi(o)}</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: '9pt' }}>{napomena} Evidentirano je samo ono što je uneseno u app (razgovori, radionice, saradnja, ostale aktivnosti); priprema za rad i dokumentacija se evidentiraju kao „Ostala aktivnost“. Izvor norme: {IZVOR_NORME}</p>
    </>
  );
}
