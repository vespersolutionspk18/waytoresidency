import Link from 'next/link';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export const metadata = {
  title: 'Books · Way to Residency',
  description:
    'The FCPS-1 Manual, Residents\' Way to Residency, QBank for FCPS-1, and the AKUH Bundle. Books written and revised every year by Dr. Rashid Mahmood for FCPS Part 1 and Aga Khan Residency candidates.',
};

const BOOKS = [
  {
    slug: 'fcps-1-manual',
    title: 'The FCPS-1 Manual 2025',
    edition: '2nd Edition',
    price: 1500,
    wasPrice: 2000,
    cover: '/images/book-fcps1-manual.png',
    purpose: 'For the preparation of FCPS Part 1.',
    long: 'The FCPS-1 Manual is a complete preparation book for the FCPS Part 1 examination of the College of Physicians and Surgeons of Pakistan. The second edition has been fully revised, with corrections from the first edition, additional clinical correlations, and updates to the high yield material in line with the current exam pattern. It covers every system in a clean, exam focused style, written by Dr. Rashid Mahmood with input from working doctors who have recently sat the paper.',
    why: [
      'Every major system in one volume, formatted for quick revision.',
      'Concepts first, then clinical applications, then exam style points.',
      'Yearly revisions so the book stays current with the latest exam patterns.',
      'Trusted by candidates across Pakistan.',
    ],
    sale: true,
  },
  {
    slug: 'rwr-2026',
    title: "Residents' Way to Residency 2026",
    edition: '6th Edition',
    price: 2700,
    cover: '/images/book-rwr-2026.jpg',
    purpose: 'For the preparation of Aga Khan postgraduate entrance exams.',
    long: 'Residents\' Way to Residency, often referred to simply as RWR, is the flagship book for the Aga Khan University Residency and Internship entrance exams. The 2026 edition is the sixth in the series, and it has been rewritten and re tested against the most recent past papers. It covers the high yield basic sciences, clinical sciences, and applied medicine that the AKU paper tests, with a special focus on the question patterns that have been repeating for years.',
    why: [
      'Six editions of refinement, each built on candidate feedback from the previous year.',
      'Drawn directly from years of past papers, with the patterns clearly identified.',
      'Written by a doctor who has sat the exam and now teaches it.',
      'A single, trusted volume for the AKU exam, instead of scattered notes.',
    ],
    sale: false,
  },
  {
    slug: 'akuh-bundle',
    title: 'AKUH Bundle',
    edition: 'RWR-2026 plus MTB',
    price: 3800,
    wasPrice: 4000,
    cover: '/images/book-akuh-bundle.png',
    purpose:
      'The full Aga Khan entrance exam package, books bundled together at a reduced price.',
    long: 'The AKUH Bundle is the most efficient way to get the full Aga Khan University Residency and Internship preparation package. It includes the latest Residents\' Way to Residency (RWR-2026, 6th Edition), and the original Master the Boards (MTB) 8th Edition, which is a coloured book printed on newspaper stock so that we can keep the price accessible for serious candidates. Together these two titles form the spine of the preparation that most successful AKU candidates use.',
    why: [
      'Two essential books, one bundled price.',
      'RWR-2026 is the latest edition, with every correction and update from the previous year.',
      'MTB 8th Edition is the original, on newspaper stock, in colour, kept affordable for the people who actually need it.',
      'Cash on delivery available everywhere in Pakistan.',
    ],
    sale: true,
  },
  {
    slug: 'qbank-fcps1',
    title: 'QBank for FCPS-1',
    edition: '2025',
    price: 3000,
    cover: '/images/book-qbank-fcps1.jpeg',
    purpose:
      'A focused question bank containing past papers across every specialty of FCPS Part 1.',
    long: 'The QBank for FCPS-1 is a curated, organised collection of past examination questions across every specialty that the College of Physicians and Surgeons of Pakistan tests in the FCPS Part 1 examination. Each question is laid out clearly with the correct answer and a focused explanation, so that the book works both as a primary practice tool during your preparation and as a final revision pass before exam day.',
    why: [
      'Past papers organised by specialty, so revision can be targeted.',
      'Clear answers with the reasoning, not just letters.',
      'Annual updates as new question stems emerge.',
      'Pairs cleanly with The FCPS-1 Manual for a complete preparation package.',
    ],
    sale: false,
  },
];

export default function BooksPage() {
  return (
    <>
      <MarketingNav />

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="section-numeral">§ Books</span>
            <span className="eyebrow">Written, revised, and shipped from Bahawalpur</span>
          </div>
          <h1
            className="text-[40px] md:text-[56px] lg:text-[64px] leading-[1.04] tracking-[-0.018em] text-ink max-w-[18ch]"
            style={{
              fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
              fontWeight: 420,
            }}
          >
            Books for the{' '}
            <span className="serif-italic text-apothecary">FCPS Part 1</span>{' '}
            and the Aga Khan exam.
          </h1>
          <p className="mt-7 max-w-[68ch] text-[16.5px] text-ink-2 leading-[1.7]">
            Four titles, all written and revised every year by Dr. Rashid
            Mahmood and the Way to Residency team. Each book is built for a
            specific exam, with a specific candidate in mind. Order online,
            pay through HBLPay, or use cash on delivery anywhere in Pakistan.
            Bulk and institutional orders are welcome, write to us for
            wholesale pricing.
          </p>
        </div>
      </section>

      {BOOKS.map((b, idx) => (
        <section key={b.slug} id={b.slug} className="border-b border-rule">
          <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className={idx % 2 === 0 ? 'lg:col-span-4 lg:order-1' : 'lg:col-span-4 lg:order-2'}>
                <div className="bg-surface border border-rule rounded-lg overflow-hidden lg:sticky lg:top-6">
                  <div className="relative aspect-[3/4] bg-paper-2 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.cover}
                      alt={`Cover of ${b.title}`}
                      className="absolute inset-0 w-full h-full object-contain p-5"
                      loading="lazy"
                    />
                    {b.sale && (
                      <span className="absolute top-3 right-3 text-[10.5px] uppercase tracking-wider font-medium bg-copper text-paper px-2 py-0.5 rounded">
                        Sale
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-4 border-t border-rule bg-paper-2 flex items-center justify-between text-[11.5px]">
                    <span className="eyebrow">{b.edition}</span>
                    <span className="text-mute font-mono">{b.slug}</span>
                  </div>
                </div>
              </div>

              <div className={idx % 2 === 0 ? 'lg:col-span-7 lg:col-start-6 lg:order-2' : 'lg:col-span-7 lg:order-1'}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="section-numeral">§ {romanise(idx + 1)}.</span>
                  <span className="eyebrow">{b.edition}</span>
                </div>
                <h2
                  className="font-display text-[30px] md:text-[38px] leading-[1.08] tracking-[-0.014em] text-ink"
                  style={{ fontWeight: 450 }}
                >
                  {b.title}
                </h2>
                <p className="mt-3 text-[15px] serif-italic text-mute">
                  {b.purpose}
                </p>

                <div className="mt-6 flex items-baseline gap-4">
                  <span
                    className="font-display text-[36px] tabular-nums text-ink tracking-tight"
                    style={{ fontWeight: 450 }}
                  >
                    ₨ {b.price.toLocaleString('en-PK')}
                  </span>
                  {b.wasPrice && (
                    <span className="text-[15px] text-mute line-through tabular-nums">
                      ₨ {b.wasPrice.toLocaleString('en-PK')}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <AddToCartButton
                    item={{
                      slug: b.slug,
                      title: b.title,
                      edition: b.edition,
                      cover: b.cover,
                      priceMinor: b.price * 100,
                      currency: 'PKR',
                    }}
                  />
                  <a
                    href="https://wa.me/923087747686"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 inline-flex items-center px-5 text-[14px] tracking-tight text-ink-2 hover:text-ink border border-rule rounded-md hover:border-mute hover:bg-paper-2"
                  >
                    Order on WhatsApp
                  </a>
                </div>

                <p className="mt-7 text-[16px] text-ink-2 leading-[1.75]">
                  {b.long}
                </p>

                <div className="mt-6 bg-surface border border-rule rounded-lg p-6">
                  <div className="eyebrow mb-3">Why candidates pick this</div>
                  <ul className="space-y-2.5 text-[14px] text-ink-2 leading-[1.65]">
                    {b.why.map((w, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-display italic text-copper shrink-0 w-5">
                          {i + 1}.
                        </span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <ul className="mt-6 space-y-2 text-[13px] text-mute">
                  <li className="flex items-center gap-2">
                    <Dot /> Cash on delivery available all across Pakistan.
                  </li>
                  <li className="flex items-center gap-2">
                    <Dot /> Online payment through HBLPay.
                  </li>
                  <li className="flex items-center gap-2">
                    <Dot /> Bulk discounts for institutions and study groups.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-ink text-paper">
        <div className="w-full px-6 md:px-12 lg:px-16 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <span className="section-numeral text-copper-soft">§ Notes on shipping</span>
            <h2
              className="mt-2 font-display text-[28px] md:text-[34px] leading-[1.1] tracking-[-0.012em] text-paper"
              style={{ fontWeight: 450 }}
            >
              How orders work.
            </h2>
            <p className="mt-4 text-[14px] text-paper/75 leading-[1.7] max-w-[40ch]">
              Plain and simple, the same way they have worked for every
              candidate who has ordered before.
            </p>
          </div>
          <ul className="lg:col-span-7 space-y-3.5 text-[15px] text-paper/90 leading-[1.7]">
            <li>
              <span className="font-medium text-paper">Pay online with HBLPay.</span>{' '}
              Visa, Mastercard, UnionPay, or directly from your HBL account.
              Secure checkout, full receipt sent to your email.
            </li>
            <li>
              <span className="font-medium text-paper">Cash on delivery.</span>{' '}
              We ship through trusted Pakistan wide couriers. Pay the courier
              in cash when the parcel arrives, anywhere in the country.
            </li>
            <li>
              <span className="font-medium text-paper">Delivery time.</span>{' '}
              Two to five working days inside Pakistan, depending on city. We
              dispatch from Bahawalpur the same day your order is placed.
            </li>
            <li>
              <span className="font-medium text-paper">Bulk and institutional orders.</span>{' '}
              Write to us at the contact email for wholesale pricing,
              tutoring centre discounts, and library orders.
            </li>
          </ul>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

function romanise(n: number): string {
  const map = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return map[n] ?? String(n);
}

function Dot() {
  return <span className="inline-block w-1 h-1 rounded-full bg-copper shrink-0" aria-hidden />;
}
