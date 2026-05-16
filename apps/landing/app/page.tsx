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
    <div className="bg-white">
      <NoiseOverlay />
      <CustomCursor />
      <Header />

      <main>
        {/* Hero Section */}
        <section data-navbar-theme="light" className="relative z-[3] bg-black min-h-full">
          <Hero />
        </section>

        {/* Value Proposition */}
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
            </div>
          </div>
          <ValueProp />
        </section>

        {/* Key Features */}
        <ArchSection id="features" className="relative z-[20]" showBottomArch={false}>
          <Features />
        </ArchSection>

        {/* Case Studies */}
        <ArchSection id="success" className="relative z-[21] bg-[#050505]" showBottomArch={true}>
          <SuccessStories />
        </ArchSection>

        {/* Challenges & Solutions */}
        <section data-navbar-theme="light" className="relative z-[22] bg-white">
          <Challenges />
        </section>

        {/* Industry Verticals */}
        <ArchSection id="industries" className="relative z-[26]" archColor="#ffffff">
          <Industries />
        </ArchSection>
      </main>

      {/* Contact & Footer Wrapper */}
      <div className="relative z-[25]">
        {/* Contact Form */}
        <section id="contact" data-navbar-theme="light" className="sticky top-0 min-h-[100vh] bg-white">
          <ContactForm />
        </section>

        {/* Footer */}
        <footer className="relative z-[26] bg-black" data-navbar-theme="dark">
          <Footer />
        </footer>
      </div>
    </div>
  );
}
