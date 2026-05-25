import Link from 'next/link';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';

export const metadata = {
  title: 'Services · Way to Residency',
  description:
    'Aga Khan Residency course, FCPS Part 1 course, book publication, research and article writing, medical content, and presentation design. All by Dr. Rashid Mahmood and the Way to Residency team.',
};

const SERVICES = [
  {
    id: 'aga-khan',
    numeral: 'A.',
    title: 'Aga Khan Residency and Internship preparation',
    summary:
      'A structured thirty to forty day program built around the past papers and the high yield concepts of the Aga Khan University Residency and Internship entrance exams.',
    details: [
      'Two to three hours of teaching every day, delivered as clear WhatsApp voice note lectures that you can play while you are walking, driving, or studying with the page open in front of you.',
      'Every system gets a dedicated set of sessions, in the order that students find easiest to absorb. We start with the systems that carry the most weight in the exam.',
      'A daily open discussion group, where you can ask any question that came up during the lectures or during your own reading. Replies typically come within the same day.',
      'A full pass of the past papers is built into the schedule. By the time the course ends you have seen every recent question pattern, and you know which ones are still being repeated.',
      'There is no large class size to hide behind. The group is small enough that every member gets answered.',
    ],
    cta: { label: 'Join the WhatsApp group', href: 'https://wa.me/923087747686' },
  },
  {
    id: 'fcps-1',
    numeral: 'B.',
    title: 'FCPS Part 1 preparation course',
    summary:
      'A one and a half to two month structured program for FCPS Part 1 candidates, focused on the concepts and exam patterns that the College of Physicians and Surgeons of Pakistan actually tests.',
    details: [
      'We teach system by system. Each system gets enough time for both the foundational concepts and the high yield clinical correlations that appear in the paper.',
      'Daily structured discussions, so that every concept you have just covered gets revisited the same day in a question driven format.',
      'Individual sessions for the difficult topics. If a particular subject is not clicking for you, we book a one to one slot.',
      'An open group running through the day for question resolution, so you never have to sit on a doubt for very long.',
      'A full past papers pass at the end, with explanations for every question. By exam day you have seen the patterns enough times to recognise them on sight.',
    ],
    cta: { label: 'Ask about the next intake', href: '/contact' },
  },
  {
    id: 'publication',
    numeral: 'C.',
    title: 'Book designing and publication',
    summary:
      'Full support for doctors and academics who want to publish their own teaching material, from a clean manuscript through to a printed, bound copy in the hands of readers.',
    details: [
      'Content formatting that respects the reading habits of medical students. Clear hierarchy, predictable layout, room to write in the margins.',
      'Layout design done in a way that is friendly to print and to revision. We are not making coffee table books, we are making books that students actually use.',
      'Professional cover design, with the option to follow your own branding or to use one of our existing imprints.',
      'Editing and proofreading. Two passes minimum. Medical terminology, references, and citations are checked carefully.',
      'Full publication support, from registering ISBNs to working with the printers and arranging distribution.',
    ],
    cta: { label: 'Discuss your manuscript', href: '/contact' },
  },
  {
    id: 'research',
    numeral: 'D.',
    title: 'Research assistance and article publication',
    summary:
      'Practical help with the research projects, case reports and review articles that postgraduate doctors are expected to publish, with a focus on CPSP approved and PMDC recognised journals.',
    details: [
      'Synopsis and proposal writing, formatted to the standards expected by the relevant institutional review board.',
      'Original research assistance, from study design and data collection planning through to statistical analysis and write up.',
      'Case reports and review articles, written to journal style and submitted on your behalf if you wish.',
      'Journal selection guidance, with a focus on CPSP approved and PMDC recognised titles, but international journals are an option too.',
      'Submission, response to reviewer comments, and revision support. We stay with the project until it is accepted or until you decide to stop.',
    ],
    cta: { label: 'Send us your topic', href: '/contact' },
  },
  {
    id: 'content',
    numeral: 'E.',
    title: 'Medical content writing',
    summary:
      'For institutions, publishers, and individual teachers who need well written medical content in volume. We write structured notes, MCQs, clinical scenarios and academic copy.',
    details: [
      'Structured medical notes, written to a clear hierarchy and revised by working doctors. Used in our own books and available for licensing.',
      'MCQ formation. We write the stems, the five options and the explanations, all reviewed for accuracy and for exam style alignment.',
      'Clinical scenarios and case based questions, suitable for OSCE banks, tutorial groups and online learning platforms.',
      'Academic content, including chapter contributions, glossaries, slide notes and teaching scripts.',
    ],
    cta: { label: 'Tell us what you need written', href: '/contact' },
  },
  {
    id: 'presentations',
    numeral: 'F.',
    title: 'PowerPoint presentation designing',
    summary:
      'Slide design for the meetings that doctors actually present in, from morning teaching sessions to journal clubs and external seminars.',
    details: [
      'A clean visual identity for the talk, with proper typography and a consistent palette. No clip art, no chart junk.',
      'Information design that prioritises the key clinical point, with supporting evidence laid out where the audience can read it.',
      'Reference handling done properly, in either Vancouver or AMA style depending on the audience and the venue.',
      'Optional speaker notes for the presenter, so that you walk into the room knowing exactly what to say on each slide.',
    ],
    cta: { label: 'Brief us on your talk', href: '/contact' },
  },
];

export default function ServicesPage() {
  return (
    <>
      <MarketingNav />

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="section-numeral">§ Services</span>
            <span className="eyebrow">Six things, done properly</span>
          </div>
          <h1
            className="text-[40px] md:text-[56px] lg:text-[64px] leading-[1.04] tracking-[-0.018em] text-ink max-w-[18ch]"
            style={{
              fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
              fontWeight: 420,
            }}
          >
            What we{' '}
            <span className="serif-italic text-apothecary">do</span>{' '}
            for medical graduates.
          </h1>
          <p className="mt-7 max-w-[68ch] text-[16.5px] text-ink-2 leading-[1.7]">
            We run two structured exam preparation courses, and we provide
            four professional services for doctors who write, teach, and
            publish. Everything is delivered directly by Dr. Rashid Mahmood
            and a small team, so the standard is the same across every
            project. Below is what each service involves, in detail.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="h-9 inline-flex items-center px-3.5 text-[12.5px] font-medium rounded-md border border-rule-2 text-ink-2 hover:text-ink hover:border-mute hover:bg-paper-2 transition-colors"
              >
                {s.numeral} {s.title.split(' ').slice(0, 3).join(' ')}
              </a>
            ))}
          </div>
        </div>
      </section>

      {SERVICES.map((s, idx) => (
        <section
          key={s.id}
          id={s.id}
          className={
            idx === SERVICES.length - 1
              ? 'border-b border-rule'
              : 'border-b border-rule'
          }
        >
          <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4">
                <span className="section-numeral text-[15px]">{s.numeral}</span>
                <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.12] tracking-[-0.015em]">
                  {s.title}.
                </h2>
                <p className="mt-5 text-[14.5px] text-ink-2 leading-[1.7]">
                  {s.summary}
                </p>
                <Link
                  href={s.cta.href}
                  {...(s.cta.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="mt-6 h-10 inline-flex items-center px-4 text-[13.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
                >
                  {s.cta.label}
                  <span className="ml-2" aria-hidden>→</span>
                </Link>
              </div>
              <ul className="lg:col-span-7 lg:col-start-6 space-y-5 text-[15px] text-ink-2 leading-[1.75]">
                {s.details.map((d, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-display italic text-copper shrink-0 w-6 text-right tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="flex-1">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-apothecary text-paper">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <h2
              className="font-display text-[28px] md:text-[34px] leading-[1.08] tracking-[-0.012em]"
              style={{ fontWeight: 450 }}
            >
              Not sure which service fits?{' '}
              <span className="serif-italic text-copper-soft">Write to us.</span>
            </h2>
            <p className="mt-3 text-[15px] text-paper/80 leading-[1.65] max-w-[60ch]">
              A short message describing your situation is enough. We will
              tell you whether one of these six services is what you need,
              whether a combination makes sense, or whether you would be
              better served somewhere else. Honesty up front saves everyone
              time.
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
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
