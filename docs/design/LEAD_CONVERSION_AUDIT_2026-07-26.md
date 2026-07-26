# Lead conversion plan audit - 26 Jul 2026

> Scope: `LEAD_CONVERSION_EXECUTION_PLAN.md`,
> `LEAD_CONVERSION_SYSTEM_UX.md`, `PRICING_LEAD_CONVERSION_UX.md`,
> roadmap D7/D8, the current CE site code, and
> `galaxyfunk/clara-chatbot` at its 26 Jul 2026 main branch.

## Executive verdict

The simplified M1/M2/M4 model is sound enough to design:

- M1 keeps a direct human path.
- M2 gives value while progressively collecting a hiring brief.
- M4 supports questions without interrupting browse pages.
- M3 stays available for legacy/direct traffic without adding another promoted door.

However, the original documents overstated likely conversion performance and
assumed capabilities that the current Pricing calculator and Clara widget do not
have. Those issues have now been corrected in the source documents.

**The M2 concept is a hypothesis, not proven best practice for CE.** V1 Book a Call
is the control. M2 should become the default only if it improves booked calls and
qualified HubSpot opportunities.

## Clara decision

### What Clara already does well

- RAG chat and streaming responses
- Q&A knowledge management and gap review
- session storage and summaries
- HubSpot contact upsert
- Calendly attribution
- embeddable widget and admin dashboard

### What Clara does not currently provide

- structured hiring-brief fields/events
- calculator context input
- a CE-owned split chat/living-brief experience
- a secure production embed contract for this use case
- complete staging CORS, durable abuse controls, webhook verification, privacy,
  and accessibility requirements

### Decision

Build M2 and M4 as CE-owned interfaces. Reuse or extend Clara selectively as a
headless backend only after a technical spike and the gates in
`LEAD_CONVERSION_EXECUTION_PLAN.md` §1a. Do not embed Clara `widget.js` as M2.

## Important findings and fixes applied

| Finding | Risk | Correction |
|---|---|---|
| `/schedule-a-call` is used in copy/code but is not a real route | Broken M1 CTA | Execution plan now defines canonical M1 behavior and `/book-a-call` fallback |
| Current Pricing calculator does not collect role/seniority | Wrong prefill and data contract | Docs now list actual fields: dev count, talent region, comparison country, currency, estimate range |
| Home calculator is decorative today | Wrong M2 placement assumption | First Home rollout deep-links to Pricing M2 |
| D7 said “do not promote M3” while Pricing offered Start Hiring | Strategy contradiction | Start Hiring removed as a Pricing/M2 door |
| “Highest conversion” was stated without CE evidence | Misleading design claim | Reframed as an experiment against V1 baseline |
| Clara widget lacks structured brief events | M2 cannot drive side panel | CE owns shell; backend must provide structured versioned fields/events |
| No CRM/Calendly handoff contract | Leads/context can be lost | Payload, destination, and failure rules added |
| No privacy/AI disclosure plan | UK/EU and trust risk | Consent, retention, disclosure, and deletion gates added |
| No accessibility/failure-state spec | Exclusion and dead-end risk | Keyboard, screen reader, reduced motion, mobile keyboard, and fallback requirements added |
| No measurement contract | Cannot know if M2 works | Event map and V1/V2 experiment requirement added |
| Legacy Clara and M4 could both load | Competing bubbles and speed cost | Legacy widget must be disabled before M4 launches |
| Psychometric/SLA claims were treated as available | Legal/trust risk | Claims are design-only until sales/legal approves wording |

## Remaining blockers before implementation

### Before Claude Design is final

- Confirm which example profile assets can be used honestly.
- Approve or remove psychometric/culture profiling claims.
- Confirm the exact sales-approved profile delivery SLA.
- Design M1 fallback, M2 loading/error, mobile keyboard, focus, and reduced-motion states.

### Before V1 code ships

- Choose one canonical in-content M1 behavior: shared Calendly popup trigger or
  `/book-a-call` route.
- Fix any `/schedule-a-call` 404 targets.
- Switch Location hero CTAs from Start Hiring to M1.
- Make Home, Hire Engineers, and Fractional CTO marketed CTAs non-dead.

### Before V3 AI/Clara integration

- Structured API schema with versioning
- signed session/embed token
- durable IP/workspace rate limiting
- explicit staging and production CORS
- Calendly webhook signature verification
- HubSpot property/object mapping and failure alerts
- transcript data controller/processor, retention, consent, and deletion policy
- accessibility and performance acceptance

## Acceptance standard

The plan is ready for Claude Design now, subject to the claim approvals above.
It is not ready for an AI production integration until the V3 gates pass.

Success is not “people chatted”. Success is:

1. Pricing estimate completed
2. M1 or M2 used
3. Calendly call booked
4. qualified HubSpot opportunity created

Keep V1 as the control and retain M2 only if it improves steps 3 and 4.
