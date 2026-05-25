import Link from 'next/link';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export default function HomePage() {
  return (
    <>
      <MarketingNav />

      {/* Announcement strip */}
      <div className="w-full bg-apothecary text-paper">
        <div className="w-full px-6 md:px-12 lg:px-16 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[13px]">
          <div className="flex items-start md:items-center gap-3">
            <span className="eyebrow text-[10px] text-paper/85 mt-0.5 md:mt-0">
              New
            </span>
            <span className="text-paper/95 leading-[1.55]">
              The latest edition of{' '}
              <span className="serif-italic">Residents' Way to Residency</span>{' '}
              (RWR-2026, 6th Edition) is now available with nationwide delivery
              all across Pakistan.
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href="tel:+923087747686"
              className="font-mono text-[12.5px] text-paper/90 hover:text-paper"
            >
              +92 308 7747686
            </a>
            <Link
              href="/books"
              className="text-[12.5px] underline underline-offset-4 decoration-paper/40 hover:decoration-paper"
            >
              Read more
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 pt-14 pb-16 lg:pt-20 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10 items-end">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-6 rise rise-1">
                <span className="section-numeral">Vol. I</span>
                <span className="h-px w-8 bg-rule-2" />
                <span className="eyebrow">A medical reading room</span>
              </div>

              <h1
                className="text-[44px] md:text-[60px] lg:text-[72px] leading-[1.02] tracking-[-0.022em] text-ink rise rise-2"
                style={{
                  fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
                  fontWeight: 420,
                }}
              >
                Welcome to{' '}
                <span className="serif-italic text-apothecary">
                  Way to Residency
                </span>
                .
              </h1>

              <p className="mt-7 max-w-[60ch] text-[17px] md:text-[18px] text-ink-2 leading-[1.65] rise rise-3">
                We are a dedicated learning home for medical graduates who are
                preparing for the FCPS Part 1 examination and for the Aga Khan
                University Residency and Internship entrance exams. Everything
                here, the books, the courses, the question bank, the
                discussions, has been built by a doctor for doctors. It started
                with one student's struggle to find good notes, and grew into a
                full platform that thousands of candidates trust every year.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3 rise rise-4">
                <Link
                  href="/services"
                  className="h-12 inline-flex items-center px-6 text-[14.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
                >
                  View all services
                </Link>
                <Link
                  href="/books"
                  className="h-12 inline-flex items-center px-5 text-[14.5px] font-medium tracking-tight text-ink-2 hover:text-ink border border-rule rounded-md hover:border-mute hover:bg-paper-2"
                >
                  Browse the books
                </Link>
              </div>
            </div>

            {/* Second announcement card */}
            <aside className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-rule rise rise-4">
              <span className="section-numeral">Upcoming</span>
              <h2
                className="mt-2 font-display text-[22px] md:text-[26px] leading-[1.12] tracking-[-0.012em]"
                style={{ fontWeight: 450 }}
              >
                Aga Khan Residency and Internship preparation,{' '}
                <span className="serif-italic">starting June 2026</span>.
              </h2>
              <p className="mt-4 text-[14.5px] text-ink-2 leading-[1.65]">
                Our well known session for the AKU entrance exams will begin
                again in June 2026, by the will of Allah. It runs for thirty
                to forty days, two to three hours every day, delivered through
                WhatsApp voice note lectures. There is an open discussion group
                so any question you have during the day can be answered the
                same day.
              </p>
              <Link
                href="/services"
                className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-apothecary hover:text-apothecary-2 font-medium"
              >
                See how the course works
                <span aria-hidden>→</span>
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* Books */}
      <section id="books" className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ I.</span>
              <h2 className="mt-2 text-[28px] md:text-[36px] leading-[1.08] tracking-[-0.015em]">
                Books trusted across Pakistan.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-[16px] text-ink-2 leading-[1.7]">
                Four titles, all written and revised every year by Dr. Rashid
                Mahmood and the Way to Residency team. They cover the FCPS
                Part 1 syllabus, the Aga Khan postgraduate entrance exam, and
                the past papers you actually need to revise from. Nationwide
                cash on delivery is available, and we ship anywhere in
                Pakistan within a few working days.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <BookCard
              slug="fcps-1-manual"
              title="The FCPS-1 Manual 2025"
              edition="2nd Edition"
              priceMinor={150000}
              wasPriceMinor={200000}
              cover="/images/book-fcps1-manual.png"
              description="A complete manual for the preparation of FCPS Part 1, covering every major system in clean, exam focused detail. The second edition is fully revised, with corrections, additions, and the latest high yield concepts."
              sale
            />
            <BookCard
              slug="rwr-2026"
              title="Residents' Way to Residency 2026"
              edition="6th Edition"
              priceMinor={270000}
              cover="/images/book-rwr-2026.jpg"
              description="The flagship book for the Aga Khan University Residency and Internship entrance exams. Six editions of refinement, drawn from years of past questions, candidate feedback, and clinical updates."
            />
            <BookCard
              slug="akuh-bundle"
              title="AKUH Bundle"
              edition="RWR-2026 plus MTB"
              priceMinor={380000}
              wasPriceMinor={400000}
              cover="/images/book-akuh-bundle.png"
              description="The full Aga Khan prep package. RWR-2026 (latest edition) paired with the original MTB 8th edition. A coloured book printed on newspaper stock, kept affordable for serious candidates."
              sale
            />
            <BookCard
              slug="qbank-fcps1"
              title="QBank for FCPS-1"
              edition="2025"
              priceMinor={300000}
              cover="/images/book-qbank-fcps1.jpeg"
              description="A focused question bank for FCPS Part 1, containing the past papers across every specialty. Useful as a primary practice tool and also as a final revision pass before the exam."
            />
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/books"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md border border-rule-2 text-ink-2 hover:text-ink hover:border-mute hover:bg-paper-2 transition-colors"
            >
              Find more books and bundles
              <span className="ml-2" aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ II.</span>
              <h2 className="mt-2 text-[28px] md:text-[36px] leading-[1.08] tracking-[-0.015em]">
                Our services.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-[16px] text-ink-2 leading-[1.7]">
                We do six things, and we try to do each of them properly. The
                first two are direct preparation courses for the exams that
                most of our students are sitting. The other four are research,
                writing and design services, useful for doctors who are
                writing journal articles, presenting at meetings, or
                publishing their own teaching material.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ServiceCard
              numeral="A."
              title="Aga Khan Residency and Internship preparation"
              blurb="A structured thirty to forty day program designed to help candidates master the high yield concepts and past MCQs tested in the AKU entrance exams. Two to three hours of WhatsApp voice note lectures every day, with an open group for questions and discussion."
              href="/services#aga-khan"
            />
            <ServiceCard
              numeral="B."
              title="FCPS Part 1 preparation"
              blurb="A one and a half to two month structured program designed to build the strong concepts and exam focused understanding you need for FCPS Part 1. We teach system by system, with daily discussions and individual sessions for the difficult topics."
              href="/services#fcps-1"
            />
            <ServiceCard
              numeral="C."
              title="Book designing and publication"
              blurb="Content formatting, layout design, professional covers, editing, proofreading, and full publication support. If you are writing a book, we can take it from manuscript to printed copy."
              href="/services#publication"
            />
            <ServiceCard
              numeral="D."
              title="Research assistance and article publication"
              blurb="Synopsis and proposal writing, original research assistance, case reports, review articles, journal formatting, and guidance for CPSP approved and PMDC recognised journals."
              href="/services#research"
            />
            <ServiceCard
              numeral="E."
              title="Medical content writing"
              blurb="Structured medical notes, MCQ formation, clinical scenarios, case based questions, and academic content for teaching and exam prep."
              href="/services#content"
            />
            <ServiceCard
              numeral="F."
              title="PowerPoint presentation designing"
              blurb="Clean and professional slide decks for teaching sessions, seminars, journal clubs, and any other professional meeting. Done with proper visual hierarchy and a focus on clarity."
              href="/services#presentations"
            />
          </div>
        </div>
      </section>

      {/* Vision */}
      <section id="vision" className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <span className="section-numeral">§ III.</span>
              <h2 className="mt-2 text-[28px] md:text-[36px] leading-[1.08] tracking-[-0.015em]">
                Our vision.
              </h2>
              <p className="mt-6 text-[16.5px] text-ink-2 leading-[1.7]">
                To empower medical students by delivering accessible, high
                quality educational resources for professional success in
                their medical careers. We believe that good notes should not
                be a privilege reserved for students in the biggest cities or
                with the deepest pockets. A well written manual, a clear
                explanation, and a teacher you can ask a question to at the
                end of the day should be available to everyone, everywhere.
              </p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <div className="bg-surface border border-rule rounded-lg overflow-hidden grid grid-cols-1 sm:grid-cols-[2fr_3fr] items-stretch">
                <div className="relative bg-paper-2 aspect-[4/5] sm:aspect-auto sm:min-h-[460px] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/dr-rashid.png"
                    alt="Dr. Rashid Mahmood, founder of Way to Residency"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="p-7 md:p-9 flex flex-col justify-center">
                  <span className="eyebrow">Founder and CEO</span>
                  <h3
                    className="mt-3 font-display text-[28px] md:text-[34px] leading-[1.05] tracking-[-0.014em] text-ink"
                    style={{ fontWeight: 450 }}
                  >
                    Dr. Rashid <span className="serif-italic text-apothecary">Mahmood</span>
                  </h3>
                  <p className="mt-4 text-[14px] text-ink-2 leading-[1.7]">
                    Since 2020 he has been researching, writing, and
                    simplifying medical concepts for FCPS Part 1 and Aga Khan
                    Residency candidates. The FCPS-1 Manual, the QBank for
                    FCPS-1, and the Residents&rsquo; Way to Residency series
                    have all grown out of that work, and are now used by
                    candidates across the country.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/dr-rashid"
                      className="h-10 inline-flex items-center px-4 text-[13.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
                    >
                      Read his story
                    </Link>
                    <Link
                      href="/about"
                      className="h-10 inline-flex items-center px-4 text-[13.5px] tracking-tight text-ink-2 hover:text-ink"
                    >
                      About the platform
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas of interest */}
      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="mb-10">
            <span className="section-numeral">§ IV.</span>
            <h2 className="mt-2 text-[28px] md:text-[36px] leading-[1.08] tracking-[-0.015em]">
              Areas of interest.
            </h2>
            <p className="mt-4 max-w-[70ch] text-[16px] text-ink-2 leading-[1.7]">
              Beyond the postgraduate medical exams, Way to Residency also
              works in adjacent fields. We help candidates with the PPSC
              competitive exam preparation, we publish under our partner
              imprint Guardian Publications, and we support a broader medical
              education community wherever we are useful.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InterestTile
              label="Medical education"
              hint="FCPS, AKU, residency"
              image="/images/area-medical-1.jpeg"
            />
            <InterestTile
              label="PPSC preparation"
              hint="Public service commission"
              image="/images/area-ppsc.jpeg"
            />
            <InterestTile
              label="Guardian Publications"
              hint="Partner imprint, book series"
              image="/images/area-guardian.jpeg"
            />
            <InterestTile
              label="Clinical content"
              hint="Notes, MCQs, journal articles"
              image="/images/area-medical-2.jpeg"
            />
          </div>
        </div>
      </section>

      {/* Watch & Learn — YouTube */}
      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ V.</span>
              <h2 className="mt-2 text-[28px] md:text-[36px] leading-[1.08] tracking-[-0.015em]">
                Watch and learn.
              </h2>
              <p className="mt-4 text-[16px] text-ink-2 leading-[1.7]">
                A short introduction to Way to Residency, the courses, and how
                we approach FCPS Part 1 and Aga Khan Residency preparation.
                For the full library of lectures, subscribe to the YouTube
                channel.
              </p>
              <a
                href="https://www.youtube.com/watch?v=I9Zt4vHrk24"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-[14px] text-apothecary hover:text-apothecary-2 font-medium"
              >
                Open on YouTube
                <span aria-hidden>→</span>
              </a>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <div className="relative w-full aspect-video bg-paper-2 border border-rule rounded-lg overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/I9Zt4vHrk24"
                  title="Way to Residency on YouTube"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-apothecary text-paper">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <h2
              className="font-display text-[28px] md:text-[34px] leading-[1.08] tracking-[-0.012em]"
              style={{ fontWeight: 450 }}
            >
              Ready to start?{' '}
              <span className="serif-italic text-copper-soft">
                We are here to help.
              </span>
            </h2>
            <p className="mt-3 text-[15px] text-paper/80 leading-[1.65] max-w-[60ch]">
              Whether you need a book, a course, a research consultation, or
              just want to talk through your plan for the exam, write to us.
              Replies usually come within the same working day.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/contact"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-paper text-ink hover:bg-paper-2 transition-colors"
            >
              Contact us
            </Link>
            <a
              href="https://wa.me/923087747686"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md border border-paper/30 text-paper hover:bg-paper/10 transition-colors"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

function BookCard({
  slug,
  title,
  edition,
  priceMinor,
  wasPriceMinor,
  description,
  sale,
  cover,
}: {
  slug: string;
  title: string;
  edition: string;
  priceMinor: number;
  wasPriceMinor?: number;
  description: string;
  sale?: boolean;
  cover: string;
}) {
  const fmt = (n: number) => `₨ ${(n / 100).toLocaleString('en-PK')}`;
  return (
    <div className="bg-surface border border-rule rounded-lg overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[3/4] bg-paper-2 border-b border-rule overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={`Cover of ${title}`}
          className="absolute inset-0 w-full h-full object-contain p-4"
          loading="lazy"
        />
        {sale && (
          <span className="absolute top-3 right-3 text-[10.5px] uppercase tracking-wider font-medium bg-copper text-paper px-2 py-0.5 rounded">
            Sale
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="eyebrow text-[10px] mb-2">Book</span>
        <h3
          className="font-display text-[19px] leading-[1.18] tracking-[-0.01em] text-ink"
          style={{ fontWeight: 450 }}
        >
          {title}
        </h3>
        <div className="mt-1 text-[12px] text-mute uppercase tracking-wider">
          {edition}
        </div>
        <p className="mt-4 text-[13.5px] text-ink-2 leading-[1.65] flex-1">
          {description}
        </p>
        <div className="mt-5 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-[20px] tabular-nums text-ink tracking-tight"
              style={{ fontWeight: 500 }}
            >
              {fmt(priceMinor)}
            </span>
            {wasPriceMinor && (
              <span className="text-[12px] text-mute line-through tabular-nums">
                {fmt(wasPriceMinor)}
              </span>
            )}
          </div>
          <AddToCartButton
            variant="link"
            item={{
              slug,
              title,
              edition,
              cover,
              priceMinor,
              currency: 'PKR',
            }}
            label="Add to cart"
          />
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  numeral,
  title,
  blurb,
  href,
}: {
  numeral: string;
  title: string;
  blurb: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-surface border border-rule rounded-lg p-7 hover:border-mute transition-colors"
    >
      <div className="flex items-baseline gap-3 mb-3">
        <span className="section-numeral text-[15px]">{numeral}</span>
        <h3
          className="font-display text-[20px] tracking-tight text-ink"
          style={{ fontWeight: 450 }}
        >
          {title}
        </h3>
      </div>
      <div className="rule mb-4" />
      <p className="text-[14px] text-ink-2 leading-[1.65]">{blurb}</p>
      <div className="mt-4 text-[12.5px] text-apothecary font-medium group-hover:text-apothecary-2">
        Learn more →
      </div>
    </Link>
  );
}

function InterestTile({ label, hint, image }: { label: string; hint: string; image: string }) {
  return (
    <div className="bg-surface border border-rule rounded-lg overflow-hidden">
      <div className="aspect-[4/3] bg-paper-2 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <span className="eyebrow text-[10px]">Focus</span>
        <h3
          className="mt-1.5 font-display text-[16px] leading-[1.2] tracking-[-0.005em] text-ink"
          style={{ fontWeight: 450 }}
        >
          {label}
        </h3>
        <p className="mt-1 text-[12.5px] text-mute leading-[1.5]">{hint}</p>
      </div>
    </div>
  );
}
