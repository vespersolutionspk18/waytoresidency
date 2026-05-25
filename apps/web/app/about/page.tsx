import Link from 'next/link';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';

export const metadata = {
  title: 'About · Way to Residency',
  description:
    'The story of Way to Residency, from one student\'s struggle for good notes into a platform that serves thousands of medical graduates across Pakistan.',
};

export default function AboutPage() {
  return (
    <>
      <MarketingNav />

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="section-numeral">§ About</span>
            <span className="eyebrow">Our journey</span>
          </div>
          <h1
            className="text-[40px] md:text-[56px] lg:text-[64px] leading-[1.02] tracking-[-0.018em] text-ink max-w-[20ch]"
            style={{
              fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
              fontWeight: 420,
            }}
          >
            From one student's struggle to a platform for{' '}
            <span className="serif-italic text-apothecary">thousands</span>.
          </h1>
          <p className="mt-6 max-w-[65ch] text-[17px] text-ink-2 leading-[1.7]">
            Way to Residency began with a very ordinary problem. A young
            medical graduate sat down to prepare for the FCPS Part 1 and could
            not find a single set of notes that he trusted. He looked through
            the books that were in the market, he asked his seniors, he
            visited the libraries that he could get to, and he kept coming
            back to the same feeling. The notes he needed simply did not
            exist. So he started to write them.
          </p>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ I.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em]">
                The first book.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5 text-[15.5px] text-ink-2 leading-[1.75]">
              <p>
                That set of personal notes turned, after many revisions, into
                a published book called <span className="serif-italic">The Night Before Exam</span>.
                It was a compact one liner guide, designed for the moment that
                every candidate knows well, the evening before the paper,
                when you want a single short document that gathers up the
                most important points in one place. The book worked. It made
                its way around the country, and the founder started to
                receive messages from students he had never met, asking him
                where they could find more of his material.
              </p>
              <p>
                Then came the Aga Khan Residency exam. Once again, the
                founder went looking for good notes, and once again he found
                that the resources for this specific exam were thin and
                scattered. There was no single trustworthy book. There was no
                modern study guide. He realised then that if he was struggling
                to find good notes, then thousands of medical students must be
                struggling too. That is the moment Way to Residency truly
                started.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ II.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em]">
                Since 2020, simplifying medicine.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5 text-[15.5px] text-ink-2 leading-[1.75]">
              <p>
                From 2020 onwards, Dr. Rashid Mahmood has been quietly working
                on the same project. Research, writing, teaching, and the
                slow craft of simplifying difficult medical concepts into
                language that an exam candidate can actually use. The result
                is a small library of materials that students recognise,
                including The FCPS-1 Manual, the QBank for FCPS-1, and the
                yearly Residents' Way to Residency series for the Aga Khan
                entrance exam.
              </p>
              <p>
                These books are not the work of a publishing house. They are
                the work of a doctor who teaches, with the help of a small
                team. Every page is read, every page is revised, and every
                edition is corrected based on the feedback that comes back
                from the people who used the previous one. That is also why
                we publish a new edition every year. Medicine changes,
                guidelines change, exam patterns change, and any book in this
                field that does not change with them is not going to do its
                job.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ III.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em]">
                Knowledge should not be limited.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5 text-[15.5px] text-ink-2 leading-[1.75]">
              <p>
                A printed book is a beautiful thing. It is also a slow thing.
                It cannot be updated for a year, it can only be shipped to
                people who can afford to wait, and it does not let the reader
                test themselves. For all of these reasons, the next chapter
                of Way to Residency is being built as a proper digital
                platform, a learning management system that will sit
                alongside the books, not replace them.
              </p>
              <p>
                The plan is straightforward. A large bank of board style
                multiple choice questions, written and reviewed by working
                doctors. Detailed explanations for every question, with the
                reasoning behind both the correct answer and the wrong ones.
                Short, focused study notes for each topic. Pre recorded
                lectures. Live discussion. And progress tracking that shows
                each candidate where their weak areas are. The principle
                behind it all is the one that started this work in the first
                place. Knowledge should not be limited to hard copies. It
                should be accessible to everyone, everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <div className="bg-paper-2 border border-rule rounded-lg overflow-hidden aspect-[4/5] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/dr-rashid.png"
                  alt="Dr. Rashid Mahmood, founder of Way to Residency"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <span className="section-numeral">§ IV.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em]">
                The founder.
              </h2>
              <p className="mt-5 text-[15.5px] text-ink-2 leading-[1.75]">
                Dr. Rashid Mahmood is a Pakistani medical graduate, an author,
                a teacher, and the founder and chief executive of Way to
                Residency. He has been writing and teaching since 2020. His
                work is read by FCPS Part 1 and Aga Khan Residency candidates
                across every province of Pakistan.
              </p>

              <div className="mt-7 bg-surface border border-rule rounded-lg p-6 md:p-7">
                <span className="eyebrow">A note from the founder</span>
                <blockquote
                  className="mt-3 font-display text-[22px] md:text-[26px] leading-[1.2] tracking-[-0.012em] text-ink"
                  style={{ fontWeight: 420 }}
                >
                  <span className="serif-italic">
                    "If I was struggling to find good resources, thousands of
                    students must be struggling too."
                  </span>
                </blockquote>
                <p className="mt-4 text-[12.5px] text-mute">
                  Dr. Rashid Mahmood, on the moment Way to Residency began.
                </p>
              </div>

              <Link
                href="/dr-rashid"
                className="mt-6 inline-flex items-center gap-1.5 text-[14px] text-apothecary hover:text-apothecary-2 font-medium"
              >
                Read his full bio
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-apothecary text-paper">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <h2
              className="font-display text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.012em]"
              style={{ fontWeight: 450 }}
            >
              Want to talk about your exam plan,{' '}
              <span className="serif-italic text-copper-soft">or your book project?</span>
            </h2>
            <p className="mt-3 text-[15px] text-paper/80 leading-[1.65] max-w-[60ch]">
              We answer every message that comes in. Whether you are looking
              for a course, a book, or help with research and publication,
              write to us and we will tell you honestly whether we can help
              and how.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/contact"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-paper text-ink hover:bg-paper-2 transition-colors"
            >
              Get in touch
            </Link>
            <Link
              href="/services"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md border border-paper/30 text-paper hover:bg-paper/10 transition-colors"
            >
              See services
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
