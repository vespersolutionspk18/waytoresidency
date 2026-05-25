import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  pgEnum,
  numeric,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { question, choice, subject } from './content';

export const attemptMode = pgEnum('attempt_mode', ['tutor', 'quiz']);

export const attempt = pgTable(
  'attempt',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    mode: attemptMode('mode').notNull(),
    subjectId: uuid('subject_id').references(() => subject.id, {
      onDelete: 'set null',
    }),
    questionCount: integer('question_count').notNull(),
    timeLimitSeconds: integer('time_limit_seconds'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    scorePercent: numeric('score_percent', { precision: 5, scale: 2 }),
    correctCount: integer('correct_count').notNull().default(0),
    wrongCount: integer('wrong_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
  },
  (t) => [
    index('attempt_user_idx').on(t.userId),
    index('attempt_user_completed_idx').on(t.userId, t.completedAt),
  ],
);

export const attemptQuestion = pgTable(
  'attempt_question',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => attempt.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => question.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull(),
    selectedChoiceId: uuid('selected_choice_id').references(() => choice.id, {
      onDelete: 'set null',
    }),
    isCorrect: boolean('is_correct'),
    flagged: boolean('flagged').notNull().default(false),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
    answeredAt: timestamp('answered_at'),
  },
  (t) => [
    uniqueIndex('attempt_question_order_idx').on(t.attemptId, t.orderIndex),
    index('attempt_question_attempt_idx').on(t.attemptId),
  ],
);
