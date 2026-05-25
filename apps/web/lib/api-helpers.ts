import { NextResponse } from 'next/server';
import { HttpError } from './auth-helpers';

/** Wrap a route handler body. Logs errors, converts HttpError → response. */
export async function handle(
  fn: () => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('unhandled route error', err);
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 },
    );
  }
}

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Read a JSON body, returning {} if it's missing or invalid. */
export async function readJson<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
