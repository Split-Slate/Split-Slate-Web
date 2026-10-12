# Competitive Landscape

A dated record preserving competitor content lessons, visual references, and launch-copy constraints.

Last updated: 2026-10-12
Product research snapshot: May 2026; volatile facts were rechecked on 2026-08-20.
Website-content review: 2026-10-10, covering eight user-selected websites.
Source: `app-featureset-context/expense-splitting-apps-feature-tables.md.pdf` + `app-featureset-context/Expense-Splitting Apps_ Market Opportunity Analysis for a Splitwise Alternative.pdf`

This is research evidence, not the implementation roadmap. Current product status lives in
[[index]]. Official rechecks: [Splitwise Pro limits](https://kb.splitwise.com/pro/what-is-splitwise-pro),
[Splid on Google Play](https://play.google.com/store/apps/details?id=splid.teamturtle.com.splid),
[PeerSplit repository](https://github.com/tanayvk/peersplit), and [Spliit](https://spliit.app/).
The product tables below retain their historical research scope; the later website review is
separate evidence about marketing content, not a new verification of competitor functionality.

---

## Major Players & Fatal Flaws

| App | Model | Strongest Region | Fatal Flaw |
|-----|-------|-----------------|------------|
| Splitwise | Freemium; regional subscription pricing | US, India, Europe | Paywall backlash; the 2026-08-20 official-documentation recheck listed 4 expenses/day on the free tier |
| Tricount (bunq) | Free + ads | France, Europe | Post-bunq redesign hated; no UPI; CSV export removed in v8 |
| Settle Up | Freemium; regional subscription pricing | Czech Republic, Europe | Sync failures and ads were prominent complaints in the source snapshot |
| Splid | Free + one-time IAP | Germany, US (travelers) | No web version; Android was updated in August 2025 |
| SplitMyExpenses | Freemium subscription | US | Web-primary; native apps were new in the source snapshot |
| Splitkaro | Freemium subscription | India | India-focused; source snapshot reported group-delete and back-date bugs |
| Spliit | Free, open-source/self-hosted | Self-hosted niche | No native mobile app; niche audience |
| SplitPro | Free, open-source/self-hosted | Self-hosted niche | No native mobile app; niche audience |
| PeerSplit | Fair-source, local-first P2P | Privacy/P2P niche | No native mobile app; niche audience |

---

## Feature Monopolies Reported in the May 2026 Snapshot

- **Ultrasound device-to-device group join** — Settle Up
- **Voice assistant integration** — Settle Up
- **Auto-fetch from Swiggy/Zomato/BlinkIt** — Splitkaro
- **SMS expense auto-detect** — Splitkaro
- **P2P sync, no central server** — PeerSplit
- **Group Premium splittable among members** — Settle Up
- **Charge review share-link** — SplitMyExpenses

---

## Research-Identified Table Stakes

These are market recommendations from the source snapshot, not a statement that split-slate has
implemented them.

- Equal / unequal / percentage / share splits
- Multi-payer per expense
- Debt simplification
- Multi-currency entry
- Offline use
- No-account / link-based joining
- CSV export
- Dark mode
- Push notifications

---

## Features Reported Gated or Missing in the Research Snapshot

- Receipt OCR with item-level assignment — only SplitMyExpenses + Splitkaro do this well
- Sub-groups — explicitly refused by Splitwise; no one else has it either
- True UPI deep-links (India) — only Splitkaro; UPI protocol prevents direct third-party links
- Search expense history — Splitwise gates behind Pro; most others free
- Group admin / read-only members — Settle Up (free read-only), Splitkaro (Paid), SplitPro

---

## Business Model Groupings

- **Freemium subscription**: Splitwise, Settle Up, Splitkaro, SplitMyExpenses
- **Free/ad-supported in the source snapshot**: Tricount v8+
- **One-time/lifetime purchase**: Splid, splitty
- **Open-source/self-hosted**: Spliit, SplitPro
- **Fair-source/local-first P2P**: PeerSplit

---

## Website Content Review — 2026-10-10

Purpose: retain the lessons behind the next landing-page content pass without copying competitor
wording or treating their claims as implemented Split Slate features.

### Evidence and Limits

- The review covers the eight sites linked below. The user found them within their first two Google
  results pages; their ranking positions were not independently verified. Page wording alone does
  not establish why a site ranks or how well it converts.
- Six homepages exposed readable content through direct fetching. `splitslate.com` and `spliito.com`
  initially returned JavaScript shells; their published copy was inspected, then the user supplied
  rendered homepage HTML to complete the content evidence. No competitor browser automation ran.
- Marketing statements are observed claims, not feature, pricing, security, or performance audits.
  The supplied HTML was synthesized, not saved as a transcript or copied into our implementation.
- **Spliito** (`spliito.com`) in this review is distinct from **Spliit** (`spliit.app`) in the older
  product-research table.

### Site-by-Site Lessons

| Website | Observed content approach | Lesson for Split Slate |
|---------|---------------------------|------------------------|
| [Splitwise](https://www.splitwise.com/) | Leads with reduced relationship stress and named audiences, then explains tracking balances, organizing expenses, adding bills, and recording repayments. Separates core and Pro capabilities. | Pair emotional positioning with explicit product actions and recognizable use cases. Do not rely on a slogan to explain the category. |
| [Splid](https://splid.app/english/) | Friendship-focused headline followed by travel, offline use, currency, export, and download benefits. | Explain benefits in everyday language: what the user can do and why it helps, rather than leading with technical architecture. |
| [Kittysplit](https://www.kittysplit.com/en) | Walks named friends through a shared-cost example, sharing, and repayment. Links dedicated use-case and alternative pages. | Make the animated expense example teach the complete workflow. Later content can address specific situations instead of repeating the homepage. |
| [SplitSlate](https://splitslate.com/) | Rendered page explicitly describes splitting expenses, groups, balances, and repayments; organizes features, process, use cases, pricing, and FAQs. Free and paid capabilities are distinguished. | Make capabilities and product questions concrete. Use the structure as inspiration, not its pricing, copy, technology, or feature promises. |
| [Splitkaro](https://www.splitkaro.com/) | Presents scattered transactions as the problem and financial contexts as the answer. Uses specific household, travel, personal, couple, and team examples with demonstrative UI. | Build a problem → solution narrative around recognizable expenses such as rent, groceries, hotels, and taxis. Borrow specificity, not unsupported automation or usage statistics. |
| [Spliito](https://spliito.com/) | Focuses on knowing who owes whom, three understandable benefits, browser/no-signup convenience, and a four-step create/share/record/settle tutorial. Names travel and smaller social occasions. | Put the outcome and ease of starting upfront; make steps understandable without prior category knowledge. Sharing mechanics must match our own approved launch design. |
| [ExpenseSplit](https://expensessplit.com/) | Offers calculators, worked explanations, FAQs, and linked guides for trips, rent, meals, fuel, groceries, subscriptions, and other specific problems. | Later SEO content should solve distinct user problems with useful examples or tools, not create repetitive keyword pages. |
| [MoneySplit](https://www.moneysplit.in/) | Uses explicit bill-splitting/category language, spending-to-settlement steps, concrete trip/roommate expenses, and linked product/use-case/guide pages. | Explain the category plainly and connect the homepage to genuinely useful supporting content when the SEO phase begins. |

Additional Kittysplit examples inspected:
[house sharing](https://www.kittysplit.com/en/house-sharing) and
[Splitwise alternative](https://www.kittysplit.com/en/splitwise-alternative).
Their presence demonstrates content organization, not independently verified comparative claims.

### Lessons to Carry Into the Next Content Pass

1. **Improve literal clarity independently of the visual direction.** The creative headline must
   be accompanied by an immediate explanation of splitting bills, tracking shared expenses, and
   seeing who owes whom. Retaining the original editorial styling was the earlier content-pass
   constraint; a subsequent full rebrand was tried and rejected as overkill. The user chose to
   restore that original styling, then refine its fonts without another full redesign.
2. **Use concrete situations.** Name trips, roommates, rent, utilities, groceries, meals, transport,
   and shared events where relevant. Explain the shared-cost problem, not merely a lifestyle label.
3. **Let the example teach.** Show who paid, which people share the cost, their allocations, and
   suggested repayments. Motion should make that relationship easier to follow, not obscure it.
4. **Give readers a complete workflow.** Describe group creation, participation/sharing, expense
   recording, split selection, balance review, and recording repayments in terms of the approved
   launch experience. Do not import another app's invitation or account model by implication.
5. **Explain useful features individually.** Five split methods, multiple payers, balances, group
   synchronization, offline use, exports, and backups need understandable outcomes and examples.
6. **Answer practical questions.** Cover uneven contributions, multiple payers, currency behavior,
   sharing, installation, data handling, backups, device changes, pricing, and how repayments work.
7. **Do not treat no-signup as a unique differentiator.** Kittysplit and Spliito already emphasize
   it. Describe our combination of benefits and distinguish local use from any future sync identity
   requirements once those are approved.
8. **Preserve low-friction entry.** Keep clear app-entry calls to action and explain installation
   inside the app. The separate marketing site must not enter the installed PWA or its offline cache.
9. **Plan supporting content after the page review.** Use-case guides, calculators, and carefully
   sourced comparisons are candidates for SEO. Do not keyword-stuff, invent testimonials/rankings,
   reuse competitor assets, or copy their analytics/scripts/schema as an implementation template.

### User-Approved Copy Constraints

- **Keep the product name Split Slate.** The existence of `splitslate.com` was discussed; the user
  explicitly chose to keep the name. Do not reopen naming as a prerequisite for this content work.
- **Write for the launch product.** Approved planned features can be described in present tense;
  public copy should not contain development-status or missing-sync disclaimers. The user intends
  to release only after every advertised promise is available.
- **Maintain honest internal status.** Track each exact promise, website location, implementation
  state, remaining work, and required release verification. Marketing copy is not evidence that a
  feature exists in the current source. Future sessions must retain this distinction.
- **Known pending launch promise: live group synchronization.** The user committed to implementing
  it before release. The approved content pass now advertises shared-group updates and access on
  another device, with exact claims/locations and current-source gaps recorded in the canonical
  website launch promise ledger in [[product-roadmap]]. Access model, pricing, detailed sync design,
  implementation, and release evidence remain pending.
  Do not automatically promise free sync, account-free cloud participation, end-to-end encryption,
  mixed-currency conversion, OCR, bank imports, or other competitor capabilities.
- **Public release is gated by advertised capability delivery.** Review all claims, including
  interactions between them (for example, offline behavior plus shared updates), before publishing
  the launch site. This gate does not authorize commands; [[testing-strategy]] still controls runs.
- **SEO remains a later phase.** This approval records lessons and copy direction; it does not
  approve production-domain metadata, new public pages, extra features, or technical implementation.

Application status: the user approved the six-file content pass on 2026-10-10. The landing page now
uses an explicit product description, concrete use cases, practical FAQs, and present-tense sync
copy, while retaining its editorial design and motion. The website launch promise ledger is in
[[product-roadmap]]; it distinguishes launch copy from current implementation. This did not change
app/PWA source, copy competitor assets/scripts, or start the technical SEO phase. The later
The initial 2026-10-12 audit formatted existing landing source and checked JavaScript syntax only.
Its approved continuation passes 12 local desktop/mobile landing cases, covering gallery navigation,
focus/scroll restoration, reduced-motion accounting, no-JavaScript links, prior-install offline access,
responsive overflow, and reversible story state. It repairs decorative orbit overflow at 280px and
bumps the landing snapshot version. This is not new evidence about any competitor, deployed updates,
or real-device behavior. See [[testing-strategy]] and [[product-roadmap]].

---

## Visual Rebrand References — 2026-10-10

Purpose: retain the user's typography/scroll-motion references separately from expense-app
competitor research. These sites are not product or feature models for Split Slate.

### Direction and Checkpoint

- The user initially requested a full rebrand, then rejected the implemented reference-informed
  direction. Their final clarification: the animations were good, but the UI/motion combination
  was overkill for this expense-splitting product; the earlier design was better with font changes.
  They explicitly approved exact restoration first, followed by a separately approved upright
  typography refinement. The product name and agreed launch-copy constraints still apply.
- User-selected references: [Vibor](https://www.vibor.it/),
  [MIMCO Capital](https://www.mimcocapital.com/), [Raven](https://raven-trading.com/), and
  [Saisei](https://saisei-sbj.webflow.io/). The user liked some fonts and scroll animations without
  selecting exact sections. Do not infer that they approved every reference effect or color palette.
- At the user's request, commit `5cdbf6a` (`chore: checkpoint landing page before visual rebrand`)
  preserves the five landing files and four related wiki files before the next redesign. It was
  committed locally and not pushed. No reset/revert or permission to discard unrelated work is implied.
- HTML, CSS, and available public animation source were inspected. The approved Chromium review
  completed eight captures at 1440×900 and 390×844, with an entrance wait and six scroll samples
  per page. Screenshots, recordings, and `results.json` are under
  `/tmp/opencode/brand-reference-review/`. This is partial-page reference sampling, not a full
  usability/performance audit or a test of our landing page.

### Source-Confirmed Typography and Motion Techniques

| Reference | Typography declared by the site | Relevant source evidence |
|-----------|----------------------------------|--------------------------|
| Vibor | Formular variants, Formular Mono, and Canela. | Large mixed-family statements, masked translated/rotated headings, desktop-specific entrance transforms, Lottie brand artwork, and background video containers. |
| MIMCO Capital | Aeonik across weights plus Aeonik Air. | Homepage intro/interactive-image modules; GSAP ScrollTrigger, line reveals, and image parallax in the public application bundle. |
| Raven | PP Mondwest, PP NeueBit, Neue Montreal, and JetBrains Mono. | Pixel/display/mono contrast in the hero, text-scramble hooks, numbered chapter navigation, light/dark theme variables, scroll-snap rules, and Three.js imports. |
| Saisei | Aeonik with PP Fragment serif. | Fluid oversized type; staggered masked line reveals, scroll-scrubbed character rotation/scale, image parallax, and coordinated panel/menu timelines in the public bundle. |

These are declared families and available implementation mechanisms, not a claim that every
mechanism ran successfully or that font names alone reproduce the visual result. Several reference
fonts are commercial; serving a font publicly does not grant us a redistribution license.

### Rendered Capture Findings and Limits

- **Vibor:** the page and its intro transition rendered; the large brand wordmark and mixed-weight
  text composition were captured on desktop/mobile. Its embedded Vimeo video showed a connection
  security restriction, so the video content/effect is not a reviewed reference.
- **MIMCO:** captured large white branding over architecture imagery and the transition to a
  light, generously spaced typographic introduction. Aeonik was the computed body font. No page
  exceptions were recorded in these samples; this is not a claim that all site behavior works.
- **Raven:** both sizes reported `Cannot read properties of null (reading 'style')`. The desktop
  loader remained visible while underlying scroll samples contained scrambled headings; that
  obscures the intended composition. Mobile exposed the page with PP NeueBit hero text and
  JetBrains Mono subheads. Do not describe the blocked desktop experience as successfully observed.
- **Saisei:** captured oversized PP Fragment branding, a dark photographic opening, a light serif
  introduction, and rearranged heading/image layouts on mobile. The source supplies evidence for
  character-rotation/stagger mechanics; sampled screenshots alone do not establish their timing.
- No loader bypass, embedded-video workaround, retry, installation, or local preview server ran.
  Do not infer all-browser, physical-device, reduced-motion, or complete-page coverage.

### Transferable Design Lessons and Boundaries

- Use deliberate family contrast, size, weight, spacing, and alignment, but match the product's
  scale. The current preference is a restrained font-focused refinement of the restored page,
  not oversized typography/immersive choreography because unrelated references use them.
- Build a few coherent sequences with a beginning, transition, and resolved state. Use masks,
  stagger, scale, and parallax to coordinate the composition rather than revealing every card alike.
- Translate motion into this product's meaning: separate contributions, a shared total, fair
  allocations, and clear repayments. Do not import architecture, manufacturing, or crypto claims.
- Keep product explanations and the canonical [[product-roadmap]] website-promise ledger intact.
  A more immersive composition is not permission to remove useful FAQs or invent product features.
- Do not copy reference logos, photography/video, font binaries, animation bundles, or analytics.
  Properly licensed self-hosted alternatives are candidates; reference commercial fonts require
  an appropriate license. Space Grotesk/Instrument Serif were acquired for the discarded rebrand,
  then their two fonts and two license files were removed during approved restoration. The current
  typography at that checkpoint used approved Manrope/Zilla Slab Latin WOFF2 assets and SIL OFL notices.
  Unsupported glyphs use generic system fallback, not additional downloaded families/subsets.
- Reference loaders, forced scroll snapping, hidden scrollbars, and disabled pinch zoom are not
  requirements. Preserve ordinary scrolling, readable content without JavaScript, keyboard access,
  reduced-motion handling, and lighter mobile behavior.
- Website-only rebranding must preserve the independent manual Netlify deployment and stay outside
  the installed PWA, app source/build/cache, and existing browser-data origin. SEO remains separate.

### Discarded Website-Only Rebrand

The user explicitly approved the thirteen-file rebuild plan and the bounded two-font/license
download. That implementation replaced the receipt composition with near-black/chalk/vermilion,
paired-plane geometry, oversized typography, masked character entrances, scroll-separated hero
lines, progressive text resolution, and a sticky contribution/shares/repayment sequence. The split
demo uses proportional full-width panels instead of decorated receipt cards. Functional launch
copy, FAQ/fact claim anchors, separate deployment, and app-entry boundaries are retained.

That version opened with “Shared life. Clear slate.” and did not copy reference photography,
videos, loaders, commercial fonts, or proprietary assets. These describe discarded source, not
the current page. Its approved formatter/syntax commands passed; browser scenarios at 280/320/390px
completed before the user stopped execution. The interrupted batch ended with a context cleanup
error, not complete coverage. No retry or deployment followed the refusal.

### Restoration and Product-Fit Lesson

With explicit approval, the five landing files were restored exactly from checkpoint `5cdbf6a`,
and the four rebrand font/license files were removed. The receipt-based “Go halves. Stay whole.”
design, launch-state copy, and original motion became the baseline again. The app/PWA was not
changed, and wiki/reference findings were retained rather than reset.

**Good motion in isolation is not sufficient product fit.** For this app's landing, the user
preferred the earlier approachable composition to the more elaborate reference-derived UI.
Do not interpret appreciation of an animation as approval for more animation or a new visual system.

### Historical Approved Upright Typography Refinement

The user's first concern was excessive typography variety, and they explicitly disliked italics.
They suggested Montserrat, Clarity City, and Roboto Slab as examples of taste, not required choices.
The approved response uses two self-hosted families and only three configured variants:

| Variant | Intended role |
|---------|---------------|
| Manrope Regular 400, normal | Body copy, FAQs, explanations, supporting text. |
| Manrope Semibold 600, normal | Navigation, controls, labels, identities, financial amounts. |
| Zilla Slab Semibold 600, normal | Hero/main headings, receipt titles, selected display text. |

Manrope supplies clean geometric text; Zilla Slab supplies upright slab-serif character suited to
the restored receipt design. Both are SIL OFL 1.1 licensed. The two Manrope face declarations use
one variable Latin WOFF2; only 400/600 are configured, not a weight range. Zilla Slab is one static
600 face. Generic fallbacks handle loading failures/unsupported glyphs; no discretionary fallback
font list or separate monospace family remains. Semantic emphasis stays in markup but is upright;
browser-default bold is mapped to 600 and synthetic faces are disabled.

The approved eleven-file scope changes fonts, preloads, documentation, and typography size/spacing/
line-height only. Layout, colours, copy, animation script, favicon, app/PWA boundaries, and SEO
deferral remain unchanged. Current implementation and launch promises are in [[product-roadmap]].
The bounded official-source font/license download completed. No formatting, tests, browser runs,
servers, installations, or font-loading/layout verification ran for this refinement. The new
typography is implemented source, not a browser-verified visual result or permanent user acceptance.

---

### Current Source and Native Animation — 2026-10-11

The earlier font-pass description is historical. Source inspection for the new animation found
three different configured upright faces already in `landing/styles.css` and its local preloads:
Montserrat Regular 400 for body copy, Saira Bold 700 for headings, and Space Grotesk Semibold 600
for controls/identities/money. These current fonts and existing unused assets are preserved.
The wiki must not infer the current implementation from the earlier Manrope/Zilla Slab approval.

The user has now explicitly requested a complete notebook → frustration → phone → clear
repayments → relief story. This supersedes the earlier restrained-motion preference for the
opening experience, not the brand identity or the launch-capability constraints. The key metaphor
is visual continuity: the same handwritten Dinner/Taxi labels and $120/$30 elements move into
the illustrated app layout. Motion conveys removal of arithmetic, not merely digital note-taking.
Maya/Leo/Nina's $150 equal-split example correctly suggests Leo → Maya $20 and Nina → Maya $50.

The supplied prompt requested React/GSAP, but the user's subsequent explicit constraint takes
precedence: plain HTML/CSS/JavaScript, no build process, and drag-and-drop deployment. The approved
implementation uses original SVG strokes, native scroll-linked reversible transforms, shorter
mobile travel, and static reduced-motion/short-screen/no-JavaScript alternatives. No libraries,
dependency downloads, videos, or reference assets were added. The phone is an illustrated
walkthrough derived from app concepts, not a live app or a screenshot. Its former visible
walkthrough note was removed in the approved copy cleanup; the illustration/live-app distinction
still holds. See [[product-roadmap]].

Current implementation and deployment/accessibility boundaries live in [[product-roadmap]].

**Approved actual-app visual alignment:** the user supplied their mobile Overview screenshot and
requested its design with fictional story records. The native phone now uses the reference's
lavender canvas, purple net-position hero, rounded white Members/Suggested transfers/Recent
transactions cards in that order, full-width card actions, category/amount-below-title transactions,
and five-item bottom navbar. Names and amounts remain Maya/Leo/Nina's mathematically correct example.
It is a presentation replica, not an embedded live React app or a screenshot replacement.

To keep the replica faithful without rebranding the landing, the user approved one phone-only font
exception: the existing app's Plus Jakarta Sans WOFF2 is copied into `landing/fonts/`, with its SIL
OFL license. The app font applies to the phone and travelling digital labels/amounts; the three
landing typography roles and SVG handwriting remain unchanged. The approved asset batch copied
the local font and fetched its official notice. Nothing is downloaded at runtime, and no packages,
frameworks, build tools, app/PWA changes, or new launch capabilities were introduced.

Scroll-linked internal panning exposes the real card order without squeezing every section into
one miniature screen. The original travelling nodes dock into the clipped phone document and
return to paper on reverse scrolling. The hand and all non-phone artwork remain unchanged.

No browser, syntax, formatting, server, performance, or deployment verification ran for this
animation; it is implemented source, not a verified award-quality or production-ready result.

## Related

- [[market-opportunity]] — the gap Splitwise's paywall created
- [[user-pain-points]] — top complaints per app
- [[monetization-model]] — recommended pricing for split-slate
- [[product-roadmap]] — independent landing/PWA deployment and implementation planning
- [[testing-strategy]] — explicit approval requirements for verification and execution
