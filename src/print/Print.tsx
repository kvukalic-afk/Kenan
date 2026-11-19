import { useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Ikona } from '../components/Ikona';
import { TabelaMjeseci, TabelaRaspodjele } from '../components/StatTabele';
import { danasIso, nazivSkolskeGodine, prikaz } from '../lib/datum';
import { nazad } from '../lib/router';
import { useImenik, usePostavke } from '../lib/podaci';
import { izracunajStatistiku, sazetak, type Period, type Statistika } from '../lib/statistika';
import { zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { punoIme, type Postavke, type Radionica, type Razgovor, type Saradnja } from '../types';
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
      <thead><tr><th>Mjesec</th><th className="n">Razgovori</th><th className="n">Radionice</th><th className="n">Učesnici rad.</th><th className="n">Saradnja</th></tr></thead>
      <tbody>
        {mjeseci.map((m) => (
          <tr key={m.kljuc}><td>{m.naziv} {m.kljuc.slice(0, 4)}.</td><td className="n">{m.razgovori}</td><td className="n">{m.radionice}</td><td className="n">{m.ucesnici}</td><td className="n">{m.saradnja}</td></tr>
        ))}
        <tr className="zbir ukupno"><td>{z.naziv}</td><td className="n">{z.razgovori}</td><td className="n">{z.radionice}</td><td className="n">{z.ucesnici}</td><td className="n">{z.saradnja}</td></tr>
      </tbody>
    </table>
  );
}

export function PrintIzvjestaj({ godina, period }: { godina: number; period: Period }) {
  const postavke = usePostavke();
  const ulaz = useLiveQuery(async () => {
    const [ucenici, razgovori, radionice, saradnja] = await Promise.all([db.ucenici.toArray(), db.razgovori.toArray(), db.radionice.toArray(), db.saradnja.toArray()]);
    return { ucenici, razgovori, radionice, saradnja };
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
    </Dokument>
  );
}
