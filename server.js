// Impor modul yang diperlukan
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const os = require('os'); // Diperlukan untuk mendapatkan direktori temporary
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Konfigurasi Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// --- Pastikan Direktori Sementara Ada di Lokasi yang Tepat untuk Vercel ---
// Vercel hanya mengizinkan penulisan di direktori /tmp
const tempDir = path.join(os.tmpdir(), 'converter_temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// --- Konfigurasi Multer untuk Penyimpanan File Sementara di /tmp ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// --- Middleware ---
const cors = require('cors');
app.use(cors());

// --- Fungsi Helper untuk Upload ke Cloudinary ---
const uploadToCloudinary = (filePath, resourceType) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(filePath, { resource_type: resourceType }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
};

// --- Endpoint Konversi ---

// Endpoint Gambar (INI AKAN BEKERJA DI VERCEL)
app.post('/convert/image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file gambar diunggah.' });
    }
    
    const inputPath = req.file.path;
    const outputFormat = req.body.outputFormat || 'png';
    const outputFileName = `${Date.now()}.${outputFormat}`;
    const outputPath = path.join(tempDir, outputFileName);

    try {
        await sharp(inputPath)
            .toFormat(outputFormat)
            .toFile(outputPath);

        const result = await uploadToCloudinary(outputPath, 'image');

        // Hapus file sementara
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.json({ success: true, downloadUrl: result.secure_url });
    } catch (error) {
        console.error('Sharp/Cloudinary Error:', error);
        fs.unlinkSync(inputPath);
        res.status(500).json({ success: false, message: 'Gagal mengonversi gambar.' });
    }
});

// Endpoint Video & Audio (INI TIDAK AKAN BEKERJA DI VERCEL)
// Dibiarkan di sini untuk kelengkapan, tapi akan error karena FFMPEG tidak ada
app.post('/convert/video', upload.single('video'), (req, res) => {
    res.status(512).json({ success: false, message: 'Konversi Video tidak didukung pada platform hosting ini karena FFMPEG tidak tersedia.' });
});

app.post('/convert/audio', upload.single('audio'), (req, res) => {
    res.status(512).json({ success: false, message: 'Konversi Audio tidak didukung pada platform hosting ini karena FFMPEG tidak tersedia.' });
});

app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Welcome to the All-in-One Converter API!' 
    });
});

// Jalankan server jika tidak di Vercel (untuk pengujian lokal)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// Ekspor aplikasi untuk Vercel
module.exports = app;