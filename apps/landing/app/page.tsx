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
        <section data-navbar-theme="light" className="sticky top-0 z-[11] bg-white">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
              alt="Forge Infrastructure"
              className="h-full w-full object-cover opacity-[0.12] grayscale contrast-125"
            />
            {/* Decorative mesh/grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
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
