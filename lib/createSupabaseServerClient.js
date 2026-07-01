/**
 * Server-side Supabase client factory.
 * Supabase JS 2.108+ initializes Realtime on createClient(); Node.js < 22 has no
 * native WebSocket, so we pass the `ws` package as the Realtime transport.
 */

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

export function createSupabaseServerClient(url, key, options = {}) {
  const clientOptions = { ...options };

  if (typeof globalThis.WebSocket === 'undefined') {
    clientOptions.realtime = {
      ...clientOptions.realtime,
      transport: ws,
    };
  }

  return createClient(url, key, clientOptions);
}
