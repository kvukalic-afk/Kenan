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
| 13 | Početni PIN je **2580**, promijeni ga odmah | `CONFIG.ADMIN_PIN` |
| 14 | Vlasnik može zatvoriti zaboravljenu smjenu samo "bez brojanja": stvarno stanje ostaje prazno, ništa se ne izmišlja | — |

## Ograničenja koja trebaš znati

- Aplikacija se mora **otvoriti** dok ima interneta (Google je servira). Kad je jednom otvorena, prodaja radi i bez interneta, a sinhronizuje se kasnije.
- Ko ima link, može otvoriti aplikaciju za radnika (ne i vlasnički pregled). Link ne objavljuj javno.
- Tab PREGLED je pravljen za do 40 proizvoda.
