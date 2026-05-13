'use client';

import { useScrollReveal } from '@/hooks';
import { useState } from 'react';

export default function ContactForm() {
  const headingRef = useScrollReveal({ y: 30 });
  const formRef    = useScrollReveal({ y: 40, delay: 0.1 });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section
      id="contact"
      className="relative min-h-screen py-24 md:py-40"
    >
      <div className="section-container relative z-10">
        {/* Large heading */}
        <div ref={headingRef} className="mb-16 md:mb-24">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-6 block">Get in Touch</span>
          <h2 className="text-[clamp(2rem,5vw,5rem)] font-medium leading-[1.05] tracking-tight text-black max-w-5xl">
            Let&apos;s power your <br />
            <span className="text-black/30">workforce</span>
          </h2>
        </div>

        {/* Form + info */}
        <div ref={formRef} className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left — form */}
          <form onSubmit={handleSubmit} className="space-y-0">
            {[
              { id: 'contact-name',    type: 'text',  label: 'Name',    placeholder: 'Your name *',    required: true  },
              { id: 'contact-email',   type: 'email', label: 'Email',   placeholder: 'Your email *',   required: true  },
              { id: 'contact-company', type: 'text',  label: 'Company', placeholder: 'Company name',   required: false },
            ].map(({ id, type, label, placeholder, required }) => (
              <div key={id} className="border-t border-black/[0.08]">
                <label htmlFor={id} className="sr-only">{label}</label>
                <input
                  id={id}
                  type={type}
                  placeholder={placeholder}
                  required={required}
                  className="w-full border-b border-black/[0.08] bg-transparent py-8 text-xl text-black placeholder:text-black/20 focus:border-[#FF4D00] focus:outline-none transition-all duration-300"
                />
              </div>
            ))}

            <div>
              <label htmlFor="contact-message" className="sr-only">Message</label>
              <textarea
                id="contact-message"
                placeholder="Tell us about your workforce needs"
                rows={3}
                className="w-full resize-none border-b border-black/[0.08] bg-transparent py-8 text-xl text-black placeholder:text-black/20 focus:border-[#FF4D00] focus:outline-none transition-all duration-300"
              />
            </div>

            <div className="pt-12">
              <button 
                type="submit" 
                id="contact-submit" 
                className="group inline-flex items-center gap-4 rounded-xl bg-[#FF4D00] px-10 py-5 text-[12px] font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                {submitted ? (
                  <span className="flex items-center gap-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    SENT SUCCESSFULLY
                  </span>
                ) : (
                  <>
                    SEND MESSAGE
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right — contact info */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xl leading-relaxed mb-12 max-w-md text-black/40 font-medium">
                Whether you&apos;re an employer, a bank, or a worker — we&apos;d
                love to hear from you. No commitments, just a conversation.
              </p>

              <div className="space-y-8">
                <div>
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.3em] text-black/20">Email</span>
                  <a href="mailto:hello@forge.app" className="text-2xl font-medium text-black transition-colors duration-300 hover:text-[#FF4D00]">
                    hello@forge.app
                  </a>
                </div>
                <div>
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.3em] text-black/20">Phone</span>
                  <a href="tel:+2341234567" className="text-2xl font-medium text-black transition-colors duration-300 hover:text-[#FF4D00]">
                    +234 (0) 123 456 7890
                  </a>
                </div>
              </div>
            </div>

            {/* Location boxes */}
            <div className="mt-16 grid grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-black/[0.03] border border-black/5 transition-colors hover:bg-black/[0.06]">
                <span className="mb-6 block text-3xl">🇳🇬</span>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-widest text-black">Lagos</h4>
                <p className="text-sm text-black/40 font-medium">Victoria Island, Lagos</p>
              </div>
              <div className="p-8 rounded-3xl bg-black/[0.03] border border-black/5 transition-colors hover:bg-black/[0.06]">
                <span className="mb-6 block text-3xl">🇬🇧</span>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-widest text-black">London</h4>
                <p className="text-sm text-black/40 font-medium">Shoreditch, London</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
