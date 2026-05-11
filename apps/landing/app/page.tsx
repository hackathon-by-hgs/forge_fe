'use client';

import { useLenis } from '@/hooks';
import {
  Header,
  Hero,
  TrustStrip,
  Marquee,
  Stats,
  Features,
  SuccessStories,
  Challenges,
  Showcase,
  Testimonials,
  Industries,
  ContactForm,
  Footer,
  NoiseOverlay,
  CustomCursor,
} from '@/components';

/**
 * Forge Landing Page
 *
 * Design system replicates phenomenonstudio.com patterns:
 * — Pure black (#000) base, warm cream (#F5F5F0) for light sections
 * — Left-aligned massive typography (8vw hero)
 * — Hairline-bordered grids throughout
 * — Numbered service lists with hover-to-accent
 * — Clip-path portal reveal for dark→light transitions
 * — Infinite marquee text strip
 * — Large blockquote testimonials
 * — GSAP ScrollTrigger staggered entrances
 * — Lenis smooth momentum scrolling
 */
export default function LandingPage() {
  useLenis();

  return (
    <>
      <NoiseOverlay />
      <CustomCursor />
      <Header />

      <main>
        <Hero />
        <TrustStrip />
        <Stats />
        <Marquee />
        <Features />
        <SuccessStories />
        <Challenges />
        <Showcase />
        <Testimonials />
        <Industries />
        <ContactForm />
      </main>

      <Footer />
    </>
  );
}
