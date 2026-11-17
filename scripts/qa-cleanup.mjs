// Borra los equipos de prueba creados por tests/ui (nombre que empieza con "QA ").
// Uso: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/qa-cleanup.mjs
const ref = process.env.SUPABASE_PROJECT_REF || 'lttfkynkhveomntejqhc';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error('Falta SUPABASE_ACCESS_TOKEN (token personal sbp_, no se guarda en el repo).');
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "delete from public.c2_teams where name like 'QA %' returning name" }),
});
console.log(res.status, await res.text());
