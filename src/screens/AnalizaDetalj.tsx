import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { obrisi } from '../db/repo';
import { Ikona } from '../components/Ikona';
import { Potvrda, Prazno, AutoTextarea } from '../components/Polja';
import { Zaglavlje } from '../components/Okvir';
import { useToast } from '../components/Toast';
import { prikaz } from '../lib/datum';
import { nazad } from '../lib/router';
import type { Analiza } from '../types';

export function AnalizaDetalj({ id }: { id: string }) {
  const toast = useToast();
  const a = useLiveQuery(() => db.analize.get(id), [id], null as Analiza | null | undefined);
  const [tekst, setTekst] = useState('');
  const [naslov, setNaslov] = useState('');
  const [brisanje, setBrisanje] = useState(false);
  useEffect(() => { if (a) { setTekst(a.tekst); setNaslov(a.naslov); } }, [a]);

  if (a === null) return <Zaglavlje naslov="Analiza" nazadNa="/biljeske?tab=analize" />;
  if (!a) return (<><Zaglavlje naslov="Analiza" nazadNa="/biljeske?tab=analize" /><main className="sadrzaj"><Prazno>Analiza ne postoji.</Prazno></main></>);
  const izmijenjeno = tekst !== a.tekst || naslov !== a.naslov;

  return (
    <>
      <Zaglavlje naslov="Analiza" nazadNa="/biljeske?tab=analize" />
      <main className="sadrzaj ulaz">
        <p className="malo blijedo">{prikaz(a.datum)} · {a.opseg} · {a.brojIzvora} zapisa{a.sifra ? <> · <a href={`#/ucenici/${encodeURIComponent(a.sifra)}`}>{a.sifra}</a></> : null}</p>
        <input type="text" value={naslov} onChange={(e) => setNaslov(e.target.value)} aria-label="Naslov analize" style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 10 }} />
        <AutoTextarea value={tekst} onChange={(e) => setTekst(e.target.value)} aria-label="Tekst analize" className="analiza-tekst" />
        <div className="red-dugmadi" style={{ marginTop: 12 }}>
          {izmijenjeno && (
            <button type="button" className="dugme primarno" onClick={async () => {
              await db.analize.update(id, { tekst, naslov, updatedAt: new Date().toISOString() });
              toast('Sačuvano ✓');
            }}><Ikona ime="kvacica" /> Sačuvaj izmjene</button>
          )}
          <a className="dugme" href={`#/print/analiza/${id}`}><Ikona ime="print" /> Print</a>
          <button type="button" className="dugme opasno" onClick={() => setBrisanje(true)}><Ikona ime="obrisi" /> Obriši</button>
        </div>
      </main>
      {brisanje && (
        <Potvrda naslov="Obrisati analizu?" tekst="Analiza će biti trajno obrisana (bilješke ostaju)." potvrdi="Obriši" opasno onOdustani={() => setBrisanje(false)}
          onPotvrdi={async () => { await obrisi('analize', id); toast('Obrisano'); nazad('/biljeske?tab=analize'); }} />
      )}
    </>
  );
}
