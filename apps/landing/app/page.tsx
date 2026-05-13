'use client';

import { useLenis } from '@/hooks';
import {
  Header,
  Hero,
  ValueProp,
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
        {/* Step 1: Hero (details pinned internally via GSAP) */}
        <section data-navbar-theme="light" className="relative z-[10] bg-white min-h-full">
          <Hero />
        </section>

        {/* Step 2: Value Prop (light, sticky) */}
        <section
          data-navbar-theme="light"
          className="sticky top-0 z-[11] min-h-screen overflow-hidden bg-white"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="sticky top-0 h-screen overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                alt="Forge Infrastructure"
                className="h-full w-full scale-105 object-cover object-center opacity-[0.4] contrast-[1.15] saturate-[0.9]"
              />
              {/* Decorative mesh/grid overlay */}
              {/* <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.08]" />
              <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.92)_18%,rgba(255,255,255,0.68)_48%,rgba(255,255,255,0.28)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.32)_52%,rgba(255,255,255,0.72)_100%)]" /> */}
            </div>
          </div>
          <ValueProp />
        </section>

        {/* Step 3: Features (dark, slides over) */}
        <ArchSection id="features" className="z-[13]">
          <Features />
        </ArchSection>

        {/* Step 4: Case Studies + Challenges split into sticky parts */}
        <section data-navbar-theme="light" className="sticky top-0 z-[14] bg-white">
          <SuccessStories />
        </section>

        <section data-navbar-theme="light" className="sticky top-0 z-[15] bg-white">
          <Challenges />
        </section>

        {/* Step 5: Showcase (dark, slides over) */}
        {/* <ArchSection id="showcase" className="sticky top-0 z-[16]">
          <Showcase />
        </ArchSection> */}

        {/* Step 6: Industries (white, sticky) */}
        <section data-navbar-theme="light" className="sticky top-0 z-[17] bg-white">
          <Industries />
        </section>

        {/* Step 7: Testimonials (dark, slides over) */}
        <ArchSection id="testimonials" className="sticky top-0 z-[18]">
          <Testimonials />
        </ArchSection>

        {/* Step 8: Contact (dark, slides over preceding dark) */}
        <section id="contact" data-navbar-theme="light" className="sticky top-0 z-[17] bg-white">
          <ContactForm />
        </section>
      </main>

      {/* Footer (sticky) */}
      <footer className="sticky top-0 z-[20] bg-white" data-navbar-theme="light">
        <Footer />
      </footer>
    </div>
  );
}
