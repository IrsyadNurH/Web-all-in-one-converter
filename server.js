// Impor modul yang diperlukan
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Untuk memuat variabel dari file .env

const app = express();
const PORT = process.env.PORT || 3000;

// --- Konfigurasi Cloudinary ---
// Ambil kredensial dari environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// --- Pastikan Direktori Sementara Ada ---
// Direktori ini HANYA untuk penyimpanan SEMENTARA selama proses konversi
const tempUploadDir = 'uploads/';
const tempConvertedDir = 'converted_temp/';
[tempUploadDir, tempConvertedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// --- Konfigurasi Multer untuk Penyimpanan File Sementara ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// --- Middleware ---
// Mengizinkan permintaan dari domain lain (penting saat frontend dan backend di host terpisah)
const cors = require('cors');
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));


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

// Endpoint Video
app.post('/convert/video', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file video diunggah.' });
    }

    const inputPath = req.file.path;
    const outputFormat = req.body.outputFormat || 'mp4';
    const outputFileName = `${Date.now()}.${outputFormat}`;
    const outputPath = path.join(tempConvertedDir, outputFileName);

    ffmpeg(inputPath)
        .toFormat(outputFormat)
        .on('end', async () => {
            try {
                // Upload hasil konversi ke Cloudinary
                const result = await uploadToCloudinary(outputPath, 'video');
                
                // Hapus file sementara dari server
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                
                // Kirim URL Cloudinary ke frontend
                res.json({ success: true, downloadUrl: result.secure_url });
            } catch (error) {
                console.error('Cloudinary Upload Error:', error);
                res.status(500).json({ success: false, message: 'Gagal mengunggah hasil video.' });
            }
        })
        .on('error', (err) => {
            console.error('FFMPEG Error:', err);
            fs.unlinkSync(inputPath); // Hapus file input jika error
            res.status(500).json({ success: false, message: 'Gagal mengonversi video.' });
        })
        .save(outputPath);
});

// Endpoint Gambar
app.post('/convert/image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file gambar diunggah.' });
    }
    
    const inputPath = req.file.path;
    const outputFormat = req.body.outputFormat || 'png';
    const outputFileName = `${Date.now()}.${outputFormat}`;
    const outputPath = path.join(tempConvertedDir, outputFileName);

    try {
        await sharp(inputPath)
            .toFormat(outputFormat)
            .toFile(outputPath);

        // Upload hasil konversi ke Cloudinary
        const result = await uploadToCloudinary(outputPath, 'image');

        // Hapus file sementara dari server
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.json({ success: true, downloadUrl: result.secure_url });
    } catch (error) {
        console.error('Sharp/Cloudinary Error:', error);
        fs.unlinkSync(inputPath);
        res.status(500).json({ success: false, message: 'Gagal mengonversi gambar.' });
    }
});


// Endpoint Audio
app.post('/convert/audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file audio diunggah.' });
    }

    const inputPath = req.file.path;
    const outputFormat = req.body.outputFormat || 'mp3';
    const outputFileName = `${Date.now()}.${outputFormat}`;
    const outputPath = path.join(tempConvertedDir, outputFileName);

    ffmpeg(inputPath)
        .toFormat(outputFormat)
        .on('end', async () => {
             try {
                // Upload hasil konversi ke Cloudinary
                const result = await uploadToCloudinary(outputPath, 'video'); // Audio di Cloudinary masuk resource_type 'video'
                
                // Hapus file sementara dari server
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                
                res.json({ success: true, downloadUrl: result.secure_url });
            } catch (error) {
                console.error('Cloudinary Upload Error:', error);
                res.status(500).json({ success: false, message: 'Gagal mengunggah hasil audio.' });
            }
        })
        .on('error', (err) => {
            console.error('FFMPEG Error:', err);
            fs.unlinkSync(inputPath);
            res.status(500).json({ success: false, message: 'Gagal mengonversi audio.' });
        })
        .save(outputPath);
});


// Mulai server
app.listen(PORT, () => {
    console.log(`Server all-in-one converter berjalan di http://localhost:${PORT}`);
});