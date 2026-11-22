# App Identity: Mood, Tone & Theme

## Mood

- **Lively & Luxurious**. Luminous emerald-mist surfaces, deep forest emerald anchor bands, delicate champagne gold accents, and crisp marble-porcelain cleanliness.
- **Clear**. Put treatment descriptions, technology standards, and the steps of a visit where people can read them in order.
- **Warm**. Put calm conversations and transparent care with patients at the center of the clinic’s story.

## Tone (copy)

- Address the reader as «شما». Use plain language and explain what visitors can expect to discuss at each stage.
- Use Persian digits and the Persian thousands separator «٬», and show dates in the Jalali calendar. Use the locale helpers for both. Set phone numbers, email addresses, and URLs in `dir="ltr"`.

## Brand

The Avida wordmark pairs the clinic name with a thin tooth outline inside an emerald-and-gold medallion. Deep luxury emerald anchors key feature bands and the footer, while champagne gold accents highlight precision details, ratings, and focus milestones. Photography uses sunlit daylight, white marble, emerald foliage, and refined luxury clinic interiors, with illustrated imagery identified in its caption.

The homepage opens with the Emerald Horizon hero: a daylight portrait fades smoothly into a luminous pale emerald surface, framed by a subtle champagne gold kicker and curved porcelain edge leading into clinic highlights, the service directory, an implant & smile showcase, modern technology & sterilization standards, specialist care disciplines, and the first-visit guide. Fine porcelain grain adds tactile richness to emerald surfaces.

## Theme

- Use the theme's Tailwind classes (`bg-primary`, `text-muted-foreground`, `text-h2`…), never raw hex or the Tailwind
  palette. A new colour or type style is declared in `src/styles.css` first.
- Token names follow shadcn so the primitives keep working. **Naming trap**: the brand call-to-action fill is
  `highlight`; shadcn's `accent` is the quiet wash for hover and selected states.
- **Dark mode** is the `.dark` class on `<html>` (the theme toggle). Recolour through the tokens, never by theme in
  component code.
- Icons are Lucide. Their stroke width is set in `styles.css`; change it with a `stroke-*` class, not the `strokeWidth`
  prop.

## Constraints

These come from the language and accessibility, not from taste, so they hold whatever the design:

- Persian needs tall lines. Keep line heights generous and text at 12px or larger.
- The layout reads right to left, and forward-pointing icons point in the reading direction. The code rules are in
  [architecture.md](./architecture.md#language-direction-and-accessibility) and [i18n.md](./i18n.md).
- Text pairs at least 4.5:1; control edges, focus rings and large text at least 3:1. Check new colours in both themes.
- Every interactive element shows a visible keyboard focus. Status colours travel with an icon or a word, never colour
  alone. Movement respects `prefers-reduced-motion` (`motion-safe:` / `motion-reduce:`).
- Standalone controls have a minimum target of 44 × 44 CSS px (`--spacing-target`), following [WCAG 2.2 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html). Use larger targets for prominent controls when space allows.
