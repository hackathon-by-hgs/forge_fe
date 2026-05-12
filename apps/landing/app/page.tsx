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
        {/* Step 1: Hero + TrustStrip + Stats (white, sticky) */}
        <section data-navbar-theme="light" className="sticky top-0 z-[10] bg-white min-h-screen">
          <Hero />
        </section>

        <section data-navbar-theme="light" className="sticky top-0 z-[11] bg-white min-h-[50vh] flex items-center">
          <TrustStrip />
        </section>

        <section data-navbar-theme="light" className="sticky top-0 z-[12] bg-white min-h-screen">
          <Stats />
        </section>

        {/* Step 2: Features (dark, slides over) */}
        <ArchSection id="features" className="z-[13]">
          <Features />
        </ArchSection>

        {/* Step 3: SuccessStories + Challenges (white, sticky) */}
        <section data-navbar-theme="light" className="sticky top-0 z-[14] bg-white min-h-screen">
          <SuccessStories />
        </section>

        <section data-navbar-theme="light" className="sticky top-0 z-[15] bg-white min-h-screen">
          <Challenges />
        </section>

        {/* Step 4: Showcase (dark, slides over) */}
        <ArchSection id="showcase" className="z-[16]">
          <Showcase />
        </ArchSection>

        {/* Step 5: Industries (white, sticky) */}
        <section data-navbar-theme="light" className="sticky top-0 z-[17] bg-white min-h-screen">
          <Industries />
        </section>

        {/* Step 6: Testimonials (dark, slides over) */}
        <ArchSection id="testimonials" className="z-[18]">
          <Testimonials />
        </ArchSection>

        {/* Step 7: Contact (dark, slides over preceding dark) */}
        <ArchSection id="contact" className="z-[19]">
          <ContactForm />
        </ArchSection>
      </main>

      {/* Footer (sticky) */}
      <footer className="sticky top-0 z-[20] bg-white min-h-[40vh]" data-navbar-theme="light">
        <Footer />
      </footer>
    </div>
  );
}
