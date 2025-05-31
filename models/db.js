const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString || undefined, // Si está definida, se usa (Heroku)
  host:     connectionString ? undefined : process.env.DB_HOST,
  user:     connectionString ? undefined : process.env.DB_USER,
  password: connectionString ? undefined : process.env.DB_PASSWORD,
  database: connectionString ? undefined : process.env.DB_NAME,
  port:     connectionString ? undefined : 5432,
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

pool.connect()
  .then(client => {
    console.log('✅ Conexión exitosa a la base de datos PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
