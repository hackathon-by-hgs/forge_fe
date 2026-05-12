'use client';

import { useLenis } from '@/hooks';
import {
  Header,
  Hero,
  TrustStrip,
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
  ArchSection,
} from '@/components';

export default function LandingPage() {
  useLenis();

  return (
    <div className="bg-black">
      <NoiseOverlay />
      <CustomCursor />
      <Header />

      <main>
        {/* ── LIGHT ZONE 1 ── */}
        <div data-navbar-theme="light" className="relative z-[1] bg-white">
          <Hero />
          <TrustStrip />
          <Stats />
        </div>

        {/* ── DARK CARD 1 ── */}
        <ArchSection id="features-arch" className="z-[2]">
          <Features />
        </ArchSection>

        {/* ── LIGHT ZONE 2 ── */}
        <div data-navbar-theme="light" className="relative z-[3] bg-white">
          <SuccessStories />
          <Challenges />
        </div>

        {/* ── DARK CARD 2 ── */}
        <ArchSection id="showcase-arch" className="z-[4]">
          <Showcase />
        </ArchSection>

        {/* ── LIGHT ZONE 3 ── */}
        <div data-navbar-theme="light" className="relative z-[5] bg-white">
          <Industries />
        </div>

        {/* ── DARK CARD 3 ── */}
        <ArchSection id="testimonials-arch" className="z-[6]">
          <Testimonials />
        </ArchSection>

        {/* ── DARK CARD 4 ── */}
        <ArchSection id="contact-arch" className="z-[7]">
          <ContactForm />
        </ArchSection>
      </main>

      <div className="relative z-[8]">
        <Footer />
      </div>
    </div>
  );
}
