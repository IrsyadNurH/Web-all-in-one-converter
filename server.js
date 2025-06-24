// Impor modul yang diperlukan
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Konfigurasi Multer untuk Menyimpan File di Memori
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// --- Middleware ---

// =================================================================
// == PERBAIKAN CORS DENGAN WHITELIST ==

// Daftar semua URL frontend yang diizinkan untuk mengakses backend ini
const whitelist = [
    'https://web-all-in-one-converter.netlify.app', // URL Produksi Utama Anda
    'https://685a8f41bf93d986bfd903cd--web-all-in-one-converter.netlify.app', // URL Preview lama (untuk jaga-jaga)
    'http://localhost:3000', // Untuk pengujian di komputer lokal
    'http://127.0.0.1:5500' // Jika Anda menggunakan Live Server di VS Code
];

const corsOptions = {
  origin: function (origin, callback) {
    // Izinkan jika origin ada di dalam whitelist, atau jika origin tidak ada (misalnya saat tes dengan Postman)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

// Gunakan middleware cors dengan opsi whitelist yang sudah kita tentukan
app.use(cors(corsOptions));
// =================================================================


// --- Rute Utama untuk Health Check ---
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Welcome to the All-in-One Converter API!' 
    });
});


// --- ENDPOINT KONVERSI (Kode ini tidak perlu diubah) ---

// Endpoint Gambar
app.post('/convert/image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file gambar diunggah.' });

    const outputFormat = req.body.outputFormat || 'png';
    const quality = parseInt(req.body.quality) || 80;

    const cld_upload_stream = cloudinary.uploader.upload_stream({
            resource_type: "image",
            transformation: [{ format: outputFormat, quality: quality }]
        },
        (error, result) => {
            if (error) {
                console.error('Cloudinary Image Error:', error);
                return res.status(500).json({ success: false, message: 'Gagal memproses gambar.' });
            }
            res.json({ success: true, downloadUrl: result.secure_url });
        }
    );
    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
});

// Endpoint Video
app.post('/convert/video', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file video diunggah.' });

    const outputFormat = req.body.outputFormat || 'mp4';
    const videoBitrate = req.body.videoBitrate || '1500k';

    const cld_upload_stream = cloudinary.uploader.upload_stream({
            resource_type: "video",
            transformation: [{ format: outputFormat, video_bitrate: videoBitrate }]
        },
        (error, result) => {
            if (error) {
                console.error('Cloudinary Video Error:', error);
                return res.status(500).json({ success: false, message: 'Gagal memproses video.' });
            }
            res.json({ success: true, downloadUrl: result.secure_url });
        }
    );
    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
});

// Endpoint Audio
app.post('/convert/audio', upload.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file audio diunggah.' });

    const outputFormat = req.body.outputFormat || 'mp3';
    const audioBitrate = req.body.audioBitrate || '192k';

    const cld_upload_stream = cloudinary.uploader.upload_stream({
            resource_type: "video",
            transformation: [{ format: outputFormat, audio_codec: "mp3", audio_bitrate: audioBitrate }]
        },
        (error, result) => {
            if (error) {
                console.error('Cloudinary Audio Error:', error);
                return res.status(500).json({ success: false, message: 'Gagal memproses audio.' });
            }
            res.json({ success: true, downloadUrl: result.secure_url });
        }
    );
    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
});

// Jalankan server jika tidak di Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// Ekspor aplikasi untuk Vercel
module.exports = app;
