# Subject label mapping (June 2026 CC)

Raw `subject` codes come from the source sheet's `Subject` column and are
surfaced to students/parents in the filter dropdown and calendar event titles.
Each slug's `subjectLabels` map in `config.ts` is the source of truth — this
table is a reference for what's currently shipped and what each code covers
across the schedule.

## Secondary (`ss-june-2026`)

> ⚠️ 8 of 408 SS sessions have **empty `Subject`** in the source sheet — 7
> rows of `S3 Pure Literature` and 1 row of `S4 IP Chemistry`. `displaySubject`
> is populated, so the calendar places them correctly, but they collapse into
> a blank entry in the filter dropdown. Fix by populating `Subject` (col D or
> AH) for those rows in the sheet, then re-run the CSV → JSON script.

| Raw code       | Levels | Shown alongside display                                | Friendly label             |
|----------------|--------|--------------------------------------------------------|----------------------------|
| `LSEng`        | S1, S2 | S1 English, S2 English                                 | Lower Sec English          |
| `LSEng(IP)`    | S1, S2 | S1 IP English, S2 IP English                           | (IP) Lower Sec English     |
| `LSMath`       | S1, S2 | S1 Math, S2 Math                                       | Lower Sec Math             |
| `LSMath(IP)`   | S1, S2 | S1 IP Math, S2 IP Math                                 | (IP) Lower Sec Math        |
| `LSScience`    | S1, S2 | S1 Science, S2 Science                                 | Lower Sec Science          |
| `SEng`         | S3, S4 | S3 English, S4/5 English                               | Upper Sec English          |
| `SEng(IP)`     | S3, S4 | S3 IP English, S4 IP English                           | (IP) Upper Sec English     |
| `SMath(AM)`    | S3, S4 | S3 A Math, S4/5 A Math                                 | A Math                     |
| `SMath(EM)`    | S3, S4 | S3 E Math, S4/5 E Math                                 | E Math                     |
| `SMath(IP)`    | S3, S4 | S3 IP Math, S4 IP Math                                 | (IP) Upper Sec Math        |
| `SPhy(Pure)`   | S3, S4 | S3 Pure Physics, S4/5 Pure Physics                     | Pure Physics               |
| `SPhy(Comb)`   | S3, S4 | S3 Combined Physics, S4/5 Combined Physics             | Combined Physics           |
| `SChem(Pure)`  | S3, S4 | S3 Pure Chemistry, S4/5 Pure Chemistry                 | Pure Chemistry             |
| `SChem(Comb)`  | S4     | S4/5 Combined Chemistry                                | Combined Chemistry         |
| `SChem(IP)`    | S3     | S3 IP Chemistry                                        | (IP) Chemistry             |
| `SBio(Pure)`   | S3, S4 | S3 Pure Biology, S4/5 Pure Biology                     | Pure Biology               |
| `SBio(Comb)`   | S4     | S4/5 Combined Biology                                  | Combined Biology           |
| `SHis(Pure)`   | S3, S4 | S3 Pure History, S4 Pure History                       | Pure History               |
| `SHis(Comb)`   | S3, S4 | S3 Combined History, S4 Combined History               | Combined History           |
| `SLit(Pure)`   | S4     | S4 Pure Literature *(S3 rows have empty `Subject`)*    | Pure Literature            |
| `SLit(Comb)`   | S3, S4 | S3 Combined Literature, S4 Combined Literature         | Combined Literature        |
| `SSoc`         | S3, S4 | S3 Social Studies, S4 Social Studies                   | Social Studies             |

S3 Combined Chemistry, S4 IP Chemistry (1 row), S4/5 Combined Physics overlap
notes are in the source CSV — `displaySubject` covers them; the raw codes
above are what currently appear after the AH-column reverse-lookup.

## JC (`jc-june-2026`)

| Raw code | Levels | Shown alongside display | Friendly label |
|----------|--------|-------------------------|----------------|
| `BIO`    | J1     | J1 Biology              | Biology        |
| `CHEM`   | J1     | J1 Chemistry            | Chemistry      |
| `ECON`   | J1     | J1 Economics            | Economics      |
| `GP`     | J1     | J1 GP                   | General Paper  |
| `MATH`   | J1     | J1 Math                 | Math           |
| `PHYS`   | J1     | J1 Physics              | Physics        |

All 299 JC sessions have a non-empty `Subject` after the parser refactor that
suffixes duplicate CSV headers (`scripts/csv_to_sessions2json.ts`).
