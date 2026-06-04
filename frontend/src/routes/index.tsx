import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { LandingLangProvider } from "@/lib/landing-i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Layover · Operational Interpreter for Ground Handling" },
      {
        name: "description",
        content:
          "Real-time multilingual translation for airline ground operations. Force-locked operational data, context-aware, voice-enabled.",
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
        <ProblemSection />
        <SolutionSection />
        <FinalCTA />
        <Footer />
      </div>
    </LandingLangProvider>
  );
}