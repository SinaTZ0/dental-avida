import type { CSSProperties } from "react";

/*===== Types =====*/

export type BlurTextProps = {
  text: string;
  /** Stagger delay in milliseconds between consecutive words. */
  delay?: number;
  /** Starting word index so multi-line headlines share one continuous stagger. */
  startIndex?: number;
  /** Direction each word drifts in from as it resolves into focus. */
  direction?: "top" | "bottom";
  /** Whether the blur-to-sharp reveal has started. */
  active?: boolean;
  /** Apply a sweeping React Bits–style glossy sheen across each word. */
  shiny?: boolean;
  className?: string;
};

/*===== Component =====*/

/**
 * Word-level blur-to-sharp entrance inspired by React Bits `BlurText`.
 * Splits by words (never characters) so Persian cursive joining remains intact.
 */
export function BlurText({
  text,
  delay = 110,
  startIndex = 0,
  direction = "top",
  active = true,
  shiny = false,
  className,
}: BlurTextProps) {
  const words = text.trim().split(/\s+/);

  return (
    <span className={className} data-blur-direction={direction}>
      {words.map((word, index) => {
        const delayStyle = {
          "--blur-delay": `${(startIndex + index) * delay}ms`,
        } as CSSProperties;
        const shinyStyle = shiny
          ? ({
              "--shiny-delay": `${index * 220}ms`,
            } as CSSProperties)
          : undefined;

        return (
          <span key={`${startIndex + index}-${word}`} className="home-blur-word-slot">
            <span className="home-blur-word" data-blur-active={active ? "true" : "false"} style={delayStyle}>
              {shiny ? (
                <span className="home-shiny-word" style={shinyStyle}>
                  {word}
                </span>
              ) : (
                word
              )}
            </span>
            {index < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </span>
  );
}
