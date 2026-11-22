import { Link, useLocation } from "@tanstack/react-router";
import { CalendarDaysIcon, CpuIcon, LogOutIcon, StethoscopeIcon, UserIcon, UsersIcon } from "lucide-react";
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
import { AvidaBrandEmblem } from "#/components/shared/avida-smile/avida-smile";
import { LocaleSwitcher } from "#/components/shared/locale-switcher/locale-switcher";
import { useActiveHomeSection } from "#/components/shared/site-header/use-active-home-section";
import { useDesktopHeaderHidden } from "#/components/shared/site-header/use-desktop-header-hidden";
import { ThemeToggle } from "#/components/shared/theme-toggle/theme-toggle";
import { useLocaleLinks } from "#/hooks/use-locale-links";
import { useSignOut } from "#/hooks/use-sign-out";
import { homeSections } from "#/lib/site";
import { cn } from "#/lib/utils";
import type { Viewer } from "#/orpc/session/contract";
import { m } from "#/paraglide/messages";
import "#/components/shared/site-header/site-header.css";

/*===== Navigation Data =====*/

// Message functions, not their text: called in render, so each request gets its own locale's labels.
const DESKTOP_NAV_ITEMS = [
  { label: m.nav_services, hash: homeSections.services, desktopWideOnly: false },
  { label: m.nav_technology_short, hash: homeSections.technology, desktopWideOnly: false },
  { label: m.nav_team, hash: homeSections.team, desktopWideOnly: false },
  { label: m.nav_visit, hash: homeSections.visit, desktopWideOnly: true },
] as const;

const MOBILE_DOCK_ITEMS = [
  { label: m.nav_services, icon: StethoscopeIcon, hash: homeSections.services, featured: false },
  { label: m.nav_technology_short, icon: CpuIcon, hash: homeSections.technology, featured: false },
  { label: m.nav_team, icon: UsersIcon, hash: homeSections.team, featured: false },
  { label: m.nav_book, icon: CalendarDaysIcon, hash: homeSections.appointments, featured: true },
] as const;

const OBSERVED_SECTIONS = [
  homeSections.services,
  homeSections.technology,
  homeSections.team,
  homeSections.visit,
  homeSections.appointments,
] as const;

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

/*===== Subcomponents =====*/

function BrandLockup() {
  return (
    <Link
      to="/"
      className="group/brand pointer-events-auto inline-flex min-h-target shrink-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
    >
      <AvidaBrandEmblem className="group-hover/brand:scale-105 motion-safe:transition-transform motion-safe:duration-200" />
      <span className="flex flex-col">
        <span className="text-h4 leading-snug font-extrabold text-foreground sm:text-h3">{m.site_name()}</span>
        <span className="hidden text-caption leading-tight text-muted-foreground sm:block md:hidden xl:block">
          {m.site_brand_subtitle()}
        </span>
      </span>
    </Link>
  );
}

function DesktopNav({
  activeSection,
  onHome,
  hashScroll,
}: {
  activeSection: string | null;
  onHome: boolean;
  hashScroll: boolean | ScrollIntoViewOptions;
}) {
  return (
    <nav
      aria-label={m.nav_main()}
      className="site-desktop-nav-pill pointer-events-auto hidden items-center gap-1 rounded-full p-1 md:flex"
    >
      {DESKTOP_NAV_ITEMS.map(({ label, hash, desktopWideOnly }) => {
        const isActive = activeSection === hash;

        return (
          <Link
            key={hash}
            to="/"
            hash={hash}
            hashScrollIntoView={hashScroll}
            onClick={onHome ? (event) => scrollToCurrentSection({ event, options: hashScroll }) : undefined}
            data-active={isActive ? "true" : undefined}
            className={cn(
              "site-desktop-nav-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
              desktopWideOnly && "site-desktop-nav-link-wide",
            )}
          >
            <span aria-hidden className="site-desktop-nav-dot" />
            {label()}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileAppDock({
  activeSection,
  onHome,
  hashScroll,
}: {
  activeSection: string | null;
  onHome: boolean;
  hashScroll: boolean | ScrollIntoViewOptions;
}) {
  return (
    <nav aria-label={m.nav_main()} className="site-mobile-dock">
      {MOBILE_DOCK_ITEMS.map(({ icon: Icon, label, hash, featured }) => {
        const isActive = activeSection === hash;

        return (
          <Link
            key={hash}
            to="/"
            hash={hash}
            hashScrollIntoView={hashScroll}
            onClick={onHome ? (event) => scrollToCurrentSection({ event, options: hashScroll }) : undefined}
            data-active={isActive ? "true" : undefined}
            className={cn(
              "site-mobile-tab focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
              featured && "site-mobile-tab-featured",
            )}
          >
            <span aria-hidden className="site-mobile-tab-dot" />
            <Icon aria-hidden className="size-5 shrink-0" />
            <span>{label()}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({ viewer }: { viewer: Viewer }) {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={m.nav_account()} render={<Button variant="glass" size="icon-pill" />}>
        <UserIcon aria-hidden />
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

/**
 * Floating translucent glass navigation: frameless over the hero at scroll top, transitioning into a full-width
 * frosted-glass bar once scrolled (auto-hiding on downward desktop scroll and reappearing on upward scroll), paired
 * with the floating glass mobile app dock.
 */
export function SiteHeader({ viewer }: { viewer: Viewer | null }) {
  const localeLinks = useLocaleLinks();
  const { hidden: desktopHeaderHidden, scrolled } = useDesktopHeaderHidden();
  const onHome = useLocation({ select: (location) => location.pathname === "/" });
  const activeSection = useActiveHomeSection(OBSERVED_SECTIONS, onHome);
  const allowScrollMotion = useSyncExternalStore(
    subscribeToScrollMotion,
    () => window.matchMedia(SCROLL_MOTION_QUERY).matches,
    () => false,
  );
  const hashScroll = onHome && allowScrollMotion ? SMOOTH_HASH_SCROLL : true;

  return (
    <>
      <header
        data-scrolled={scrolled ? "true" : undefined}
        className={cn(
          "site-header-floating pointer-events-none z-30 md:z-40 md:has-[:focus-visible]:translate-y-0 md:motion-safe:transition-transform md:motion-safe:duration-200 md:motion-safe:ease-out",
          onHome ? "fixed inset-x-0 top-0" : "sticky top-0",
          desktopHeaderHidden && "md:-translate-y-full",
        )}
      >
        <div className="site-header-inner mx-auto flex max-w-site-wide items-center justify-between gap-3 px-4 py-3 sm:px-6 md:py-4">
          <BrandLockup />

          <DesktopNav activeSection={activeSection} onHome={onHome} hashScroll={hashScroll} />

          <div className="site-header-actions pointer-events-auto flex shrink-0 items-center gap-2">
            <ThemeToggle variant="glass" size="icon-pill" />
            <LocaleSwitcher links={localeLinks} variant="glass" size="pill" />
            {viewer ? (
              <AccountMenu viewer={viewer} />
            ) : (
              // A link styled as a button: `<Button render={<Link />}>` would announce it as a button (`role="button"`).
              <Link to="/auth" className={buttonVariants({ variant: "glass", size: "icon-pill" })}>
                <UserIcon aria-hidden />
                <span className="sr-only">{m.nav_sign_in()}</span>
              </Link>
            )}

            {/* Primary desktop booking glass pill; on mobile this lives as the featured tab in the bottom app dock. */}
            <Link
              to="/"
              hash={homeSections.appointments}
              hashScrollIntoView={hashScroll}
              onClick={onHome ? (event) => scrollToCurrentSection({ event, options: hashScroll }) : undefined}
              className="site-header-book-pill hidden min-h-target items-center gap-2 rounded-full px-4 text-body-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid md:inline-flex"
            >
              <CalendarDaysIcon aria-hidden className="size-4 shrink-0" />
              <span>{m.nav_book()}</span>
            </Link>
          </div>
        </div>
      </header>

      <MobileAppDock activeSection={activeSection} onHome={onHome} hashScroll={hashScroll} />
    </>
  );
}
