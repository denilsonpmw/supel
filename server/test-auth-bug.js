const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    const email = 'bugtest@supel.gov';
    const senha = 'MySecretPassword123';
    
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    await pool.query(`
      INSERT INTO users (email, nome, perfil, ativo, primeiro_acesso)
      VALUES ($1, 'Bug Test', 'usuario', true, true)
    `, [email]);

    console.log('👉 Usuário de teste criado (primeiro_acesso = true)');

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    await pool.query(
      'UPDATE users SET senha = $1, primeiro_acesso = false WHERE email = $2',
      [hashedPassword, email]
    );
    
    console.log('👉 Senha criptografada salva na primeira vez. Hash:', hashedPassword);

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    const match = await bcrypt.compare(senha, user.senha);
    console.log('👉 bcrypt.compare() com a senha exata retornou:', match);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    pool.end();
  }
}
run();
