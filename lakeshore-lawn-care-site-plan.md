# LakeShore Lawn Care Website Plan

## Goal
Create a small public website for LakeShore Lawn Care that helps local homeowners call or text for affordable lawn service.

Primary win: a visitor can understand the offer and call `616-307-4305` in one tap.

## Mode
New website / design pass / static implementation.

## User Lens
- Who: homeowners in Muskegon, Whitehall, Ferrysburg, Spring Lake Township, and nearby West Michigan.
- What they want: a clean yard, fair price, clear service area, fast quote.
- What they fear: hidden fees, no-show service, unclear pricing, yard being too big for the posted price.
- Friction to remove: hunting for the phone number, guessing what is included, wondering if photos are enough for a quote.

## Constraints
- Platform: static client site under `client-sites/lakeshore-lawn-care`.
- Technical: served by `server.js` through a slug route; no backend form handling.
- Budget: keep it light, fast, and easy to change.
- Time: first usable version now, not a broad brand system.
- Legal/compliance: no invented claims such as licensed, insured, guaranteed, same-day, top rated, or best in town.
- Existing system: keep the existing Pure Pressure site and admin preview untouched.
- Content: use only the provided Facebook post, comments, photos/context, phone number, and service towns.

## Assumptions
- Known fact: provided phone number is `616-307-4305`.
- Known fact: services include mowing, weed-whacking, edge trimming, and blowing hard surfaces clean.
- Known fact: they serve Muskegon and surrounding areas, with Whitehall, Ferrysburg, and Spring Lake Township mentioned in the thread.
- Guess: `$50` is a starting or standard mow price, not a guaranteed flat price for every property.
- Fragile assumption: users are comfortable texting photos for quotes. The Facebook replies suggest this is true, but it is not a formal business policy.

## Edge Cases
1. Yard is much larger than a standard lawn.
2. Two lots need service.
3. Leaf cleanup is requested.
4. User is outside the named towns.
5. User does not want to call.
6. User cannot text from desktop.
7. User wants recurring mowing.
8. User wants one-time cleanup.
9. User wants only weed-whacking.
10. User wants driveway blow-off included.
11. User thinks `$50` covers every job.
12. User needs a price before any visit.
13. User has no photos.
14. User has only one blurry photo.
15. User has tall grass.
16. User has wet grass.
17. User has a fenced backyard.
18. User has pets in the yard.
19. User has toys, hoses, or debris in grass.
20. User has steep or uneven areas.
21. User has narrow gates.
22. User needs work in Whitehall.
23. User needs work in Ferrysburg.
24. User needs work in Spring Lake Township.
25. User needs work near but not inside Muskegon.
26. User visits on slow mobile data.
27. User taps the sticky CTA near page bottom.
28. Mobile browser does not support `sms:` links.
29. Phone number typo would break leads.
30. User wants weekend service.
31. User wants same-day service, but that is not promised.
32. User wants leaves done twice.
33. User wants photo quote for two lots.
34. User wants hard surfaces blown but not washed.
35. User wants edge trimming around driveway.
36. User wants brush or tree work, which is not listed.
37. User wants snow service, which is not listed.
38. User wants commercial work, which is not listed.
39. User wants an exact arrival window.
40. User is comparing against a higher-priced crew.
41. User needs accessible large tap targets.
42. User uses screen reader.
43. Hero photo fails to load.
44. CSS fails and page should still show content.
45. JavaScript fails and phone links still work.
46. User scrolls past hero and still needs phone CTA.
47. User wants to copy the phone number.
48. User wants to know who to message.
49. User wants service for an overgrown lot.
50. User needs proof that trimming is included.

## Options Considered
### Option 1: Call-first one-page site
Use a strong hero, phone CTA, service list, quote-by-photo form, service area, and short FAQ.

Why it wins: fastest path to leads, matches the Facebook behavior, low risk, easy to maintain.

### Option 2: Bigger local business site
Add gallery, testimonials, long about section, separate services, and FAQ wall.

Why it loses now: more clutter, more unsupported claims, slower to ship, less useful for a small local offer.

### Option 3: Form-first lead capture site
Make the quote form the main action.

Why it loses now: no backend exists, and the Facebook thread shows phone/text is the current workflow.

## Recommended Path
Build Option 1.

Decision record: the page should spend its first screen on the brand, price signal, phone number, and what is included. Reject long proof blocks and fake trust claims until real business data exists.

Evidence that would prove this wrong: most leads say they refuse to call/text, or the business wants structured quote data more than quick calls.

## Wireframe
```text
DESKTOP FIRST VIEWPORT
┌─────────────────────────────────────────────────────────────┐
│ LakeShore Lawn Care                         Call/Text       │
│                                                             │
│ LakeShore Lawn Care                                         │
│ A clean yard, without the big price.                        │
│ Mowing starts at $50. Final quote depends on yard size.     │
│                                                             │
│ [Call 616-307-4305] [Text for a quote]                      │
│ Muskegon + Whitehall + Ferrysburg + Spring Lake             │
│                                                             │
│ Full-bleed local lawn photo                                 │
│                                                             │
│        Bottom edge shows: Mow | Trim | Blow clean           │
└─────────────────────────────────────────────────────────────┘

MOBILE FLOW
┌────────────────────────────┐
│ LakeShore Lawn Care         │
│ A clean yard...             │
│ [Call] [Text]               │
│ towns served                │
├────────────────────────────┤
│ What's included             │
│ 1 Mow 2 Trim 3 Blow clean   │
├────────────────────────────┤
│ Send photos for quote       │
└────────────────────────────┘
Sticky bottom: Call | Text
```

## Implementation Plan
1. Create `client-sites/lakeshore-lawn-care`.
2. Add a generated real-yard hero asset.
3. Build `index.html` with semantic sections and phone-first CTAs.
4. Build `styles.css` with a green photo-led visual system, expressive type, responsive layout, and mobile sticky CTA.
5. Build `script.js` to make the photo quote form open an SMS draft.
6. Register the static site in `server.js`.
7. Run syntax/server checks.
8. Verify desktop and mobile in browser.

## Prioritization
- Now: hero, phone CTA, price wording, services included, service area, quote-by-photo path.
- Later: real before/after gallery, Google Business link, real reviews, service boundaries, seasonal leaf cleanup page.
- Maybe: quote form backend, Messenger link, separate recurring mowing plan.
- Never: fake reviews, fake ratings, unsupported guarantees, generic SaaS sections.

## Risks
- Price wording can overpromise if `$50` is not universal.
- SMS links may not work on every desktop setup, so the form also prints a copyable text message.
- Generated hero image is a compressed JPG stand-in until real approved yard photos are available as project files.
- Leaf cleanup pricing is intentionally not promised.

## Acceptance Criteria
- Brand is clear in the first viewport.
- Phone number appears in hero, form area, footer, and mobile sticky CTA.
- `$50` is visible with a quote caveat.
- Included services are visible before deep scrolling.
- Service area mentions Muskegon, Whitehall, Ferrysburg, Spring Lake Township, and nearby West Michigan.
- No unsupported claims are present.
- Mobile CTAs are at least 44px tall.
- Page loads through `/lakeshore-lawn-care/`.
- Quote form opens a text message draft without needing a backend.

## Success Metrics
- Call/text click-through rate.
- Quote requests that include photos.
- Fewer price clarification messages.
- Lower bounce from mobile visitors.
- Time to first lead action under 10 seconds.

## Regression Check
- Existing `/pure-pressure-power-washing/` route still works.
- `/admin` still works.
- Static asset paths are scoped under the new site.
- Mobile sticky CTA does not cover key form controls.
- Page remains usable with JavaScript disabled.

## Dumbed Down
The page does one job: help people call or text Matthew for lawn care. It shows the price signal, what is included, where they work, and how to send photos for a quote.
