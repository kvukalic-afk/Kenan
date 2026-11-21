import { useEffect, useState } from 'react';
import { KATEGORIJE } from '../db/defaults';
import { dodajStavku, izmijeniStavku, obrisiSvePodatke, sacuvajPostavke } from '../db/repo';
import { izveziKopiju, NijeKopija, primijeniPlan, procitajKopiju } from '../db/kopija';
import { Ikona } from '../components/Ikona';
import { Modal, Polje, Potvrda, Prekidac } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { NAZIVI_TABELA, TABELE_KOPIJE, type PlanUvoza } from '../lib/backup';
import { nazivSkolskeGodine, prikazVremena, skolskaGodinaZaDatum } from '../lib/datum';
import { hashirajPin, jeIspravanPin, PogresnaLozinka, provjeriPin } from '../lib/kripto';
import { snimakBaze, usePostavke, useSifrarnik } from '../lib/podaci';
import { AI_MODEL, sacuvajKljuc, sroci, ucitajKljuc } from '../lib/ai';
import { napraviExcel, nazivExcelFajla } from '../lib/excel';
import { preuzmi } from '../lib/preuzimanje';
import type { Kategorija } from '../types';

export function Postavke({ otvoriKopiju }: { otvoriKopiju?: boolean }) {
  const toast = useToast();
  const postavke = usePostavke();
  const [skola, setSkola] = useState(postavke.nazivSkole);
  const [ime, setIme] = useState(postavke.imePsihologa);
  const [pin, setPin] = useState<'postavi' | 'iskljuci' | null>(null);
  const [kopija, setKopija] = useState(!!otvoriKopiju);
  const [uvoz, setUvoz] = useState(false);
  const [brisanje, setBrisanje] = useState(false);

  useEffect(() => { setSkola(postavke.nazivSkole); setIme(postavke.imePsihologa); }, [postavke.nazivSkole, postavke.imePsihologa]);

  const sacuvajOsnovno = async (izmjene: Parameters<typeof sacuvajPostavke>[0]) => {
    await sacuvajPostavke(izmjene);
    toast('Sačuvano ✓');
  };

  const tekuca = skolskaGodinaZaDatum(new Date());
  const godine = [...new Set([tekuca + 1, tekuca, tekuca - 1, tekuca - 2, postavke.skolskaGodinaPocetak])].sort((a, b) => b - a);

  return (
    <>
      <Zaglavlje naslov="Postavke" nazadNa="/" />
      <main className="sadrzaj">
        <section className="kartica">
          <h2>Škola i psiholog</h2>
          <Polje labela="Naziv škole" id="p-skola">
            <input id="p-skola" type="text" value={skola} onChange={(e) => setSkola(e.target.value)} onBlur={() => skola !== postavke.nazivSkole && sacuvajOsnovno({ nazivSkole: skola.trim() })} />
          </Polje>
          <Polje labela="Ime psihologa (za potpis na dokumentima)" id="p-ime">
            <input id="p-ime" type="text" value={ime} onChange={(e) => setIme(e.target.value)} onBlur={() => ime !== postavke.imePsihologa && sacuvajOsnovno({ imePsihologa: ime.trim() })} />
          </Polje>
          <Polje labela="Školska godina" id="p-godina" pomoc="Zadana godina u statistici i izvještajima.">
            <select id="p-godina" value={postavke.skolskaGodinaPocetak} onChange={(e) => sacuvajOsnovno({ skolskaGodinaPocetak: Number(e.target.value) })}>
              {godine.map((g) => <option key={g} value={g}>{nazivSkolskeGodine(g)}</option>)}
            </select>
          </Polje>
        </section>

        <section className="kartica">
          <h2>Imena učenika</h2>
          <Prekidac labela="Imena učenika u dokumentima za print i u Excelu" vrijednost={postavke.imenaUDokumentima !== false}
            onChange={(v) => sacuvajOsnovno({ imenaUDokumentima: v })} />
          <p className="malo blijedo">U appu se imena uvijek vide. Isključi ovo ako dokument ili Excel daješ nekome kome ime učenika ne treba – tada stoji samo šifra.</p>
        </section>

        <AIPostavke />

        <section className="kartica">
          <h2>PIN za otključavanje</h2>
          <p className="malo blijedo">
            {postavke.pinHash ? 'PIN je uključen. App se zaključava pri otvaranju i nakon 5 minuta neaktivnosti.' : 'PIN je isključen. Preporuka: uključi PIN (4–6 cifara).'}
          </p>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={() => setPin('postavi')}><Ikona ime="brava" /> {postavke.pinHash ? 'Promijeni PIN' : 'Uključi PIN'}</button>
            {postavke.pinHash && <button type="button" className="dugme" onClick={() => setPin('iskljuci')}>Isključi PIN</button>}
          </div>
        </section>

        <section className="kartica">
          <h2>Rezervna kopija</h2>
          <p className="malo">
            Kopija je jedan <strong>.json</strong> fajl šifrovan tvojom lozinkom (AES-GCM). Služi za čuvanje i prenos na drugi uređaj (npr. mobitel → računar).
            Uvoz spaja podatke bez duplikata.
          </p>
          <p className="malo blijedo">Zadnja kopija: {postavke.zadnjaKopija ? prikazVremena(postavke.zadnjaKopija) : 'još nije napravljena'}</p>
          <div className="red-dugmadi">
            <button type="button" className="dugme primarno" onClick={() => setKopija(true)}><Ikona ime="preuzmi" /> Izvezi rezervnu kopiju</button>
            <button type="button" className="dugme" onClick={() => setUvoz(true)}><Ikona ime="posalji" /> Uvezi rezervnu kopiju</button>
          </div>
          <div className="red-dugmadi" style={{ marginTop: 8 }}>
            <button type="button" className="dugme" onClick={async () => {
              const data = await napraviExcel(await snimakBaze(), postavke.skolskaGodinaPocetak, postavke.imenaUDokumentima !== false);
              preuzmi(data as BlobPart, nazivExcelFajla(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
              toast('Excel fajl je preuzet ✓');
            }}><Ikona ime="excel" /> Izvezi sve u Excel</button>
          </div>
        </section>

        <section>
          <div className="naslov-sekcije"><h2>Šifrarnik</h2></div>
          <p className="malo blijedo">Dodaj, preimenuj ili sakrij stavke. Stari zapisi zadržavaju vrijednost koju su imali.</p>
          {KATEGORIJE.map((k) => <UrediKategoriju key={k.kljuc} kategorija={k.kljuc} naziv={k.naziv} />)}
        </section>

        <section className="kartica" style={{ marginTop: 16 }}>
          <h2>O aplikaciji</h2>
          <p className="malo">
            Svi podaci, uključujući imena učenika, su samo na ovom uređaju (IndexedDB u pregledniku). Nema servera, računa ni praćenja.
            Podaci napuštaju uređaj samo kad ih izvezeš (šifrovana kopija, Excel, print).
          </p>
          <p className="malo"><strong>Verzija appa:</strong> {__VERZIJA__}</p>
          <p className="malo blijedo">PIN zaključava ekran aplikacije. Za punu zaštitu drži telefon i računar zaključanim i čuvaj šifrovanu kopiju.</p>
          <button type="button" className="dugme opasno" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /> Obriši sve podatke</button>
        </section>
      </main>

      {pin && <PinDijalog rezim={pin} sacuvanHash={postavke.pinHash} onZatvori={() => setPin(null)} />}
      {kopija && <IzvozKopije onZatvori={() => setKopija(false)} />}
      {uvoz && <UvozKopije onZatvori={() => setUvoz(false)} />}
      {brisanje && <BrisanjeSvega onZatvori={() => setBrisanje(false)} />}
    </>
  );
}

function UrediKategoriju({ kategorija, naziv }: { kategorija: Kategorija; naziv: string }) {
  const toast = useToast();
  const sve = useSifrarnik();
  const stavke = sve.filter((s) => s.kategorija === kategorija).sort((a, b) => a.redoslijed - b.redoslijed);
  const [nova, setNova] = useState('');
  const [nazivi, setNazivi] = useState<Record<string, string>>({});

  const dodaj = async () => {
    const n = nova.trim();
    if (!n) return;
    if (stavke.some((s) => s.naziv.toLowerCase() === n.toLowerCase())) return toast('Ta stavka već postoji', 'greska');
    await dodajStavku(kategorija, n);
    setNova('');
    toast('Dodano ✓');
  };

  const pomjeri = async (i: number, smjer: -1 | 1) => {
    const j = i + smjer;
    if (j < 0 || j >= stavke.length) return;
    await izmijeniStavku(stavke[i].id, { redoslijed: stavke[j].redoslijed });
    await izmijeniStavku(stavke[j].id, { redoslijed: stavke[i].redoslijed });
  };

  return (
    <details className="sekcija">
      <summary>{naziv} <span className="blijedo malo">({stavke.filter((s) => !s.sakriveno).length})</span></summary>
      <div className="unutra">
        {stavke.map((s, i) => (
          <div key={s.id} className={`stavka-sifrarnika ${s.sakriveno ? 'sakriveno' : ''}`}>
            <input type="text" aria-label={`Naziv stavke ${s.naziv}`} value={nazivi[s.id] ?? s.naziv}
              onChange={(e) => setNazivi({ ...nazivi, [s.id]: e.target.value })}
              onBlur={async () => {
                const v = (nazivi[s.id] ?? s.naziv).trim();
                if (v && v !== s.naziv) { await izmijeniStavku(s.id, { naziv: v }); toast('Preimenovano ✓'); }
                setNazivi((x) => { const c = { ...x }; delete c[s.id]; return c; });
              }} />
            <button type="button" className="ikona-dugme" aria-label="Pomjeri gore" onClick={() => pomjeri(i, -1)} disabled={i === 0}>↑</button>
            <button type="button" className="ikona-dugme" aria-label="Pomjeri dolje" onClick={() => pomjeri(i, 1)} disabled={i === stavke.length - 1}>↓</button>
            <button type="button" className="dugme tiho" onClick={() => izmijeniStavku(s.id, { sakriveno: !s.sakriveno })} style={{ minWidth: 84 }}>
              {s.sakriveno ? 'Prikaži' : 'Sakrij'}
            </button>
          </div>
        ))}
        <form className="razdvoji" style={{ marginTop: 10 }} onSubmit={(e) => { e.preventDefault(); void dodaj(); }}>
          <input type="text" className="rastegni" placeholder="Nova stavka…" value={nova} onChange={(e) => setNova(e.target.value)} aria-label={`Nova stavka: ${naziv}`} style={{ flex: 1 }} />
          <button type="submit" className="dugme" disabled={!nova.trim()}>Dodaj</button>
        </form>
      </div>
    </details>
  );
}

function PinDijalog({ rezim, sacuvanHash, onZatvori }: { rezim: 'postavi' | 'iskljuci'; sacuvanHash: string; onZatvori: () => void }) {
  const toast = useToast();
  const [stari, setStari] = useState('');
  const [novi, setNovi] = useState('');
  const [ponovo, setPonovo] = useState('');
  const [greska, setGreska] = useState('');

  const potvrdi = async () => {
    if (sacuvanHash && !(await provjeriPin(stari, sacuvanHash))) return setGreska('Trenutni PIN nije tačan.');
    if (rezim === 'iskljuci') {
      await sacuvajPostavke({ pinHash: '' }, false);
      toast('PIN je isključen');
      return onZatvori();
    }
    if (!jeIspravanPin(novi)) return setGreska('PIN mora imati 4 do 6 cifara.');
    if (novi !== ponovo) return setGreska('PIN-ovi se ne poklapaju.');
    await sacuvajPostavke({ pinHash: await hashirajPin(novi) }, false);
    toast('PIN je sačuvan ✓');
    onZatvori();
  };

  const pinInput = (id: string, labela: string, v: string, set: (s: string) => void) => (
    <Polje labela={labela} id={id}>
      <input id={id} type="password" inputMode="numeric" autoComplete="off" pattern="\d*" maxLength={6} value={v}
        onChange={(e) => { set(e.target.value.replace(/\D/g, '').slice(0, 6)); setGreska(''); }} />
    </Polje>
  );

  return (
    <Modal naslov={rezim === 'iskljuci' ? 'Isključi PIN' : sacuvanHash ? 'Promijeni PIN' : 'Uključi PIN'} onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void potvrdi(); }}>
        {sacuvanHash && pinInput('pin-stari', 'Trenutni PIN', stari, setStari)}
        {rezim === 'postavi' && (
          <>
            {pinInput('pin-novi', 'Novi PIN (4–6 cifara)', novi, setNovi)}
            {pinInput('pin-ponovo', 'Ponovi novi PIN', ponovo, setPonovo)}
            <p className="malo blijedo">Zaboravljen PIN se ne može vratiti – tada ostaje samo brisanje podataka i vraćanje iz rezervne kopije.</p>
          </>
        )}
        {greska && <p className="greska-tekst" role="alert" style={{ color: 'var(--crvena)', fontWeight: 600 }}>{greska}</p>}
        <div className="red-dugmadi">
          <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
          <button type="submit" className="dugme primarno">{rezim === 'iskljuci' ? 'Isključi' : 'Sačuvaj'}</button>
        </div>
      </form>
    </Modal>
  );
}

function IzvozKopije({ onZatvori }: { onZatvori: () => void }) {
  const toast = useToast();
  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [greska, setGreska] = useState('');
  const [radi, setRadi] = useState(false);

  const izvezi = async () => {
    if (l1.length < 6) return setGreska('Lozinka mora imati najmanje 6 znakova.');
    if (l1 !== l2) return setGreska('Lozinke se ne poklapaju.');
    setRadi(true);
    try {
      await izveziKopiju(l1);
      toast('Rezervna kopija je preuzeta ✓');
      onZatvori();
    } catch (e) {
      setGreska('Izvoz nije uspio: ' + (e as Error).message);
    } finally {
      setRadi(false);
    }
  };

  return (
    <Modal naslov="Izvezi rezervnu kopiju" onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void izvezi(); }}>
        <p className="malo">Izaberi lozinku za kopiju. <strong>Bez nje se kopija ne može otvoriti</strong> – zapiši je na sigurno mjesto.</p>
        <Polje labela="Lozinka" id="k-l1">
          <input id="k-l1" type="password" autoComplete="new-password" value={l1} onChange={(e) => { setL1(e.target.value); setGreska(''); }} />
        </Polje>
        <Polje labela="Ponovi lozinku" id="k-l2" greska={greska}>
          <input id="k-l2" type="password" autoComplete="new-password" value={l2} onChange={(e) => { setL2(e.target.value); setGreska(''); }} />
        </Polje>
        <p className="malo blijedo">Fajl spremi npr. na USB ili u svoj oblak – sadržaj je šifrovan. Kopija ne sadrži PIN.</p>
        <div className="red-dugmadi">
          <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
          <button type="submit" className="dugme primarno" disabled={radi}>{radi ? 'Šifrujem…' : 'Izvezi'}</button>
        </div>
      </form>
    </Modal>
  );
}

function UvozKopije({ onZatvori }: { onZatvori: () => void }) {
  const toast = useToast();
  const [fajl, setFajl] = useState<File | null>(null);
  const [lozinka, setLozinka] = useState('');
  const [greska, setGreska] = useState('');
  const [plan, setPlan] = useState<PlanUvoza | null>(null);
  const [radi, setRadi] = useState(false);

  const procitaj = async () => {
    if (!fajl) return setGreska('Izaberi fajl kopije.');
    setRadi(true);
    try {
      const { plan } = await procitajKopiju(await fajl.text(), lozinka);
      setPlan(plan);
      setGreska('');
    } catch (e) {
      setGreska(e instanceof PogresnaLozinka ? 'Pogrešna lozinka ili oštećen fajl.' : e instanceof NijeKopija ? e.message : 'Greška: ' + (e as Error).message);
    } finally {
      setRadi(false);
    }
  };

  const primijeni = async () => {
    if (!plan) return;
    setRadi(true);
    try {
      await primijeniPlan(plan);
      toast(`Uvezeno ✓ (${plan.broj.dodati} dodano, ${plan.broj.azurirati} ažurirano)`);
      onZatvori();
    } catch (e) {
      setGreska('Uvoz nije uspio: ' + (e as Error).message);
    } finally {
      setRadi(false);
    }
  };

  return (
    <Modal naslov="Uvezi rezervnu kopiju" onZatvori={onZatvori}>
      {!plan ? (
        <form onSubmit={(e) => { e.preventDefault(); void procitaj(); }}>
          <Polje labela="Fajl kopije (.json)" id="u-fajl">
            <input id="u-fajl" type="file" accept=".json,application/json" onChange={(e) => { setFajl(e.target.files?.[0] ?? null); setGreska(''); }} />
          </Polje>
          <Polje labela="Lozinka kopije" id="u-loz" greska={greska}>
            <input id="u-loz" type="password" autoComplete="off" value={lozinka} onChange={(e) => { setLozinka(e.target.value); setGreska(''); }} />
          </Polje>
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
            <button type="submit" className="dugme primarno" disabled={radi || !fajl}>{radi ? 'Čitam…' : 'Dalje'}</button>
          </div>
        </form>
      ) : (
        <>
          <p>Prije uvoza – šta će se promijeniti na ovom uređaju:</p>
          <div className="tabela-omot">
            <table className="tabela">
              <thead><tr><th></th><th className="n">Dodati</th><th className="n">Ažurirati</th><th className="n">Obrisati</th></tr></thead>
              <tbody>
                {TABELE_KOPIJE.map((t) => (
                  <tr key={t}><td>{NAZIVI_TABELA[t]}</td><td className="n">{plan.dodati[t].length}</td><td className="n">{plan.azurirati[t].length}</td><td className="n">{plan.obrisati[t].length}</td></tr>
                ))}
                <tr className="zbir"><td>Ukupno</td><td className="n">{plan.broj.dodati}</td><td className="n">{plan.broj.azurirati}</td><td className="n">{plan.broj.obrisati}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="malo blijedo" style={{ marginTop: 8 }}>Zapisi koji već postoje i nisu mijenjani se preskaču – nema duplikata.{plan.postavke ? ' Postavke (naziv škole, ime) će biti preuzete iz kopije.' : ''}</p>
          {greska && <p style={{ color: 'var(--crvena)', fontWeight: 600 }}>{greska}</p>}
          <div className="red-dugmadi">
            <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
            <button type="button" className="dugme primarno" disabled={radi || (!plan.broj.dodati && !plan.broj.azurirati && !plan.broj.obrisati && !plan.postavke)} onClick={() => void primijeni()}>
              {plan.broj.dodati + plan.broj.azurirati + plan.broj.obrisati === 0 && !plan.postavke ? 'Nema promjena' : 'Uvezi'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export function BrisanjeSvega({ onZatvori }: { onZatvori: () => void }) {
  const [korak, setKorak] = useState<1 | 2>(1);
  const [rijec, setRijec] = useState('');
  if (korak === 1) {
    return (
      <Potvrda naslov="Obrisati sve podatke?" opasno potvrdi="Da, nastavi"
        tekst={<p>Biće obrisani <strong>svi učenici, razgovori, radionice, saradnja i postavke</strong> s ovog uređaja. Ako nemaš rezervnu kopiju, podaci su zauvijek izgubljeni.</p>}
        onOdustani={onZatvori} onPotvrdi={() => setKorak(2)} />
    );
  }
  return (
    <Modal naslov="Posljednja potvrda" onZatvori={onZatvori}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (rijec !== 'OBRIŠI') return;
        await obrisiSvePodatke();
        window.location.hash = '/';
        window.location.reload();
      }}>
        <Polje labela='Upiši riječ OBRIŠI (velikim slovima)' id="obrisi-rijec">
          <input id="obrisi-rijec" type="text" autoComplete="off" value={rijec} onChange={(e) => setRijec(e.target.value)} />
        </Polje>
        <div className="red-dugmadi">
          <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
          <button type="submit" className="dugme opasno puno" disabled={rijec !== 'OBRIŠI'}>Obriši sve</button>
        </div>
      </form>
    </Modal>
  );
}

function AIPostavke() {
  const toast = useToast();
  const [kljuc, setKljuc] = useState(ucitajKljuc());
  const [prikazi, setPrikazi] = useState(false);
  const [test, setTest] = useState('');
  const sacuvan = ucitajKljuc();

  const isprobaj = async () => {
    setTest('Provjeravam…');
    try {
      const r = await sroci('hodnik, ucenik U001 plakao, kaze da ga zezaju u razredu, rekla sam da dodje sutra', 'biljeska');
      setTest(r);
    } catch (e) {
      setTest('✗ ' + (e as Error).message);
    }
  };

  return (
    <section className="kartica">
      <h2>✨ Umjetna inteligencija (AI)</h2>
      <p className="malo">
        AI pretvara tvoje kratke, brzo zapisane bilješke u uredan stručan tekst (dugme <strong>„✨ Sroči stručno“</strong> uz bilješke).
        Bez ključa radi preko ChatGPT-a (kopiraj–zalijepi). Sa ključem radi jednim klikom, direktno u appu.
      </p>
      <p className="malo blijedo">
        Koristi se Claude (Anthropic, model {AI_MODEL}). Ključ dobiješ na <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com</a> (plaća se po upotrebi – jedna bilješka košta par feninga).
        Ključ se čuva samo na ovom uređaju i ne ide u rezervnu kopiju. Prije slanja, imena učenika se zamjenjuju šiframa; tekst bilješke se šalje Anthropicu na obradu.
      </p>
      <Polje labela="API ključ" id="ai-kljuc" pomoc={sacuvan ? '✓ Ključ je sačuvan na ovom uređaju.' : 'Počinje sa sk-ant-…'}>
        <div className="razdvoji">
          <input id="ai-kljuc" type={prikazi ? 'text' : 'password'} autoComplete="off" spellCheck={false} className="rastegni" style={{ flex: 1 }}
            value={kljuc} onChange={(e) => setKljuc(e.target.value)} placeholder="sk-ant-…" />
          <button type="button" className="dugme" onClick={() => setPrikazi(!prikazi)}>{prikazi ? 'Sakrij' : 'Prikaži'}</button>
        </div>
      </Polje>
      <div className="red-dugmadi">
        <button type="button" className="dugme primarno" disabled={kljuc.trim() === sacuvan} onClick={() => { sacuvajKljuc(kljuc); toast(kljuc.trim() ? 'AI ključ sačuvan ✓' : 'AI ključ uklonjen'); setTest(''); }}>Sačuvaj</button>
        {sacuvan && <button type="button" className="dugme" onClick={() => void isprobaj()}>Isprobaj</button>}
        {sacuvan && <button type="button" className="dugme opasno" onClick={() => { sacuvajKljuc(''); setKljuc(''); toast('AI ključ uklonjen'); }}>Ukloni</button>}
      </div>
      {test && <div className="blok-teksta malo" style={{ marginTop: 10 }}>{test}</div>}
    </section>
  );
}
