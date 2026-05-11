'use client';

import { useScrollReveal } from '@/hooks';
import { useState } from 'react';

export default function ContactForm() {
  const headingRef = useScrollReveal({ y: 30 });
  const formRef = useScrollReveal({ y: 40, delay: 0.1 });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className="relative bg-black py-24 md:py-40">
      <div className="section-container">
        <div className="divider mb-16 md:mb-24" />

        {/* Large CTA heading — Phenomenon uses massive type for contact */}
        <div ref={headingRef} className="mb-16 md:mb-24">
          <span className="eyebrow mb-6 block">Get in Touch</span>
          <h2 className="text-hero max-w-5xl">
            Let&apos;s power your{' '}
            <span className="text-forge-accent">workforce</span>
          </h2>
        </div>

        {/* Form + info — 2 column */}
        <div ref={formRef} className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left — form */}
          <form onSubmit={handleSubmit} className="space-y-0">
            <div className="border-t border-white/[0.08]">
              <label htmlFor="contact-name" className="sr-only">Name</label>
              <input
                id="contact-name"
                type="text"
                placeholder="Your name *"
                required
                className="w-full bg-transparent border-b border-white/[0.08] py-6 text-white text-lg placeholder:text-white/20 focus:border-forge-accent focus:outline-none transition-colors duration-300"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="sr-only">Email</label>
              <input
                id="contact-email"
                type="email"
                placeholder="Your email *"
                required
                className="w-full bg-transparent border-b border-white/[0.08] py-6 text-white text-lg placeholder:text-white/20 focus:border-forge-accent focus:outline-none transition-colors duration-300"
              />
            </div>
            <div>
              <label htmlFor="contact-company" className="sr-only">Company</label>
              <input
                id="contact-company"
                type="text"
                placeholder="Company name"
                className="w-full bg-transparent border-b border-white/[0.08] py-6 text-white text-lg placeholder:text-white/20 focus:border-forge-accent focus:outline-none transition-colors duration-300"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="sr-only">Message</label>
              <textarea
                id="contact-message"
                placeholder="Tell us about your workforce needs"
                rows={3}
                className="w-full bg-transparent border-b border-white/[0.08] py-6 text-white text-lg placeholder:text-white/20 focus:border-forge-accent focus:outline-none transition-colors duration-300 resize-none"
              />
            </div>

            <div className="pt-8">
              <button
                type="submit"
                id="contact-submit"
                className="btn-primary"
              >
                {submitted ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Thank you!
                  </span>
                ) : (
                  <>
                    Send Message
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right — contact details */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-body-lg text-white/35 mb-10 max-w-md">
                Whether you&apos;re an employer, a bank, or a worker —
                we&apos;d love to hear from you. No commitments, just a conversation.
              </p>

              <div className="space-y-6">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/20 block mb-2">Email</span>
                  <a href="mailto:hello@forge.app" className="text-lg text-white hover:text-forge-accent transition-colors duration-200">
                    hello@forge.app
                  </a>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/20 block mb-2">Phone</span>
                  <a href="tel:+2341234567" className="text-lg text-white hover:text-forge-accent transition-colors duration-200">
                    +234 (0) 123 456 7890
                  </a>
                </div>
              </div>
            </div>

            {/* Location cards — Phenomenon shows office locations */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="border border-white/[0.08] p-6 rounded-xl">
                <span className="text-2xl mb-3 block">🇳🇬</span>
                <h4 className="text-sm font-semibold text-white mb-1">Lagos</h4>
                <p className="text-[13px] text-white/25">Victoria Island, Lagos</p>
              </div>
              <div className="border border-white/[0.08] p-6 rounded-xl">
                <span className="text-2xl mb-3 block">🇬🇧</span>
                <h4 className="text-sm font-semibold text-white mb-1">London</h4>
                <p className="text-[13px] text-white/25">Shoreditch, London</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
