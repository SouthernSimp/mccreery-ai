# Design QA

final result: passed

Source: `/Users/nate/Desktop/McCreery Redesign/selected-offline-mockup.png`, selected option 3 with the requested offline AI positioning. Original selected layout: `/Users/nate/.codex/generated_images/01a0f0e4-54e9-7021-aa7a-0611ab01679e/exec-8b675978-e5b5-48c5-b875-94d937a516e3.png`.
Implementation: in-app browser, `http://127.0.0.1:5233/`.
Final screenshots: `/Users/nate/Desktop/McCreery Redesign/audit-condensed-final.png`, `audit-condensed-hero.jpg`, `audit-condensed-mobile.jpg`.

## Comparison evidence
Source 876×1796 px. Desktop viewport 1440×840 CSS px at DPR 1, content width 1425 px including the browser scrollbar convention. Both images normalized to 650 px wide without stretching. Reduced motion enabled temporarily to compare the single hero and following sections to the flat mock; regular motion checked separately and restored. Mobile 390×844 and tablet 820×1180 checked; temporary viewport overrides reset.
Combined full view: `qa-final-full.jpg`; focused combined comparisons: `qa-final-hero.jpg`, `qa-final-services.jpg`, `qa-final-osat.jpg`, all in the same audit folder. Each comparison contains the reference and implementation together.

## Findings and fixes
- P2: Initial mobile moving cube obscured paragraph text (`qa-mobile-hero.jpg`). Added a warm vertical readability scrim. Post-fix `qa-mobile-hero-fixed.jpg` and `audit-condensed-mobile.jpg` show legible dark copy.
- P2: Header became solid when the services boundary just touched the viewport, including the reduced-motion opening (`qa-desktop-hero.jpg`). Require positive intersection ratio or a boundary already above the viewport. Post-fix opening is transparent (`audit-condensed-hero.jpg`).
- P2: Focusing the demo scrolled its heading underneath the fixed header (`qa-osat.jpg`). Focus the native video with preventScroll.
- P2: Services art had a right gutter and excessive height relative to the source (`qa-desktop-full.png`). Extended the image to the right edge and capped desktop height at 780px. Post-fix `qa-final-services.jpg` preserves the editorial split.

The final comparison has no outstanding P0/P1/P2 findings. Intentional changes follow the user's latest request to condense: one shorter scroll scene, shorter service headings and descriptions, one OSAT sentence, one contact section, and no repeated privacy paragraphs. Native video controls are retained for usability. Contact form appears below the reference's final call to action because existing real intake functionality is retained.

## Required fidelity surfaces
- Typography: Arial regular sans-serif for display/body, Georgia bold wordmark, Courier New labels. Clear display hierarchy, tight tracking, no truncation. Copy wraps naturally on mobile; shorter wording intentionally changes wrapping from the mock.
- Spacing/layout: Architectural full-screen opening, editorial service split, blue OSAT section, divided work rows. No horizontal overflow at desktop/tablet/mobile. One scene instead of three reduces motion travel while keeping the existing film.
- Colors: Warm paper #f5f3ee, ink #242523, pale OSAT blue #e5eef3. Warm transparent overlay preserves readability without covering the architecture. Visible focus rings retained.
- Image quality: Original production hero video/poster reused, generated service image matches the daylight architectural direction, actual OSAT video and still reused. No handmade replacement illustrations. Native media controls differ intentionally from the mock's still screenshot.
- Copy/content: Immediate custom software + automation + offline AI explanation. Hardware and ownership stated in plain terms. OSAT marked in development. Future Mac mini appliance availability is not claimed.

## Verification
Build and packaging checks passed; scroll/contact self-check passed without sending a live message. In-app browser verified forward/reverse film seeking, shortened sequence (378px scroll yielded 9.75s of a 15s film), navigation, mobile menu and Escape, required form fields, forward/back entry retention, real OSAT playback on desktop/mobile, reduced-motion poster, and no console errors in the final local state. No claim of full accessibility compliance or live contact delivery test.
