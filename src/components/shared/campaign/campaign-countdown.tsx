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
  variant?: "compact" | "editorial";
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
      <output className="block text-body-sm font-semibold text-campaign-crimson">{m.campaign_ended_message()}</output>
    );
  }

  if (variant === "compact") {
    return (
      <span
        dir="ltr"
        aria-label={m.campaign_countdown_until()}
        className="campaign-countdown-digits inline-flex items-center gap-1 rounded-full border border-brand-surface-gold/30 bg-card/55 px-2.5 py-0.5 text-caption font-bold text-brand-surface-gold"
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
        <span className="text-campaign-crimson-foreground">{twoDigits(parts.seconds)}</span>
      </span>
    );
  }

  const units = [
    { key: "days", value: twoDigits(parts.days), label: m.campaign_countdown_days() },
    { key: "hours", value: twoDigits(parts.hours), label: m.campaign_countdown_hours() },
    { key: "minutes", value: twoDigits(parts.minutes), label: m.campaign_countdown_minutes() },
    { key: "seconds", value: twoDigits(parts.seconds), label: m.campaign_countdown_seconds() },
  ] as const;

  return (
    <div aria-label={m.campaign_countdown_until()} className="campaign-countdown-editorial rounded-md">
      {units.map((unit) => (
        <div key={unit.key} className="campaign-countdown-cell">
          <span
            className={
              unit.key === "seconds"
                ? "campaign-countdown-digits text-h2 font-extrabold text-campaign-crimson"
                : "campaign-countdown-digits text-h2 font-extrabold text-brand-surface-gold"
            }
          >
            {unit.value}
          </span>
          <span className="text-caption text-muted-foreground">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
