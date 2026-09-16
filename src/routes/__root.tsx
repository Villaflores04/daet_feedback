import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { BootSplash } from "@/components/boot-splash";
import { HydratePulse } from "@/components/hydrate-pulse";
import { NotFoundPage } from "@/components/not-found";
import { ToasterHost } from "@/components/toaster-host";
import appCss from "../styles.css?url";

const APP_NAME = "DAET Pulse";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#0E6A62" },
      {
        name: "description",
        content:
          "See Daet through the eyes of its visitors. A public tourism feedback desk for the Municipality of Daet, Camarines Norte.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  notFoundComponent: NotFoundPage,
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh bg-page font-sans text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <HydratePulse />
          <ToasterHost />
          <BootSplash>
            <Outlet />
          </BootSplash>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
