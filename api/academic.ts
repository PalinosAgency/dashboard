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

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "Missing id" }));
      }
      await sql`DELETE FROM academic WHERE id = ${id} AND user_id = ${user.id}`;
      res.statusCode = 200;
      return res.end(JSON.stringify({ success: true }));
    }

    // We update academic DB fetch to also respect dateRange
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    let docs;
    if (start && end) {
      docs = await sql`
        SELECT * FROM academic 
        WHERE user_id = ${user.id} 
        AND created_at >= ${start}::date 
        AND created_at < (${end}::date + interval '1 day')
        ORDER BY created_at DESC
      `;
    } else {
      docs = await sql`
        SELECT * FROM academic 
        WHERE user_id = ${user.id} 
        ORDER BY created_at DESC
      `;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ documents: docs }));
    
  } catch (err: any) {
    console.error("Academic API error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message }));
  }
}
