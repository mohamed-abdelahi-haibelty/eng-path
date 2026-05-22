import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Root "/" is the language picker (auth-required but locale-free).
// "/sign-in" stays at the root, unprefixed.
const isPublicRoute = createRouteMatcher(["/sign-in"]);
const isRootPicker = createRouteMatcher(["/"]);

const intlMiddleware = createIntlMiddleware(routing);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  if (!isPublicRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  // /sign-in and / are not locale-routed.
  if (isPublicRoute(request) || isRootPicker(request)) return;

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp3)$).*)",
  ],
};
