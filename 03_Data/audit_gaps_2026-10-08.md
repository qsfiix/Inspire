# Аудит пробелов в базе, 2026-10-08

Сверка базы со схемой швейцарской системы образования (berufsberatung.ch/de/bildungssystem). Только чтение, в базе ничего не менялось.

## Цифры на день аудита
- Школы: 514. Berufsfachschulen 217, Weiterbildungszentren 120, Gymnasien 91, FH 30, FMS 18, Unis 13, PH 10, интернациональные 10, частные 4, ETH/EPFL-тип 1.
- Профессии активные: 1655. other 825, Fachausweis 240, EFZ 185, Diplom 133, Uni 78, FH-Bachelor 67, HF 65, EBA 62.
- Ресурсы: 585, из них 305 без topic_code.

## Пробелы по схеме
1. Нет школ вообще: Brückenangebote (10. Schuljahr, Vorlehre, Integrationsvorlehre, Motivationssemester), Passerelle / Vorbereitungskurse, Handelsmittelschule (тип есть, 0 строк), искусство и музыка (ZHdK, HKB и т. д. почти нет), спортивные школы (2), Sonderschulen / Heilpädagogik (0).
2. Berufsmaturität: нет данных, какие Berufsfachschulen и BMS дают какое направление BM (BM1/BM2, технич./коммерч./...). BM-школ по имени только 2.
3. FMS: 18 школ в 12 кантонах; в AG, BL, SG, SO, SZ, TI, ZH, SH и ещё 8 кантонах 0. По факту FMS в ZH, AG, SG, BL существуют: проверить и догрузить.
4. Малые кантоны: AI 1, OW 2, UR 2, NW 3, AR 3, SH 3, GL 4, JU 6, SZ 7. Берусфшуле почти нет в AI, AR/NW/OW/UR, SH.
5. PH: 10 из примерно 15–18 (нет PHSG, PHTG, FHNW, PH Schwyz, PH Schaffhausen, HEP Fribourg, SUPSI-DFA и др.). FH: 30 записей (кампусы), без Kalaidos/FFHS и др.
6. Master и PhD в модели не различаются (профессии uni/fh_bachelor только).

## Глубина данных
- Условия приёма (admission_info_url / admissions_summary): Berufsfachschulen 0/217, Weiterbildungszentren 0/120, Gymnasien url 46/91, summary 0, FH 2/30, FMS 2/18, Unis url 9/13.
- Контакты: email есть у единиц (Berufsfachschulen 5/217, FH 0/30).
- Описания: нет у 28 Berufsfachschulen, 24 Gymnasien, 10 FH, 9 из 10 PH.
- Гео: все школы есть кроме 1 FH.
- Профессии: 825 типа other, 805 без школ. Это берусбератунг-профессии без классификации (часто Fachausweis-/Uni-пути, не EFZ). salary_notes пусты почти везде. Facts только для 30 профессий, фирмы для 30. profession_path_links 5, profession_resource_links 13 профессий (оценка по таблицам связей).
- Ресурсы по темам: Bewerbungsschreiben 4, Lebenslauf 2, Passerelle 6, Lehrstart 2, Lehrvertrag 6, Eignungstests 8, Plan B 7. В кантонах UR, VS, TI по 2 школьных ресурса.

## Предлагаемый порядок
1. Таблица переходов (граф) и тип «Programm» (BM, FMS-Profil, Passerelle, Brückenangebot).
2. Условия приёма по школам (Gymnasium, FMS, BMS, HF, FH).
3. Brückenangebote + Passerelle + HMS + BMS в базу (источник: кантональные порталы, bildungssystem).
4. FMS и малые кантоны.
5. Классификация 825 other, зарплаты (Salarium BFS), facts шире 30 профессий.
