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

    if (req.method === 'POST') {
      let body: any = req.body;
      if (!body) {
        body = await new Promise((resolve) => {
          let data = '';
          req.on('data', (chunk: any) => data += chunk);
          req.on('end', () => resolve(data ? JSON.parse(data) : {}));
        });
      }

      await sql`
        INSERT INTO health (user_id, category, value, item, description, unit, calendario)
        VALUES (
          ${user.id}, 
          ${body.category}, 
          ${body.value}, 
          ${body.item}, 
          ${body.description},
          ${body.unit},
          ${body.calendario}
        )
      `;
      res.statusCode = 201;
      return res.end(JSON.stringify({ success: true }));
    }

    if (req.method !== 'GET') {
      res.statusCode = 405;
      return res.end(JSON.stringify({ error: "Method Not Allowed" }));
    }

    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!start || !end) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing start or end date" }));
    }

    const logs = await sql`
      SELECT * FROM health 
      WHERE user_id = ${user.id} 
      AND calendario >= ${start}::date 
      AND calendario < (${end}::date + interval '1 day')
      ORDER BY calendario DESC
    `;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ logs }));
    
  } catch (err: any) {
    console.error("Health API error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message }));
  }
}
