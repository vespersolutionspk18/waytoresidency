import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const difficulty = pgEnum('difficulty', ['easy', 'medium', 'hard']);

export const course = pgTable(
  'course',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('course_sort_idx').on(t.sortOrder)],
);

export const subject = pgTable(
  'subject',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').references(() => course.id, {
      onDelete: 'set null',
    }),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('subject_sort_idx').on(t.sortOrder),
    index('subject_course_idx').on(t.courseId),
  ],
);

export const question = pgTable(
  'question',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: uuid('subject_id').references(() => subject.id, {
      onDelete: 'set null',
    }),
    vignette: text('vignette').notNull(),
    explanation: text('explanation').notNull(),
    difficulty: difficulty('difficulty').notNull().default('medium'),
    source: text('source'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('question_difficulty_idx').on(t.difficulty),
    index('question_subject_idx').on(t.subjectId),
  ],
);

export const choice = pgTable(
  'choice',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => question.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    text: text('text').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    rationale: text('rationale'),
  },
  (t) => [
    uniqueIndex('choice_question_label_idx').on(t.questionId, t.label),
    index('choice_correct_idx').on(t.questionId, t.isCorrect),
  ],
);
