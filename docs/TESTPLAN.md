# Test Plan — COBOL Account Management System

This test plan captures the current business logic and implementation behaviour of the COBOL application (files: `main.cob`, `operations.cob`, `data.cob`). Use this to validate with business stakeholders and as the source-of-truth when creating unit and integration tests in the Node.js migration.

Notes:
- Initial in-memory balance is `1000.00` (set in `data.cob`).
- All tests assume a fresh program start unless otherwise noted.
- For fields where the code does not implement validation, the table marks expected behaviour as "Observe/record" so stakeholders can confirm desired behaviour.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---:|---:|---|
| TC-001 | View current balance (TOTAL) | Program started (balance = `1000.00`) | 1) Launch program
2) Enter `1` (View Balance)
3) Observe output | Program displays: `Current balance: 001000.00` (or `1000.00` format consistent with display) |  |  | Confirms read-only path from `DataProgram` |
| TC-002 | Credit an account (CREDIT) — simple positive amount | Program started (balance = `1000.00`) | 1) Launch program
2) Enter `2` (Credit)
3) When prompted, enter `3000`
4) Observe output and view balance (option 1) | After credit, program displays: `Amount credited. New balance: 004000.00` and subsequent view shows `004000.00` |  |  | Confirms ADD, WRITE and in-memory persistence across calls |
| TC-003 | Debit an account (DEBIT) — sufficient funds | Program started (balance = `1000.00`) | 1) Launch program
2) Enter `3` (Debit)
3) Enter `500`
4) Observe output; view balance | After debit, program displays: `Amount debited. New balance: 000500.00` and subsequent view shows `000500.00` |  |  | Confirms SUBTRACT, WRITE when sufficient funds |
| TC-004 | Debit an account (DEBIT) — insufficient funds | Program started (balance = `1000.00`) | 1) Launch program
2) Enter `3` (Debit)
3) Enter `5000`
4) Observe output; view balance | Program displays: `Insufficient funds for this debit.` Balance remains `1000.00` |  |  | Confirms branch preventing negative balance and no WRITE call when insufficient funds |
| TC-005 | Debit exactly equal to balance | Program started (balance = `1000.00`) | 1) Launch program
2) Enter `3` (Debit)
3) Enter `1000`
4) Observe output; view balance | Program debits successfully. New balance `000000.00` (zero). |  |  | Confirms boundary equality handled as allowed (>= comparison) |
| TC-006 | Multiple sequential operations in same session | Program started (balance = `1000.00`) | 1) Launch program
2) Credit `500`
3) Debit `200`
4) View balance | After operations: 1000 + 500 - 200 = `001300.00` displayed |  |  | Confirms in-memory `STORAGE-BALANCE` updates persist across calls within same run |
| TC-007 | Exit behavior | Program started | 1) Launch program
2) Enter `4` (Exit) | Program displays: `Exiting the program. Goodbye!` and terminates |  |  | Confirms graceful termination path |
| TC-008 | Invalid menu selection handling | Program started | 1) Launch program
2) Enter `9` (or non 1-4 value) | Program displays: `Invalid choice, please select 1-4.` and returns to menu |  |  | Confirms menu validation for range 1-4 |
| TC-009 | Numeric input formatting — decimal amounts | Program started (balance = `1000.00`) | 1) Launch program
2) Enter `2` (Credit)
3) Enter `123.45` as amount
4) View balance | Program accepts decimal `123.45` and new balance is `001123.45` (two decimal places preserved). |  |  | Confirms decimal acceptance up to 2 places (PIC V99) |
| TC-010 | Very large credit near field limit | Program started (balance = `1000.00`) | 1) Launch program
2) Enter `2` (Credit)
3) Enter `999999` (or `999999.99`) | Expected: If within PIC limits (9(6)V99), operation succeeds and balance does not overflow; otherwise observe failure. Record actual behaviour. |  |  | Observe overflow handling — COBOL PIC limit is 6 integer digits + 2 decimals |
| TC-011 | Zero amount credit/debit | Program started (balance = `1000.00`) | 1) Choose Credit or Debit
2) Enter `0` as amount
3) View balance | For credit: balance unchanged; display appropriate message with same balance. For debit: if `0`, balance unchanged. |  |  | Edge case: check that zero is allowed and no unintended side effects |
| TC-012 | Non-numeric input for menu choice | Program started | 1) Launch program
2) Enter `a` or `hello` at menu prompt | Expected: Observe and record behaviour. Code uses `ACCEPT USER-CHOICE` into numeric `PIC 9` — current implementation has no explicit validation; behaviour is implementation-dependent. Record actual behaviour and decide desired handling. |  |  | Stakeholder must confirm desired validation rules (reject or sanitize input) |
| TC-013 | Non-numeric input for amount | Program started | 1) Choose Credit or Debit
2) When prompted for amount, enter `abc` or `12abc` | Expected: Observe and record behaviour. No validation present in code; likely to yield zeros or unexpected numeric conversion. Capture actual program behaviour. |  |  | Stakeholder must decide required input validation; this will guide Node.js tests and implementation |
| TC-014 | Persistence across program runs | Program started and exited after modifying balance | 1) Start program, credit `100` and exit
2) Restart program and view balance | Expected: Balance resets to initial `1000.00` because `STORAGE-BALANCE` is in-memory and initialized on program start. |  |  | Confirms storage is not persistent across process runs; if persistence required, stakeholder must specify external storage requirements |
| TC-015 | Display formatting consistency | Program started | 1) View balance multiple times after different operations | Expected: Balance consistently displays with two decimals and fixed width as implemented (leading zeros may be shown). |  |  | Stakeholders may request formatting changes (e.g., no leading zeros, currency symbol) |

How to use this test plan
- For each test case, execute steps against the current COBOL program and fill in `Actual Result` and `Status`.
- Where `Expected Result` says "Observe/record", capture the runtime behaviour and attach logs/screenshots for stakeholder review.
- After stakeholders confirm desired behaviour for each case (especially input validation and persistence), the same table will drive unit/integration test creation for the Node.js migration.
