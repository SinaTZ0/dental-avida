import { Badge } from "#/components/primitive/badge/badge";
import type { CampaignDiscount } from "#/orpc/campaign/contract";
import { m } from "#/paraglide/messages";

/*===== Discount Ledger =====*/

/**
 * Giant typographic ruled editorial discount ledger for cash vs. installment campaign percentages.
 * Highlights the top cash discount row with a sharp crimson taste stamp without repeating boxed cards.
 */
export function DiscountLedger({ discounts }: { discounts: readonly CampaignDiscount[] }) {
  const topCash = discounts.length > 0 ? Math.max(...discounts.map((row) => row.cashPercent)) : 0;

  return (
    <section aria-labelledby="bf-discounts-title" className="mx-auto w-full max-w-site px-4 py-14 sm:px-6 md:py-20">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="bf-kicker">{m.campaign_table_kicker()}</p>
          <h2 id="bf-discounts-title" className="scroll-mt-24 text-section font-black text-foreground">
            {m.campaign_table_title()}
          </h2>
        </div>
        <p className="max-w-md border-s-2 border-brand-gold/60 ps-4 text-body-sm text-muted-foreground">
          {m.campaign_table_note()}
        </p>
      </div>

      {/*------ Desktop & Tablet Ruled Typographic Table ------*/}
      <div className="bf-ledger hidden sm:block">
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="text-caption font-extrabold text-muted-foreground">
              <th scope="col" className="py-4 pe-4 text-start font-extrabold">
                {m.campaign_table_col_treatment()}
              </th>
              <th scope="col" className="px-4 py-4 text-center font-extrabold">
                {m.campaign_table_col_cash()}
              </th>
              <th scope="col" className="py-4 ps-4 text-center font-extrabold">
                {m.campaign_table_col_installment()}
              </th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((row) => {
              const isTop = topCash > 0 && row.cashPercent === topCash;
              return (
                <tr key={row.id} className="bf-ledger-row">
                  <td className="py-6 pe-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-h2 font-black text-foreground">{row.title}</span>
                      {isTop && (
                        <Badge variant="crimson-solid">
                          {m.campaign_page_up_to_discount({ percent: row.cashPercent })}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-6 text-center">
                    <span className="text-display leading-none font-black text-brand-gold tabular-nums">
                      {m.campaign_percent_value({ percent: row.cashPercent })}
                    </span>
                  </td>
                  <td className="py-6 ps-4 text-center">
                    <span className="text-h1 font-extrabold text-foreground/85 tabular-nums">
                      {m.campaign_percent_value({ percent: row.installmentPercent })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/*------ Mobile Stacked Ruled Ledger ------*/}
      <div className="bf-ledger sm:hidden">
        {discounts.map((row, index) => {
          const isTop = topCash > 0 && row.cashPercent === topCash;
          return (
            <div key={row.id} className={index === 0 ? "space-y-3 py-5" : "bf-ledger-row space-y-3 py-5"}>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-h3 font-black text-foreground">{row.title}</h3>
                {isTop && (
                  <Badge variant="crimson-solid">{m.campaign_page_up_to_discount({ percent: row.cashPercent })}</Badge>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <dt className="text-caption text-muted-foreground">{m.campaign_table_col_cash()}</dt>
                  <dd className="text-display leading-none font-black text-brand-gold tabular-nums">
                    {m.campaign_percent_value({ percent: row.cashPercent })}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 border-s border-border ps-4">
                  <dt className="text-caption text-muted-foreground">{m.campaign_table_col_installment()}</dt>
                  <dd className="text-h1 font-extrabold text-foreground/85 tabular-nums">
                    {m.campaign_percent_value({ percent: row.installmentPercent })}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
