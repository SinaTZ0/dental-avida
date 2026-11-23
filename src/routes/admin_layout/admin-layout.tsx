import { createFileRoute, redirect } from "@tanstack/react-router";

import { localizedPath } from "#/lib/locale";
import type { UserRole } from "#/lib/user-constants";
import { roleHomePath } from "#/lib/viewer";
import { orpc } from "#/orpc/client";

/** Only admins may open routes below this layout. */
const ROLES: readonly UserRole[] = ["admin"];

/*===== Guard =====*/
export const Route = createFileRoute("/_site-layout/_admin-layout")({
  beforeLoad: async ({ context, location }) => {
    const viewer = await context.queryClient.ensureQueryData(orpc.session.viewer.queryOptions());
    if (!viewer) throw redirect({ to: "/auth", search: { redirectTo: location.href } });
    if (!ROLES.includes(viewer.role as UserRole)) throw redirect({ href: localizedPath(roleHomePath(viewer.role)) });
    return { viewer };
  },
});
