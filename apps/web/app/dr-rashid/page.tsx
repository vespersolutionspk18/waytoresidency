import Link from 'next/link';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';

export const metadata = {
  title: 'Dr. Rashid Mahmood · Way to Residency',
  description:
    'Founder and CEO of Way to Residency. Doctor, teacher, author, and the person behind The FCPS-1 Manual, Residents\' Way to Residency, and the QBank for FCPS-1.',
};

export default function DrRashidPage() {
  return (
    <>
      <MarketingNav />

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-6">
                <span className="section-numeral">§ The founder</span>
                <span className="eyebrow">Author, teacher, doctor</span>
              </div>
              <h1
                className="text-[44px] md:text-[60px] lg:text-[72px] leading-[1.02] tracking-[-0.02em] text-ink"
                style={{
                  fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
                  fontWeight: 420,
                }}
              >
                Dr. Rashid{' '}
                <span className="serif-italic text-apothecary">Mahmood</span>.
              </h1>
              <p className="mt-7 max-w-[60ch] text-[17px] text-ink-2 leading-[1.7]">
                Founder and Chief Executive of Way to Residency. A Pakistani
                medical graduate who started writing his own notes because he
                could not find good ones, and who has spent the years since
                then turning those notes into a small library of trusted books
                and a growing platform that thousands of exam candidates rely
                on every year.
              </p>
              <aside className="mt-8 bg-surface border border-rule rounded-lg p-6">
                <span className="eyebrow">At a glance</span>
                <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-[13.5px]">
                  <Row k="Role" v="Founder and CEO" />
                  <Row k="Based in" v="Bahawalpur, Pakistan" />
                  <Row k="Active since" v="2020" />
                  <Row k="Books authored" v="The FCPS-1 Manual, RWR, QBank, more" />
                  <Row k="Focus" v="FCPS Part 1, Aga Khan Residency exam" />
                  <Row k="Find him" v={<a href="https://wa.me/923087747686" target="_blank" rel="noopener noreferrer" className="text-apothecary hover:text-apothecary-2 font-mono">WhatsApp +92 308 7747686</a>} />
                </dl>
              </aside>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 order-1 lg:order-2">
              <div className="relative bg-paper-2 border border-rule rounded-lg overflow-hidden aspect-[4/5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/dr-rashid.png"
                  alt="Dr. Rashid Mahmood, founder of Way to Residency"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="eager"
                />
                {/* Editorial corner mark, no caption strip */}
                <div className="absolute top-4 left-4 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-ink-2/85 bg-paper/85 backdrop-blur px-2.5 py-1 rounded">
                  <span className="serif-italic text-copper not-italic font-display" style={{ fontStyle: 'italic' }}>§</span>
                  Portrait
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ I.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em]">
                The student who became a teacher.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5 text-[15.5px] text-ink-2 leading-[1.75]">
              <p>
                Dr. Rashid Mahmood is a Pakistani medical graduate. Like many
                of his peers, he sat down soon after his MBBS to prepare for
                the FCPS Part 1 examination of the College of Physicians and
                Surgeons of Pakistan. He went looking for notes. He found
                that the available material was either incomplete, badly
                organised, or simply outdated. So he started taking his own
                notes, and the notes started to take shape.
              </p>
              <p>
                Out of that work came his first published book, a small
                volume called The Night Before Exam. It was designed for the
                evening before the paper, the moment that every candidate
                knows, when you want a single concise document that pulls
                together all the points you need to revise before the exam
                starts. The book was practical, it was honest, and it found
                its readers quickly.
              </p>
              <p>
                Soon afterwards he began preparing for the Aga Khan
                University Residency and Internship entrance exam. The same
                gap appeared. The notes that existed were thin, scattered,
                and inconsistent. There was no single trusted book. Dr.
                Rashid realised that if he was struggling to find good
                resources, thousands of other students must be struggling
                too. That recognition is the seed of Way to Residency.
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
                Books that students actually use.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5 text-[15.5px] text-ink-2 leading-[1.75]">
              <p>
                Since 2020, Dr. Rashid has been researching, writing, teaching
                and simplifying medical concepts for FCPS Part 1 and Aga Khan
                Residency candidates. The library has grown one careful
                volume at a time. The FCPS-1 Manual, now in its second
                edition, is a complete system by system preparation book for
                the FCPS Part 1 examination. The QBank for FCPS-1 collects
                the past papers across every specialty and pairs them with
                clear, focused explanations. And the Residents' Way to
                Residency series, currently in its sixth edition, has become
                the standard preparation volume for the Aga Khan entrance
                exam.
              </p>
              <p>
                These are not books that sit on a publisher's catalogue. They
                are revised every year. The author re reads the past papers,
                he listens to feedback from the candidates who used the
                previous edition, and he corrects, expands and updates the
                material so that the book continues to do its job. That kind
                of yearly discipline is the reason the books are trusted
                across Pakistan.
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
                The teacher.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5 text-[15.5px] text-ink-2 leading-[1.75]">
              <p>
                Dr. Rashid teaches both the structured Aga Khan course and
                the FCPS Part 1 course personally. The Aga Khan session runs
                for thirty to forty days, two to three hours every day,
                delivered as carefully recorded WhatsApp voice note lectures
                so that candidates can listen during their commute or while
                they walk through the syllabus on paper. The FCPS Part 1
                course runs for one and a half to two months, system by
                system, with daily discussions and individual sessions for
                difficult topics.
              </p>
              <p>
                Whatever the format, the teaching philosophy is the same.
                The explanation has to be honest. The reasoning has to be
                shown. The exam patterns have to be respected. And every
                question that comes in during the day gets an answer the
                same day.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <span className="section-numeral">§ IV.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em]">
                Outside of medicine.
              </h2>
              <p className="mt-5 text-[15px] text-ink-2 leading-[1.75]">
                Dr. Rashid is based in Bahawalpur, where Way to Residency
                operates from a small office in Cheema Town. Outside of his
                clinical reading and his writing, he runs the platform's
                book publication and research consulting work, supports the
                team behind Guardian Publications, and is steadily building
                the next chapter of Way to Residency as a proper learning
                management system.
              </p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <div className="bg-surface border border-rule rounded-lg p-7">
                <span className="eyebrow">In his own words</span>
                <blockquote
                  className="mt-4 font-display text-[22px] md:text-[26px] leading-[1.2] tracking-[-0.012em] text-ink"
                  style={{ fontWeight: 420 }}
                >
                  <span className="serif-italic">
                    "Knowledge should not be limited to hard copies. It should
                    be accessible to everyone, everywhere."
                  </span>
                </blockquote>
                <p className="mt-4 text-[13px] text-mute">
                  Dr. Rashid Mahmood, on the future of medical exam preparation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4">
              <span className="section-numeral">§ V.</span>
              <h2 className="mt-2 text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em]">
                Watch a session.
              </h2>
              <p className="mt-5 text-[15px] text-ink-2 leading-[1.7]">
                A short introduction to how the courses run, and what to
                expect from the daily voice note teaching. For the full
                library of lectures and short topic videos, subscribe to the
                YouTube channel.
              </p>
              <a
                href="https://www.youtube.com/watch?v=I9Zt4vHrk24"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-[14px] text-apothecary hover:text-apothecary-2 font-medium"
              >
                Subscribe on YouTube
                <span aria-hidden>→</span>
              </a>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <div className="relative w-full aspect-video bg-paper-2 border border-rule rounded-lg overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/I9Zt4vHrk24"
                  title="Way to Residency by Dr. Rashid Mahmood"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
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
              Want to work with Dr. Rashid?{' '}
              <span className="serif-italic text-copper-soft">
                Drop a message.
              </span>
            </h2>
            <p className="mt-3 text-[15px] text-paper/80 leading-[1.65] max-w-[60ch]">
              For course enrolment, book orders, research help, or any other
              question, write to us. The same person you read on this page
              is reading the replies.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/contact"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-paper text-ink hover:bg-paper-2 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/books"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md border border-paper/30 text-paper hover:bg-paper/10 transition-colors"
            >
              See the books
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-wider text-mute mb-0.5">
        {k}
      </dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}
