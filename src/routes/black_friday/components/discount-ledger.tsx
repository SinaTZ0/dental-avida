import type { CampaignDiscount } from "#/orpc/campaign/contract";
import { m } from "#/paraglide/messages";

/*===== Discount Ledger =====*/

/**
 * Mobile-first ruled editorial discount ledger for cash vs. installment campaign percentages.
 * Uses hairline dividers on a shared surface rather than repetitive boxed cards.
 */
export function DiscountLedger({ discounts }: { discounts: readonly CampaignDiscount[] }) {
  return (
    <section aria-labelledby="bf-discounts-title" className="mx-auto max-w-site px-4 py-14 sm:px-6 md:py-20">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="bf-kicker">{m.campaign_table_kicker()}</p>
          <h2 id="bf-discounts-title" className="text-section text-foreground">
            {m.campaign_table_title()}
          </h2>
        </div>
        <p className="max-w-md border-s-2 border-brand-gold/50 ps-4 text-body-sm text-muted-foreground">
          {m.campaign_table_note()}
        </p>
      </div>

      {/*------ Desktop & Tablet Ruled Table ------*/}
      <div className="bf-ledger hidden sm:block">
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="text-caption font-bold text-muted-foreground">
              <th scope="col" className="py-4 pe-4 text-start font-bold">
                {m.campaign_table_col_treatment()}
              </th>
              <th scope="col" className="px-4 py-4 text-center font-bold">
                {m.campaign_table_col_cash()}
              </th>
              <th scope="col" className="py-4 ps-4 text-center font-bold">
                {m.campaign_table_col_installment()}
              </th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((row) => (
              <tr key={row.id} className="bf-ledger-row">
                <td className="py-5 pe-4 text-h3 font-bold text-foreground">{row.title}</td>
                <td className="px-4 py-5 text-center">
                  <span className="bf-percent-cash inline-flex min-w-20 items-center justify-center rounded-full px-4 py-1 text-h3 font-extrabold">
                    {m.campaign_percent_value({ percent: row.cashPercent })}
                  </span>
                </td>
                <td className="py-5 ps-4 text-center">
                  <span className="bf-percent-installment inline-flex min-w-20 items-center justify-center rounded-full px-4 py-1 text-h3 font-bold">
                    {m.campaign_percent_value({ percent: row.installmentPercent })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*------ Mobile Stacked Ruled Ledger ------*/}
      <div className="bf-ledger sm:hidden">
        {discounts.map((row, index) => (
          <div key={row.id} className={index === 0 ? "space-y-3 py-5" : "bf-ledger-row space-y-3 py-5"}>
            <h3 className="text-h3 font-bold text-foreground">{row.title}</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <dt className="text-caption text-muted-foreground">{m.campaign_table_col_cash()}</dt>
                <dd>
                  <span className="bf-percent-cash inline-flex min-w-16 items-center justify-center rounded-full px-3.5 py-1 text-h4 font-extrabold">
                    {m.campaign_percent_value({ percent: row.cashPercent })}
                  </span>
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 border-s border-border ps-4">
                <dt className="text-caption text-muted-foreground">{m.campaign_table_col_installment()}</dt>
                <dd>
                  <span className="bf-percent-installment inline-flex min-w-16 items-center justify-center rounded-full px-3.5 py-1 text-h4 font-bold">
                    {m.campaign_percent_value({ percent: row.installmentPercent })}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
