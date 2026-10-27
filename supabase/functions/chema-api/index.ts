// Generated core.js uses the exact TypeScript domain from src/domain; never edit it manually.
import { createSharedHandler } from './core.js';
const url=Deno.env.get('SUPABASE_URL');
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publicKey=Deno.env.get('SUPABASE_ANON_KEY');
if(!url||!serviceKey||!publicKey)throw new Error('Falta configuración del servidor.');
Deno.serve(createSharedHandler({url,serviceKey,publicKey}));
