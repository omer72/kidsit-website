import { notFound } from "next/navigation";

// Any unknown path under /he or /en (and, via the middleware rewrite, any other unknown path) renders
// app/[lang]/not-found.tsx inside the [lang] layout: <html lang dir>, the NagishLi widget and a link home, status 404.
// force-dynamic: random URLs must not create ISR cache entries.
export const dynamic = "force-dynamic";

export default function Missing() {
  notFound();
}
