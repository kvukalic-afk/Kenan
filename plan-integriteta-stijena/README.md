# Plan integriteta JU OŠ „Stijena“ – revizija 2026

| Datoteka | Sadržaj |
|---|---|
| **`Plan_integriteta_JU_OS_Stijena_za_dostavu_Uredu.docx` / `.pdf`** | **Konačni nacrt za dostavu Uredu (čista verzija, prazna polja za dopis)** |
| `Dopis_Uredu_zahtjev_za_misljenje.docx` / `.pdf` | Propratni dopis Uredu |
| `Spisak_za_direktora_prije_slanja.docx` / `.pdf` | Interni spisak: odluke, prazna polja, provjere, šta nije urađeno |
| `Plan_integriteta_JU_OS_Stijena_revidirani_nacrt_2026.docx` / `.pdf` | Revidirani nacrt Plana integriteta (uređivi DOCX i PDF za pregled) |
| `Izvjestaj_o_reviziji_Plana_integriteta_JU_OS_Stijena_2026.docx` / `.pdf` | Izvori, uporedna analiza, pregled ispravki po stranicama originala, kontrolna lista usklađenosti, podaci za potvrdu |
| `izvor/` | Generator dokumenata (Node.js `docx`, Python za PDF i provjeru ankete) |

Status: **radni nacrt** – nije usvojen i nije dobio mišljenje Ureda za borbu protiv korupcije USK.

Ponovna izrada (iz mape `izvor/`):

```bash
node plan_konacni.js && node dodaci.js   # konačna verzija
node plan.js && node izvjestaj.js         # ranija radna verzija i izvještaj o reviziji
python3 u_pdf.py ../Plan_integriteta_JU_OS_Stijena_revidirani_nacrt_2026.docx ../Plan_integriteta_JU_OS_Stijena_revidirani_nacrt_2026.pdf
python3 provjera_ankete.py "Plan integriteta-ver 2.docx" ../Plan_integriteta_JU_OS_Stijena_revidirani_nacrt_2026.docx
```

Registar rizika i mjere nalaze se u `izvor/rizici.js`; izmjena ocjena ili mjera vrši se tamo, nakon čega se dokumenti ponovo generišu.
