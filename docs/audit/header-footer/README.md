<!-- @format -->

# WeshBazar Header, Navigation & Footer — Audit and Redesign

**Status:** Complete — Re-verified 2026-10-14 (critical corrections applied)  
**Date:** 2026-10-14  
**Auditor:** Senior Full-Stack / UX / Security Review  
**Scope:** Shared header, global navigation, mobile navigation, footer, and all authentication-dependent interface states across WeshBazar.

## Purpose

This audit delivers three documents:

1. **Verified current-state audit** (`01-current-state.md`) — what exists, file-by-file, with caller/dependency tracing.
2. **Comprehensive criteria catalogue and gap analysis** (`02-criteria-and-gap-analysis.md` + `criteria-register.json`) — traceable requirement catalogue with PASS/PARTIAL/FAIL status and evidence.
3. **Target design specification and implementation roadmap** (`03-target-design-and-roadmap.md`) — prioritized tasks with affected files, dependencies, and acceptance criteria.

## Document Index

| Document                          | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `README.md`                       | This index and methodology summary.              |
| `basec.md`                        | Original audit specification and instructions.   |
| `review-inventory.md`             | Every file, component, page, and test inspected. |
| `findings.md`                     | Condensed list of defects and observations.      |
| `criteria-register.json`          | Machine-readable requirement catalogue.          |
| `01-current-state.md`             | Narrative audit of the current implementation.   |
| `02-criteria-and-gap-analysis.md` | Current vs. required behaviour, per criterion.   |
| `03-target-design-and-roadmap.md` | What to build, in what order, with what tests.   |

## Methodology

1. **Repository investigation**: Every layout component, header, footer, nav, and auth file was read and traced.
2. **Dependency tracing**: For each component: file path, line ranges, callers, data sources, tests.
3. **Authentication-state matrix**: Behaviour verified or documented for anonymous, authenticated, verification, seller, and admin states.
4. **Link inventory**: Every footer and nav link destination verified against existing routes.
5. **API contract verification**: All auth and session endpoints cross-referenced against `weshbazar-backend/docs/openapi.json`.

## Constraints

- Backend API frozen at v1.0.0. Never invent endpoints.
- Use `docs/openapi.json` as HTTP contract.
- Frontend language: Persian/Dari. Default direction: RTL.
- Do not modify backend. Do not invent unsupported features.
- Do not start by replacing existing header or footer.

## Priority Definitions

- **P0**: Security, privacy, account-switching, or session correctness defects.
- **P1**: Broken primary navigation, authentication transitions, or core marketplace actions.
- **P2**: Major usability, accessibility, responsive, and performance defects.
- **P3**: Optional visual polish.
