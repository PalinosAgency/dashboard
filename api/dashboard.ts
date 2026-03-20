import { sql } from './_lib/db.js';
import { authenticate } from './_lib/auth.js';

export default async function handler(req: any, res: any) {
  try {
    const user = await authenticate(req);
    if (!user) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }

    const url = new URL(req.url, 'http://localhost');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!start || !end) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing start or end date" }));
    }

    // 1. Finanças
    const financeRes = await sql`
        SELECT type, amount, category, description, transaction_date 
        FROM finances 
        WHERE user_id = ${user.id} 
        AND transaction_date >= ${start} 
        AND transaction_date <= ${end}
        ORDER BY transaction_date DESC
    `;
    
    // 2. Saúde
    const todayStr = new Date().toISOString().split('T')[0];
    const waterRes = await sql`SELECT value FROM health WHERE user_id = ${user.id} AND category = 'agua' AND calendario::date = ${todayStr}::date`;
    const sleepRes = await sql`SELECT value FROM health WHERE user_id = ${user.id} AND category = 'sono' ORDER BY calendario DESC LIMIT 1`;

    // 3. Acadêmico
    const academicRes = await sql`
      SELECT tags, COUNT(*) as count 
      FROM academic 
      WHERE user_id = ${user.id} 
      AND created_at >= ${start} 
      AND created_at <= ${end}
      GROUP BY tags
    `;

    // 4. Agenda
    const eventsRes = await sql`SELECT id, title, start_time, google_event_id FROM agendamento WHERE user_id = ${user.id} AND start_time > NOW() ORDER BY start_time ASC LIMIT 3`;
    const eventsSyncedCountRes = await sql`SELECT count(*) as total FROM agendamento WHERE user_id = ${user.id} AND google_event_id IS NOT NULL`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      finances: financeRes,
      health: {
        waterToday: waterRes.reduce((acc: number, curr: any) => acc + Number(curr.value), 0),
        sleepLast: sleepRes.length ? Number(sleepRes[0].value) : 0
      },
      academicGrouped: academicRes,
      schedule: {
        upcoming: eventsRes,
        syncedCount: Number(eventsSyncedCountRes[0].total)
      }
    }));
  } catch (err: any) {
    console.error("Dashboard API error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message }));
  }
}
