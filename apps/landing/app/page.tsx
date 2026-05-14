'use client';

import Image from 'next/image';
import { useLenis } from '@/hooks';
import {
  Header,
  Hero,
  ValueProp,
  Features,
  SuccessStories,
  Challenges,
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
        <section data-navbar-theme="light" className="relative z-[3] bg-black min-h-full">
          <Hero />
        </section>

        {/* Step 2: Value Prop (light, sticky) */}
        <section
          data-navbar-theme="light"
          className="sticky top-0 z-[2] min-h-screen overflow-hidden bg-white"
          style={{marginTop: '-100vh'}}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="sticky top-0 h-screen overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                alt="Forge Infrastructure"
                fill
                priority
                sizes="100vw"
                className="scale-105 object-cover object-center opacity-[0.4] contrast-[1.15] saturate-[0.9]"
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
        <ArchSection id="features" className="relative z-[20]">
          <Features />
        </ArchSection>

        {/* Step 4: Case Studies — horizontal scroll, self-pinning */}
        <section data-navbar-theme="dark" className="relative z-[21]" style={{ marginTop: '-160px' }}>
          <SuccessStories />
        </section>

        {/* Step 5: Challenges — white, flows naturally */}
        <section data-navbar-theme="light" className="relative z-[22] bg-white">
          <Challenges />
        </section>

        {/* Step 6: Industries — dark section */}
        <section data-navbar-theme="dark" className="relative z-[23]">
          <Industries />
        </section>

        {/* Step 7: Testimonials — self-pinning panels */}
        <section data-navbar-theme="dark" className="relative z-[24]">
          <Testimonials />
        </section>

        {/* Step 8: Contact — white */}
        <section id="contact-section" data-navbar-theme="light" className="sticky top-0 min-h-screen z-[25] bg-white">
          <ContactForm />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-[26]" data-navbar-theme="dark">
        <Footer />
      </footer>
    </div>
  );
}
