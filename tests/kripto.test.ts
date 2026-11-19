import { describe, expect, it } from 'vitest';
import { desifruj, hashirajPin, jePaket, PogresnaLozinka, provjeriPin, sifruj } from '../src/lib/kripto';

describe('šifrovanje rezervne kopije', () => {
  const podaci = { ucenici: [{ id: '1', sifra: 'U014', napomena: 'čćžšđ – test' }], broj: 42 };

  it('šifruje i dešifruje istom lozinkom', async () => {
    const paket = await sifruj(podaci, 'tajna-lozinka', 1000);
    expect(jePaket(paket)).toBe(true);
    expect(JSON.stringify(paket)).not.toContain('U014');
    expect(await desifruj(paket, 'tajna-lozinka')).toEqual(podaci);
  });
  it('pogrešna lozinka baca grešku', async () => {
    const paket = await sifruj(podaci, 'tajna-lozinka', 1000);
    await expect(desifruj(paket, 'pogresna')).rejects.toBeInstanceOf(PogresnaLozinka);
  });
  it('izmijenjen sadržaj se otkriva (AES-GCM)', async () => {
    const paket = await sifruj(podaci, 'x', 1000);
    const b = paket.podaci;
    const izmijenjen = { ...paket, podaci: (b[0] === 'A' ? 'B' : 'A') + b.slice(1) };
    await expect(desifruj(izmijenjen, 'x')).rejects.toBeInstanceOf(PogresnaLozinka);
  });
  it('svaka kopija ima novu so i IV', async () => {
    const a = await sifruj(podaci, 'x', 1000);
    const b = await sifruj(podaci, 'x', 1000);
    expect(a.kdf.sol).not.toBe(b.kdf.sol);
    expect(a.sifra.iv).not.toBe(b.sifra.iv);
  });
});

describe('PIN', () => {
  it('čuva se kao hash, ne kao tekst', async () => {
    const h = await hashirajPin('1234');
    expect(h).not.toContain('1234');
    expect(await provjeriPin('1234', h)).toBe(true);
    expect(await provjeriPin('4321', h)).toBe(false);
    expect(await provjeriPin('1234', '')).toBe(false);
  });
});
