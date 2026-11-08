# Black-accent visual refresh

## Purpose

The project owner identified appearance, layout, readability, and visual style as the remaining gap, specified Ross black accents, and requested a simple client walkthrough. This revision addresses presentation and orientation while retaining the assessment model and evidence behavior.

## Changes

- Black/charcoal sidebar and primary actions, white content surfaces, and a consistent neutral workspace palette.
- Larger form values and labels, stronger heading/body contrast, clearer selected profiles, consistent borders, spacing, buttons, and dialogs.
- A visible assessment step strip across Activity profiles, Assessment rubric, and Recommendation map. Links retain the selected activity and use the existing routes.
- Existing source/method editors retain their controls and behavior. Evidence-status colors remain semantic availability indicators, separate from brand accents.
- Export/restore actions sit at the page footer instead of floating over form content.
- `docs/CLIENT-DEMO.md` provides a 4–5 minute walkthrough using one synthetic A1 example. Configuration and source-maintenance screens are optional follow-up topics.

## Verification

- Production build passed.
- All 21 unit tests passed.
- All 26 desktop/mobile Chromium interaction tests passed.
- Five pages were checked at viewport widths 390, 768, 1024, 1440, and 1920: no page-level horizontal overflow.
- Desktop and mobile Activity Profile screenshots, dashboard, editor layouts, and typography were reviewed locally.
- The file-replacement browser check now explicitly waits for the asynchronous evidence save to complete before refreshing, rather than racing the file reader.
- `data/concepts.json`, `knime/`, and `src/lib/` have no changes. The built concept asset still matches its source.

The supplied Netlify deploy-preview URL returned HTTP 401 Unauthorized from this environment. Visual verification used the merged repository code and revised local build; the protected live page was not verified. No sign-in credentials were requested or bypassed.

This change is prepared for review on a branch. It is not merged or deployed by this task.
