import { sql } from './_lib/db';
import { authenticate } from './_lib/auth';

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

    // Buscar transações
    const transactions = await sql`
      SELECT * FROM finances 
      WHERE user_id = ${user.id} 
      AND transaction_date >= ${start}::date 
      AND transaction_date < (${end}::date + interval '1 day')
      ORDER BY transaction_date DESC
    `;

    // Buscar resumo
    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM finances 
      WHERE user_id = ${user.id} 
      AND type = 'income' 
      AND transaction_date >= ${start}::date 
      AND transaction_date < (${end}::date + interval '1 day')
    `;
    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM finances 
      WHERE user_id = ${user.id} 
      AND type = 'expense' 
      AND transaction_date >= ${start}::date 
      AND transaction_date < (${end}::date + interval '1 day')
    `;

    const income = Number(incomeResult[0].total) || 0;
    const expenses = Number(expensesResult[0].total) || 0;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ 
      transactions, 
      summary: { income, expenses } 
    }));
    
  } catch (err: any) {
    console.error("Finances API error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message }));
  }
}
