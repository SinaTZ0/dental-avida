import { Link, useLocation } from "@tanstack/react-router";
import { Building2Icon, CalendarDaysIcon, LogOutIcon, NotebookPenIcon, StethoscopeIcon, UserIcon } from "lucide-react";
import { type MouseEvent, useSyncExternalStore } from "react";

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
import { defineStyles, joinStyles } from "#/components/primitive/styles";
import { LocaleSwitcher } from "#/components/shared/locale-switcher/locale-switcher";
import { useDesktopHeaderHidden } from "#/components/shared/site-header/use-desktop-header-hidden";
import { ThemeToggle } from "#/components/shared/theme-toggle/theme-toggle";
import { useLocaleLinks } from "#/hooks/use-locale-links";
import { useSignOut } from "#/hooks/use-sign-out";
import { homeSections } from "#/lib/site";
import { cn } from "#/lib/utils";
import type { Viewer } from "#/orpc/session/contract";
import { m } from "#/paraglide/messages";

/*===== Navigation =====*/

// Message functions, not their text: called in render, so each request gets its own locale's labels.
const NAV_ITEMS = [
  { label: m.nav_services, icon: StethoscopeIcon, to: "/", hash: homeSections.services },
  { label: m.nav_practice, icon: Building2Icon, to: "/", hash: homeSections.practice },
  { label: m.nav_visit, icon: CalendarDaysIcon, to: "/", hash: homeSections.visit },
  { label: m.nav_notes, icon: NotebookPenIcon, to: "/notes", hash: undefined },
] as const;

const navItemClasses = joinStyles(
  defineStyles({
    layout: "group/nav relative flex flex-col items-center justify-center gap-0.5 md:inline-flex",
    geometry:
      "min-h-site-mobile-nav min-w-target px-0.5 py-1 md:min-h-target md:rounded-full md:px-1.5 md:py-0 lg:px-4",
    typography: "text-center text-caption md:text-body md:font-medium",
    hover: "hover:text-foreground md:hover:bg-accent",
    focus:
      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid md:focus-visible:outline-offset-2",
    active:
      "md:after:absolute md:after:inset-x-4 md:after:bottom-1 md:after:h-0.5 md:after:rounded-full md:after:bg-current md:after:opacity-0 md:aria-[current=page]:after:opacity-100",
    motion: "motion-safe:transition-colors motion-safe:duration-150",
  }),
);

const SCROLL_MOTION_QUERY = "(prefers-reduced-motion: no-preference)";
const SMOOTH_HASH_SCROLL: ScrollIntoViewOptions = { behavior: "smooth" };

function subscribeToScrollMotion(onChange: () => void) {
  const media = window.matchMedia(SCROLL_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Return to the section when the router already has its fragment and skips scrolling. */
function scrollToCurrentSection({
  event,
  options,
}: {
  event: MouseEvent<HTMLAnchorElement>;
  options: boolean | ScrollIntoViewOptions;
}) {
  const { hash } = event.currentTarget;
  if (
    hash !== window.location.hash ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  document.getElementById(hash.slice(1))?.scrollIntoView(options);
}

/*===== Account =====*/

function AccountMenu({ viewer }: { viewer: Viewer }) {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <UserIcon aria-hidden />
        <span className="sr-only lg:not-sr-only">{m.nav_account()}</span>
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
  const desktopHeaderHidden = useDesktopHeaderHidden();
  const onHome = useLocation({ select: (location) => location.pathname === "/" });
  const allowScrollMotion = useSyncExternalStore(
    subscribeToScrollMotion,
    () => window.matchMedia(SCROLL_MOTION_QUERY).matches,
    () => false,
  );
  const hashScroll = onHome && allowScrollMotion ? SMOOTH_HASH_SCROLL : true;

  return (
    <header
      className={cn(
        "border-b bg-card md:sticky md:top-0 md:z-40 md:has-[:focus-visible]:translate-y-0 md:motion-safe:transition-transform md:motion-safe:duration-200 md:motion-safe:ease-out",
        desktopHeaderHidden && "md:-translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-2 px-4 sm:px-6 md:grid md:min-h-site-desktop-header md:grid-cols-3">
        <Link
          to="/"
          className="inline-flex min-h-16 items-center gap-2.5 rounded-md text-h4 font-bold text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid sm:text-h3 sm:font-bold md:justify-self-start"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-brand-text sm:size-12">
            <svg
              aria-hidden
              className="size-7 stroke-2"
              viewBox="0 0 28 32"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 5C11 5 8.5 1.5 5 3.5 0 6.2 2.5 14 4.5 18.5 7 24.3 6 29 9.3 29c3.3 0 1.5-9.3 4.7-9.3s1.4 9.3 4.7 9.3c3.3 0 2.3-4.7 4.8-10.5 2-4.5 4.5-12.3-.5-15C19.5 1.5 17 5 14 5Zm0 0 3.4-.9" />
            </svg>
          </span>
          {m.site_name()}
        </Link>

        <nav
          aria-label={m.nav_main()}
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card pb-(--site-mobile-nav-safe-area) md:static md:z-auto md:flex md:w-max md:items-center md:gap-1 md:justify-self-center md:border-t-0 md:bg-transparent md:pb-0"
        >
          {NAV_ITEMS.map(({ icon: Icon, label, to, hash }) => {
            const featured = hash === homeSections.visit;

            return (
              <Link
                key={hash ?? to}
                to={to}
                hash={hash}
                hashScrollIntoView={hash ? hashScroll : undefined}
                onClick={hash && onHome ? (event) => scrollToCurrentSection({ event, options: hashScroll }) : undefined}
                activeOptions={{ exact: true, includeHash: true, includeSearch: false }}
                className={cn(
                  navItemClasses,
                  featured
                    ? "font-semibold text-brand-jade md:bg-brand-jade-surface md:font-semibold"
                    : "text-muted-foreground aria-[current=page]:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full md:hidden",
                    featured
                      ? "bg-brand-jade-surface group-aria-[current=page]/nav:ring-1 group-aria-[current=page]/nav:ring-current"
                      : "group-aria-[current=page]/nav:bg-accent",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {label()}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-1 md:justify-self-end">
          <LocaleSwitcher links={localeLinks} />
          <ThemeToggle />
          {viewer ? (
            <AccountMenu viewer={viewer} />
          ) : (
            // A link styled as a button: `<Button render={<Link />}>` would announce it as a button (`role="button"`).
            <Link to="/auth" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              <UserIcon aria-hidden />
              <span className="sr-only lg:not-sr-only">{m.nav_sign_in()}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
