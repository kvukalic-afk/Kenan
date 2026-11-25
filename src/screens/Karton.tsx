import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisiUcenika, postaviUPracenju, sacuvajUcenika } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Modal, Polje, Potvrda, Prazno, Prekidac, SifraPolje } from '../components/Polja';
import { RedStavke, StatusOznaka, Zaglavlje, type StavkaVremena } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { AnalizaModal } from '../components/AnalizaModal';
import { REZIMI, sastaviIzvore, type RezimAnalize } from '../lib/analiza';
import { prikaz } from '../lib/datum';
import { idi } from '../lib/router';
import { jeIspravnaSifra } from '../lib/sifra';
import { zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { punoIme, STATUSI_UCENIKA, type BrzaBiljeska, type StatusUcenika, type Ucenik } from '../types';

export function Karton({ sifra }: { sifra: string }) {
  const toast = useToast();
  const [uredi, setUredi] = useState(false);
  const [aiPregled, setAiPregled] = useState<RezimAnalize | null>(null);
  const podaci = useLiveQuery(async () => {
    const [ucenik, razgovori, saradnja, radionice, razredi, biljeske, analize] = await Promise.all([
      db.ucenici.where('sifra').equals(sifra).first(),
      db.razgovori.where('sifra').equals(sifra).toArray(),
      db.saradnja.where('sifra').equals(sifra).toArray(),
      db.radionice.where('ucenicizaPracenje').equals(sifra).toArray(),
      db.razredi.toArray(),
      db.brzeBiljeske.where('sifra').equals(sifra).toArray(),
      db.analize.where('sifra').equals(sifra).toArray(),
    ]);
    const razrednik = razredi.find((r) => r.razred === ucenik?.razred)?.razrednik ?? '';
    return { ucenik, razgovori, saradnja, radionice, razrednik, biljeske, analize };
  }, [sifra]);

  if (!podaci) return <Zaglavlje naslov={sifra} nazadNa="/ucenici" />;
  const { ucenik } = podaci;
  if (!ucenik) {
    return (
      <>
        <Zaglavlje naslov={sifra} nazadNa="/ucenici" />
        <main className="sadrzaj"><Prazno>Učenik sa šifrom {sifra} ne postoji.</Prazno></main>
      </>
    );
  }

  const linija: (StavkaVremena | { vrsta: 'biljeska'; z: BrzaBiljeska })[] = [
    ...podaci.biljeske.map((z) => ({ vrsta: 'biljeska' as const, z })),
    ...podaci.razgovori.map((z) => ({ vrsta: 'razgovor' as const, z })),
    ...podaci.saradnja.map((z) => ({ vrsta: 'saradnja' as const, z })),
    ...podaci.radionice.map((z) => ({ vrsta: 'radionica' as const, z })),
  ].sort((a, b) => b.z.datum.localeCompare(a.z.datum) || b.z.createdAt.localeCompare(a.z.createdAt));
  const zadnji = zadnjiRazgovorPoUceniku(podaci.razgovori).get(sifra);

  return (
    <>
      <Zaglavlje naslov="Karton učenika" nazadNa="/ucenici" />
      <main className="sadrzaj">
        <section className="kartica">
          {punoIme(ucenik) && <div className="ime-krupno">{punoIme(ucenik)}</div>}
          <div className="karton-zaglavlje">
            <span className={punoIme(ucenik) ? 'oznaka' : 'sifra-krupno'}>{ucenik.sifra}</span>
            <span><span className="blijedo">Razred</span> <strong>{ucenik.razred || '–'}</strong></span>
            {podaci.razrednik && <span><span className="blijedo">Razrednik</span> <strong>{podaci.razrednik}</strong></span>}
            <span className={`oznaka ${ucenik.status === 'Aktivan' ? 'zelena' : ''}`}>{ucenik.status}</span>
            {zadnji && <StatusOznaka status={zadnji.statusSlucaja} />}
          </div>
          <div style={{ marginTop: 8 }}>
            <Prekidac labela="U praćenju" vrijednost={ucenik.uPracenju} onChange={async (v) => { await postaviUPracenju(ucenik.id, v); toast(v ? 'Učenik je u praćenju ✓' : 'Uklonjen iz praćenja ✓'); }} />
          </div>
          {ucenik.napomena && <p className="blok-teksta" style={{ marginTop: 8 }}>{ucenik.napomena}</p>}
          <div className="red-dugmadi" style={{ marginTop: 12 }}>
            <a className="dugme primarno" href={`#/novi/razgovor?sifra=${encodeURIComponent(sifra)}`}><Ikona ime="razgovor" /> + Razgovor</a>
            <a className="dugme" href={`#/novi/saradnja?sifra=${encodeURIComponent(sifra)}`}><Ikona ime="saradnja" /> + Saradnja</a>
            <button type="button" className="dugme" onClick={() => setUredi(true)}><Ikona ime="uredi" /> Uredi</button>
            <a className="dugme" href={`#/print/karton/${encodeURIComponent(sifra)}`}><Ikona ime="print" /> Preuzmi karton za print</a>
          </div>
          <div className="red-dugmadi" style={{ marginTop: 8 }}>
            <button type="button" className="chip ai-chip" onClick={() => setAiPregled('priprema')}>🗣 Priprema za razgovor</button>
            <button type="button" className="chip ai-chip" onClick={() => setAiPregled('teskoce')}>🧩 Procjena teškoća</button>
            <button type="button" className="chip ai-chip" disabled={!podaci.razgovori.length && !podaci.biljeske.length && !podaci.saradnja.length} onClick={() => setAiPregled('pregled')}>🧠 AI pregled svih zapisa</button>
            <a className="chip" href={`#/obrazac/misljenje?sifra=${encodeURIComponent(sifra)}`}>📄 Mišljenje</a>
            <a className="chip" href={`#/obrazac/saglasnost?sifra=${encodeURIComponent(sifra)}`}>📄 Saglasnost</a>
            <a className="chip" href={`#/obrazac/poziv?sifra=${encodeURIComponent(sifra)}`}>📄 Poziv roditelju</a>
            <a className="chip" href={`#/obrazac/plan-podrske?sifra=${encodeURIComponent(sifra)}`}>📄 Plan podrške</a>
          </div>
        </section>

        {podaci.analize.length > 0 && (
          <>
            <div className="naslov-sekcije"><h2>Analize</h2></div>
            <ul className="lista">
              {podaci.analize.map((a) => (
                <li key={a.id}><a className="stavka" href={`#/analiza/${a.id}`}><span className="vrsta analiza" aria-hidden /><span className="glavno"><span className="red1">{a.naslov}</span><span className="red2">{a.brojIzvora} zapisa</span></span><span className="desno broj">{prikaz(a.datum)}</span></a></li>
              ))}
            </ul>
          </>
        )}

        <div className="naslov-sekcije">
          <h2>Vremenska linija</h2>
          <span className="blijedo malo">{podaci.razgovori.length} razg. · {podaci.saradnja.length} sar. · {podaci.radionice.length} rad.</span>
        </div>
        {linija.length === 0 ? (
          <Prazno>Još nema zapisa za ovog učenika. Dodaj prvi razgovor dugmetom „+ Razgovor“.</Prazno>
        ) : (
          <ul className="vremenska-linija">
            {linija.map((s) => (
              <li key={s.z.id}>
                {s.vrsta === 'biljeska' ? (
                  <a className="stavka" href="#/biljeske">
                    <span className="vrsta biljeska" aria-hidden />
                    <span className="glavno">
                      <span className="red1"><span className="oznaka biljeska">Bilješka</span>{s.z.kategorija ?? ''}</span>
                      <span className="red2">{s.z.sroceno || s.z.tekst}</span>
                    </span>
                    <span className="desno broj">{prikaz(s.z.datum)}</span>
                  </a>
                ) : <RedStavke s={s} prikaziSifru={false} />}
              </li>
            ))}
          </ul>
        )}
      </main>
      {uredi && <UrediUcenika ucenik={ucenik} onZatvori={() => setUredi(false)} />}
      {aiPregled && (() => {
        const { tekst, broj } = sastaviIzvore({ biljeske: podaci.biljeske, razgovori: podaci.razgovori, saradnja: podaci.saradnja });
        const opseg = aiPregled === 'pregled' ? `svi zapisi o učeniku ${sifra}` : `${sifra}, razred ${ucenik.razred}`;
        return <AnalizaModal rezim={aiPregled} naslov={`${REZIMI[aiPregled].naslov} – ${sifra}`} opseg={opseg} sifra={sifra} izvorniTekst={tekst} brojIzvora={broj} onZatvori={() => setAiPregled(null)} />;
      })()}
    </>
  );
}

function UrediUcenika({ ucenik, onZatvori }: { ucenik: Ucenik; onZatvori: () => void }) {
  const toast = useToast();
  const sviUcenici = useLiveQuery(() => db.ucenici.toArray(), []) ?? [];
  const [p, setP] = useState(ucenik);
  const [greska, setGreska] = useState('');
  const [brisanje, setBrisanje] = useState(false);

  const sacuvaj = async () => {
    if (!jeIspravnaSifra(p.sifra)) return setGreska('Upiši ispravnu šifru.');
    if (p.sifra !== ucenik.sifra && sviUcenici.some((u) => u.sifra === p.sifra)) return setGreska('Ta šifra je već zauzeta.');
    await sacuvajUcenika({ ...p, ime: (p.ime ?? '').trim(), prezime: (p.prezime ?? '').trim() });
    toast('Sačuvano ✓');
    onZatvori();
    if (p.sifra !== ucenik.sifra) idi(`/ucenici/${encodeURIComponent(p.sifra)}`, true);
  };

  return (
    <Modal naslov="Uredi učenika" onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void sacuvaj(); }}>
        <div className="dva-stupca">
          <Polje labela="Ime" id="u-ime">
            <input id="u-ime" type="text" value={p.ime ?? ''} autoCapitalize="words" onChange={(e) => setP({ ...p, ime: e.target.value })} />
          </Polje>
          <Polje labela="Prezime" id="u-prezime">
            <input id="u-prezime" type="text" value={p.prezime ?? ''} autoCapitalize="words" onChange={(e) => setP({ ...p, prezime: e.target.value })} />
          </Polje>
        </div>
        <SifraPolje labela="Šifra" samoSifra vrijednost={p.sifra} onChange={(s) => { setP({ ...p, sifra: s }); setGreska(''); }} ucenici={[]} obavezno greska={greska} />
        {p.sifra !== ucenik.sifra && <p className="malo blijedo">Promjena šifre se prenosi na sve razgovore, saradnju i radionice ovog učenika.</p>}
        <Polje labela="Razred" id="u-razred">
          <input id="u-razred" type="text" value={p.razred} onChange={(e) => setP({ ...p, razred: e.target.value })} />
        </Polje>
        <Polje labela="Status" id="u-status">
          <select id="u-status" value={p.status} onChange={(e) => setP({ ...p, status: e.target.value as StatusUcenika })}>
            {STATUSI_UCENIKA.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Polje>
        <Polje labela="Napomena" id="u-nap">
          <textarea id="u-nap" rows={3} value={p.napomena} onChange={(e) => setP({ ...p, napomena: e.target.value })} style={{ overflow: 'auto' }} />
        </Polje>
        <div className="red-dugmadi">
          <button type="button" className="dugme opasno" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /> Obriši učenika</button>
          <button type="button" className="dugme" onClick={onZatvori}>Odustani</button>
          <button type="submit" className="dugme primarno">Sačuvaj</button>
        </div>
      </form>
      {brisanje && (
        <Potvrda naslov="Obrisati učenika?" opasno potvrdi="Obriši"
          tekst={<p>Biće obrisan učenik <strong>{punoIme(ucenik) || ucenik.sifra}</strong> ({ucenik.sifra}) i svi njegovi razgovori. Kontakti saradnje ostaju, ali bez šifre. Ovo se ne može poništiti.</p>}
          onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisiUcenika(ucenik); toast('Učenik obrisan'); onZatvori(); idi('/ucenici', true); }} />
      )}
    </Modal>
  );
}
