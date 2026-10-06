# Master Database & ERD Specification — Section Index

Line-number map of the binding database & ERD spec at `.devin/rules/database.md` (workspace root; 1404 lines, 50 numbered sections, written in Persian). Use it to jump straight to the sections relevant to a task — read the section bodies in the spec itself, not here.

Section headers appear in the spec as markdown H1 `# N. Title` between `---` divider lines. Line numbers are 1-based and point at the section header line.

## Core principles

- §1 اصل اصلی Database — L13
- §2 شناسهها — L43
- §3 زمان — L69

## Identity, roles & status

- §4 User — L100
- §5 User Role — L137
- §6 User Status — L162

## Seller accounts

- §7 SellerAccount — L191
- §8 چرا SellerAccount جداست؟ — L234

## Sessions & verification tokens

- §9 RefreshSession — L268
- §10 VerificationChallenge — L303
- §11 PasswordResetToken — L343

## Categories & dynamic attributes

- §12 Category — L360
- §13 Category Hierarchy — L390
- §14 CategoryTranslation — L421
- §15 CategoryAttribute — L453
- §16 CategoryAttributeOption — L501
- §17 Dynamic Attribute Example — L524
- §18 Dynamic Attribute Storage — L550
- §19 Attribute Schema Evolution — L576

## Geography

- §20 Province — L609
- §21 ProvinceTranslation — L632
- §22 City — L651
- §23 CityTranslation — L673

## Listing core

- §24 Listing — L692
- §25 PricingType — L739
- §26 Condition — L777
- §27 Listing Status — L790
- §28 Listing State Machine — L803
- §29 Listing Version — L835

## Listing children: revisions, images, contacts

- §30 ListingRevision — L865
- §31 چرا Revision؟ — L899
- §32 ListingImage — L913
- §33 Image Variants — L940
- §34 ListingContactMethod — L958
- §35 Contact Value Rules — L984

## Engagement, moderation & audit

- §36 Favorite — L1002
- §37 Report — L1021
- §38 ModerationAction — L1061
- §39 AuditLog — L1089
- §40 ListingDailyStat — L1133

## ERD & data policies

- §41 Entity Relationship — L1162
- §42 Database Rules — L1202
- §43 Delete Strategy — L1219
- §44 Counter Strategy — L1243
- §45 JSONB Policy — L1260
- §46 Index Philosophy — L1280
- §47 Search Text — L1302

## Operations & completion

- §48 Database Migration Rules — L1334
- §49 Expansion Safety — L1358
- §50 Database Completion — L1387

---

Coverage: 50 sections mapped (expected 50); headers found in spec: 50; duplicate mappings: 0.
