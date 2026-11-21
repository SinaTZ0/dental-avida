import { Link } from "@tanstack/react-router";
import { LogOutIcon, UserIcon } from "lucide-react";

import { Button } from "#/components/primitive/button/button";
import { buttonVariants } from "#/components/primitive/button/button.styles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/primitive/dropdown-menu/dropdown-menu";
import { LocaleSwitcher } from "#/components/shared/locale-switcher/locale-switcher";
import { ThemeToggle } from "#/components/shared/theme-toggle/theme-toggle";
import { useLocaleLinks } from "#/hooks/use-locale-links";
import { useSignOut } from "#/hooks/use-sign-out";
import { homeSections } from "#/lib/site";
import type { Viewer } from "#/orpc/session/contract";
import { m } from "#/paraglide/messages";

/*===== Navigation =====*/

// Message functions, not their text: called in render, so each request gets its own locale's labels.
const NAV_ITEMS = [
  { label: m.nav_services, to: "/", hash: homeSections.services },
  { label: m.nav_practice, to: "/", hash: homeSections.practice },
  { label: m.nav_visit, to: "/", hash: homeSections.visit },
  { label: m.nav_notes, to: "/notes", hash: undefined },
] as const;

// The current page gets the primary underline; hover and focus tint the text.
const navItemClasses =
  "relative inline-flex min-h-10 items-center px-1.5 text-nav text-muted-foreground outline-none transition-colors duration-150 after:absolute after:inset-x-1.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid aria-[current=page]:text-foreground aria-[current=page]:after:opacity-100 motion-reduce:transition-none lg:h-18";

/*===== Account =====*/

function AccountMenu({ viewer }: { viewer: Viewer }) {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={m.nav_account()} />}>
        <UserIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-foreground">{viewer.name}</span>
            <span dir="ltr" className="block text-start">
              {viewer.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          <LogOutIcon />
          {m.nav_sign_out()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/*===== Site Header =====*/

/** Brand, main navigation, language switcher, theme toggle and the account menu (or a sign-in button for visitors). */
export function SiteHeader({ viewer }: { viewer: Viewer | null }) {
  const localeLinks = useLocaleLinks();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-1 px-4 sm:gap-x-4 sm:px-6 lg:flex-nowrap">
        <Link
          to="/"
          className="inline-flex min-h-16 min-w-0 items-center gap-1.5 rounded-sm text-h4 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid sm:gap-2"
        >
          <svg
            aria-hidden
            className="size-6 shrink-0 stroke-2 text-brand-text sm:size-7"
            viewBox="0 0 28 32"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 5C11 5 8.5 1.5 5 3.5 0 6.2 2.5 14 4.5 18.5 7 24.3 6 29 9.3 29c3.3 0 1.5-9.3 4.7-9.3s1.4 9.3 4.7 9.3c3.3 0 2.3-4.7 4.8-10.5 2-4.5 4.5-12.3-.5-15C19.5 1.5 17 5 14 5Zm0 0 3.4-.9" />
          </svg>
          {m.site_name()}
        </Link>

        <nav
          aria-label={m.nav_main()}
          className="order-last flex w-full flex-wrap items-center gap-x-2 border-t sm:gap-x-4 lg:order-none lg:w-auto lg:border-t-0"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.hash ?? item.to}
              to={item.to}
              hash={item.hash}
              activeOptions={{ exact: true, includeHash: true, includeSearch: false }}
              className={navItemClasses}
            >
              {item.label()}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center sm:gap-1">
          <LocaleSwitcher links={localeLinks} />
          <ThemeToggle />
          {viewer ? (
            <AccountMenu viewer={viewer} />
          ) : (
            // A link styled as a button: `<Button render={<Link />}>` would announce it as a button (`role="button"`).
            <Link
              to="/auth"
              className={buttonVariants({ size: "icon-sm", variant: "outline" })}
              aria-label={m.nav_sign_in()}
            >
              <UserIcon aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
