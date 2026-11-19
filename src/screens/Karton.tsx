import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisiUcenika, postaviUPracenju, sacuvajUcenika } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Modal, Polje, Potvrda, Prazno, Prekidac, SifraPolje } from '../components/Polja';
import { RedStavke, StatusOznaka, Zaglavlje, type StavkaVremena } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { idi } from '../lib/router';
import { jeIspravnaSifra } from '../lib/sifra';
import { zadnjiRazgovorPoUceniku } from '../lib/zakazano';
import { STATUSI_UCENIKA, type StatusUcenika, type Ucenik } from '../types';

export function Karton({ sifra }: { sifra: string }) {
  const toast = useToast();
  const [uredi, setUredi] = useState(false);
  const podaci = useLiveQuery(async () => {
    const [ucenik, razgovori, saradnja, radionice] = await Promise.all([
      db.ucenici.where('sifra').equals(sifra).first(),
      db.razgovori.where('sifra').equals(sifra).toArray(),
      db.saradnja.where('sifra').equals(sifra).toArray(),
      db.radionice.where('ucenicizaPracenje').equals(sifra).toArray(),
    ]);
    return { ucenik, razgovori, saradnja, radionice };
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

  const linija: StavkaVremena[] = [
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
          <div className="karton-zaglavlje">
            <span className="sifra-krupno">{ucenik.sifra}</span>
            <span><span className="blijedo">Razred</span> <strong>{ucenik.razred || '–'}</strong></span>
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
        </section>

        <div className="naslov-sekcije">
          <h2>Vremenska linija</h2>
          <span className="blijedo malo">{podaci.razgovori.length} razg. · {podaci.saradnja.length} sar. · {podaci.radionice.length} rad.</span>
        </div>
        {linija.length === 0 ? (
          <Prazno>Još nema zapisa za ovog učenika. Dodaj prvi razgovor dugmetom „+ Razgovor“.</Prazno>
        ) : (
          <ul className="vremenska-linija">
            {linija.map((s) => <li key={s.z.id}><RedStavke s={s} prikaziSifru={false} /></li>)}
          </ul>
        )}
      </main>
      {uredi && <UrediUcenika ucenik={ucenik} onZatvori={() => setUredi(false)} />}
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
    await sacuvajUcenika(p);
    toast('Sačuvano ✓');
    onZatvori();
    if (p.sifra !== ucenik.sifra) idi(`/ucenici/${encodeURIComponent(p.sifra)}`, true);
  };

  return (
    <Modal naslov="Uredi učenika" onZatvori={onZatvori}>
      <form onSubmit={(e) => { e.preventDefault(); void sacuvaj(); }}>
        <SifraPolje vrijednost={p.sifra} onChange={(s) => { setP({ ...p, sifra: s }); setGreska(''); }} ucenici={[]} obavezno greska={greska} />
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
          tekst={<p>Biće obrisan učenik <strong>{ucenik.sifra}</strong> i svi njegovi razgovori. Kontakti saradnje ostaju, ali bez šifre. Ovo se ne može poništiti.</p>}
          onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisiUcenika(ucenik); toast('Učenik obrisan'); onZatvori(); idi('/ucenici', true); }} />
      )}
    </Modal>
  );
}
