# Curriculum data

The `/curriculum` page, the official-syllabus panel on subject pages and the subjects created by `npm run seed` all come from `src/data/curriculum`.

| Batch | Scheme (source of truth for codes, names, L-T-P-C) | Syllabus (topics + references) |
| --- | --- | --- |
| 2025–26 onwards | `RAI-Scheme.pdf`: Sem 1–8, 160 credits, plus the 160 + 18 Minor/Honours scheme | `RAI-Syllabus.pdf`: Sem 3–8 |
| 2024 batch | `Scheme & Syllabus_BTech_R&AI_B.Tech 2024-04.02.2025.pdf`: Sem 3–8 (120 of 160 credits), Honours and 3D-printing minor | Same file: Sem 3–4 courses only |

The admissions brochure (`Robotics-&-AI-Mechatronics.pdf`) is used only for the "About the programme" copy on `/about`. Its statistics aren't reproduced.

## Files

- `schemes.ts`: both schemes transcribed by hand from the PDFs. Placeholder codes (`RAIXXXX`, `MASXXXX`, `XXXXXXX`…) are kept exactly as printed.
- `syllabus-2025.ts`, `syllabus-2024.ts`: syllabus text extracted from the PDFs with a parser, then spot-checked. Topics and references are reproduced as printed, including the documents' own typos.
- `index.ts`: helpers, including `catalogSubjects()` (what `npm run seed` creates) and `findCurriculumCourse()` (subject page → syllabus).
- `npm run test:curriculum`: checks that semester credits add up to the printed totals and every syllabus link resolves.

When the department publishes a new scheme, add a new `BatchCurriculum` rather than editing an old one. Each batch keeps its own scheme.

## Differences between the documents

The scheme code is shown everywhere, and each difference is also noted under the course on `/curriculum`.

### 2025–26 onwards: scheme vs syllabus

| Scheme | Syllabus | Note |
| --- | --- | --- |
| RAI2101 Embedded Controllers | MCE2101 | code |
| RAI2103 Strength of Materials | MCE2103 | code |
| RAI2241 Robot Gripper Design (PE1) | MCE2241 | code |
| RAI3105 Mobile Robots | MCE3105 | code |
| RAI3131 Modeling and Simulation Lab | RAI3130 | code (RAI3130 isn't used in the scheme) |
| RAI3132 Robotics Lab | RAI3131 | code (RAI3131 is the scheme's Modeling and Simulation Lab) |
| RAI3271 Project Based Learning - 2 | MCE3171 | code |
| RAI3202 Reinforcement Learning in Robotics | RAI3102 | the syllabus reuses Deep Learning's code |
| RAI3254 Intelligent Systems (PE5) | MCE3254 | code |
| RAI3264 Machine Vision (PE6) | RAI3260 | code |
| RAI4155 AI in Industrial Applications (PE8) | MCE4153 | code, **and the syllabus prints e-mobility topics under this title**, so no topics are shown |
| RAI3180 Data Analytics and Visualization (Honours) | MCE3180 | code, **and the syllabus prints intro-to-mechatronics topics**, so no topics are shown |
| RAI3190 Additive Manufacturing (Minor) | MCE3190 | code |
| Internship: `RAIXXXX`, 0-0-0-1 (Sem 7) | RAI4170, [0 0 2 1] | code + L-T-P |
| Major Project: RAI4170, 0-0-12-12 (Sem 8) | RAI4270, [0 0 0 12] | code + L-T-P; the Honours page of the scheme also uses RAI4270 for the major project and RAI4170 for the internship |
| Technical Report Writing `XXXXXXX` | XXX22XX | placeholder codes differ |
| Statistics & Probability `MASXXXX` | MAS21XX | placeholder codes differ |
| Principles of Management / Engineering Economics `MBBXXX/MEEXXXX` (Sem 3 and Sem 4) | MBB2001 Principle of Management; MEEXXXX Engineering Economics | the scheme lists the combined row in both semesters; both syllabus entries are shown |

L-T-P differences (credits agree): RAI2130, RAI2131, RAI2232, RAI3131, RAI3132 and RAI3231 are 0-0-1-1 in the scheme but [0 0 2 1] in the syllabus. RAI3232 Pneumatics and Hydraulics Lab is 0-0-2-2 vs [0 0 4 2]. RAI2271 Project Based Learning - 1 is 0-0-3-3 vs [0 0 0 3]. RAI4171 Project Based Learning-3 is printed as [3 0 0 3].

The syllabus title says "160 and 180 Credits"; the scheme says 160 and 160 + 18 = 178.

On the scheme's Honours page, the Semester 7 table lists three open electives, but its total of 19 credits only allows for two.

### 2024 batch: scheme vs syllabus

| Scheme | Syllabus | Note |
| --- | --- | --- |
| RAI2170 Project-based Learning-1 (Sem 3) | RAI2270 "Project Based Learning-I" | the syllabus uses the scheme's PBL-2 code |
| MAS21XX / MEE22XX Statistics & Probability | MAS2001 Statistical Methods and Probability Theory | code + title |
| CSE22XX Data Structures and Algorithms (Flexi Core 1, 3-1-0-4) | CSE2101, [3 1 0 3] | code + credits |
| CSE21XX Object Oriented Programming (Flexi Core 2) | CSE2122 Object Oriented Programming using Python | code + title |
| RAI3101 Design of Machine Elements | — | the Honours page of the same document lists RAI3101 as "AI in Robotics" |
| PE5: RAI3150 / RAI3151 / RAI3152 | — | these codes are already used by the PE3 courses (Cyber Physical System, Digital Signal Processing, Advance Control Systems) |

## Not in the documents

- The 2024 batch's first year (Sem 1–2) isn't in its scheme document.
- No syllabus for Sem 5–8 of the 2024 batch, Sem 1–2 of 2025, RAI0006 Manufacturing Process (OE6), or the 2024 flexi-core-3 options.
- The syllabi list topics, not numbered units, so seeded subjects have no units. Admins can add units in Admin → Catalogue.
