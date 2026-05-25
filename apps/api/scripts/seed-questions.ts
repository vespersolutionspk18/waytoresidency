import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import {
  course,
  subject,
  question,
  choice,
  attempt,
  attemptQuestion,
} from '../src/db/schema';

type Parsed = {
  vignette: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

const ANCHOR_RE = /^correct\s*answer\b/i;
const EXPLANATION_LABEL_RE = /^explanation\s*:?\s*$/i;
const LETTER_PREFIX_RE = /^\(?[A-Ea-e]\s*[)\.\-]\s*/;
const TRAILING_CHECK_RE = /\s*[✓✔✅]\s*$/;
const ANY_CHECK_RE = /[✓✔✅]/;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function matchOption(target: string, options: { text: string }[]): number {
  const t = normalize(target);
  if (t.length < 3) return -1;
  for (let i = 0; i < options.length; i++) {
    if (normalize(options[i]!.text) === t) return i;
  }
  let best = -1;
  let bestLen = 0;
  for (let i = 0; i < options.length; i++) {
    const o = normalize(options[i]!.text);
    if (o.length < 4) continue;
    if (o === t) return i;
    if (o.includes(t) && t.length > bestLen) {
      best = i;
      bestLen = t.length;
    } else if (t.includes(o) && o.length > bestLen) {
      best = i;
      bestLen = o.length;
    }
  }
  return best;
}

function parseQuestions(raw: string): { parsed: Parsed[]; skipped: number } {
  const lines = raw
    .split('\n')
    .map((l) => l.replace(/ /g, ' ').replace(/\s+$/, ''));
  const anchors: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (ANCHOR_RE.test(lines[i]!.trim())) anchors.push(i);
  }

  type Meta = {
    ai: number;
    vignetteStartLine: number;
    correctIndex: number;
    options: string[];
    vignette: string;
    inverted: boolean;
    expEnd: number;
    resolvedBy: string;
  };

  const meta: Meta[] = [];
  let skipped = 0;

  for (let k = 0; k < anchors.length; k++) {
    const ai = anchors[k]!;
    const prevEnd = k > 0 ? anchors[k - 1]! : -1;

    let j = ai - 1;
    while (j > prevEnd && lines[j]!.trim() === '') j--;
    const probeCollected: { idx: number; text: string }[] = [];
    let hitExplanation = -1;
    while (j > prevEnd && probeCollected.length < 5) {
      const t = lines[j]!.trim();
      if (t === '') {
        j--;
        continue;
      }
      if (EXPLANATION_LABEL_RE.test(t)) {
        hitExplanation = j;
        break;
      }
      probeCollected.unshift({ idx: j, text: t });
      j--;
    }
    let aboveIsExp = -1;
    if (probeCollected.length === 5) {
      let m = j;
      while (m > prevEnd && lines[m]!.trim() === '') m--;
      if (m > prevEnd && EXPLANATION_LABEL_RE.test(lines[m]!.trim())) {
        aboveIsExp = m;
      }
    }
    const inverted = hitExplanation >= 0 || aboveIsExp >= 0;
    const expEnd = inverted ? (hitExplanation >= 0 ? hitExplanation : aboveIsExp) : -1;
    let optionLines: { idx: number; text: string }[];
    let postOptionsJ: number;
    if (inverted) {
      let j2 = expEnd - 1;
      while (j2 > prevEnd && lines[j2]!.trim() === '') j2--;
      const collected: { idx: number; text: string }[] = [];
      while (j2 > prevEnd && collected.length < 5) {
        const t = lines[j2]!.trim();
        if (t === '') {
          j2--;
          continue;
        }
        if (EXPLANATION_LABEL_RE.test(t)) {
          j2--;
          continue;
        }
        collected.unshift({ idx: j2, text: t });
        j2--;
      }
      optionLines = collected;
      postOptionsJ = j2;
    } else {
      optionLines = probeCollected;
      postOptionsJ = j;
    }
    if (optionLines.length < 5) {
      skipped++;
      continue;
    }
    let v = postOptionsJ;
    while (v > prevEnd && lines[v]!.trim() === '') v--;
    const vignetteLines: string[] = [];
    while (v > prevEnd && lines[v]!.trim() !== '') {
      const t = lines[v]!.trim();
      if (EXPLANATION_LABEL_RE.test(t)) break;
      vignetteLines.unshift(t);
      v--;
    }
    const vignetteStartLine = v + 1;
    if (vignetteLines.length === 0) {
      skipped++;
      continue;
    }
    const vignette = vignetteLines.join(' ').replace(/\s+/g, ' ').trim();
    if (vignette.length < 40) {
      skipped++;
      continue;
    }
    const cleanedOptions = optionLines.map((o) => ({
      text: o.text.replace(LETTER_PREFIX_RE, '').replace(TRAILING_CHECK_RE, '').trim(),
      raw: o.text,
    }));
    let correctIndex = -1;
    let resolvedBy = '';
    const acLine = lines[ai]!.trim();
    const m1 = acLine.match(/^correct\s*answer\s*:?\s*\(?([A-Ea-e])(?![a-zA-Z])/i);
    if (m1) {
      correctIndex = m1[1]!.toUpperCase().charCodeAt(0) - 65;
      resolvedBy = 'letter';
    }
    if (correctIndex < 0) {
      const after = acLine.replace(/^correct\s*answer\s*:?\s*/i, '').trim();
      if (after) {
        const idx = matchOption(after, cleanedOptions);
        if (idx >= 0) {
          correctIndex = idx;
          resolvedBy = 'text-after-anchor';
        }
      }
    }
    if (correctIndex < 0) {
      for (let m = ai + 1; m <= ai + 6 && m < lines.length; m++) {
        const t = lines[m]!.trim();
        if (!t) continue;
        if (EXPLANATION_LABEL_RE.test(t)) break;
        if (ANCHOR_RE.test(t)) break;
        const idx = matchOption(t, cleanedOptions);
        if (idx >= 0) {
          correctIndex = idx;
          resolvedBy = 'line-after-anchor';
          break;
        }
        break;
      }
    }
    if (correctIndex < 0) {
      const idx = cleanedOptions.findIndex((o) => ANY_CHECK_RE.test(o.raw));
      if (idx >= 0) {
        correctIndex = idx;
        resolvedBy = 'check-mark-in-option';
      }
    }
    if (correctIndex < 0 && inverted && expEnd >= 0) {
      let explanationStart = expEnd + 1;
      while (
        explanationStart < ai &&
        (lines[explanationStart]!.trim() === '' ||
          EXPLANATION_LABEL_RE.test(lines[explanationStart]!.trim()))
      ) {
        explanationStart++;
      }
      for (let m = explanationStart; m < ai && m < explanationStart + 5; m++) {
        const t = lines[m]!.trim();
        if (!t) continue;
        const firstSentence = t.split(/[.;:]/)[0]!.trim();
        const idx = matchOption(firstSentence, cleanedOptions);
        if (idx >= 0) {
          correctIndex = idx;
          resolvedBy = 'explanation-first-sentence';
          break;
        }
      }
    }
    if (correctIndex < 0 || correctIndex > 4) {
      skipped++;
      continue;
    }
    meta.push({
      ai,
      vignetteStartLine,
      correctIndex,
      options: cleanedOptions.map((o) => o.text),
      vignette,
      inverted,
      expEnd,
      resolvedBy,
    });
  }

  const parsed: Parsed[] = [];
  for (let k = 0; k < meta.length; k++) {
    const cur = meta[k]!;
    const next = meta[k + 1];
    let explanation = '';
    if (cur.inverted && cur.expEnd >= 0) {
      let start = cur.expEnd + 1;
      while (start < cur.ai && lines[start]!.trim() === '') start++;
      explanation = lines
        .slice(start, cur.ai)
        .map((l) => l.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } else {
      let start = cur.ai + 1;
      if (cur.resolvedBy === 'line-after-anchor') {
        while (start < lines.length && lines[start]!.trim() === '') start++;
        start++;
      }
      while (
        start < lines.length &&
        EXPLANATION_LABEL_RE.test(lines[start]!.trim())
      ) {
        start++;
      }
      while (start < lines.length && lines[start]!.trim() === '') start++;
      const end = next ? next.vignetteStartLine : lines.length;
      explanation = lines
        .slice(start, end)
        .map((l) => l.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
    explanation = explanation.replace(/^Explanation\s*:?\s*\n*/i, '').trim();
    parsed.push({
      vignette: cur.vignette,
      choices: cur.options,
      correctIndex: cur.correctIndex,
      explanation,
    });
  }

  return { parsed, skipped };
}

// =====================================================================
// Subject classifier
// =====================================================================
const SUBJECTS: {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  keywords: [string, number][];
}[] = [
  {
    slug: 'cardiology',
    name: 'Cardiology',
    description: 'Heart and vascular system — arrhythmias, ischemia, valvular disease, ECG interpretation.',
    sortOrder: 1,
    keywords: [
      ['hyperkalemia', 3], ['STEMI', 5], ['myocardial infarction', 4], ['ECG', 3], ['EKG', 3],
      ['amlodipine', 3], ['lisinopril', 2], ['arrhythmia', 4], ['mitral stenosis', 5],
      ['aortic', 2], ['angina', 3], ['cardiac', 2], ['CCB', 2], ['beta blocker', 2],
      ['PR interval', 3], ['QRS', 3], ['CHF', 2], ['streptokinase', 3], ['ACE inhibitor', 2],
      ['peaked T waves', 3], ['T wave', 2],
    ],
  },
  {
    slug: 'neurology',
    name: 'Neurology',
    description: 'Central and peripheral nervous system — demyelinating, neuromuscular, stroke.',
    sortOrder: 2,
    keywords: [
      ['botulism', 5], ['Guillain', 5], ['GBS', 4], ['Multiple Sclerosis', 5],
      ['demyelinat', 4], ['Reiter', 4], ['paralysis', 3], ['cranial nerve', 3],
      ['optic neuritis', 4], ['spinal cord', 2], ['CNS', 1], ['myasthenia', 4], ['ALS', 3],
      ['amyotrophic', 4], ['neuromuscular junction', 3], ['areflexia', 3], ['ptosis', 3],
      ['descending paralysis', 4], ['ascending paralysis', 4],
    ],
  },
  {
    slug: 'pediatrics',
    name: 'Pediatrics',
    description: 'Childhood illness — infections, growth, vaccines, IMNCI.',
    sortOrder: 3,
    keywords: [
      ['child', 3], ['infant', 3], ['pediatric', 3], ['IMNCI', 5],
      ['febrile seizure', 5], ['croup', 5], ['laryngotracheobronchitis', 4],
      ['otitis media', 4], ['MMR', 4], ['breastfeed', 3], ['neonatal', 3],
      ['mother brings', 4], ['year-old child', 3], ['percentile', 3],
      ['intussusception', 5], ['immunization', 3], ['vaccine', 2],
    ],
  },
  {
    slug: 'obgyn',
    name: 'Obstetrics & Gynecology',
    description: 'Women’s health — menstrual disorders, pregnancy, gynecologic cancers.',
    sortOrder: 4,
    keywords: [
      ['vaginal discharge', 4], ['menstrual', 3], ['intermenstrual', 5], ['pelvic', 2],
      ['pregnant', 4], ['pregnancy', 3], ['gynecology', 3], ['endometrial', 4],
      ['cervix', 3], ['cervical cancer', 4], ['Turner', 4], ['fibroid', 4],
      ['preeclampsia', 5], ['eclampsia', 4], ['trichomoniasis', 5], ['G2P2', 3], ['amenorrhea', 3],
    ],
  },
  {
    slug: 'toxicology',
    name: 'Toxicology',
    description: 'Poisonings, overdoses, antidotes and decontamination.',
    sortOrder: 5,
    keywords: [
      ['toxicity', 3], ['poisoning', 4], ['overdose', 4], ['antidote', 4],
      ['organophosphate', 5], ['TCA', 3], ['tricyclic', 4], ['lidocaine toxicity', 5],
      ['gastric lavage', 4], ['naloxone', 3], ['morphine poisoning', 5], ['iron poisoning', 4],
      ['kerosene', 3], ['atropine', 3], ['pralidoxime', 4], ['acetaminophen', 3],
      ['amitriptyline', 3], ['cholinergic', 3], ['SLUDGE', 3],
    ],
  },
  {
    slug: 'anesthesia',
    name: 'Anesthesia',
    description: 'Anaesthetic agents, neuromuscular blockers, perioperative care.',
    sortOrder: 6,
    keywords: [
      ['suxamethonium', 5], ['succinylcholine', 5], ['neuromuscular blocker', 5],
      ['local anesthetic', 4], ['anesthesi', 3], ['atracurium', 4], ['vecuronium', 4],
      ['rocuronium', 4], ['pancuronium', 4], ['depolarizing', 4],
    ],
  },
  {
    slug: 'psychiatry',
    name: 'Psychiatry',
    description: 'Mood, psychotic, anxiety, eating disorders and substance use.',
    sortOrder: 7,
    keywords: [
      ['schizophren', 5], ['bipolar', 4], ['depression', 3], ['lithium', 4],
      ['antidepressant', 3], ['antipsychotic', 4], ['psychiatric', 3], ['bulimia', 5],
      ['eating disorder', 4], ['Tarasoff', 4], ['involuntar', 3], ['mania', 3],
    ],
  },
  {
    slug: 'hematology',
    name: 'Hematology',
    description: 'Anaemias, bleeding disorders, leukaemias and transfusion.',
    sortOrder: 8,
    keywords: [
      ['anemia', 4], ['hemoglobin', 3], ['thrombocytopenia', 5], ['ferritin', 4],
      ['blood transfusion', 4], ['PRBC', 3], ['leukemia', 4], ['AML', 4], ['platelet', 3],
      ['iron deficiency', 4], ['ferrous sulfate', 4], ['dilutional', 4], ['DIC', 3],
      ['FFP', 3], ['bone marrow', 3],
    ],
  },
  {
    slug: 'infectious-disease',
    name: 'Infectious Disease',
    description: 'Bacterial, viral, parasitic and protozoal infections.',
    sortOrder: 9,
    keywords: [
      ['cholera', 5], ['E. coli', 4], ['Escherichia', 4], ['Salmonella', 4],
      ['Shigella', 4], ['amebiasis', 5], ['meningitis', 4], ['malaria', 5],
      ['falciparum', 5], ['vibrio', 4], ['traveler', 3], ['Chlamydia', 3],
      ['Plasmodium', 5], ['Giardia', 4], ['acyclovir', 4], ['herpes', 3], ['ETEC', 4],
    ],
  },
  {
    slug: 'endocrinology',
    name: 'Endocrinology',
    description: 'Thyroid, adrenal, pituitary, calcium and pancreatic-axis disorders.',
    sortOrder: 10,
    keywords: [
      ['thyroid', 4], ['hypothyroid', 5], ['hyperthyroid', 5], ['TSH', 4], ['cortisol', 3],
      ['diabetes', 3], ['insulin', 3], ['adrenal', 3], ['pituitary', 4], ['Hashimoto', 4],
      ['hypocalcemia', 3], ['hypercalcemia', 3], ['hypoglycem', 3],
    ],
  },
  {
    slug: 'gastroenterology',
    name: 'Gastroenterology',
    description: 'Hepatobiliary, pancreatic and intestinal disorders.',
    sortOrder: 11,
    keywords: [
      ['ERCP', 5], ['cholang', 4], ['hepato', 3], ['pancrea', 4], ['gallbladder', 4],
      ['hepatitis', 3], ['cirrhosis', 4], ['necrosectomy', 5], ['gastrointestinal', 2],
      ['Wilson', 4],
    ],
  },
  {
    slug: 'surgery',
    name: 'Surgery',
    description: 'Operative anatomy, perioperative complications, surgical emergencies.',
    sortOrder: 12,
    keywords: [
      ['cystic artery', 5], ['gastroduodenal', 5], ['appendec', 4], ['laparotomy', 4],
      ['laparoscop', 4], ['surgical resident', 4], ['scrubbed', 3], ['sterile', 3],
    ],
  },
  {
    slug: 'rheumatology',
    name: 'Rheumatology',
    description: 'Inflammatory and crystal arthritis, connective tissue disease.',
    sortOrder: 13,
    keywords: [
      ['gout', 5], ['rheumatoid', 4], ['arthritis', 2], ['lupus', 4],
      ['connective tissue', 3], ['synovial', 4], ['uric acid', 3],
    ],
  },
  {
    slug: 'nephrology',
    name: 'Nephrology',
    description: 'Glomerular, tubular and renal-replacement medicine.',
    sortOrder: 14,
    keywords: [
      ['kidney', 4], ['renal', 4], ['CKD', 5], ['glomerular', 5], ['nephritis', 4],
      ['urinary', 2], ['dialysis', 4], ['SIADH', 4], ['hyponatremia', 3], ['proteinuria', 4],
    ],
  },
  {
    slug: 'pulmonology',
    name: 'Pulmonology',
    description: 'Respiratory infections, malignancy and obstructive disease.',
    sortOrder: 15,
    keywords: [
      ['lung cancer', 5], ['Small Cell Lung', 5], ['asthma', 4], ['COPD', 4],
      ['pneumonia', 3], ['pulmonary', 3], ['bronch', 2], ['SCLC', 4],
    ],
  },
  {
    slug: 'general-medicine',
    name: 'General Medicine',
    description: 'Cross-system and miscellaneous internal-medicine vignettes.',
    sortOrder: 99,
    keywords: [],
  },
];

function classify(text: string): string {
  const lower = text.toLowerCase();
  const scores: { slug: string; score: number }[] = [];
  for (const s of SUBJECTS) {
    let score = 0;
    for (const [kw, w] of s.keywords) {
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (re.test(lower)) score += w;
    }
    scores.push({ slug: s.slug, score });
  }
  scores.sort((a, b) => b.score - a.score);
  if (scores[0]!.score === 0) return 'general-medicine';
  return scores[0]!.slug;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const docxPath = path.resolve(here, '../../../docs/Generic 2024 final 62.docx');
  console.log(`reading ${docxPath}`);
  const { value: text } = await mammoth.extractRawText({ path: docxPath });
  const { parsed, skipped } = parseQuestions(text);
  console.log(`parsed ${parsed.length} questions, skipped ${skipped}`);

  // Course
  const COURSE_SLUG = 'generic-2024';
  let [courseRow] = await db.select().from(course).where(eq(course.slug, COURSE_SLUG));
  if (!courseRow) {
    [courseRow] = await db
      .insert(course)
      .values({
        slug: COURSE_SLUG,
        name: 'Generic 2024 — Mixed Specialties',
        description:
          'Cross-specialty board-style MCQs covering common residency-exam scenarios.',
        sortOrder: 1,
        isPublished: true,
      })
      .returning();
  }
  const courseId = courseRow!.id;

  // Wipe attempts (FK to question)
  const allAttempts = await db.select({ id: attempt.id }).from(attempt);
  if (allAttempts.length > 0) {
    console.log(`clearing ${allAttempts.length} attempts`);
    await db.delete(attemptQuestion);
    await db.delete(attempt);
  }

  // Wipe existing seeded questions
  const oldQs = await db.select({ id: question.id }).from(question).where(eq(question.source, 'Generic 2024'));
  if (oldQs.length > 0) {
    console.log(`clearing ${oldQs.length} prior seeded questions`);
    for (const r of oldQs) await db.delete(question).where(eq(question.id, r.id));
  }
  await db.delete(subject).where(eq(subject.slug, 'mixed-2024'));

  // Subjects
  const subjectIdBySlug = new Map<string, string>();
  for (const s of SUBJECTS) {
    let [row] = await db.select().from(subject).where(eq(subject.slug, s.slug));
    if (!row) {
      [row] = await db
        .insert(subject)
        .values({
          courseId,
          slug: s.slug,
          name: s.name,
          description: s.description,
          sortOrder: s.sortOrder,
        })
        .returning();
    } else {
      await db
        .update(subject)
        .set({
          courseId,
          name: s.name,
          description: s.description,
          sortOrder: s.sortOrder,
        })
        .where(eq(subject.id, row.id));
    }
    subjectIdBySlug.set(s.slug, row!.id);
  }

  // Insert questions
  let inserted = 0;
  const tally: Record<string, number> = {};
  for (const q of parsed) {
    const subjSlug = classify(`${q.vignette}\n${q.explanation}`);
    tally[subjSlug] = (tally[subjSlug] ?? 0) + 1;
    const subjectId = subjectIdBySlug.get(subjSlug)!;

    const [qrow] = await db
      .insert(question)
      .values({
        subjectId,
        vignette: q.vignette,
        explanation: q.explanation,
        difficulty: 'medium',
        source: 'Generic 2024',
      })
      .returning();
    if (!qrow) continue;

    await db.insert(choice).values(
      q.choices.map((text, i) => ({
        questionId: qrow.id,
        label: String.fromCharCode(65 + i),
        text,
        isCorrect: i === q.correctIndex,
      })),
    );
    inserted++;
  }

  console.log(`inserted ${inserted} questions`);
  console.log('  classification:');
  for (const s of SUBJECTS) {
    const n = tally[s.slug] ?? 0;
    if (n > 0) console.log(`    ${s.name.padEnd(28)} ${n}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
