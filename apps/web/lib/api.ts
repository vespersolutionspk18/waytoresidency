const BASE = '/api';

async function request<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let msg = `request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type AttemptMode = 'tutor' | 'quiz';

export type AttemptChoice = { id: string; label: string; text: string };

export type AttemptQuestion = {
  attemptQuestionId: string;
  orderIndex: number;
  vignette: string;
  subject: { id: string; name: string; slug: string } | null;
  choices: AttemptChoice[];
  selectedChoiceId: string | null;
  flagged: boolean;
  timeSpentSeconds: number;
  answeredAt: string | null;
  isCorrect: boolean | null;
  correctChoiceId: string | null;
  explanation: string | null;
};

export type AttemptState = {
  id: string;
  mode: AttemptMode;
  questionCount: number;
  timeLimitSeconds: number | null;
  startedAt: string;
  completedAt: string | null;
  scorePercent: string | null;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  questions: AttemptQuestion[];
};

export type AttemptSummary = {
  id: string;
  mode: AttemptMode;
  questionCount: number;
  startedAt: string;
  completedAt: string | null;
  scorePercent: string | null;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
};

export const api = {
  listAttempts: () => request<{ attempts: AttemptSummary[] }>('/attempts'),

  createAttempt: (input: {
    mode: AttemptMode;
    questionCount: number;
    timeLimitSeconds?: number | null;
    subjectIds?: string[];
  }) =>
    request<{ id: string }>('/attempts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getAttempt: (id: string) => request<AttemptState>(`/attempts/${id}`),

  answer: (
    attemptId: string,
    input: {
      attemptQuestionId: string;
      selectedChoiceId: string;
      timeSpentSeconds: number;
    },
  ) =>
    request<{
      ack: true;
      isCorrect?: boolean;
      correctChoiceId?: string | null;
      explanation?: string | null;
    }>(`/attempts/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  skip: (
    attemptId: string,
    input: { attemptQuestionId: string; timeSpentSeconds: number },
  ) =>
    request<{ ack: true }>(`/attempts/${attemptId}/skip`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  flag: (
    attemptId: string,
    input: { attemptQuestionId: string; flagged: boolean },
  ) =>
    request<{ ack: true }>(`/attempts/${attemptId}/flag`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  complete: (attemptId: string) =>
    request<{ ack: true }>(`/attempts/${attemptId}/complete`, {
      method: 'POST',
    }),

  // ---- billing ----
  getPlan: () => request<{ plan: Plan }>('/billing/plan'),

  getSubscription: () =>
    request<{ subscription: Subscription | null }>('/billing/subscription'),

  createCheckout: (planSlug?: string) =>
    request<CheckoutResponse>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(planSlug ? { planSlug } : {}),
    }),

  getTransaction: (orderId: string) =>
    request<TransactionResponse>(`/billing/transactions/${orderId}`),

  mockComplete: (input: {
    orderId: string;
    outcome: 'success' | 'fail' | 'under_review';
    method?: 'card' | 'hbl_account' | 'unionpay';
  }) =>
    request<{
      ack: true;
      transaction: {
        orderId: string;
        status: 'succeeded' | 'failed' | 'under_review';
        responseCode: string;
        responseMessage: string;
      };
      subscriptionId: string | null;
    }>('/billing/mock-complete', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

// ---- billing types ----
export type Plan = {
  id?: string;
  slug: string;
  name: string;
  description: string | null;
  priceMinorUnits: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
};

export type Subscription = {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  provider: 'hblpay';
};

export type CheckoutResponse = {
  transaction: {
    id: string;
    orderId: string;
    amountMinorUnits: number;
    currency: string;
    status: 'pending';
  };
  plan: Omit<Plan, 'id' | 'description'>;
};

export type TransactionResponse = {
  transaction: {
    id: string;
    orderId: string;
    amountMinorUnits: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'under_review' | 'refunded';
    responseCode: string | null;
    responseMessage: string | null;
    createdAt: string;
    updatedAt: string;
  };
  plan: {
    slug: string;
    name: string;
    priceMinorUnits: number;
    currency: string;
    interval: 'month' | 'year';
  } | null;
};

// ====================================================================
// Admin API
// ====================================================================
export type AdminWhoami = {
  user: { id: string; name: string; email: string; isAdmin: boolean };
};

export type AdminStats = {
  users: { total: number; admins: number; paying: number };
  subscriptions: { active: number };
  transactions: { pending: number; revenueMinor: number };
  attempts: { total: number; completed: number };
  content: { questions: number; subjects: number };
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    provider: string;
  } | null;
  attempts: { total: number; completed: number };
};

export type AdminUserDetail = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    isAdmin: boolean;
    createdAt: string;
  };
  attempts: Array<{
    id: string;
    mode: 'tutor' | 'quiz';
    questionCount: number;
    startedAt: string;
    completedAt: string | null;
    scorePercent: string | null;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
  }>;
  transactions: Array<{
    id: string;
    providerOrderId: string;
    amountMinorUnits: number;
    currency: string;
    status: string;
    providerResponseCode: string | null;
    createdAt: string;
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    provider: string;
  }>;
};

export type AdminTransactionRow = {
  id: string;
  orderId: string;
  amountMinorUnits: number;
  currency: string;
  status: string;
  provider: string;
  responseCode: string | null;
  createdAt: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
};

export type AdminCourse = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isPublished: boolean;
  subjectCount: number;
};

export type AdminSubject = {
  id: string;
  courseId: string | null;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  courseName: string | null;
  courseSlug: string | null;
  questionCount: number;
};

export type AdminQuestionRow = {
  id: string;
  vignette: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string | null;
  createdAt: string;
  subject: { id: string; slug: string; name: string } | null;
};

export type AdminQuestionDetail = {
  question: {
    id: string;
    subjectId: string | null;
    vignette: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    source: string | null;
    createdAt: string;
    updatedAt: string;
  };
  choices: Array<{
    id: string;
    questionId: string;
    label: string;
    text: string;
    isCorrect: boolean;
    rationale: string | null;
  }>;
  subject: { id: string; slug: string; name: string } | null;
};

async function adminReq<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let msg = `request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* noop */
    }
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type ContactSubmission = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentStats = {
  currency: string;
  totalRevenue: number;
  monthRevenue: number;
  monthDeltaPct: number | null;
  avgTransactionMinor: number;
  mrrMinor: number;
  activeSubscriptions: number;
  succeededCount: number;
  failedCount: number;
  underReviewCount: number;
  pendingCount: number;
  refundedCount: number;
  successRate: number | null;
  breakdown: Record<string, { count: number; amount: number }>;
};

export const adminApi = {
  whoami: () => adminReq<AdminWhoami>('/whoami'),
  stats: () => adminReq<AdminStats>('/stats'),
  paymentStats: () => adminReq<PaymentStats>('/payment-stats'),

  contactSubmissions: {
    list: () =>
      adminReq<{ submissions: ContactSubmission[] }>('/contact-submissions'),
    setHandled: (id: string, handled: boolean) =>
      adminReq<{ ack: true }>(`/contact-submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ handled }),
      }),
    delete: (id: string) =>
      adminReq<{ ack: true }>(`/contact-submissions/${id}`, {
        method: 'DELETE',
      }),
  },

  users: {
    list: (q?: string) =>
      adminReq<{ users: AdminUserRow[] }>(`/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    get: (id: string) => adminReq<AdminUserDetail>(`/users/${id}`),
    update: (id: string, patch: { isAdmin?: boolean; emailVerified?: boolean }) =>
      adminReq<{ ack: true }>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
  },

  transactions: {
    list: (status?: string) =>
      adminReq<{ transactions: AdminTransactionRow[] }>(
        `/transactions${status ? `?status=${status}` : ''}`,
      ),
  },

  courses: {
    list: () => adminReq<{ courses: AdminCourse[] }>('/courses'),
    create: (data: { slug: string; name: string; description?: string; sortOrder?: number; isPublished?: boolean }) =>
      adminReq<{ course: AdminCourse }>('/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, patch: Partial<AdminCourse>) =>
      adminReq<{ ack: true }>(`/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    delete: (id: string) =>
      adminReq<{ ack: true }>(`/courses/${id}`, { method: 'DELETE' }),
  },

  subjects: {
    list: () => adminReq<{ subjects: AdminSubject[] }>('/subjects'),
    create: (data: {
      courseId?: string | null;
      slug: string;
      name: string;
      description?: string;
      sortOrder?: number;
    }) =>
      adminReq<{ subject: AdminSubject }>('/subjects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, patch: Partial<AdminSubject>) =>
      adminReq<{ ack: true }>(`/subjects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    delete: (id: string) =>
      adminReq<{ ack: true }>(`/subjects/${id}`, { method: 'DELETE' }),
  },

  questions: {
    list: (params?: { subjectId?: string; courseId?: string; q?: string }) => {
      const qs = new URLSearchParams();
      if (params?.subjectId) qs.set('subjectId', params.subjectId);
      if (params?.courseId) qs.set('courseId', params.courseId);
      if (params?.q) qs.set('q', params.q);
      const suffix = qs.toString();
      return adminReq<{ questions: AdminQuestionRow[] }>(
        `/questions${suffix ? `?${suffix}` : ''}`,
      );
    },
    get: (id: string) => adminReq<AdminQuestionDetail>(`/questions/${id}`),
    update: (id: string, patch: { vignette?: string; explanation?: string; difficulty?: string; source?: string; subjectId?: string | null }) =>
      adminReq<{ ack: true }>(`/questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    replace: (
      id: string,
      data: {
        vignette: string;
        explanation: string;
        difficulty: 'easy' | 'medium' | 'hard';
        subjectId: string | null;
        choices: Array<{
          id: string;
          text: string;
          isCorrect: boolean;
          rationale?: string | null;
        }>;
      },
    ) =>
      adminReq<{ ack: true }>(`/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateChoice: (id: string, choiceId: string, patch: { text?: string; isCorrect?: boolean; rationale?: string | null }) =>
      adminReq<{ ack: true }>(`/questions/${id}/choices/${choiceId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    create: (data: {
      vignette: string;
      explanation: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      subjectId?: string;
      choices: { label: string; text: string; isCorrect: boolean }[];
    }) =>
      adminReq<{ id: string }>('/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      adminReq<{ ack: true }>(`/questions/${id}`, { method: 'DELETE' }),
  },
};
