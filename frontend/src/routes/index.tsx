import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/Hero";
import { LandingLangProvider } from "@/lib/landing-i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Layover · Operational Interpreter for Ground Handling" },
      {
        name: "description",
        content:
          "Real-time multilingual translation for airline ground operations. 4 languages, voice-enabled, force-locked flight data.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Layover · Operational Interpreter" },
      {
        property: "og:description",
        content:
          "Real-time multilingual translation for airline ground operations.",
      },
      { property: "og:image", content: "/og-image.svg" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <LandingLangProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Hero />
      </div>
    </LandingLangProvider>
  );
}