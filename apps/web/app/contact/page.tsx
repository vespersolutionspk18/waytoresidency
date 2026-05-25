import Link from 'next/link';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';
import { ContactForm } from '@/components/marketing/ContactForm';

export const metadata = {
  title: 'Contact · Way to Residency',
  description:
    'Write to Dr. Rashid Mahmood and the Way to Residency team. WhatsApp, email, phone, and a contact form. Replies usually within the same working day.',
};

export default function ContactPage() {
  return (
    <>
      <MarketingNav />

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="section-numeral">§ Contact</span>
            <span className="eyebrow">We answer every message</span>
          </div>
          <h1
            className="text-[40px] md:text-[56px] lg:text-[64px] leading-[1.04] tracking-[-0.018em] text-ink max-w-[18ch]"
            style={{
              fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
              fontWeight: 420,
            }}
          >
            Hey there,{' '}
            <span className="serif-italic text-apothecary">
              how can we help?
            </span>
          </h1>
          <p className="mt-7 max-w-[65ch] text-[16.5px] text-ink-2 leading-[1.7]">
            Whether you have a question about a book, you want to enrol in
            one of the courses, you need help with a research project, or
            you just want to talk through your plan for the exam, write to
            us. There are a few different ways to reach the team, and we
            usually reply within the same working day.
          </p>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <span className="section-numeral">§ I.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.12] tracking-[-0.015em]">
                Send a message.
              </h2>
              <p className="mt-4 text-[15px] text-ink-2 leading-[1.7] max-w-[60ch]">
                Drop your details below, write a few lines about what you
                need, and we will get back to you. Keep your message clear
                and we will give you a clear answer in return.
              </p>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>

            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="bg-surface border border-rule rounded-lg p-6 lg:sticky lg:top-6">
                <span className="eyebrow">Direct contact</span>
                <ul className="mt-4 space-y-5 text-[14px]">
                  <li>
                    <div className="text-[10.5px] uppercase tracking-wider text-mute mb-1">
                      WhatsApp and phone
                    </div>
                    <a
                      href="https://wa.me/923087747686"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[15px] text-ink hover:text-apothecary"
                    >
                      +92 308 7747686
                    </a>
                    <div className="text-[12px] text-mute mt-0.5">
                      Fastest channel. Voice notes welcome.
                    </div>
                  </li>
                  <li>
                    <div className="text-[10.5px] uppercase tracking-wider text-mute mb-1">
                      Email
                    </div>
                    <a
                      href="mailto:dr.rashid157@gmail.com"
                      className="text-[14.5px] text-ink hover:text-apothecary break-all"
                    >
                      dr.rashid157@gmail.com
                    </a>
                    <div className="text-[12px] text-mute mt-0.5">
                      For longer queries, attachments, manuscripts.
                    </div>
                  </li>
                  <li>
                    <div className="text-[10.5px] uppercase tracking-wider text-mute mb-1">
                      Address
                    </div>
                    <p className="text-[14px] text-ink leading-[1.55]">
                      Street 2, Cheema Town Phase 2,
                      <br />
                      Bahawalpur, Pakistan
                    </p>
                  </li>
                </ul>

                <div className="mt-6 pt-5 border-t border-rule">
                  <div className="eyebrow mb-3">Follow along</div>
                  <ul className="grid grid-cols-2 gap-2 text-[13px]">
                    <SocialLink href="https://www.facebook.com/" label="Facebook" />
                    <SocialLink href="https://www.instagram.com/" label="Instagram" />
                    <SocialLink href="https://www.youtube.com/" label="YouTube" />
                    <SocialLink href="https://wa.me/923087747686" label="WhatsApp" />
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section>
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ II.</span>
              <h2 className="mt-2 text-[24px] md:text-[28px] leading-[1.12] tracking-[-0.012em]">
                Common questions.
              </h2>
              <p className="mt-4 text-[14px] text-mute leading-[1.65]">
                If your question is below, you can usually skip the form and
                get a faster answer.
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-6 text-[15px] text-ink-2 leading-[1.7]">
              <Faq
                q="When does the next Aga Khan course start?"
                a="The next intake of our Aga Khan Residency and Internship preparation course starts in June 2026. The session runs for thirty to forty days, two to three hours a day, by WhatsApp voice note. Write to us to be added to the waiting list."
              />
              <Faq
                q="How do I order a book?"
                a="Pick the book on the Books page and choose between online payment through HBLPay or cash on delivery. Cash on delivery is available everywhere in Pakistan. Delivery takes two to five working days depending on your city."
              />
              <Faq
                q="Do you accept international orders?"
                a="Yes, for international orders we arrange shipping on a case by case basis. Write to us with your country and address and we will quote a delivery fee."
              />
              <Faq
                q="Can you help with my research article?"
                a="Yes. We help with the synopsis, the writing, the journal selection and the submission. We work mostly with CPSP approved and PMDC recognised journals, but international submissions are an option too. Send us the topic and the stage you are at."
              />
              <Faq
                q="Can I publish a book through Way to Residency?"
                a="Yes. Our book designing and publication service takes a manuscript from the early draft through to the printed copy. We handle layout, editing, proofreading, cover design and the publication paperwork."
              />
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-2 hover:text-ink"
      >
        {label}
      </a>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3
        className="font-display text-[18px] text-ink tracking-[-0.005em]"
        style={{ fontWeight: 500 }}
      >
        {q}
      </h3>
      <p className="mt-2">{a}</p>
    </div>
  );
}
