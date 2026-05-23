import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Koneksi langsung pakai password asli Aiven kamu
    const dbConfig = {
        host: 'mysql-bce409f-yozy.f.aivencloud.com',
        port: 10252,
        user: 'avnadmin',
        password: 'AVNS_FuPikeHfrugsuGp1-u-', // 👈 Samakan di sini juga, bro!
        database: 'defaultdb',
        ssl: { rejectUnauthorized: false }
    };

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

        // Ambil 20 data CO2 terbaru
        const [rows] = await connection.execute(
            'SELECT co2, created_at FROM co2_monitoring ORDER BY id DESC LIMIT 20'
        );

        await connection.end();
        return res.status(200).json(rows.reverse()); // Urutkan dari data lama ke baru untuk grafik

    } catch (error) {
        if (connection) await connection.end();
        return res.status(500).json({ error: error.message });
    }
}