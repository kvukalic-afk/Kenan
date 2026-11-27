import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Dokument } from './Print';
import { prikaz } from '../lib/datum';
import { useRuta } from '../lib/router';
import { useImenik, usePostavke } from '../lib/podaci';
import {
  brojStavki, formatVrijednosti, instrument, NAZIV_INFORMANTA, obradiSociometriju, pragoviZa, type Informant, type Instrument, type Nivo,
} from '../lib/instrumenti';
import { sortirajRazred } from '../screens/Instrumenti';
import { punoIme, type Testiranje } from '../types';
import './print.css';

const KLASA_PRINT: Record<string, string> = { uredno: '', granicno: 'p-granicno', povisen: 'p-povisen', alarm: 'p-alarm', info: '' };

function Poruka({ children }: { children: string }) {
  return <p style={{ padding: 24 }}>{children}</p>;
}

function useOsoba(sifra: string) {
  const postavke = usePostavke();
  const { poSifri, razrednik } = useImenik();
  const u = sifra ? poSifri.get(sifra) : undefined;
  const imena = postavke.imenaUDokumentima !== false;
  return {
    postavke,
    imena,
    ime: u ? (imena ? punoIme(u) : '') : '',
    razred: u?.razred ?? '',
    razrednik: u?.razred ? razrednik.get(u.razred) ?? '' : '',
    imeZa: (s: string) => (imena && punoIme(poSifri.get(s))) || s,
  };
}

const fajl = (...d: string[]) => d.filter(Boolean).join('_').replace(/\s+/g, '_');

// ---------- Prazan obrazac / ključ / list za bodovanje ----------

export function PrintInstrument({ id }: { id: string }) {
  const ruta = useRuta();
  const ins = instrument(id);
  const sifra = ruta.upit.get('sifra') ?? '';
  const o = useOsoba(sifra);
  if (!ins) return <Poruka>Nepoznat instrument.</Poruka>;
  const inf = (ins.informanti.includes(ruta.upit.get('informant') as Informant) ? ruta.upit.get('informant') : ins.informanti[0]) as Informant;
  if (ruta.upit.get('kljuc') === '1') return <KljucBodovanja ins={ins} postavke={o.postavke} />;
  if (ins.nacin === 'u-appu') return <Upitnik ins={ins} inf={inf} o={o} sifra={sifra} />;
  if (ins.nacin === 'bodovanje') return <ListZaBodovanje ins={ins} inf={inf} o={o} sifra={sifra} />;
  if (ins.nacin === 'obrazac') return <DnevnikPracenja o={o} sifra={sifra} />;
  return <Poruka>Za ovaj instrument koristi službeni obrazac (link u opisu instrumenta).</Poruka>;
}

type Osoba = ReturnType<typeof useOsoba>;

function GlavaUpitnika({ o, inf, sifra }: { o: Osoba; inf: Informant; sifra: string }) {
  return (
    <table className="upitnik-glava">
      <tbody>
        <tr>
          <td style={{ width: '56%' }}>{inf === 'dijete' ? 'Ime i prezime' : 'Ime i prezime djeteta'}: <span className="upisano">{o.ime || (sifra && !o.imena ? sifra : '')}</span></td>
          <td>Razred: <span className="upisano">{o.razred}</span></td>
          <td>Datum: <span className="upisano" /></td>
        </tr>
        {inf === 'roditelj' && <tr><td colSpan={3}>Upitnik popunio/la (majka, otac, staratelj): <span className="upisano" /></td></tr>}
        {inf === 'nastavnik' && <tr><td colSpan={3}>Upitnik popunio/la (nastavnik, predmet): <span className="upisano" /></td></tr>}
      </tbody>
    </table>
  );
}

function Upitnik({ ins, inf, o, sifra }: { ins: Instrument; inf: Informant; o: Osoba; sifra: string }) {
  const stavke = ins.stavke?.[inf] ?? [];
  const opcije = ins.odgovori ?? [];
  const dodatna = ins.dodatna?.[inf] ?? [];
  return (
    <Dokument naslov={ins.naziv.toUpperCase()} podnaslov={`${ins.kratko}${ins.informanti.length > 1 ? ` · ${NAZIV_INFORMANTA[inf]}` : ''}`} javno bezPotpisa oznaka="Upitnik"
      nazivFajla={fajl(ins.kratko, inf, o.ime || sifra)} postavke={o.postavke}>
      <GlavaUpitnika o={o} inf={inf} sifra={sifra} />
      {ins.uputa?.[inf] && <p className="upitnik-uputa">{ins.uputa[inf]}</p>}
      <table className={`upitnik op-${opcije.length}`}>
        <thead>
          <tr>
            <th className="rb">#</th>
            <th className="tvrdnja">{ins.uvodStavki?.[inf] ?? ''}</th>
            {opcije.map((x) => <th key={x.v} className="odg">{x.t}</th>)}
          </tr>
        </thead>
        <tbody>
          {stavke.map((t, i) => (
            <tr key={i}>
              <td className="rb">{i + 1}</td>
              <td className="tvrdnja">{t}</td>
              {opcije.map((x) => <td key={x.v} className="odg"><span className="krug" /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {dodatna.map((d) => (
        <div key={d.id} className="upitnik-dodatno">
          <p>{d.tekst}</p>
          <div className="upitnik-opcije">{d.opcije.map((x) => <span key={x.v}><span className="kvadrat" /> {x.t}</span>)}</div>
        </div>
      ))}
      <p className="upitnik-hvala">{inf === 'dijete' ? 'Hvala ti!' : 'Hvala na saradnji!'}</p>
      <p className="upitnik-izvor">{ins.kratko} ({ins.izvorni}). {ins.izvor}</p>
    </Dokument>
  );
}

function KljucBodovanja({ ins, postavke }: { ins: Instrument; postavke: Osoba['postavke'] }) {
  const opcije = ins.odgovori ?? [];
  const sInf = ins.informanti.filter((inf) => ins.skale.some((s) => s.pragovi && !Array.isArray(s.pragovi) && s.pragovi[inf]));
  return (
    <Dokument naslov="KLJUČ ZA BODOVANJE" podnaslov={`${ins.kratko} – ${ins.naziv}`} nazivFajla={fajl('Kljuc', ins.kratko)} postavke={postavke}>
      <h2>Bodovi za odgovore</h2>
      <table className="tabela">
        <thead><tr><th>Odgovor</th><th className="n">Bodovi</th>{ins.obrnute?.length ? <th className="n">Obrnuto ({ins.obrnute.join(', ')})</th> : null}</tr></thead>
        <tbody>
          {opcije.map((x) => (
            <tr key={x.v}><td>{x.t}</td><td className="n">{x.v}</td>{ins.obrnute?.length ? <td className="n">{Math.min(...opcije.map((y) => y.v)) + Math.max(...opcije.map((y) => y.v)) - x.v}</td> : null}</tr>
          ))}
        </tbody>
      </table>
      <h2>Skale i granice</h2>
      <table className="tabela">
        <thead><tr><th style={{ width: '28%' }}>Skala</th><th style={{ width: '22%' }}>Pitanja</th><th>Tumačenje</th><th style={{ width: '13%' }}>Rezultat</th></tr></thead>
        <tbody>
          {ins.skale.map((s) => (
            <tr key={s.id}>
              <td>{s.naziv}{s.nacin === 'prosjek' ? ' (prosjek)' : ' (zbir)'}</td>
              <td>{s.stavke ? (s.stavke.length === brojStavki(ins) ? `sva (1–${brojStavki(ins)})` : s.stavke.join(', ')) : (s.izSkala ?? []).join(' + ')}</td>
              <td>{(sInf.length ? sInf : [ins.informanti[0]]).map((inf) => {
                const p = pragoviZa(s, inf).filter((x) => x.od > 0 || x.nivo !== 'uredno');
                if (!p.length) return <div key={inf}>bez utvrđene granice</div>;
                return <div key={inf}>{sInf.length > 1 && <em>{NAZIV_INFORMANTA[inf]}: </em>}{p.map((x) => `${x.od > 0 ? `≥ ${formatVrijednosti(x.od)}` : '0+'} ${x.opis}`).join('; ')}</div>;
              })}</td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
      {(ins.alarmStavke?.length || Object.values(ins.dodatna ?? {}).some((d) => d?.some((x) => x.alarmOd !== undefined))) ? (
        <div className="p-alarm-okvir">
          <strong>Hitno postupanje:</strong>
          {ins.alarmStavke?.map((a) => <div key={a.stavka}>Pitanje {a.stavka}, bilo koji odgovor osim „{opcije[0]?.t}“: {a.poruka}</div>)}
          {Object.values(ins.dodatna ?? {}).flatMap((d) => d ?? []).filter((d) => d.alarmOd !== undefined && d.nivo !== 'info').map((d) => <div key={d.id}>Dodatno pitanje „{d.tekst}“ – odgovor „Da“.</div>)}
        </div>
      ) : null}
      <h2>Kako tumačiti</h2>
      <ul className="p-lista">{ins.tumacenje.map((t) => <li key={t}>{t}</li>)}</ul>
      {ins.prevod && <p className="malo-print">{ins.prevod}</p>}
      <p className="malo-print">Izvor: {ins.izvor} Licenca: {ins.licenca}</p>
    </Dokument>
  );
}

function ListZaBodovanje({ ins, inf, o, sifra }: { ins: Instrument; inf: Informant; o: Osoba; sifra: string }) {
  const n = brojStavki(ins);
  const redovi: number[][] = [];
  for (let i = 1; i <= n; i += 10) redovi.push(Array.from({ length: Math.min(10, n - i + 1) }, (_, k) => i + k));
  return (
    <Dokument naslov="LIST ZA BODOVANJE" podnaslov={`${ins.kratko} – ${ins.naziv}`} nazivFajla={fajl('Bodovanje', ins.kratko, o.ime || sifra)} postavke={o.postavke}>
      <table className="podaci-tab">
        <tbody>
          <tr><th>Učenik</th><td>{o.ime}{sifra ? ` (${sifra})` : ''}</td></tr>
          <tr><th>Razred / datum</th><td>{o.razred}</td></tr>
          <tr><th>Obrazac popunio</th><td>{ins.informanti.map((i) => NAZIV_INFORMANTA[i]).join(' / ')}</td></tr>
        </tbody>
      </table>
      <p>Prepiši odgovore sa službenog obrasca: {(ins.odgovori ?? []).map((x) => `${x.v} = ${x.t}`).join('; ')}. Zatim saberi po skalama ili ih upiši u app (Instrumenti → {ins.kratko} → Unesi bodove → brzi unos).</p>
      <table className="bod-mreza">
        <tbody>
          {redovi.map((r) => (
            <tr key={r[0]}>{r.map((b) => <td key={b}><span className="bod-br">{b}</span><span className="bod-polje" /></td>)}</tr>
          ))}
        </tbody>
      </table>
      <h2>Skale</h2>
      <table className="tabela">
        <thead><tr><th style={{ width: '28%' }}>Skala</th><th>Pitanja</th><th style={{ width: '14%' }}>{ins.skale.some((s) => s.nacin === 'prosjek') ? 'Zbir / prosjek' : 'Zbir'}</th><th style={{ width: '24%' }}>Granica</th></tr></thead>
        <tbody>
          {ins.skale.map((s) => (
            <tr key={s.id}>
              <td>{s.naziv}</td>
              <td>{s.stavke && s.stavke.length === n ? `sva (1–${n})` : (s.stavke ?? []).join(', ')}</td>
              <td />
              <td>{ins.informanti.map((i) => {
                const p = pragoviZa(s, i).filter((x) => x.od > 0);
                return p.length ? <div key={i}>{ins.informanti.length > 1 && <em>{i === 'dijete' ? 'učenik' : i}: </em>}≥ {p.map((x) => formatVrijednosti(x.od)).join(' / ')}</div> : null;
              })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Kako tumačiti</h2>
      <ul className="p-lista">{ins.tumacenje.map((t) => <li key={t}>{t}</li>)}</ul>
      <p className="malo-print">Popunio: {NAZIV_INFORMANTA[inf]} · Izvor: {ins.izvor}</p>
    </Dokument>
  );
}

function DnevnikPracenja({ o, sifra }: { o: Osoba; sifra: string }) {
  return (
    <Dokument naslov="DNEVNIK PRAĆENJA" podnaslov="tegobe i ponašanje u školi (2 sedmice)" javno bezPotpisa oznaka="Dnevnik praćenja"
      nazivFajla={fajl('Dnevnik_pracenja', o.ime || sifra)} postavke={o.postavke}>
      <table className="upitnik-glava">
        <tbody>
          <tr>
            <td style={{ width: '50%' }}>Učenik: <span className="upisano">{o.ime || (sifra && !o.imena ? sifra : '')}</span></td>
            <td>Razred: <span className="upisano">{o.razred}</span></td>
            <td>Period: <span className="upisano" /></td>
          </tr>
          <tr><td colSpan={3}>Popunjava (učitelj/ica, razrednik, roditelj): <span className="upisano" /></td></tr>
        </tbody>
      </table>
      <p className="upitnik-uputa">Upišite svaki put kad se tegoba ili ponašanje javi. Dovoljna je kratka rečenica. Cilj je da vidimo <strong>kada i nakon čega</strong> se javlja i <strong>šta pomaže</strong>. Jačina: 0 = nimalo, 10 = najjače.</p>
      <table className="abc-tabela">
        <thead>
          <tr>
            <th style={{ width: '12%' }}>Datum, čas</th>
            <th style={{ width: '13%' }}>Predmet / mjesto</th>
            <th>Šta se desilo neposredno prije?</th>
            <th>Šta se desilo? (tegoba, ponašanje, riječi)</th>
            <th style={{ width: '8%' }}>Jačina 0–10</th>
            <th>Šta je uslijedilo? Šta je pomoglo?</th>
            <th style={{ width: '7%' }}>Kući? D/N</th>
          </tr>
        </thead>
        <tbody>{Array.from({ length: 10 }, (_, i) => <tr key={i}>{Array.from({ length: 7 }, (_, k) => <td key={k} />)}</tr>)}</tbody>
      </table>
      <p style={{ marginTop: 10 }}><strong>Šta ste primijetili (obrasci, dani, predmeti, šta pomaže):</strong></p>
      <div className="crte-print">{Array.from({ length: 3 }, (_, i) => <div key={i} />)}</div>
      <p className="upitnik-hvala">Hvala! Dnevnik vratite školskom psihologu nakon dvije sedmice.</p>
    </Dokument>
  );
}

// ---------- Sociometrija: listići ----------

export function PrintSociometrijaUpitnik({ razred }: { razred: string }) {
  const ruta = useRuta();
  const postavke = usePostavke();
  const { ucenici, razrednik } = useImenik();
  const kriterij = ruta.upit.get('kriterij') || 'S kim bi najradije radio/la zajednički zadatak?';
  const broj = Number(ruta.upit.get('broj')) || 3;
  const djeca = sortirajRazred(ucenici, razred);
  const imena = postavke.imenaUDokumentima !== false;
  const listici = djeca.length ? djeca.map((u) => (imena ? punoIme(u) : '') || '') : Array.from({ length: 3 }, () => '');
  return (
    <Dokument naslov={`SOCIOMETRIJSKI UPITNIK – RAZRED ${razred}`} podnaslov={`${razrednik.get(razred) ? `Razrednik: ${razrednik.get(razred)} · ` : ''}listići za rezanje, po jedan za svakog učenika`}
      javno bezPotpisa oznaka="Upitnik" nazivFajla={fajl('Sociometrija_listici', razred)} postavke={postavke}>
      <div className="socio-listici">
        {listici.map((ime, i) => (
          <div key={i} className="socio-listic">
            <div className="socio-listic-vrh"><span>{postavke.nazivSkole}</span><span>Razred {razred}</span></div>
            <div className="socio-listic-ime">Ime i prezime: <span className="upisano">{ime}</span></div>
            <p className="socio-listic-pitanje">{kriterij}</p>
            <p className="socio-listic-uputa">Napiši ime i prezime najviše {broj} {broj > 4 ? 'učenika' : 'učenika'} iz svog razreda. Prvo onoga koga bi najradije izabrao/la.</p>
            {Array.from({ length: broj }, (_, k) => <div key={k} className="socio-listic-crta">{k + 1}.</div>)}
            <p className="socio-listic-tajno">Tvoji odgovori su povjerljivi. Vidjeće ih samo školski psiholog.</p>
          </div>
        ))}
      </div>
    </Dokument>
  );
}

// ---------- Rezultat primjene ----------

export function PrintTestiranje({ id }: { id: string }) {
  const t = useLiveQuery(() => db.testiranja.get(id), [id], null as Testiranje | null | undefined);
  if (t === null) return <Poruka>Učitavam…</Poruka>;
  if (!t) return <Poruka>Rezultat ne postoji.</Poruka>;
  if (t.instrument === 'sociometrija') return <RezultatSociometrije t={t} />;
  return <RezultatInstrumenta t={t} />;
}

function RezultatInstrumenta({ t }: { t: Testiranje }) {
  const o = useOsoba(t.sifra);
  const ins = instrument(t.instrument);
  if (!ins) return <Poruka>Nepoznat instrument.</Poruka>;
  const inf = t.informant as Informant;
  const stavke = ins.stavke?.[inf] ?? [];
  const n = brojStavki(ins);
  const opcija = (v: number | undefined, opc = ins.odgovori ?? []) => (v === undefined ? '–' : opc.find((x) => x.v === v)?.t ?? String(v));
  return (
    <Dokument naslov="REZULTAT PRIMJENE INSTRUMENTA" podnaslov={`${ins.kratko} – ${ins.naziv}`} nazivFajla={fajl(ins.kratko, o.ime, t.sifra, t.datum)} postavke={o.postavke}>
      <table className="podaci-tab">
        <tbody>
          {o.imena && <tr><th>Ime i prezime učenika</th><td><strong>{o.ime}</strong></td></tr>}
          <tr><th>Šifra učenika</th><td>{t.sifra}</td></tr>
          <tr><th>Razred</th><td>{t.razred}</td></tr>
          {o.razrednik && <tr><th>Razrednik</th><td>{o.razrednik}</td></tr>}
          <tr><th>Datum primjene</th><td>{prikaz(t.datum)}</td></tr>
          <tr><th>Popunio</th><td>{NAZIV_INFORMANTA[inf] ?? t.informant}</td></tr>
          <tr><th>Instrument</th><td>{ins.izvorni} ({ins.kratko})</td></tr>
        </tbody>
      </table>
      {t.upozorenja.length > 0 && <div className="p-alarm-okvir">{t.upozorenja.map((u) => <div key={u}>⚠ {u}</div>)}</div>}
      <h2>Rezultati</h2>
      <table className="tabela">
        <thead><tr><th>Skala</th><th className="n" style={{ width: '14%' }}>Rezultat</th><th style={{ width: '46%' }}>Tumačenje</th></tr></thead>
        <tbody>
          {t.rezultat.map((r) => (
            <tr key={r.id} className={r.id === 'uk' ? 'zbir' : ''}>
              <td>{r.naziv}</td>
              <td className="n">{formatVrijednosti(r.vrijednost)}</td>
              <td className={KLASA_PRINT[r.nivo as Nivo] ?? ''}>{r.opis}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ins.nacin !== 'skale' && Object.keys(t.odgovori).length > 0 && (
        <>
          <h2>Odgovori</h2>
          {ins.nacin === 'u-appu' ? (
            <table className="lista-tab odg-tab">
              <tbody>
                {stavke.map((s, i) => <tr key={i}><td className="n" style={{ width: '6%' }}>{i + 1}</td><td>{s}</td><td style={{ width: '24%' }}>{opcija(t.odgovori[String(i + 1)])}</td></tr>)}
                {(ins.dodatna?.[inf] ?? []).map((d) => <tr key={d.id}><td className="n">•</td><td>{d.tekst}</td><td>{opcija(t.odgovori[`d:${d.id}`], d.opcije)}</td></tr>)}
              </tbody>
            </table>
          ) : (
            <p className="odg-niz">{Array.from({ length: n }, (_, i) => `${i + 1}: ${t.odgovori[String(i + 1)] ?? '–'}`).join('   ')}</p>
          )}
        </>
      )}
      {t.napomena && <div className="blok"><h2>Zapažanja tokom primjene</h2><div className="sadrzaj-bloka" style={{ minHeight: 0 }}>{t.napomena}</div></div>}
      <h2>Napomena o tumačenju</h2>
      <ul className="p-lista">
        {ins.tumacenje.map((x) => <li key={x}>{x}</li>)}
        <li>Instrument je skrining, a ne dijagnostičko sredstvo. Rezultat se tumači zajedno s razgovorom, opservacijom i podacima roditelja i nastavnika. {ins.prevod ? 'Korišten je radni prevod bez normi za BiH.' : ''}</li>
      </ul>
      <p className="malo-print">Izvor: {ins.izvor}</p>
    </Dokument>
  );
}

function RezultatSociometrije({ t }: { t: Testiranje }) {
  const o = useOsoba('');
  const { ucenici, razrednik } = useImenik();
  const djeca = sortirajRazred(ucenici, t.razred);
  // i učenici koji su u međuvremenu ispisani, a bili su u ispitivanju
  const sifre = [...djeca.map((u) => u.sifra), ...Object.keys(t.izbori ?? {}).filter((s) => !djeca.some((u) => u.sifra === s))];
  const rez = obradiSociometriju(sifre, t.izbori ?? {}, t.odsutni ?? []);
  const ime = (s: string) => o.imeZa(s);
  const izbori = t.izbori ?? {};
  return (
    <Dokument naslov="SOCIOMETRIJSKO ISPITIVANJE" podnaslov={`Razred ${t.razred} · ${prikaz(t.datum)}`} nazivFajla={fajl('Sociometrija', t.razred, t.datum)} postavke={o.postavke}>
      <table className="podaci-tab">
        <tbody>
          {razrednik.get(t.razred) && <tr><th>Razrednik</th><td>{razrednik.get(t.razred)}</td></tr>}
          <tr><th>Kriterij</th><td>{t.kriterij}</td></tr>
          <tr><th>Broj izbora po učeniku</th><td>{t.brojIzbora ?? 3}</td></tr>
          <tr><th>Učenika / odsutnih</th><td>{sifre.length} / {(t.odsutni ?? []).length}</td></tr>
          <tr><th>Uzajamnih parova</th><td>{rez.parovi.length} ({Math.round(rez.udioUzajamnih * 100)} % svih izbora je uzajamno)</td></tr>
        </tbody>
      </table>
      <h2>Učenici kojima treba pažnja</h2>
      <ul className="p-lista">
        <li><strong>Bez ijednog izbora:</strong> {rez.bezIzbora.length ? rez.bezIzbora.map(ime).join(', ') : 'nema'}</li>
        <li><strong>Bez uzajamnog izbora:</strong> {rez.bezUzajamnog.filter((s) => !rez.bezIzbora.includes(s)).map(ime).join(', ') || 'nema'}</li>
        <li><strong>Najbiraniji:</strong> {rez.najbiraniji.map(ime).join(', ') || '–'}</li>
      </ul>
      <h2>Pregled po učenicima</h2>
      <table className="tabela socio-pregled">
        <thead><tr><th className="n" style={{ width: '6%' }}>Rb</th><th>Učenik</th><th className="n" style={{ width: '11%' }}>Primio</th><th className="n" style={{ width: '11%' }}>Uzajamni</th><th style={{ width: '34%' }}>Status</th></tr></thead>
        <tbody>
          {[...rez.redovi].sort((a, b) => b.primio - a.primio).map((r, i) => (
            <tr key={r.sifra}><td className="n">{i + 1}</td><td>{ime(r.sifra)}</td><td className="n">{r.primio}</td><td className="n">{r.uzajamni}</td><td className={KLASA_PRINT[r.nivo]}>{r.odsutan && r.primio === 0 ? 'odsutan/na' : r.status}</td></tr>
          ))}
        </tbody>
      </table>
      {rez.parovi.length > 0 && <p><strong>Uzajamni izbori:</strong> {rez.parovi.map(([a, b]) => `${ime(a)} ↔ ${ime(b)}`).join('; ')}</p>}
      <h2 style={{ breakBefore: 'page' }}>Sociometrijska matrica</h2>
      <p className="malo-print">Red = ko bira, kolona = koga bira (broj = redoslijed izbora). „Primio“ = koliko puta je učenik izabran.</p>
      <table className="socio-matrica">
        <thead><tr><th className="ime">Učenik</th>{sifre.map((_, j) => <th key={j}>{j + 1}</th>)}<th>Dao</th></tr></thead>
        <tbody>
          {sifre.map((s, i) => (
            <tr key={s}>
              <th className="ime">{i + 1}. {ime(s)}</th>
              {sifre.map((x, j) => {
                const k = (izbori[s] ?? []).indexOf(x);
                const uzaj = k >= 0 && (izbori[x] ?? []).includes(s);
                return <td key={j} className={i === j ? 'dijag' : uzaj ? 'uzaj' : ''}>{k >= 0 ? k + 1 : ''}</td>;
              })}
              <td className="zbir">{(t.odsutni ?? []).includes(s) ? '–' : (izbori[s] ?? []).filter((x) => sifre.includes(x) && x !== s).length}</td>
            </tr>
          ))}
          <tr className="primio"><th className="ime">Primio</th>{sifre.map((s) => <td key={s}>{rez.redovi.find((r) => r.sifra === s)?.primio ?? 0}</td>)}<td /></tr>
        </tbody>
      </table>
      <p className="malo-print">Osjenčena polja su uzajamni izbori.</p>
      {t.napomena && <div className="blok"><h2>Zapažanja i plan</h2><div className="sadrzaj-bloka" style={{ minHeight: 0 }}>{t.napomena}</div></div>}
      <p className="malo-print">Rezultati sociometrije su povjerljivi i ne saopštavaju se učenicima. Koriste se za plan rada razrednika i psihologa (uključivanje, rad u grupama, praćenje).</p>
    </Dokument>
  );
}
