import { sql } from './_lib/db';
import { authenticate } from './_lib/auth';

export default async function handler(req: any, res: any) {
  try {
    const user = await authenticate(req);
    if (!user) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }

    const events = await sql`
      SELECT * FROM agendamento 
      WHERE user_id = ${user.id} 
      ORDER BY start_time ASC
    `;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ events }));
    
  } catch (err: any) {
    console.error("Schedule API error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message }));
  }
}
