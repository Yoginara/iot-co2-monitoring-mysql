import mysql from 'mysql2/promise';

// Fungsi bantuan untuk membaca body request manual di Vercel Serverless Modern
async function parseBody(req) {
    if (req.body !== undefined) return req.body;

    const buffers = [];
    for await (const chunk of req) {
        buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    try {
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

export default async function handler(req, res) {
    // 1. Atur Header CORS agar Bebas Ditembak dari ReqBin, ESP32, & Browser Frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight Request dari Browser
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const dbConfig = {
        host: 'mysql-bce409f-yozy.f.aivencloud.com',
        port: 10252,
        user: 'avnadmin',
        password: process.env.MYSQL_PASSWORD, // 👈 Alihkan ke sini, bro!
        database: 'defaultdb',
        ssl: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    };

    let connection;

    try {
        // Jalankan fungsi pengurai body data JSON
        const body = await parseBody(req);
        const { co2 } = body;

        if (!co2) {
            return res.status(400).json({ message: 'Data CO2 tidak ditemukan atau format salah' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Otomatis buat tabel jika belum ada
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS co2_monitoring (
        id INT AUTO_INCREMENT PRIMARY KEY,
        co2 INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Masukkan data sensor
        await connection.execute(
            'INSERT INTO co2_monitoring (co2) VALUES (?)',
            [Number(co2)]
        );

        await connection.end();
        return res.status(200).json({ status: 'success', message: 'Tabel siap & data masuk MySQL!' });

    } catch (error) {
        if (connection) await connection.end();
        return res.status(500).json({ error: error.message });
    }
}