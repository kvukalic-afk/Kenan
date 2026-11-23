# Pretpostavke — molim potvrdi ili ispravi

| # | Pretpostavka | Gdje se mijenja |
|---|---|---|
| 1 | Nabavna cijena **Voda 1 L = 0,80 KM** (nije bila poznata) | PROIZVODI → `nabavna_cijena` |
| 2 | **Prevoz 3%** se dodaje samo na robu (pića, suplementi), ne na usluge i članarine | `CONFIG.PREVOZ` + `obnoviPregled` |
| 3 | Mjesečna 24/7: trošak **20 KM** po prodaji (profit 30); mjesečna 30 KM = čist profit | PROIZVODI → `nabavna_cijena` |
| 4 | Članarina traje **1 kalendarski mjesec** (21.11. → 21.12.; 31.01. → 28.02.). Produženje ide od isteka ako još važi, inače od danas | PROIZVODI → `clanarina_mjeseci` |
| 5 | Sedmica za platu je **ponedjeljak–nedjelja**; plata = 30% profita **cijele prošle sedmice** (svih radnika zajedno), isplata u ponedjeljak. Ako je sedmični profit negativan, plata je 0 | `CONFIG.PLATA_UDIO` |
| 6 | Profit = prodajna cijena − nabavna (+3%). Manjkovi robe se **ne** oduzimaju od profita ni od plate (vide se posebno kao "manjak robe") | — |
| 7 | **Minimum zalihe** (upozorenje): Voda 0,5 L i Red Bull 6, suplementi 3, ostala pića 4 — izmišljene početne vrijednosti | PROIZVODI → `minimum` |
| 8 | Razlog je obavezan ako se ne poklapa **kasa ili bilo koji proizvod** (lista: Greška u kucanju / Gratis-poklon / Lom ili isteklo / Ne znam) | `CONFIG.RAZLOZI` |
| 9 | Sve se plaća gotovinom (nema kartica) | — |
| 10 | Članarina se **ne može poništiti** dugmetom PONIŠTI (jer mijenja datum isteka člana). Ako je greška, ispravi ručno u Sheetu (CLANOVI + napomena) | — |
| 11 | Dva nova stupca u PROIZVODI: `minimum` i `clanarina_mjeseci` (ostale kolone su tačno po specifikaciji) | — |
| 12 | Vrijeme svake prodaje je vrijeme kad je **server** primio klik. Kod prodaje bez interneta upisuje se i vrijeme sa telefona u napomenu | — |
| 13 | Početni PIN je **2580**, promijeni ga odmah | Vlasnik → Postavke |
| 14 | Vlasnik može zatvoriti zaboravljenu smjenu samo "bez brojanja": stvarno stanje ostaje prazno, ništa se ne izmišlja | — |
| 15 | Paljenje/gašenje svjetla pri ulasku radi **Tuya automatizacija**, ne ova aplikacija (zbog brzine) | Smart Life → Scene |
| 16 | Član se na bravi prepoznaje po **istom imenu** kao u Smart Life ili po koloni `brava_id` | Vlasnik → Članovi |
| 17 | Data centar Tuye je **Central Europe** | Vlasnik → Vrata → Postavke |

| 18 | **Lični trener**: 60 KM mjesečno, po defaultu ide treneru u cijelosti (ne ulazi u profit ni u platu radnika). Treneri na spisku: Kenan, Edin | Vlasnik → Proizvodi / Postavke |
| 19 | Mjesečna karta i dalje stoji na **30 KM** (i 24/7 na 50) jer cijenu nisi potvrdio. Ako je sada 40, promijeni je u Vlasnik → Proizvodi | Vlasnik → Proizvodi |
| 20 | Vlasnici u pozdravu: **Edin & Kenan**; radnici na prvom ekranu: Kenan, Edin | `CONFIG` / Vlasnik → Postavke |

## Ograničenja koja trebaš znati

- Aplikacija se mora **otvoriti** dok ima interneta (Google je servira). Kad je jednom otvorena, prodaja radi i bez interneta, a sinhronizuje se kasnije.
- Ko ima link, može otvoriti aplikaciju za radnika (ne i vlasnički pregled). Link ne objavljuj javno.
- Tab PREGLED je pravljen za do 40 proizvoda.
- Ulazi se povlače s brave svakih 5 minuta (nisu trenutni). Daljinsko otključavanje i dnevnik ulazaka zavise od modela brave; testirani su na simuliranom Tuya serveru, ne na tvojoj bravi.
- Aplikacija još **ne** pravi niti briše čipove/šifre u bravi. To radiš u Smart Life. Automatsko blokiranje čipa kad istekne članarina može se dodati kad znamo tačan model brave.
