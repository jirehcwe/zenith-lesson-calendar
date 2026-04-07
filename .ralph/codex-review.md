# Code Review: Prefill Promocode Query Parameter

**Reviewer:** Claude (manual review — codex unavailable due to OpenAI usage limit)
**Commit:** e61dd03
**Branch:** ralph/feat/prefill-promocode

## Summary

Added `getPromocodeParam()` and `replacePromocodeInUrl()` to `src/utils/campaign.ts`, mirroring the existing campaign parameter pattern. Applied `replacePromocodeInUrl()` at all call sites where `replaceCampaignInUrl()` is used.

## Acceptance Criteria Checklist

- [x] `promocode` query parameter is read from the URL
- [x] `PROMOCODE` placeholder in form URLs is replaced with the promocode value
- [x] `WeeklyClassCalendar.tsx` applies promocode replacement to trial + registration links
- [x] `ListView.tsx` applies promocode replacement to trial + registration links
- [x] Fallback registration links from `getFallbackRegistrationLinkByLevel()` also get promocode replacement (they are wrapped inside the `replaceCampaignInUrl` call which is then wrapped by `replacePromocodeInUrl`)
- [x] When no `promocode` param is present, `getPromocodeParam()` returns `""` — `PROMOCODE` placeholder is replaced with empty string (harmless)
- [x] Existing `campaign` parameter functionality is unchanged
- [x] No TypeScript errors (`npx tsc --noEmit` passes)
- [x] No lint errors (`yarn lint` passes)

## Bugs / Issues

None found. The implementation is a straightforward mirror of the campaign pattern.

## Edge Cases

- **No `promocode` param:** Returns `""`, replacing `PROMOCODE` with empty string. This could leave a dangling `=` in the URL (e.g., `&entry.123=`), but Google Forms handles this gracefully — the field is simply left empty.
- **SSR / `window` undefined:** Handled correctly — returns `""` when `window` is undefined, matching the campaign pattern's SSR guard.
- **Multiple `PROMOCODE` occurrences:** The regex `/PROMOCODE/g` replaces all occurrences, which is correct.

## Security

- No injection risk: the promocode value is placed into a URL query parameter value position in a Google Forms URL. The URLs are rendered as `href` attributes, not executed as code.
- URL encoding: The promocode value is inserted as-is (no encoding). This matches the campaign pattern. Special characters in the promocode could technically break the URL, but this is a pre-existing pattern and the values are controlled by the business (e.g., `DISC20`).

## Additional Notes

- `CalendarView.tsx` and `BottomBanner.tsx` were also updated for completeness, even though they weren't explicitly listed in the acceptance criteria. These files also use `replaceCampaignInUrl()` and should consistently apply the promocode replacement.
- The fallback registration URLs in `prefillRegistration.ts` currently don't contain a `PROMOCODE` placeholder, so `replacePromocodeInUrl` is a no-op on them. If/when `PROMOCODE` placeholders are added to those URLs, the replacement will work automatically.
