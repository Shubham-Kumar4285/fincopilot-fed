import { FeatureRows } from "../components/FeatureRows";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { LandingNav } from "../components/LandingNav";

export function LandingPage() {
  return (
    <div className="bg-surface">
      <LandingNav />
      <main className="bg-canvas">
        <Hero />
        <FeatureRows />
      </main>
      <Footer />
    </div>
  );
}
