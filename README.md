# Willow — Childcare Operations Platform

**Live site:** [https://raviacn95.github.io/child-management-system/](https://raviacn95.github.io/child-management-system/)

This folder used to list the **world’s most-forked GitHub repos in general** (TensorFlow, Bootstrap, Spoon-Knife, and so on). None of those are childcare systems.

What lives here now is a working **child / daycare / kindergarten management app** whose modules match the union of features in the most-forked GitHub projects actually about managing children.

## Run it

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). **Settings → country pack** switches India / UAE / Singapore / UK / US (currency, GST/VAT, vaccines, stages, COD). Reset demo if you still see old USD data.

**Willow Mart Auto Order** quotes nearby dark stores (Zepto / Blinkit / Instamart **sandbox partner adapters** — not live consumer APIs). Optional middleware: `node middleware/server.mjs` (Vite proxies `/qc-api` → `:8790`).

| Role | Email | Password |
|------|--------|----------|
| Director | `director@willow.care` | `demo` |
| Teacher (Oaks) | `teacher@willow.care` | `demo` |
| Parent (Leo & Mira Shah) | `parent@willow.care` | `demo` |

Try pickup PIN **4482** on Attendance for the Shah family.

## What was here before

A multi-root workspace plus `scripts/clone-top15.sh` pointed at global fork-farm / tutorial repos. That snapshot is obsolete. The product is `app/`.

## Top child-management GitHub sources (by forks)

Childcare-specific open source is a small set. Ranked among **kindergarten / daycare / childcare / infant-care** repos (not plant nurseries, not generic K–12 SMS unless noted):

| Rank | Repository | Forks (approx.) | What we took |
|------|------------|----------------:|--------------|
| 1 | [Amarjha01/InfantCareCompass](https://github.com/Amarjha01/InfantCareCompass) | 97 | Vaccination schedules, parent-facing health |
| 2 | [espoon-voltti/evaka](https://github.com/espoon-voltti/evaka) | ~17 | ECE operations, applications, employee + citizen (parent) portals |
| 3 | [wysheng/kindergarten](https://github.com/wysheng/kindergarten) | 15 | Illness/medicine logs, announcements, staff training |
| 4 | [Gracelaura/kindergarten-management-system-frontend](https://github.com/Gracelaura/kindergarten-management-system-frontend) | 13 | Admin + parent dashboards, attendance, discipline |
| 5 | [AnFengDe/afd_zaojiao](https://github.com/AnFengDe/afd_zaojiao) | 11 | Pickup/dropoff, enrollment |
| 6 | [darkweb-alt/tinysteps](https://github.com/darkweb-alt/tinysteps) | 11 | Daycare operations shell |
| 7 | [Gracelaura/kindergarten-management-system-backend](https://github.com/Gracelaura/kindergarten-management-system-backend) | 6 | Students, teachers, parents APIs |
| 8 | [christancone/project1](https://github.com/christancone/project1) (TinyToes) | 4 | Parent live updates |
| 9 | [NadunKulatunge/KidsCave](https://github.com/NadunKulatunge/KidsCave) | 4 | Nursery admin |
| 10 | [relyonOn/KindergartenManagement](https://github.com/relyonOn/KindergartenManagement) | 3 | Classes, notices, attendance, roles, photos |
| 11 | [gatsinski/kindergarten-management-system](https://github.com/gatsinski/kindergarten-management-system) | 2 | Multi-kindergarten |
| 12 | [cybasoft/carepro](https://github.com/cybasoft/carepro) | 1 | Meds, allergies, pickup PIN + photo, incidents, invoices |
| 13 | [rehan243/sunshine-care-daycare-saas](https://github.com/rehan243/sunshine-care-daycare-saas) | 1 | Multi-site, CACFP meals, CRM pipeline, PD hours |
| 14 | [YAS-1/Daystar_Daycare](https://github.com/YAS-1/Daystar_Daycare) | 1 | Enrollment, attendance, staff |
| 15 | [olamide226/nannybill](https://github.com/olamide226/nannybill) | — | Attendance board, automated billing |

Also folded in from the **most-forked school/child information systems** (they dwarf daycare-only repos): [changeweb/Unifiedtransform](https://github.com/changeweb/Unifiedtransform), [GibbonEdu/core](https://github.com/GibbonEdu/core), [frappe/education](https://github.com/frappe/education) — admissions, finance, messenger, medical records, planner/learning.

Production-shaped references used for depth: eVaka, Sunshine Care, Safari Leader, DayCarePro, BloomNest, Wren (EYFS diaries).

## Modules in Willow

- Role-based portals (director, teacher, parent) and **multi-site** switching
- Child profiles: allergies, custody, food, medical, weekly schedule, guardians, **authorized pickup PINs**, emergency/healthcare contacts
- **Admissions pipeline** (inquiry → tour → applied → waitlist → accepted → enrolled)
- **Attendance + secure handoff** (PIN / photo / kiosk / staff) with an audit log
- **Daily care diary**: meals, naps, diapers, mood, activities, photos
- **Health**: immunizations, medication administration, incidents, behavior notes
- **Billing**: invoices, partial pay, overdue, receipts
- **Staff**: time clock, shifts, certifications, PD hours, **licensing ratios**
- **Teacher workers**: five caseload teachers auto-monitor assigned children, then write a report plus meal, health, and education plans
- **Grow at home (parents)**: age-based BMI meal plans, dress orders, games, tricks, and **ten skills** (language, numeracy, motor, fine motor, social, music, art, science, focus, leadership)
- **Willow Mart (FirstCry-style shop)**: fashion, diapers, feeding, toys, gear, school — age + child-file recommendations, **Cash on Delivery**, GST, PIN-code delivery, and **Auto Order** quotes from Zepto / Blinkit / Instamart sandbox partner APIs
- **Country packs**: India (default) plus UAE, Singapore, UK, US — currency, stages, vaccines, meals, documents, holidays, payments
- Playgroup / Nursery / LKG / UKG, **GST + UPI fees**, **UIP/IAP vaccines**, FSSAI tiffin, **van routes**, WhatsApp notices, DPDP-minimised ID last-4
- Rooms/programs, messages + announcements, calendar, **learning observations**
- **CACFP-style menus** with allergen flags, documents with approval/expiry
- Supplies/inventory, occupancy & collection **reports**

Data is stored in the browser (`localStorage`). Reset it from Settings.
