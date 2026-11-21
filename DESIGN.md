---
name: Avida Dental
description: A Persian dental practice website with a blue palette, airy typography, and daylight photography.
colors:
  primary: "#1c608e"
  primary-hover: "#16496e"
  primary-foreground: "#fff"
  primary-dark: "#8bc3ef"
  primary-hover-dark: "#afd7f6"
  primary-foreground-dark: "#102b45"
  highlight: "#124c79"
  highlight-hover: "#0c375a"
  highlight-foreground: "#fff"
  highlight-dark: "#b6dcfa"
  highlight-hover-dark: "#d2eaff"
  highlight-foreground-dark: "#122e48"
  brand-text: "#1b629b"
  brand-text-dark: "#9cd0f9"
  brand-jade: "#28766a"
  brand-jade-dark: "#90d4c5"
  brand-jade-surface: "#dcefea"
  brand-jade-surface-dark: "#193a3b"
  hero-surface: "#e3eef9"
  hero-surface-dark: "#172d40"
  hero-line: "#92b8d7"
  hero-line-dark: "#4e7592"
  brand-surface: "#123653"
  brand-surface-dark: "#15354f"
  brand-surface-foreground: "#f1f8ff"
  brand-surface-muted: "#bed5e7"
  brand-surface-line: "#6890ad"
  brand-surface-line-dark: "#6588a2"
  background: "#fff"
  background-dark: "#10202e"
  card: "#fff"
  card-dark: "#172b3b"
  foreground: "#132d49"
  foreground-dark: "#eef6fd"
  muted: "#edf5fb"
  muted-dark: "#192f42"
  muted-foreground: "#466178"
  muted-foreground-dark: "#bdcfdd"
  accent: "#e2eff9"
  accent-dark: "#223d52"
  border: "#d1e0ed"
  border-dark: "#385266"
  input: "#7188a0"
  input-dark: "#718da4"
  ring: "#336998"
  ring-dark: "#a3cff4"
typography:
  hero:
    fontFamily: '"Vazirmatn Variable", "Segoe UI", Tahoma, system-ui, sans-serif'
    fontSize: "clamp(2.35rem, 5.1vw, 4.7rem)"
    fontWeight: 800
    lineHeight: 1.28
  section:
    fontSize: "clamp(1.75rem, 3vw, 2.75rem)"
    fontWeight: 750
    lineHeight: 1.4
  display:
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: "4.25rem"
  h1:
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: "3.25rem"
  h2:
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2.5rem"
  h3:
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.875rem"
  body-lg:
    fontSize: "1rem"
    lineHeight: "1.75rem"
  body:
    fontFamily: '"Vazirmatn Variable", "Segoe UI", Tahoma, system-ui, sans-serif'
    fontSize: "0.9375rem"
    lineHeight: "1.625rem"
  body-sm:
    fontSize: "0.8125rem"
    lineHeight: "1.375rem"
  caption:
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  button:
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: "1.375rem"
  nav:
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.375rem"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "1.125rem"
spacing:
  site-width: "75rem"
  home-gutter: "1rem"
  home-gutter-wide: "1.5rem"
  home-section-inset: "clamp(3.5rem, 6.5vw, 6rem)"
components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-highlight:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.highlight-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-outline:
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 1.25rem"
    height: "2.75rem"
  text-input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.25rem 1rem"
    height: "2.75rem"
  navigation-link:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.nav}"
    padding: "0 0.375rem"
  badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.brand-text}"
    typography: "{typography.caption}"
    padding: "0.125rem 0.75rem"
    height: "1.5rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  home-question:
    textColor: "{colors.foreground}"
    typography: "{typography.h3}"
    padding: "0.875rem 0"
---

# Design System: Avida Dental

## Overview

Avida Dental uses a blue palette and generous Persian line spacing. The full-width homepage hero blends a daylight patient portrait into a blue surface. A navy practice section provides contrast between the white service directory and first-visit guide. Fine porcelain grain gives the blue surfaces a matte finish.

Use the shared styles and primitives across the site. The compositions and responsive layouts described for the homepage apply to that route. [Shared tokens](src/styles.css), [homepage styles](src/routes/home/home.css), [app identity](docs/frontend/app-identity.md).

## Colors

### Primary

- Use `primary` for standard in-app actions and `highlight` for the main action on light or dark neutral surfaces. Each has its own hover fill and foreground.
- Use `brand-text` for links and outline icons. Use `brand-jade` for the smile stroke beneath the hero title, the consultation prompts, and the family visit timeline. Use `brand-jade-surface` behind the family visit guide.
- Use `hero-surface` behind the patient portrait and `hero-line` along the curve below it. Use `brand-surface`, `brand-surface-foreground`, and `brand-surface-muted` for the practice section and footer. Use `brand-surface-line` for rules on the navy surface.

### Neutral

- White, ink blue, and muted powder blue form the light theme. The dark theme uses dark blue surfaces and pale text. The dark values in the palette map to the same semantic roles at runtime.
- Use `muted` for supporting sections and callouts. Use `accent` for hover and selected states, badges, and the numbered first-visit steps on the homepage.
- Use `border` for hairline separators, `input` for control edges, and `ring` for keyboard focus.

## Typography

Vazirmatn Variable serves headings, body copy, and controls. Use generous line heights for Persian. Pair the homepage's fluid hero and section headings with the shared `h3` style for services, step titles, and question labels. Use the larger body style for introductions and answers, and the shared body style for regular descriptions.

The shared display, `h1`, and `h2` styles step down below 600px. The treatment-room caption uses the compact 12px style.

On the homepage, justify body paragraphs and visit checklist items. Align the final line to inline start, and use start alignment for headings and control labels. The hero introduction caps at 28rem.

## Layout

Use logical inline spacing and preserve the right-to-left reading order. The default site width is 75rem. The homepage content width caps at 72rem with side gutters of 1rem on phones and 1.5rem from 40rem. Section padding grows from 3.5rem to 6rem.

The hero spans the full viewport. From 48rem, the portrait fades behind the introduction at inline start. At smaller widths, the full-width photo follows the copy. The service list grows to two columns at 40rem and three at 60rem. At 48rem, the practice feature and questions use two columns, and the visit sequence uses three. The preparation groups switch to three columns at 54rem.

## Elevation & Depth

The homepage separates content with fills, image crops, and fine rules. Apply the `porcelain-grain` utility to the colored hero, practice, FAQ, preparation, and footer surfaces. The card primitive adds a hairline and a soft resting shadow. Linked cards deepen the shadow and take an accent wash on hover and keyboard focus.

## Shapes

Use the small radius for inputs, the medium radius for standard buttons and supporting homepage callouts, and the large radius for cards and feature images. A shallow curve separates the hero from the service directory. Circular markers identify the ordered first-visit steps.

## Components

### Buttons and links

The button primitive uses a 1.5px edge and a 2px focus outline with a 2px offset. The homepage uses the pill-shaped highlight button for the first-visit action. Its secondary link underlines on hover. Shared buttons change color in 150ms and move down 1px during a press when motion is allowed. Trailing arrows move 4px in the forward direction on the Persian button.

### Text fields, badges, and navigation

Text fields use the card surface, a defined control edge, and a visible focus outline. Compact badges use the accent wash with brand-colored text. The header sets the tooth mark on a pale blue tile and highlights the first-visit link with the jade surface. Other navigation links use muted text at rest. On desktop, hover adds the accent wash and the current destination has an underline. The desktop header hides on downward scroll and reappears on upward scroll or keyboard focus. On phones, the four main links sit in a fixed bottom bar with icons and Persian labels. The current destination has a tinted icon background, or an outline when the first-visit link is current.

### Homepage lists

Service descriptions pair an outline icon with an item heading and muted body copy. The icons have a stroke width of 1.5. Horizontal rules divide rows, and inline separators appear in multi-column layouts. Native question disclosures show an outlined plus when closed and a filled minus when open. Where the browser supports intrinsic-size transitions, the answer opens in 220ms. The numbered visit steps use the accent wash at rest and briefly take the primary fill when reached through the page anchor.

The hero copy rises 5px as the portrait settles on entry. The jade smile stroke appears just after the headline. Both effects honor reduced motion.

## Do's and Don'ts

- **Do** use semantic color tokens so surfaces and controls adapt to both themes.
- **Do** show a visible keyboard focus outline on controls and links.
- **Do** identify illustrative images in captions or alternative text.
- **Do** respect reduced-motion preferences for button movement, page transitions, and visit-step animation.
