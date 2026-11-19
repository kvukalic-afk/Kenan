// Šifrovanje rezervne kopije (AES-GCM 256, ključ iz lozinke preko PBKDF2-SHA-256)
// i hashiranje PIN-a (PBKDF2 sa slučajnom soli). Sve preko Web Crypto API-ja.

export const PBKDF2_ITERACIJE = 310_000;
const PIN_ITERACIJE = 150_000;

const enc = new TextEncoder();
const dec = new TextDecoder();

export function uBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function izBase64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function nasumicno(n: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(n));
}

async function izvediKljuc(lozinka: string, sol: Uint8Array<ArrayBuffer>, iteracije: number): Promise<CryptoKey> {
  const osnova = await crypto.subtle.importKey('raw', enc.encode(lozinka), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sol, iterations: iteracije, hash: 'SHA-256' },
    osnova,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface SifrovaniPaket {
  app: 'evidencija-psihologa';
  format: 1;
  kreirano: string;
  kdf: { alg: 'PBKDF2-SHA256'; iteracije: number; sol: string };
  sifra: { alg: 'AES-GCM'; iv: string };
  podaci: string; // base64 šifrovanog JSON-a
}

export async function sifruj(obj: unknown, lozinka: string, iteracije = PBKDF2_ITERACIJE): Promise<SifrovaniPaket> {
  const sol = nasumicno(16);
  const iv = nasumicno(12);
  const kljuc = await izvediKljuc(lozinka, sol, iteracije);
  const tekst = enc.encode(JSON.stringify(obj));
  const sifrovano = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kljuc, tekst);
  return {
    app: 'evidencija-psihologa',
    format: 1,
    kreirano: new Date().toISOString(),
    kdf: { alg: 'PBKDF2-SHA256', iteracije: iteracije, sol: uBase64(sol) },
    sifra: { alg: 'AES-GCM', iv: uBase64(iv) },
    podaci: uBase64(sifrovano),
  };
}

export class PogresnaLozinka extends Error {
  constructor() {
    super('Pogrešna lozinka ili oštećen fajl.');
  }
}

export function jePaket(x: unknown): x is SifrovaniPaket {
  const p = x as SifrovaniPaket;
  return !!p && p.app === 'evidencija-psihologa' && p.format === 1 && typeof p.podaci === 'string';
}

export async function desifruj<T = unknown>(paket: SifrovaniPaket, lozinka: string): Promise<T> {
  const kljuc = await izvediKljuc(lozinka, izBase64(paket.kdf.sol), paket.kdf.iteracije);
  try {
    const tekst = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: izBase64(paket.sifra.iv) }, kljuc, izBase64(paket.podaci));
    return JSON.parse(dec.decode(tekst)) as T;
  } catch {
    throw new PogresnaLozinka();
  }
}

// ---------- PIN ----------

async function pbkdf2Bitovi(tekst: string, sol: Uint8Array<ArrayBuffer>, iteracije: number): Promise<Uint8Array> {
  const osnova = await crypto.subtle.importKey('raw', enc.encode(tekst), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sol, iterations: iteracije, hash: 'SHA-256' }, osnova, 256);
  return new Uint8Array(bits);
}

export function jeIspravanPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/** Vraća "sol:hash" (base64). PIN se nikad ne čuva kao običan tekst. */
export async function hashirajPin(pin: string): Promise<string> {
  const sol = nasumicno(16);
  const h = await pbkdf2Bitovi(pin, sol, PIN_ITERACIJE);
  return `${uBase64(sol)}:${uBase64(h)}`;
}

export async function provjeriPin(pin: string, sacuvano: string): Promise<boolean> {
  const [sol, hash] = (sacuvano || '').split(':');
  if (!sol || !hash) return false;
  const h = uBase64(await pbkdf2Bitovi(pin, izBase64(sol), PIN_ITERACIJE));
  // poređenje bez ranog izlaza
  let razlika = h.length ^ hash.length;
  for (let i = 0; i < Math.min(h.length, hash.length); i++) razlika |= h.charCodeAt(i) ^ hash.charCodeAt(i);
  return razlika === 0;
}
