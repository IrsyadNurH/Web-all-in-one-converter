// Impor modul yang diperlukan
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Konfigurasi Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// --- Konfigurasi Multer untuk Menyimpan File di Memori ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Middleware ---
const cors = require('cors');
app.use(cors());

// --- Rute Utama untuk Health Check ---
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Welcome to the All-in-One Converter API!' 
    });
});


// --- ENDPOINT KONVERSI ---

// Endpoint Gambar (Disesuaikan untuk Vercel & Cloudinary Transformation)
app.post('/convert/image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file gambar diunggah.' });
    }

    const outputFormat = req.body.outputFormat || 'png';
    const quality = parseInt(req.body.quality) || 80; // Ambil nilai kualitas dari frontend

    const cld_upload_stream = cloudinary.uploader.upload_stream(
        {
            resource_type: "image",
            // Perintah transformasi, termasuk kualitas, dikirim ke Cloudinary
            transformation: [
                { format: outputFormat, quality: quality }
            ]
        },
        (error, result) => {
            if (error) {
                console.error('Cloudinary Image Transformation Error:', error);
                return res.status(500).json({ success: false, message: 'Gagal memproses gambar di cloud.' });
            }
            res.json({ success: true, downloadUrl: result.secure_url });
        }
    );

    // Salurkan buffer file dari multer ke stream uploader Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
});


// Endpoint Video (Disesuaikan untuk Vercel & Cloudinary Transformation)
app.post('/convert/video', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file video diunggah.' });
    }

    const outputFormat = req.body.outputFormat || 'mp4';

    const cld_upload_stream = cloudinary.uploader.upload_stream(
        {
            resource_type: "video",
            // Perintah transformasi untuk mengubah format video
            transformation: [
                { format: outputFormat }
            ]
        },
        (error, result) => {
            if (error) {
                console.error('Cloudinary Video Transformation Error:', error);
                return res.status(500).json({ success: false, message: 'Gagal memproses video di cloud.' });
            }
            res.json({ success: true, downloadUrl: result.secure_url });
        }
    );

    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
});


// Endpoint Audio (Disesuaikan untuk Vercel & Cloudinary Transformation)
app.post('/convert/audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file audio diunggah.' });
    }

    const outputFormat = req.body.outputFormat || 'mp3';

    const cld_upload_stream = cloudinary.uploader.upload_stream(
        {
            resource_type: "video", // Audio di Cloudinary tetap menggunakan resource_type "video"
            // Perintah transformasi untuk mengubah format audio
            transformation: [
                { format: outputFormat }
            ]
        },
        (error, result) => {
            if (error) {
                console.error('Cloudinary Audio Transformation Error:', error);
                return res.status(500).json({ success: false, message: 'Gagal memproses audio di cloud.' });
            }
            res.json({ success: true, downloadUrl: result.secure_url });
        }
    );

    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
});


// Jalankan server jika tidak di Vercel (untuk pengujian lokal)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// Ekspor aplikasi untuk Vercel
module.exports = app;