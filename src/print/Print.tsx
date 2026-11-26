import { useEffect, useState, type ReactNode } from 'react';
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
import { definicija, popuniUvod } from '../lib/obrasci';
import { brojPerioda, nazivDana, naslovIzvjestaja, opisPerioda, sazetakPerioda, stavkePerioda, vrstaPerioda } from '../lib/periodIzvjestaj';
import { procitajTekst } from '../screens/IzvjestajPeriod';
import { punoIme, type Ucenik, type Aktivnost, type Analiza, type PopunjenObrazac, type Postavke, type Radionica, type Razgovor, type Saradnja } from '../types';
import { GRUPE } from '../lib/dokumentacija';
import { ucitajPripremu, type PripremaRadionice } from '../lib/aiAlati';
import { useKontrola } from '../lib/useKontrola';
import './print.css';

function Dokument({ naslov, podnaslov, nazivFajla, postavke, children, javno = false }: {
  naslov: string; podnaslov?: string; nazivFajla: string; postavke: Postavke; children: ReactNode;
  /** dokument za dijeljenje (letak, priprema) – bez oznake POVJERLJIVO */
  javno?: boolean;
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
                  {javno ? <span className="dok-oznaka">Školski psiholog</span> : <span className="povjerljivo">POVJERLJIVO</span>}
                </div>
              </td></tr>
            </thead>
            <tfoot>
              <tr><td>
                <div className="dok-podnozje">
                  <div>
                    Datum: {prikaz(danasIso())}<br />
                    {!javno && <span className="povjerljivo">POVJERLJIVO</span>}
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
    const [ucenik, razgovori, saradnja, radionice, biljeske, analize] = await Promise.all([
      db.ucenici.where('sifra').equals(sifra).first(),
      db.razgovori.where('sifra').equals(sifra).toArray(),
      db.saradnja.where('sifra').equals(sifra).toArray(),
      db.radionice.where('ucenicizaPracenje').equals(sifra).toArray(),
      db.brzeBiljeske.where('sifra').equals(sifra).toArray(),
      db.analize.where('sifra').equals(sifra).toArray(),
    ]);
    return { ucenik, razgovori, saradnja, radionice, biljeske, analize };
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
                <td className="tekst-celija">{[r.preporuke, r.sljedeciKorak && `Sljedeći korak: ${r.sljedeciKorak}`, r.datumSljedecegKontakta && `Sljedeći kontakt: ${prikaz(r.datumSljedecegKontakta)}`].filter(Boolean).join('\n\n')}</td>
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

      <h2>Bilješke i informativni razgovori</h2>
      {p.biljeske.length === 0 ? <p>Nema bilješki vezanih za učenika.</p> : (
        <table className="lista-tab">
          <thead><tr><th style={{ width: '12%' }}>Datum</th><th style={{ width: '16%' }}>Vrsta</th><th style={{ width: '18%' }}>O kome / sa kim</th><th>Zapis</th></tr></thead>
          <tbody>
            {[...p.biljeske].sort(poDatumu).map((b) => (
              <tr key={b.id}><td>{prikaz(b.datum)}</td><td>{b.kategorija}</td><td>{(b.osobe ?? []).join(', ')}</td><td className="tekst-celija">{b.sroceno || b.tekst}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {p.analize.length > 0 && (
        <>
          <h2>Analize i zaključci</h2>
          {[...p.analize].sort((a, b) => a.datum.localeCompare(b.datum)).map((a) => (
            <div key={a.id} style={{ breakInside: 'avoid', marginBottom: 10 }}>
              <p style={{ margin: '0 0 4px' }}><strong>{prikaz(a.datum)} – {a.naslov}</strong></p>
              <div className="tekst-celija" style={{ fontSize: '9.5pt', whiteSpace: 'pre-wrap' }}>{a.tekst}</div>
            </div>
          ))}
        </>
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

export function PrintDnevnik({ mjesec, uvid = false }: { mjesec: string; uvid?: boolean }) {
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
  // za uvid (pedagog, direktor) samo šifra i razred, bez imena
  const imena = !uvid && postavke.imenaUDokumentima !== false;
  const ucenik = (s: string) => (!s ? '' : imena && punoIme(poSifri.get(s)) ? `${punoIme(poSifri.get(s))} (${s})` : [s, poSifri.get(s)?.razred].filter(Boolean).join(', '));
  const ukupnoMin = stavke.reduce((s, x) => s + x.minuta, 0);
  const naziv = `${MJESECI[m - 1]} ${g}.`;
  return (
    <Dokument naslov="DNEVNIK RADA PSIHOLOGA" podnaslov={`${naziv[0].toUpperCase()}${naziv.slice(1)}${uvid ? ' · za uvid' : ''}`} nazivFajla={`Dnevnik_rada_${mjesec}`} postavke={postavke}>
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

// ---------- 8. Popunjen obrazac ----------

export function PrintObrazac({ id }: { id: string }) {
  const postavke = usePostavke();
  const { poSifri, razrednik } = useImenik();
  const o = useLiveQuery(() => db.obrasci.get(id), [id], null as PopunjenObrazac | null | undefined);
  if (o === null) return <Ucitavanje />;
  if (!o) return <p style={{ padding: 24 }}>Obrazac ne postoji.</p>;
  const def = definicija(o.vrsta);
  if (!def) return <p style={{ padding: 24 }}>Nepoznata vrsta obrasca.</p>;
  const imena = postavke.imenaUDokumentima !== false;
  const u = o.sifra ? poSifri.get(o.sifra) : undefined;
  const ucenikTekst = u ? `${imena && punoIme(u) ? punoIme(u) : u.sifra}` : o.polja.ucenik || '';
  const vr: Record<string, string> = {
    ...Object.fromEntries(def.polja.map((f) => [f.kljuc, f.tip === 'datum' ? prikaz(o.polja[f.kljuc] ?? '') : (o.polja[f.kljuc] ?? '')])),
    ucenik: ucenikTekst, razred: u?.razred ?? '',
  };
  const kratka = def.polja.filter((f) => f.tip !== 'dugi' && !(def.uvod && def.uvod.includes(`{${f.kljuc}}`) && f.kljuc !== 'datum'));
  const duga = def.polja.filter((f) => f.tip === 'dugi' && !(def.uvod && def.uvod.includes(`{${f.kljuc}}`)));
  return (
    <Dokument naslov={def.naslov} nazivFajla={`${def.naziv.replace(/\s+/g, '_')}_${o.datum}`} postavke={postavke}>
      {kratka.length > 0 && (
        <table className="podaci-tab">
          <tbody>
            {kratka.map((f) => (
              <Red key={f.kljuc} o={f.labela.replace(/\s*\(.*\)$/, '')} v={f.tip === 'ucenik' ? (vr.ucenik ? `${vr.ucenik}${u?.razred ? `, razred ${u.razred}` : ''}` : '') : vr[f.kljuc]} />
            ))}
            {u?.razred && razrednik.get(u.razred) && <Red o="Razrednik" v={razrednik.get(u.razred)} />}
          </tbody>
        </table>
      )}
      {def.uvod && <p className="tekst-obrasca">{popuniUvod(def.uvod, vr)}</p>}
      {duga.map((f) => <Blok key={f.kljuc} naslov={f.labela} tekst={vr[f.kljuc]} />)}
      {def.zavrsetak && <p className="tekst-obrasca">{def.zavrsetak}</p>}
      <div className="potpisi">
        {def.potpisi.map((p) => (
          <div key={p} className="potpis-polje">
            <div className="linija-potpisa" />
            <div>{p}{p === 'Psiholog' && postavke.imePsihologa ? `: ${postavke.imePsihologa}` : ''}</div>
          </div>
        ))}
        {def.mp && <div className="potpis-polje mp">M.P.</div>}
      </div>
    </Dokument>
  );
}

// ---------- 9. Analiza ----------

/** Tekst s podnaslovima („Naslov:“ u svom redu) i stavkama („• …“) kao uredan HTML. */
function FormatiranTekst({ tekst }: { tekst: string }) {
  const blokovi: ReactNode[] = [];
  let lista: string[] = [];
  const zatvoriListu = () => { if (lista.length) { blokovi.push(<ul key={`l${blokovi.length}`} className="letak-lista">{lista.map((x, i) => <li key={i}>{x}</li>)}</ul>); lista = []; } };
  for (const red of tekst.split('\n')) {
    const t = red.trim();
    if (!t) { zatvoriListu(); continue; }
    if (/^[•\-*–]\s+/.test(t)) { lista.push(t.replace(/^[•\-*–]\s+/, '')); continue; }
    zatvoriListu();
    if (/^\d+\.\s.{2,80}$/.test(t) && !/[.!?]$/.test(t) || (/:$/.test(t) && t.length < 80)) blokovi.push(<h2 key={blokovi.length} className="letak-podnaslov">{t.replace(/:$/, '')}</h2>);
    else blokovi.push(<p key={blokovi.length}>{t}</p>);
  }
  zatvoriListu();
  return <div className="formatiran">{blokovi}</div>;
}

export function PrintAnaliza({ id }: { id: string }) {
  const postavke = usePostavke();
  const a = useLiveQuery(() => db.analize.get(id), [id], null as Analiza | null | undefined);
  if (a === null) return <Ucitavanje />;
  if (!a) return <p style={{ padding: 24 }}>Dokument ne postoji.</p>;
  if (a.vrsta === 'letak') {
    const [naslov, ...ostalo] = a.tekst.trim().split('\n');
    return (
      <Dokument javno naslov={naslov.replace(/^#+\s*/, '').toUpperCase()} podnaslov={a.opseg} nazivFajla={`Letak_${a.datum}`} postavke={postavke}>
        <div className="letak"><FormatiranTekst tekst={ostalo.join('\n')} /></div>
      </Dokument>
    );
  }
  if (a.vrsta === 'priprema-radionice') {
    const pr = ucitajPripremu(a.tekst);
    if (pr) return <PrintPriprema p={pr} postavke={postavke} datum={a.datum} />;
    return (
      <Dokument javno naslov="PRIPREMA ZA RADIONICU" podnaslov={a.naslov} nazivFajla={`Priprema_radionice_${a.datum}`} postavke={postavke}>
        <table className="podaci-tab"><tbody><Red o="Datum pripreme" v={prikaz(a.datum)} /><Red o="Razred / grupa" v={a.opseg} /></tbody></table>
        <FormatiranTekst tekst={a.tekst} />
      </Dokument>
    );
  }
  return (
    <Dokument naslov="ANALIZA PRIKUPLJENIH INFORMACIJA" podnaslov={a.naslov} nazivFajla={`Analiza_${a.datum}`} postavke={postavke}>
      <table className="podaci-tab">
        <tbody>
          <Red o="Datum analize" v={prikaz(a.datum)} />
          <Red o="Obuhvaćeno" v={a.opseg} />
          <Red o="Broj zapisa" v={a.brojIzvora} />
          {a.sifra && <Red o="Učenik (šifra)" v={a.sifra} />}
        </tbody>
      </table>
      <div className="blok"><div className="sadrzaj-bloka" style={{ minHeight: 0 }}>{a.tekst}</div></div>
      <p style={{ fontSize: '9pt' }}>Analiza je izrađena uz pomoć umjetne inteligencije na osnovu evidencije psihologa i služi kao radni materijal; zaključke je pregledao i potvrdio psiholog.</p>
    </Dokument>
  );
}

// ---------- 10. Evidencija stručnog usavršavanja ----------

export function PrintUsavrsavanje({ godina }: { godina: number }) {
  const postavke = usePostavke();
  const lista = useLiveQuery(() => db.aktivnosti.filter((a) => /usavršavanj/i.test(a.vrsta) && a.datum >= `${godina}-09-01` && a.datum <= `${godina + 1}-08-31`).toArray(), [godina]);
  if (!lista) return <Ucitavanje />;
  const sort = [...lista].sort((a, b) => a.datum.localeCompare(b.datum));
  const sati = sort.reduce((s, a) => s + (a.trajanjeMin ?? 0), 0) / 60;
  return (
    <Dokument naslov="EVIDENCIJA STRUČNOG USAVRŠAVANJA" podnaslov={`Školska ${nazivSkolskeGodine(godina)}. godina`} nazivFajla={`Usavrsavanje_${godina}-${godina + 1}`} postavke={postavke}>
      {sort.length === 0 ? <p>Nema evidentiranog stručnog usavršavanja (Ostala aktivnost → Stručno usavršavanje).</p> : (
        <table className="lista-tab">
          <thead><tr><th style={{ width: '6%' }}>R. br.</th><th style={{ width: '14%' }}>Datum</th><th>Tema / naziv</th><th style={{ width: '22%' }}>Organizator / napomena</th><th style={{ width: '10%' }} className="n">Sati</th></tr></thead>
          <tbody>
            {sort.map((a, i) => (
              <tr key={a.id}><td className="n">{i + 1}.</td><td>{prikaz(a.datum)}</td><td className="tekst-celija">{a.tema || a.predmet || '—'}</td><td className="tekst-celija">{[a.napomena, a.zapazanja].filter(Boolean).join(' · ')}</td><td className="n">{a.trajanjeMin ? zaokruzi(a.trajanjeMin / 60) : ''}</td></tr>
            ))}
            <tr className="zbir"><td colSpan={4}>Ukupno</td><td className="n">{zaokruzi(sati)}</td></tr>
          </tbody>
        </table>
      )}
      <p style={{ fontSize: '9pt' }}>Uz evidenciju se prilažu potvrde/certifikati o učešću.</p>
    </Dokument>
  );
}

export function PrintDokumentacija({ godina }: { godina: number }) {
  const postavke = usePostavke();
  const kon = useKontrola(godina);
  if (!kon) return <Ucitavanje />;
  let rb = 0;
  return (
    <Dokument naslov="PREGLED OBAVEZNE DOKUMENTACIJE PSIHOLOGA" podnaslov={`Školska ${nazivSkolskeGodine(godina)}. godina · stanje na dan ${prikaz(danasIso())}`} nazivFajla={`Dokumentacija_psihologa_${godina}-${godina + 1}`} postavke={postavke}>
      {kon.k.pocetakRada && <p style={{ fontSize: '9.5pt' }}>Psiholog radi u školi od {prikaz(kon.k.pocetakRada)}{kon.k.pripravnik ? ' (pripravnik)' : ''}. Rokovi za obaveze koje su dospjele prije dolaska računaju se od dana početka rada.</p>}
      <table className="lista-tab">
        <thead><tr><th style={{ width: '5%' }}>R. br.</th><th style={{ width: '33%' }}>Dokument / obaveza</th><th>Pravni osnov</th><th style={{ width: '12%' }}>Rok</th><th style={{ width: '11%' }}>Stanje</th></tr></thead>
        <tbody>
          {GRUPE.map((g) => {
            const stavke = kon.stanje.filter((s) => s.def.grupa === g.kljuc).sort((a, b) => a.rok.localeCompare(b.rok));
            if (!stavke.length) return null;
            return [
              <tr key={g.kljuc} className="zbir"><td colSpan={5}>{g.naziv}</td></tr>,
              ...stavke.map((s) => (
                <tr key={s.id}>
                  <td className="n">{++rb}.</td>
                  <td className="tekst-celija"><strong>{s.def.naziv}</strong><br /><span style={{ fontSize: '8.5pt' }}>{s.def.opis}</span></td>
                  <td className="tekst-celija" style={{ fontSize: '8.5pt' }}>{s.def.osnov}</td>
                  <td>{prikaz(s.rok)}{s.def.ponavljanje === 'mjesecno' ? <><br /><span style={{ fontSize: '8pt' }}>(svaki mjesec)</span></> : null}</td>
                  <td>{s.gotovo ? '✓ urađeno' : s.kasni ? 'kasni' : '☐'}</td>
                </tr>
              )),
            ];
          })}
        </tbody>
      </table>
      <p style={{ fontSize: '8.5pt' }}>Napomena: obaveze označene kao „dobra praksa“ nisu izričito propisane, ali ih inspekcija i Pedagoški zavod uobičajeno očekuju. Izvori: Zakon o osnovnom odgoju i obrazovanju USK (Sl. glasnik USK 19/2023), Pedagoški standardi i normativi za osnovno obrazovanje USK (Sl. glasnik USK 20/2024, čl. 13).</p>
    </Dokument>
  );
}

/** Zbirna evidencija rada s učenicima za uvid (pedagog, direktor): bez imena i bez sadržaja razgovora. */
export function PrintUvidUcenici({ od, do: doD }: { od: string; do: string }) {
  const postavke = usePostavke();
  const { poSifri } = useImenik();
  const ulaz = useLiveQuery(async () => {
    const [razgovori, saradnja] = await Promise.all([db.razgovori.toArray(), db.saradnja.toArray()]);
    return { razgovori: razgovori.filter((r) => r.datum >= od && r.datum <= doD), saradnja: saradnja.filter((s) => s.sifra && s.datum >= od && s.datum <= doD) };
  }, [od, doD]);
  if (!ulaz) return <Ucitavanje />;
  const zadnji = zadnjiRazgovorPoUceniku(ulaz.razgovori);
  const redovi = [...zadnji.keys()].map((sifra) => {
    const svi = ulaz.razgovori.filter((r) => r.sifra === sifra).sort((a, b) => a.datum.localeCompare(b.datum));
    return {
      sifra,
      razred: poSifri.get(sifra)?.razred || svi[svi.length - 1].razred || '',
      broj: svi.length,
      saradnja: ulaz.saradnja.filter((s) => s.sifra === sifra).length,
      prvi: svi[0].datum, zadnji: svi[svi.length - 1].datum,
      razlozi: [...new Set(svi.map((r) => r.razlog).filter(Boolean))].join(', '),
      status: zadnji.get(sifra)?.statusSlucaja || '',
    };
  }).sort((a, b) => a.razred.localeCompare(b.razred, 'bs', { numeric: true }) || a.sifra.localeCompare(b.sifra, 'bs', { numeric: true }));
  const ukupno = redovi.reduce((s, r) => s + r.broj, 0);
  return (
    <Dokument naslov="EVIDENCIJA RADA S UČENICIMA – ZBIRNO" podnaslov={`Period ${prikaz(od)} – ${prikaz(doD)} · za uvid`} nazivFajla={`Evidencija_ucenici_zbirno_${od}_${doD}`} postavke={postavke}>
      {redovi.length === 0 ? <p>U ovom periodu nema evidentiranih razgovora s učenicima.</p> : (
        <table className="lista-tab">
          <thead><tr><th style={{ width: '5%' }}>R. br.</th><th style={{ width: '10%' }}>Šifra</th><th style={{ width: '8%' }}>Razred</th><th style={{ width: '9%' }} className="n">Razgovora</th><th style={{ width: '10%' }} className="n">Saradnja (roditelji, nastavnici)</th><th>Razlog</th><th style={{ width: '13%' }}>Prvi / zadnji kontakt</th><th style={{ width: '11%' }}>Status</th></tr></thead>
          <tbody>
            {redovi.map((r, i) => (
              <tr key={r.sifra}>
                <td className="n">{i + 1}.</td><td>{r.sifra}</td><td>{r.razred}</td><td className="n">{r.broj}</td><td className="n">{r.saradnja || ''}</td>
                <td className="tekst-celija">{r.razlozi}</td><td>{prikaz(r.prvi)}{r.zadnji !== r.prvi ? <><br />{prikaz(r.zadnji)}</> : null}</td><td>{r.status}</td>
              </tr>
            ))}
            <tr className="zbir"><td colSpan={3}>Ukupno: {redovi.length} učenika</td><td className="n">{ukupno}</td><td colSpan={4}></td></tr>
          </tbody>
        </table>
      )}
      <p style={{ fontSize: '8.5pt' }}>Evidencija pokazuje obim i vrstu rada. Bilješke iz razgovora, zaključci, nalazi i testovi su povjerljiva dokumentacija psihologa i čuvaju se odvojeno (Etički kodeks psihologa; propisi o zaštiti ličnih podataka). Ključ šifri učenika je kod psihologa.</p>
    </Dokument>
  );
}

// ---------- Spiskovi odjeljenja (svako odjeljenje na svojoj stranici) ----------

const RIMSKI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
/** "7-1" → "VII-1" */
export const rimskiRazred = (r: string) => r.replace(/^(\d)(?=\D)/, (_, d: string) => RIMSKI[Number(d)] || d);
const porediRazred = (a: string, b: string) => a.localeCompare(b, 'bs', { numeric: true });

export function PrintSpiskovi({ razred }: { razred?: string }) {
  const postavke = usePostavke();
  const [sifre, setSifre] = useState(true);
  const p = useLiveQuery(async () => {
    const [ucenici, razredi] = await Promise.all([db.ucenici.toArray(), db.razredi.toArray()]);
    return { ucenici, razredi };
  }, []);
  useEffect(() => {
    const stari = document.title;
    document.title = razred ? `Spisak_ucenika_${razred}` : 'Spiskovi_odjeljenja';
    return () => { document.title = stari; };
  }, [razred]);
  if (!p) return <Ucitavanje />;
  const razrednik = new Map(p.razredi.map((r) => [r.razred, r.razrednik]));
  const grupe = new Map<string, Ucenik[]>();
  for (const u of p.ucenici) {
    if (u.status && u.status !== 'Aktivan') continue;
    if (!u.razred || (razred && u.razred !== razred)) continue;
    grupe.set(u.razred, [...(grupe.get(u.razred) ?? []), u]);
  }
  const redoslijed = [...grupe.keys()].sort(porediRazred);
  const sg = nazivSkolskeGodine(postavke.skolskaGodinaPocetak);
  const poPrezimenu = (a: Ucenik, b: Ucenik) => (a.prezime || '').localeCompare(b.prezime || '', 'bs') || (a.ime || '').localeCompare(b.ime || '', 'bs') || a.sifra.localeCompare(b.sifra, 'bs', { numeric: true });

  return (
    <div className="print-omot">
      <div className="print-alati">
        <button type="button" className="dugme" onClick={() => nazad('/ucenici')}><Ikona ime="nazad" /> Nazad</button>
        <button type="button" className="dugme primarno" style={{ background: '#fff', color: '#17556b' }} onClick={() => window.print()}>
          <Ikona ime="print" /> Štampaj / Sačuvaj kao PDF
        </button>
        <label className="prekidac" style={{ color: 'inherit' }}>
          <input type="checkbox" role="switch" checked={sifre} onChange={(e) => setSifre(e.target.checked)} /> Šifre učenika
        </label>
        <span className="napomena">{redoslijed.length} {redoslijed.length === 1 ? 'odjeljenje' : 'odjeljenja'} · svako na svojoj stranici. Šifre isključi ako spisak daješ drugima.</span>
      </div>
      <div className="print-pozadina">
        {redoslijed.length === 0 && <p style={{ color: '#fff', textAlign: 'center' }}>Nema učenika za prikaz.</p>}
        {redoslijed.map((r) => {
          const lista = (grupe.get(r) ?? []).sort(poPrezimenu);
          const rz = razrednik.get(r);
          return (
            <article key={r} className="print-stranica spisak">
              <div className="spisak-vrh">
                <span className="skola">{postavke.nazivSkole}</span>
                <span>Školska {sg}. godina</span>
              </div>
              <div className="spisak-naslov">
                <div className="spisak-oznaka">Spisak učenika</div>
                <div className="spisak-odjeljenje">Odjeljenje {rimskiRazred(r)}</div>
              </div>
              <div className="spisak-razrednik">
                <span>Razrednik/ca:</span>
                {rz ? <strong>{rz}</strong> : <span className="crta" />}
              </div>
              <table className="spisak-tabela">
                <thead>
                  <tr><th className="rb">Br.</th><th>Ime i prezime</th>{sifre && <th className="sf">Šifra</th>}<th className="nap">Napomena</th></tr>
                </thead>
                <tbody>
                  {lista.map((u, i) => (
                    <tr key={u.id}>
                      <td className="rb">{i + 1}.</td>
                      <td className="ime">{punoIme(u) || <span className="blijedo-print">(ime nije upisano)</span>}</td>
                      {sifre && <td className="sf">{u.sifra}</td>}
                      <td className="nap" />
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="spisak-dno">
                <span>Ukupno učenika: <strong>{lista.length}</strong></span>
                <span>Stanje na dan {prikaz(danasIso())}.</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const PODRUCJE_GRUPE: Record<string, number> = { 'Učenici': 5, 'Roditelji': 8, 'Nastavnici': 4 };

function PrintPriprema({ p, postavke, datum }: { p: PripremaRadionice; postavke: Postavke; datum: string }) {
  const pod = PODRUCJA.find((x) => x.kod === (PODRUCJE_GRUPE[p.grupa ?? 'Učenici'] ?? 5));
  const ukupno = p.tok.reduce((s, e) => s + (e.minuta || 0), 0);
  const crta = '______________________';
  const ishodi = p.ishodi.map((x) => x.trim()).filter(Boolean);
  return (
    <Dokument javno naslov="PISANA PRIPREMA ZA RADIONICU" podnaslov={p.tema} nazivFajla={`Priprema_radionice_${p.datum || datum}`} postavke={postavke}>
      <table className="podaci-tab">
        <tbody>
          <Red o="Stručni saradnik" v={`Psiholog${postavke.imePsihologa ? ` ${postavke.imePsihologa}` : ''}`} />
          <Red o="Razred / odjeljenje" v={p.razred ? rimskiRazred(p.razred) : crta} />
          <Red o="Ciljna grupa" v={p.grupa ?? 'Učenici'} />
          <Red o="Datum realizacije" v={p.datum ? prikaz(p.datum) : crta} />
          <Red o="Trajanje" v={`${p.trajanje ?? ukupno} minuta`} />
          {pod && <Red o="Područje rada (Ped. standardi USK, čl. 13)" v={`${pod.kod}. ${pod.naziv}`} />}
        </tbody>
      </table>

      <h2>Cilj radionice</h2>
      <p>{p.cilj}</p>

      <h2>Zadaci</h2>
      <table className="podaci-tab">
        <tbody>
          <Red o="Obrazovni" v={<span className="tekst-celija">{p.zadaci.obrazovni}</span>} />
          <Red o="Odgojni" v={<span className="tekst-celija">{p.zadaci.odgojni}</span>} />
          <Red o="Funkcionalni" v={<span className="tekst-celija">{p.zadaci.funkcionalni}</span>} />
        </tbody>
      </table>

      {ishodi.length > 0 && (
        <>
          <h2>Očekivani ishodi</h2>
          <p style={{ marginBottom: 3 }}>Nakon radionice učenici će moći:</p>
          <ul className="letak-lista">{ishodi.map((x, i) => <li key={i}>{x.replace(/^Učeni(k\/ca|ci) će moći\s*/i, '')}</li>)}</ul>
        </>
      )}

      <table className="podaci-tab" style={{ marginTop: 8 }}>
        <tbody>
          <Red o="Oblici rada" v={p.obliciRada} />
          <Red o="Metode i tehnike" v={p.metode} />
          <Red o="Sredstva i materijal" v={p.sredstva} />
          {p.korelacija && <Red o="Korelacija" v={p.korelacija} />}
        </tbody>
      </table>

      <h2>Tok radionice</h2>
      <table className="lista-tab tok-tabela">
        <thead><tr><th style={{ width: '22%' }}>Etapa i vrijeme</th><th>Aktivnosti psihologa</th><th style={{ width: '32%' }}>Aktivnosti učenika</th></tr></thead>
        <tbody>
          {p.tok.map((e, i) => (
            <tr key={i}>
              <td><strong>{e.etapa}</strong>{e.minuta ? <><br />{e.minuta} min</> : null}</td>
              <td className="tekst-celija">{e.voditelj}</td>
              <td className="tekst-celija">{e.ucenici}</td>
            </tr>
          ))}
          {ukupno > 0 && <tr><td colSpan={3} style={{ textAlign: 'right' }}><strong>Ukupno: {ukupno} minuta</strong></td></tr>}
        </tbody>
      </table>

      <h2>Evaluacija</h2>
      <p className="tekst-celija">{p.evaluacija}</p>
      {p.literatura && <><h2>Literatura</h2><p className="tekst-celija">{p.literatura}</p></>}
      {p.napomena && <><h2>Napomena za voditelja</h2><p className="tekst-celija">{p.napomena}</p></>}

      <div className="blok refleksija">
        <h2>Zapažanja nakon realizacije (refleksija)</h2>
        <div className="crte">{Array.from({ length: 6 }, (_, i) => <div key={i} className="crta-red" />)}</div>
      </div>

      {p.listic && (
        <div className="listici">
          {[0, 1].map((k) => (
            <div key={k} className="listic">
              <div className="listic-naslov">Evaluacijski listić</div>
              <div className="listic-tema">Radionica: {p.tema}{p.datum ? ` · ${prikaz(p.datum)}` : ''}</div>
              <p className="listic-pitanje">Kako ti je bilo na radionici? Zaokruži:</p>
              <div className="listic-skala">{['Nije mi se svidjelo', 'Bilo je u redu', 'Svidjelo mi se', 'Odlično!'].map((x, i) => <span key={x}><b>{i + 1}</b>{x}</span>)}</div>
              <p className="listic-pitanje">Danas sam naučio/la:</p><div className="crte"><div className="crta-red" /><div className="crta-red" /></div>
              <p className="listic-pitanje">Najviše mi se svidjelo:</p><div className="crte"><div className="crta-red" /><div className="crta-red" /></div>
              <p className="listic-pitanje">Promijenio/la bih:</p><div className="crte"><div className="crta-red" /></div>
              <div className="listic-napomena">Listić je anoniman – ne piši svoje ime.</div>
            </div>
          ))}
        </div>
      )}
    </Dokument>
  );
}
