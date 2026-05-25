'use client';

import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      firstName: String(form.get('firstName') ?? '').trim(),
      lastName: String(form.get('lastName') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      message: String(form.get('message') ?? '').trim(),
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ack?: true;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `Submission failed (${res.status}).`);
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setSubmitting(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-apothecary-soft border border-apothecary/30 rounded-lg p-6">
        <div className="eyebrow text-apothecary mb-2">Message received</div>
        <h3
          className="font-display text-[22px] text-ink leading-[1.12]"
          style={{ fontWeight: 450 }}
        >
          Thank you, we will get back to you soon.
        </h3>
        <p className="mt-3 text-[14px] text-ink-2 leading-[1.65] max-w-[60ch]">
          Your message has been sent. For the fastest reply, you can also
          reach us on WhatsApp at +92 308 7747686, or by email at
          dr.rashid157@gmail.com.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-5 text-[13px] text-apothecary hover:text-apothecary-2 font-medium"
        >
          Send another message →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="First name" required>
          <input
            type="text"
            name="firstName"
            required
            placeholder="Imran"
            className="contact-input"
          />
        </Field>
        <Field label="Last name">
          <input
            type="text"
            name="lastName"
            placeholder="Khan"
            className="contact-input"
          />
        </Field>
      </div>

      <Field label="Email" required>
        <input
          type="email"
          name="email"
          required
          placeholder="you@hospital.org"
          className="contact-input"
        />
      </Field>

      <Field label="Phone or WhatsApp">
        <input
          type="tel"
          name="phone"
          inputMode="tel"
          placeholder="+92 300 1234567"
          className="contact-input font-mono"
        />
      </Field>

      <Field label="Message" required hint="A few sentences about what you need.">
        <textarea
          name="message"
          required
          rows={6}
          placeholder="I am preparing for FCPS Part 1 and would like to know about the next intake..."
          className="contact-input leading-[1.6]"
        />
      </Field>

      {error && (
        <div className="border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'h-11 px-6 text-[14px] font-medium tracking-tight rounded-md',
            'bg-apothecary text-paper border border-apothecary-2',
            'hover:bg-apothecary-2 transition-colors disabled:opacity-50',
          )}
        >
          {submitting ? 'Sending...' : 'Send message'}
        </button>
        <span className="text-[12px] text-mute">
          We answer within the same working day.
        </span>
      </div>

      <style jsx>{`
        :global(.contact-input) {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14.5px;
          color: var(--color-ink);
          width: 100%;
          outline: none;
          font-family: var(--font-body);
          line-height: 1.55;
          transition: border-color 120ms, box-shadow 120ms;
        }
        :global(.contact-input::placeholder) {
          color: var(--color-mute);
        }
        :global(.contact-input:focus) {
          border-color: var(--color-apothecary);
          box-shadow: 0 0 0 3px rgba(41, 74, 61, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-mute">
        {label}
        {required && <span className="text-copper ml-1">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11.5px] text-mute mt-0.5">{hint}</span>}
    </label>
  );
}
