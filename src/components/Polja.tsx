import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Ikona } from './Ikona';
import { dodajDane, danasIso, parsirajPrikaz, prikaz } from '../lib/datum';
import { diktiranjePodrzano, dodajNaKraj, slusaj, type Slusanje } from '../lib/govor';
import { liciNaIme, ocistiSifru, PORUKA_IME, uporediSifre } from '../lib/sifra';

// ---------- Okvir polja ----------

export function Polje(props: {
  labela: string;
  id?: string;
  obavezno?: boolean;
  greska?: string;
  upozorenje?: string;
  pomoc?: ReactNode;
  children: ReactNode;
  grupa?: boolean; // za chipove (nema <label for>)
}) {
  return (
    <div className={`polje ${props.greska ? 'ima-gresku' : ''}`} role={props.grupa ? 'group' : undefined} aria-labelledby={props.grupa ? `${props.id}-l` : undefined}>
      {props.grupa ? (
        <span className="labela" id={`${props.id}-l`}>{props.labela}{props.obavezno && <span className="obavezno" aria-hidden>*</span>}</span>
      ) : (
        <label htmlFor={props.id}>{props.labela}{props.obavezno && <span className="obavezno" aria-hidden>*</span>}</label>
      )}
      {props.children}
      {props.greska && <div className="greska-tekst" role="alert">{props.greska}</div>}
      {!props.greska && props.upozorenje && <div className="upozorenje-tekst" role="alert">{props.upozorenje}</div>}
      {props.pomoc && <div className="pomoc">{props.pomoc}</div>}
    </div>
  );
}

// ---------- Chipovi (izbor jednim dodirom) ----------

export function Chipovi({ id, labela, opcije, vrijednost, onChange, obavezno, greska, mozeOdznaciti = true }: {
  id: string; labela: string; opcije: string[]; vrijednost: string; onChange: (v: string) => void; obavezno?: boolean; greska?: string; mozeOdznaciti?: boolean;
}) {
  return (
    <Polje labela={labela} id={id} grupa obavezno={obavezno} greska={greska}>
      <div className="chipovi">
        {opcije.map((o) => (
          <button key={o} type="button" className="chip" aria-pressed={vrijednost === o}
            onClick={() => onChange(vrijednost === o && mozeOdznaciti ? '' : o)}>
            {o}
          </button>
        ))}
      </div>
    </Polje>
  );
}

// ---------- Padajuća lista ----------

export function Izbor({ labela, opcije, vrijednost, onChange, prazno = '— izaberi —' }: {
  labela: string; opcije: string[]; vrijednost: string; onChange: (v: string) => void; prazno?: string;
}) {
  const id = useId();
  return (
    <Polje labela={labela} id={id}>
      <select id={id} value={vrijednost} onChange={(e) => onChange(e.target.value)}>
        <option value="">{prazno}</option>
        {opcije.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Polje>
  );
}

// ---------- Tekstualno polje koje se samo širi + diktiranje ----------

export function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

export function TekstPolje({ labela, vrijednost, onChange, kratko, placeholder, obavezno, greska }: {
  labela: string; vrijednost: string; onChange: (v: string) => void; kratko?: boolean; placeholder?: string; obavezno?: boolean; greska?: string;
}) {
  const id = useId();
  const podrzano = diktiranjePodrzano();
  const [slusa, setSlusa] = useState(false);
  const [greskaMik, setGreskaMik] = useState('');
  const slusanje = useRef<Slusanje | null>(null);
  const trenutno = useRef(vrijednost);
  trenutno.current = vrijednost;

  useEffect(() => () => slusanje.current?.zaustavi(), []);

  const prebaci = () => {
    if (slusa) {
      slusanje.current?.zaustavi();
      return;
    }
    setGreskaMik('');
    const s = slusaj(
      (t) => onChange(dodajNaKraj(trenutno.current, t)),
      (g) => {
        setSlusa(false);
        slusanje.current = null;
        if (g === 'not-allowed' || g === 'service-not-allowed') setGreskaMik('Mikrofon nije dozvoljen. Dozvoli ga u postavkama preglednika ili koristi mikrofon na tastaturi.');
        else if (g === 'network') setGreskaMik('Diktiranje u pregledniku traži internet. Offline koristi mikrofon na tastaturi telefona.');
        else if (g && g !== 'no-speech' && g !== 'aborted') setGreskaMik('Diktiranje nije uspjelo. Pokušaj ponovo.');
      },
    );
    if (s) {
      slusanje.current = s;
      setSlusa(true);
    } else setGreskaMik('Diktiranje nije dostupno. Koristi mikrofon na tastaturi telefona.');
  };

  return (
    <Polje labela={labela} id={id} obavezno={obavezno} greska={greska || greskaMik || undefined}
      pomoc={!podrzano ? 'Koristi mikrofon na tastaturi telefona' : slusa ? 'Slušam… dodirni ponovo za kraj.' : undefined}>
      <div className={podrzano ? 's-mikrofonom' : ''}>
        <AutoTextarea id={id} value={vrijednost} onChange={(e) => onChange(e.target.value)} className={kratko ? 'kratko' : ''}
          rows={kratko ? 1 : 3} placeholder={placeholder} spellCheck lang="bs" />
        {podrzano && (
          <button type="button" className={`mikrofon ${slusa ? 'slusa' : ''}`} onClick={prebaci}
            aria-label={slusa ? `Zaustavi diktiranje (${labela})` : `Diktiraj: ${labela}`} aria-pressed={slusa}>
            <Ikona ime={slusa ? 'stop' : 'mikrofon'} />
          </button>
        )}
      </div>
    </Polje>
  );
}

// ---------- Datum (DD.MM.YYYY) ----------

export function DatumPolje({ labela, vrijednost, onChange, obavezno, greska, brzi }: {
  labela: string; vrijednost: string; onChange: (iso: string) => void; obavezno?: boolean; greska?: string; brzi?: { naziv: string; dana: number }[];
}) {
  const id = useId();
  const [tekst, setTekst] = useState(prikaz(vrijednost));
  const [neispravno, setNeispravno] = useState(false);
  const skriveni = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (parsirajPrikaz(tekst) !== vrijednost && !(tekst === '' && vrijednost === '')) setTekst(prikaz(vrijednost));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vrijednost]);

  const promjena = (t: string) => {
    // automatske tačke: 19112026 → 19.11.2026
    let v = t.replace(/[^\d.]/g, '');
    if (/^\d{8}$/.test(v)) v = `${v.slice(0, 2)}.${v.slice(2, 4)}.${v.slice(4)}`;
    setTekst(v);
    if (v === '') { setNeispravno(false); onChange(''); return; }
    const iso = parsirajPrikaz(v);
    setNeispravno(!iso);
    if (iso) onChange(iso);
  };

  const otvoriKalendar = () => {
    const el = skriveni.current;
    if (!el) return;
    el.value = vrijednost || danasIso();
    try {
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <Polje labela={labela} id={id} obavezno={obavezno} greska={greska || (neispravno ? 'Upiši datum kao DD.MM.YYYY' : undefined)}>
      <div className="datum-red" style={{ position: 'relative' }}>
        <input id={id} type="text" inputMode="decimal" placeholder="DD.MM.YYYY" value={tekst} autoComplete="off"
          onChange={(e) => promjena(e.target.value)} onBlur={() => { if (!neispravno && vrijednost) setTekst(prikaz(vrijednost)); }} />
        <button type="button" className="dugme" onClick={otvoriKalendar} aria-label={`Kalendar: ${labela}`}><Ikona ime="kalendar" /></button>
        <input ref={skriveni} type="date" className="skriveni-datum" tabIndex={-1} aria-hidden lang="bs"
          onChange={(e) => { if (e.target.value) { onChange(e.target.value); setTekst(prikaz(e.target.value)); setNeispravno(false); } }} />
      </div>
      {brzi && (
        <div className="brzi-datumi">
          {brzi.map((b) => (
            <button key={b.naziv} type="button" className="chip mali" onClick={() => onChange(b.dana === 0 ? danasIso() : dodajDane(danasIso(), b.dana))}>{b.naziv}</button>
          ))}
          {vrijednost && !obavezno && <button type="button" className="chip mali" onClick={() => onChange('')}>Bez datuma</button>}
        </div>
      )}
    </Polje>
  );
}

// ---------- Šifra učenika s autocomplete-om ----------

export interface UcenikZaIzbor { sifra: string; razred: string }

function useAutocomplete(ucenici: UcenikZaIzbor[], upit: string, iskljuci: string[] = []) {
  const u = upit.trim().toUpperCase();
  return ucenici
    .filter((x) => !iskljuci.includes(x.sifra) && (!u || x.sifra.includes(u) || x.razred.toUpperCase() === u))
    .sort((a, b) => (a.sifra.startsWith(u) ? 0 : 1) - (b.sifra.startsWith(u) ? 0 : 1) || uporediSifre(a.sifra, b.sifra))
    .slice(0, 8);
}

export function SifraPolje({ labela = 'Šifra učenika', vrijednost, onChange, onIzaberi, ucenici, obavezno, greska, autoFokus }: {
  labela?: string; vrijednost: string; onChange: (s: string) => void; onIzaberi?: (u: UcenikZaIzbor) => void; ucenici: UcenikZaIzbor[];
  obavezno?: boolean; greska?: string; autoFokus?: boolean;
}) {
  const id = useId();
  const [otvoreno, setOtvoreno] = useState(false);
  const [aktivni, setAktivni] = useState(-1);
  const [upozorenje, setUpozorenje] = useState(false);
  const prijedlozi = useAutocomplete(ucenici, vrijednost);
  const tacno = ucenici.some((u) => u.sifra === vrijednost);

  const izaberi = (u: UcenikZaIzbor) => {
    onChange(u.sifra);
    onIzaberi?.(u);
    setOtvoreno(false);
    setUpozorenje(false);
  };

  return (
    <Polje labela={labela} id={id} obavezno={obavezno} greska={greska} upozorenje={upozorenje ? PORUKA_IME : undefined}
      pomoc={!upozorenje && !greska ? 'Slova, brojevi, - i _ (do 20 znakova). Npr. U014' : undefined}>
      <div className="autocomplete">
        <input id={id} type="text" className="sifra-unos" value={vrijednost} autoComplete="off" autoCapitalize="characters" spellCheck={false}
          autoFocus={autoFokus} maxLength={40} role="combobox" aria-expanded={otvoreno && prijedlozi.length > 0} aria-controls={`${id}-lista`} aria-autocomplete="list"
          onChange={(e) => {
            const sirovo = e.target.value;
            setUpozorenje(liciNaIme(sirovo));
            onChange(ocistiSifru(sirovo));
            setOtvoreno(true);
            setAktivni(-1);
          }}
          onFocus={() => setOtvoreno(true)}
          onBlur={() => setTimeout(() => setOtvoreno(false), 150)}
          onKeyDown={(e) => {
            if (!otvoreno || !prijedlozi.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setAktivni((a) => Math.min(a + 1, prijedlozi.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setAktivni((a) => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter' && aktivni >= 0) { e.preventDefault(); izaberi(prijedlozi[aktivni]); }
            else if (e.key === 'Escape') setOtvoreno(false);
          }} />
        {otvoreno && prijedlozi.length > 0 && !(tacno && prijedlozi.length === 1) && (
          <ul id={`${id}-lista`} role="listbox">
            {prijedlozi.map((u, i) => (
              <li key={u.sifra} role="option" aria-selected={i === aktivni}>
                <button type="button" className={i === aktivni ? 'aktivno' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => izaberi(u)}>
                  <strong>{u.sifra}</strong><span className="blijedo">{u.razred}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Polje>
  );
}

// ---------- Više šifri kao tagovi ----------

export function TagSifre({ labela, vrijednost, onChange, ucenici }: {
  labela: string; vrijednost: string[]; onChange: (v: string[]) => void; ucenici: UcenikZaIzbor[];
}) {
  const id = useId();
  const [unos, setUnos] = useState('');
  const [otvoreno, setOtvoreno] = useState(false);
  const [upozorenje, setUpozorenje] = useState(false);
  const prijedlozi = useAutocomplete(ucenici, unos, vrijednost);

  const dodaj = (s: string) => {
    const c = ocistiSifru(s);
    if (c && !vrijednost.includes(c)) onChange([...vrijednost, c]);
    setUnos('');
    setUpozorenje(false);
  };

  return (
    <Polje labela={labela} id={id} upozorenje={upozorenje ? PORUKA_IME : undefined}
      pomoc="Upiši šifru i pritisni Enter ili zarez. Učenici će vidjeti ovu radionicu u svom kartonu.">
      {vrijednost.length > 0 && (
        <div className="tagovi">
          {vrijednost.map((s) => (
            <span key={s} className="tag">{s}
              <button type="button" aria-label={`Ukloni ${s}`} onClick={() => onChange(vrijednost.filter((x) => x !== s))}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="autocomplete razdvoji">
        <input id={id} type="text" className="sifra-unos rastegni" value={unos} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="npr. U014"
          onChange={(e) => {
            const v = e.target.value;
            if (/[,;\n]/.test(v)) { v.split(/[,;\n]/).forEach((x) => x.trim() && dodaj(x)); return; }
            setUpozorenje(liciNaIme(v));
            setUnos(ocistiSifru(v));
            setOtvoreno(true);
          }}
          onFocus={() => setOtvoreno(true)}
          onBlur={() => setTimeout(() => setOtvoreno(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (unos) dodaj(unos); }
            else if (e.key === 'Backspace' && !unos && vrijednost.length) onChange(vrijednost.slice(0, -1));
          }} style={{ flex: 1 }} />
        <button type="button" className="dugme" onClick={() => unos && dodaj(unos)} disabled={!unos}>Dodaj</button>
        {otvoreno && unos && prijedlozi.length > 0 && (
          <ul role="listbox">
            {prijedlozi.map((u) => (
              <li key={u.sifra}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => dodaj(u.sifra)}>
                  <strong>{u.sifra}</strong><span className="blijedo">{u.razred}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Polje>
  );
}

// ---------- Prekidač ----------

export function Prekidac({ labela, vrijednost, onChange }: { labela: string; vrijednost: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="prekidac">
      <input type="checkbox" role="switch" checked={vrijednost} onChange={(e) => onChange(e.target.checked)} />
      {labela}
    </label>
  );
}

// ---------- Modal i potvrda ----------

export function Modal({ naslov, children, onZatvori }: { naslov: string; children: ReactNode; onZatvori: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prethodni = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onZatvori();
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      prethodni?.focus?.();
    };
  }, [onZatvori]);
  return (
    <div className="modal-pozadina" onClick={(e) => e.target === e.currentTarget && onZatvori()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={naslov} ref={ref}>
        <h2>{naslov}</h2>
        {children}
      </div>
    </div>
  );
}

export function Potvrda({ naslov, tekst, potvrdi = 'Potvrdi', opasno, onPotvrdi, onOdustani }: {
  naslov: string; tekst: ReactNode; potvrdi?: string; opasno?: boolean; onPotvrdi: () => void; onOdustani: () => void;
}) {
  return (
    <Modal naslov={naslov} onZatvori={onOdustani}>
      <div>{tekst}</div>
      <div className="red-dugmadi">
        <button type="button" className="dugme" onClick={onOdustani}>Odustani</button>
        <button type="button" className={`dugme ${opasno ? 'opasno puno' : 'primarno'}`} onClick={onPotvrdi}>{potvrdi}</button>
      </div>
    </Modal>
  );
}

// ---------- Prazno stanje ----------

export function Prazno({ children }: { children: ReactNode }) {
  return (
    <div className="prazno">
      <Ikona ime="prazno" />
      <div>{children}</div>
    </div>
  );
}

// ---------- Horizontalni bar grafikon ----------

export function Grafikon({ naslov, podaci }: { naslov: string; podaci: { naziv: string; broj: number }[] }) {
  const max = Math.max(1, ...podaci.map((p) => p.broj));
  const ukupno = podaci.reduce((s, p) => s + p.broj, 0);
  return (
    <section className="kartica">
      <h2>{naslov}</h2>
      {podaci.length === 0 ? (
        <p className="blijedo malo">Nema podataka za ovaj period.</p>
      ) : (
        <ul className="grafikon">
          {podaci.map((p) => (
            <li key={p.naziv}>
              <span>{p.naziv}</span>
              <span className="vr">{p.broj} <span className="blijedo malo">({Math.round((p.broj / ukupno) * 100)}%)</span></span>
              <span className="traka-g" aria-hidden><span style={{ width: `${(p.broj / max) * 100}%` }} /></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
