// Narrow Express 5's overly-permissive `params` type back to a flat string map.
// Express 5's default is `string | string[]` (to support new pattern matchers we
// don't use) which breaks downstream calls into Drizzle's `eq(..., string)`.
import 'express';

declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}
