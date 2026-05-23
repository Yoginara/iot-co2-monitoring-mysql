import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // 1. KONEKSI KE DATABASE AIVEN (Menggunakan Environment Variable)
    const dbConfig = {
        host: 'mysql-bce409f-yozy.f.aivencloud.com',
        port: 10252,
        user: 'avnadmin',
        password: process.env.MYSQL_PASSWORD, // 👈 Sudah diganti pakai ini ya, bro! Aman dari intipan GitHub
        database: 'defaultdb',
        ssl: { rejectUnauthorized: false }
    };

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const { co2 } = req.body;

        if (!co2) {
            return res.status(400).json({ message: 'Data CO2 tidak ditemukan' });
        }

        // 🔥 TRIK SMART: Otomatis buatin tabel kalau di database belum ada
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS co2_monitoring (
        id INT AUTO_INCREMENT PRIMARY KEY,
        co2 INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2. MASUKKAN DATA DARI ESP32
        await connection.execute(
            'INSERT INTO co2_monitoring (co2) VALUES (?)',
            [co2]
        );

        await connection.end();
        return res.status(200).json({ status: 'success', message: 'Tabel siap & data masuk MySQL!' });

    } catch (error) {
        if (connection) await connection.end();
        return res.status(500).json({ error: error.message });
    }
}