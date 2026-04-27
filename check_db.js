import { neon } from '@neondatabase/serverless';

const connectionString = "postgresql://neondb_owner:npg_PEeYG8p0BqQj@ep-mute-mud-adsmr6ut-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(connectionString);

async function check() {
  const userId = "1369";
  
  // Last 30 days
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const start = d.toISOString();
  
  console.log("Checking DB for user:", userId);

  const finances = await sql`SELECT type, amount, category, description, transaction_date FROM finances WHERE user_id = ${userId} ORDER BY transaction_date DESC LIMIT 5`;
  const healthAgua = await sql`SELECT sum(value) as total_agua FROM health WHERE user_id = ${userId} AND category = 'agua'`;
  const healthSono = await sql`SELECT value as ultimo_sono FROM health WHERE user_id = ${userId} AND category = 'sono' ORDER BY calendario DESC LIMIT 1`;
  const academic = await sql`SELECT tags, COUNT(*) as count FROM academic WHERE user_id = ${userId} GROUP BY tags`;
  const agendamento = await sql`SELECT title, start_time FROM agendamento WHERE user_id = ${userId} ORDER BY start_time ASC LIMIT 5`;

  console.log("==== FINANCES (LAST 5) ====");
  console.table(finances);
  console.log("==== HEALTH ====");
  console.log("Agua Total:", healthAgua[0]?.total_agua);
  console.log("Ultimo Sono:", healthSono[0]?.ultimo_sono);
  console.log("==== ACADEMIC ====");
  console.table(academic);
  console.log("==== AGENDAMENTO (NEXT 5) ====");
  console.table(agendamento);
}

check().catch(console.error);
