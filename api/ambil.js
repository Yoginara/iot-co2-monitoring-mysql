import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    // 1. Atur Header CORS agar bisa dibaca oleh script.js frontend di browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight Request dari Browser
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const dbConfig = {
        host: 'mysql-bce409f-yozy.f.aivencloud.com',
        port: 10252,
        user: 'avnadmin',
        password: process.env.MYSQL_PASSWORD, // 👈 Alihkan ke sini juga!
        database: 'defaultdb',
        ssl: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    };

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

        // 🔍 Membaca parameter query ?start=...&end=... dari halaman Historis
        // Vercel Serverless mengurai query lewat req.query atau URLSearchParams
        const url = new URL(req.url, `http://${req.headers.host}`);
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');

        if (start && end) {
            // CASE 1: JIKA USER MEMILIH FILTER TANGGAL (Halaman Historis)
            // Tambahkan jam agar mencakup data dari jam 00:00 sampai akhir hari pukul 23:59
            const startDateTime = `${start} 00:00:00`;
            const endDateTime = `${end} 23:59:59`;

            const [rows] = await connection.execute(
                'SELECT co2, created_at FROM co2_monitoring WHERE created_at BETWEEN ? AND ? ORDER BY id DESC',
                [startDateTime, endDateTime]
            );

            await connection.end();
            return res.status(200).json(rows);
        } else {
            // CASE 2: JIKA TIDAK ADA FILTER (Dashboard Utama / Real-time Polling)
            const [rows] = await connection.execute(
                'SELECT co2, created_at FROM co2_monitoring ORDER BY id DESC LIMIT 20'
            );

            await connection.end();
            return res.status(200).json(rows.reverse()); // Balik urutan agar grafik pas (kiri lama, kanan baru)
        }

    } catch (error) {
        if (connection) await connection.end();
        return res.status(500).json({ error: error.message });
    }
}