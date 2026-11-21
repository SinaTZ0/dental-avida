# App Identity: Mood, Tone & Theme

## Mood

- **Calm**. Pale blue surfaces, generous room around headings, and natural daylight in photographs.
- **Clear**. Put treatment descriptions and the steps of a visit where people can read them in order.
- **Warm**. Put conversations with patients at the center of the clinic’s story.

## Tone (copy)

- Address the reader as «شما». Use plain language and explain what visitors can expect to discuss at each stage.
- Use Persian digits and the Persian thousands separator «٬», and show dates in the Jalali calendar. Use the locale helpers for both. Set phone numbers, email addresses, and URLs in `dir="ltr"`.

## Brand

The Avida wordmark pairs the clinic name with a thin tooth outline. Deep blue anchors headings and the footer. Photography uses soft light, with deliberate cropping around faces and illustrated clinic imagery identified in its caption.

The homepage opens with the Blue Horizon hero. A daylight patient portrait fades into the blue introduction, with a curved edge leading into the service directory. The navy practice section separates services from the first-visit guide. Fine porcelain grain adds texture to the blue surfaces. The service directory, visit sequence, and questions use rules and spacing to establish hierarchy. Use a card when the content needs its own surface and actions.

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
- Tap targets are at least 40px.
