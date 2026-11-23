import { useEffect, useState } from "react";

import { formatNumber } from "#/lib/locale";
import { m } from "#/paraglide/messages";
import "#/components/shared/campaign/campaign.css";

/*===== Types =====*/

type CountdownParts = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function computeParts(remainingMs: number): CountdownParts {
  if (remainingMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { expired: false, days, hours, minutes, seconds };
}

function twoDigits(value: number): string {
  return formatNumber(value, { minimumIntegerDigits: 2, useGrouping: false });
}

/*===== Component =====*/

/**
 * Live countdown synchronized against `serverNow` so skewed device clocks stay aligned with `Asia/Tehran` campaign
 * deadlines. Stops automatically at zero and switches to the expired message.
 */
export function CampaignCountdown({
  endsAt,
  serverNow,
  variant = "editorial",
  onExpire,
}: {
  endsAt: Date;
  serverNow: Date;
  variant?: "compact" | "editorial" | "impact";
  onExpire?: () => void;
}) {
  const endMs = endsAt.getTime();
  const initialRemaining = Math.max(0, endMs - serverNow.getTime());
  const [remainingMs, setRemainingMs] = useState(initialRemaining);

  useEffect(() => {
    const clockOffsetMs = serverNow.getTime() - Date.now();

    const tick = () => {
      const next = Math.max(0, endMs - (Date.now() + clockOffsetMs));
      setRemainingMs(next);
      if (next <= 0) {
        onExpire?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endMs, serverNow, onExpire]);

  const parts = computeParts(remainingMs);

  if (parts.expired) {
    return (
      <output
        className={
          variant === "impact"
            ? "block text-h3 font-black text-highlight-foreground"
            : "block text-body-sm font-semibold text-campaign-crimson"
        }
      >
        {m.campaign_ended_message()}
      </output>
    );
  }

  if (variant === "compact") {
    return (
      <span
        dir="ltr"
        aria-label={m.campaign_countdown_until()}
        className="campaign-countdown-digits inline-flex items-center gap-1 rounded-sm border border-brand-gold/45 bg-card/85 px-2.5 py-0.5 text-caption font-extrabold text-brand-gold"
      >
        <span>{twoDigits(parts.days)}</span>
        <span aria-hidden className="text-brand-surface-muted">
          :
        </span>
        <span>{twoDigits(parts.hours)}</span>
        <span aria-hidden className="text-brand-surface-muted">
          :
        </span>
        <span>{twoDigits(parts.minutes)}</span>
        <span aria-hidden className="text-brand-surface-muted">
          :
        </span>
        <span className="text-campaign-crimson">{twoDigits(parts.seconds)}</span>
      </span>
    );
  }

  const units = [
    { key: "days", value: twoDigits(parts.days), label: m.campaign_countdown_days() },
    { key: "hours", value: twoDigits(parts.hours), label: m.campaign_countdown_hours() },
    { key: "minutes", value: twoDigits(parts.minutes), label: m.campaign_countdown_minutes() },
    { key: "seconds", value: twoDigits(parts.seconds), label: m.campaign_countdown_seconds() },
  ] as const;

  if (variant === "impact") {
    return (
      <div aria-label={m.campaign_countdown_until()} className="grid grid-cols-4 gap-3 sm:gap-5">
        {units.map((unit) => (
          <div key={unit.key} className="flex flex-col items-center">
            <span
              className={
                unit.key === "seconds"
                  ? "campaign-countdown-digits rounded-sm bg-campaign-crimson px-2.5 py-0.5 text-h1 font-black text-campaign-crimson-foreground"
                  : "campaign-countdown-digits text-h1 font-black text-highlight-foreground"
              }
            >
              {unit.value}
            </span>
            <span className="text-caption font-extrabold text-highlight-foreground/80">{unit.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div aria-label={m.campaign_countdown_until()} className="campaign-countdown-editorial rounded-sm">
      {units.map((unit) => (
        <div key={unit.key} className="campaign-countdown-cell">
          <span
            className={
              unit.key === "seconds"
                ? "campaign-countdown-digits text-h2 font-black text-campaign-crimson"
                : "campaign-countdown-digits text-h2 font-black text-brand-gold"
            }
          >
            {unit.value}
          </span>
          <span className="text-caption font-semibold text-muted-foreground">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
