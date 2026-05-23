import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const dbConfig = {
        host: 'mysql-bce409f-yozy.f.aivencloud.com',
        port: 10252,
        user: 'avnadmin',
        password: process.env.MYSQL_PASSWORD, // 👈 WAJIB PAKAI INI, BRO! Jangan diketik teks aslinya
        database: 'defaultdb',
        ssl: { rejectUnauthorized: false }
    };

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

        // Membaca parameter tanggal dari URL website (jika ada)
        const { start, end } = req.query;

        if (start && end) {
            // 1. JIKA USER SEDANG MELAKUKAN FILTER DI HALAMAN HISTORIS
            const startISO = `${start} 00:00:00`;
            const endISO = `${end} 23:59:59`;

            const [rows] = await connection.execute(
                'SELECT co2, created_at FROM co2_monitoring WHERE created_at >= ? AND created_at <= ? ORDER BY created_at ASC',
                [startISO, endISO]
            );
            await connection.end();
            return res.status(200).json(rows);

        } else {
            // 2. JIKA WEBSITE SEDANG MEMINTA DATA REALTIME DASHBOARD UTAMA
            const [rows] = await connection.execute(
                'SELECT co2, created_at FROM co2_monitoring ORDER BY created_at DESC LIMIT 50'
            );
            await connection.end();
            return res.status(200).json(rows.reverse());
        }

    } catch (error) {
        if (connection) await connection.end();
        return res.status(500).json({ error: error.message });
    }
}