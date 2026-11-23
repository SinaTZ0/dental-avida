import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/primitive/button/button";
import { formatNumber } from "#/lib/locale";
import { m } from "#/paraglide/messages";
import campaignHeroUrl from "#/routes/black_friday/assets/campaign-hero.webp";

/*===== Banner Presets (Section 4.2) =====*/

type BannerSpec = {
  readonly id: "leaderboard" | "rectangle" | "mobile" | "square";
  readonly width: number;
  readonly height: number;
  readonly label: () => string;
};

const BANNER_SPECS: readonly BannerSpec[] = [
  { id: "leaderboard", width: 728, height: 90, label: m.admin_campaign_banner_size_leaderboard },
  { id: "rectangle", width: 300, height: 250, label: m.admin_campaign_banner_size_rectangle },
  { id: "mobile", width: 320, height: 100, label: m.admin_campaign_banner_size_mobile },
  { id: "square", width: 1080, height: 1080, label: m.admin_campaign_banner_size_square },
];

/*===== Canvas PNG Renderer =====*/

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => resolve(img), { once: true });
    img.addEventListener("error", () => resolve(null), { once: true });
    img.src = src;
  });
}

async function renderBannerPng({
  spec,
  maxDiscountPercent,
  totalCapacity,
}: {
  spec: BannerSpec;
  maxDiscountPercent: number;
  totalCapacity: number;
}): Promise<string> {
  if ("fonts" in document) {
    await document.fonts.ready;
  }

  const scale = spec.width < 600 ? 2 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = spec.width * scale;
  canvas.height = spec.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.scale(scale, scale);
  const w = spec.width;
  const h = spec.height;
  const fontFamily = '"Vazirmatn", Tahoma, sans-serif';

  // Pure noir base
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, w, h);

  // Background campaign art subtly faded on the left side (RTL visual balance)
  const bg = await loadImage(campaignHeroUrl);
  if (bg) {
    ctx.save();
    ctx.globalAlpha = spec.id === "square" ? 0.42 : 0.34;
    const ratio = Math.max(w / bg.width, h / bg.height);
    const drawW = bg.width * ratio;
    const drawH = bg.height * ratio;
    const drawX = spec.id === "square" ? (w - drawW) / 2 : 0;
    const drawY = (h - drawH) / 2;
    ctx.drawImage(bg, drawX, drawY, drawW, drawH);
    ctx.restore();

    const scrim = ctx.createLinearGradient(w, 0, 0, 0);
    scrim.addColorStop(0, "rgba(8, 8, 8, 0.96)");
    scrim.addColorStop(0.55, "rgba(8, 8, 8, 0.84)");
    scrim.addColorStop(1, "rgba(8, 8, 8, 0.38)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);
  }

  // Voltage Ticker top & bottom electric-yellow accent rules
  ctx.fillStyle = "#ffd000";
  ctx.fillRect(0, 0, w, spec.id === "square" ? 10 : 3);
  ctx.fillStyle = "#e11d48";
  ctx.fillRect(0, h - (spec.id === "square" ? 8 : 2), w, spec.id === "square" ? 8 : 2);

  const percentText = `تا ${formatNumber(maxDiscountPercent)}٪ تخفیف ویژه`;
  const capacityText = `ظرفیت محدود ${formatNumber(totalCapacity)} نفر`;
  const deadlineText = "مهلت ثبت‌نام تا ۱۲ آذر";
  const titleText = "جشنواره بلک فرایدی و روز مادر";
  const ctaText = "مشاهده تخفیفات";

  ctx.direction = "rtl";
  ctx.textBaseline = "middle";

  if (spec.id === "leaderboard") {
    // Horizontal 728x90 layout (RTL: brand/title right, metrics center, yellow CTA left)
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd000";
    ctx.font = `800 12px ${fontFamily}`;
    ctx.fillText("کلینیک تخصصی دندان‌پزشکی آویدا", w - 20, 22);

    ctx.fillStyle = "#ffffff";
    ctx.font = `900 19px ${fontFamily}`;
    ctx.fillText(titleText, w - 20, 48);

    ctx.fillStyle = "#d4d4d8";
    ctx.font = `600 11px ${fontFamily}`;
    ctx.fillText(`${capacityText}  •  ${deadlineText}`, w - 20, 72);

    // Center crimson discount stamp
    ctx.fillStyle = "#e11d48";
    ctx.fillRect(195, 22, 146, 46);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = `900 16px ${fontFamily}`;
    ctx.fillText(percentText, 268, 45);

    // Left electric-yellow CTA
    ctx.fillStyle = "#ffd000";
    ctx.fillRect(18, 23, 158, 44);
    ctx.fillStyle = "#080808";
    ctx.font = `900 14px ${fontFamily}`;
    ctx.fillText(ctaText, 97, 45);
  } else if (spec.id === "mobile") {
    // Compact 320x100 mobile strip
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd000";
    ctx.font = `800 10px ${fontFamily}`;
    ctx.fillText(`${percentText} • ${capacityText}`, w - 12, 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = `900 14px ${fontFamily}`;
    ctx.fillText(titleText, w - 12, 46);

    ctx.fillStyle = "#d4d4d8";
    ctx.font = `600 10px ${fontFamily}`;
    ctx.fillText(deadlineText, w - 12, 74);

    ctx.fillStyle = "#ffd000";
    ctx.fillRect(10, 56, 108, 30);
    ctx.fillStyle = "#080808";
    ctx.textAlign = "center";
    ctx.font = `900 11px ${fontFamily}`;
    ctx.fillText(ctaText, 64, 71);
  } else if (spec.id === "rectangle") {
    // 300x250 medium rectangle
    ctx.fillStyle = "#e11d48";
    ctx.fillRect(w - 150, 18, 132, 28);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = `900 13px ${fontFamily}`;
    ctx.fillText(percentText, w - 84, 32);

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd000";
    ctx.font = `800 11px ${fontFamily}`;
    ctx.fillText("کلینیک دندان‌پزشکی آویدا", w - 18, 66);

    ctx.fillStyle = "#ffffff";
    ctx.font = `900 20px ${fontFamily}`;
    ctx.fillText("جشنواره بلک فرایدی", w - 18, 96);
    ctx.fillText("و روز مادر", w - 18, 124);

    ctx.fillStyle = "#e4e4e7";
    ctx.font = `700 12px ${fontFamily}`;
    ctx.fillText(`${capacityText}  •  ${deadlineText}`, w - 18, 162);

    ctx.fillStyle = "#ffd000";
    ctx.fillRect(18, 186, w - 36, 42);
    ctx.fillStyle = "#080808";
    ctx.textAlign = "center";
    ctx.font = `900 15px ${fontFamily}`;
    ctx.fillText(ctaText, w / 2, 207);
  } else {
    // 1080x1080 social square
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd000";
    ctx.font = `800 32px ${fontFamily}`;
    ctx.fillText("کلینیک تخصصی دندان‌پزشکی آویدا", w - 72, 110);

    // Crimson stamp
    ctx.fillStyle = "#e11d48";
    ctx.fillRect(w - 460, 175, 388, 86);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = `900 42px ${fontFamily}`;
    ctx.fillText(percentText, w - 266, 218);

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 76px ${fontFamily}`;
    ctx.fillText("جشنواره بلک فرایدی", w - 72, 375);
    ctx.fillStyle = "#ffd000";
    ctx.fillText("و روز مادر", w - 72, 478);

    // Ruled editorial metrics strip
    ctx.strokeStyle = "rgba(255, 208, 0, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 575);
    ctx.lineTo(w - 72, 575);
    ctx.moveTo(72, 745);
    ctx.lineTo(w - 72, 745);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 38px ${fontFamily}`;
    ctx.fillText(capacityText, w - 72, 635);
    ctx.fillStyle = "#d4d4d8";
    ctx.font = `700 32px ${fontFamily}`;
    ctx.fillText(`${deadlineText} • ایمپلنت دیجیتال و لمینیت سرامیکی`, w - 72, 698);

    // Full-width yellow CTA bar
    ctx.fillStyle = "#ffd000";
    ctx.fillRect(72, 825, w - 144, 130);
    ctx.fillStyle = "#080808";
    ctx.textAlign = "center";
    ctx.font = `900 46px ${fontFamily}`;
    ctx.fillText(ctaText, w / 2, 890);
  }

  return canvas.toDataURL("image/png");
}

/*===== Component =====*/

/**
 * Downloadable Persian Voltage Ticker advertising banner studio (Section 4.2). Generates ready-to-publish PNGs in
 * standard Iranian web & social formats reflecting the live campaign discount percentage and total capacity.
 */
export function AdBannerKit({
  maxDiscountPercent,
  totalCapacity,
}: {
  maxDiscountPercent: number;
  totalCapacity: number;
}) {
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleDownload = async (spec: BannerSpec) => {
    setExportingId(spec.id);
    try {
      const dataUrl = await renderBannerPng({ spec, maxDiscountPercent, totalCapacity });
      if (!dataUrl) return;
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `avida-black-friday-${spec.id}-${spec.width}x${spec.height}.png`;
      anchor.click();
    } finally {
      setExportingId(null);
    }
  };

  return (
    <section aria-labelledby="admin-banners-title" className="space-y-6 border-t border-border pt-10">
      <div className="space-y-2">
        <h2 id="admin-banners-title" className="text-h2 text-foreground">
          {m.admin_campaign_banners_title()}
        </h2>
        <p className="max-w-3xl text-body-sm text-muted-foreground">{m.admin_campaign_banners_subtitle()}</p>
      </div>

      {/* Ruled editorial list of ready-to-download banner formats */}
      <div className="divide-y divide-border border-y border-border">
        {BANNER_SPECS.map((spec) => (
          <div key={spec.id} className="grid gap-5 py-6 lg:grid-cols-12 lg:items-center">
            <div className="space-y-2 lg:col-span-4">
              <p className="text-body font-bold text-foreground">{spec.label()}</p>
              <p className="text-caption text-muted-foreground">
                {m.campaign_modal_capacity_headline({ total: totalCapacity, maxPercent: maxDiscountPercent })} •{" "}
                {m.campaign_countdown_until()}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportingId === spec.id}
                onClick={() => void handleDownload(spec)}
              >
                <DownloadIcon aria-hidden data-icon="inline-start" />
                <span>{m.admin_campaign_banners_download()}</span>
              </Button>
            </div>

            {/* Live compact Voltage Ticker preview */}
            <div className="lg:col-span-8">
              <div className="relative overflow-hidden border-t-2 border-b-2 border-t-brand-surface-gold border-b-campaign-crimson bg-overlay px-5 py-4 text-brand-surface-foreground">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-campaign-crimson px-2 py-0.5 text-caption font-extrabold text-brand-surface-foreground">
                        {m.campaign_page_up_to_discount({ percent: maxDiscountPercent })}
                      </span>
                      <span className="text-caption font-bold text-brand-surface-gold">{m.campaign_modal_title()}</span>
                    </div>
                    <p className="text-caption text-brand-surface-foreground/80">
                      {m.campaign_modal_capacity_headline({ total: totalCapacity, maxPercent: maxDiscountPercent })} —{" "}
                      {m.campaign_countdown_until()}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center bg-brand-surface-gold px-3.5 py-1.5 text-caption font-black text-overlay">
                    {m.campaign_ribbon_cta()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
