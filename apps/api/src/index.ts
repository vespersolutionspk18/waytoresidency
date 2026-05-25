import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth';
import { attemptsRouter } from './routes/attempts';
import { billingRouter } from './routes/billing';
import { adminRouter } from './routes/admin';
import { publicRouter } from './routes/public';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

app.use(
  cors({
    origin: WEB_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Public, unauthenticated: contact form submissions from the marketing site.
app.post('/api/contact', async (req, res) => {
  try {
    const { db } = await import('./db');
    const { contactSubmission } = await import('./db/schema');
    const b = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      message?: string;
    };
    const firstName = (b.firstName ?? '').trim();
    const email = (b.email ?? '').trim();
    const message = (b.message ?? '').trim();
    if (!firstName || !email || !message) {
      res
        .status(400)
        .json({ error: 'First name, email, and message are required.' });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'Please use a valid email address.' });
      return;
    }
    const [row] = await db
      .insert(contactSubmission)
      .values({
        firstName,
        lastName: (b.lastName ?? '').trim() || null,
        email,
        phone: (b.phone ?? '').trim() || null,
        message,
      })
      .returning({ id: contactSubmission.id });
    res.status(201).json({ ack: true, id: row?.id });
  } catch (err) {
    console.error('contact submission failed', err);
    res.status(500).json({ error: 'Could not save your message. Please try again.' });
  }
});

app.use('/api/attempts', attemptsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/admin', adminRouter);
app.use('/api', publicRouter);

app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  res.json(session);
});

// global error handler — last middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('unhandled error', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'internal server error' });
  },
);

app.listen(PORT, () => {
  console.log(`api listening on http://localhost:${PORT}`);
});
