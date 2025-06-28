// Jalankan skrip setelah semua elemen HTML dimuat
document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURASI PENTING ---
    // Pastikan URL ini sudah benar menunjuk ke backend Vercel Anda.
    const backendUrl = 'https://web-all-in-one-converter-git-main-irs-projects-b9f679f3.vercel.app';

    // Ambil semua elemen tab dan section converter
    const tabButtons = document.querySelectorAll('.tab-button');
    const converterSections = document.querySelectorAll('.converter-section');

    /**
     * Fungsi untuk mengganti tab yang aktif dan menampilkan section yang sesuai.
     * @param {string} activeTabId - ID dari tab yang akan diaktifkan (misal: 'video', 'image').
     */
    function switchTab(activeTabId) {
        tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === activeTabId));
        converterSections.forEach(section => {
            section.style.display = (section.id === `${activeTabId}-converter`) ? 'block' : 'none';
        });
    }

    // Tambahkan event listener untuk setiap tombol tab
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    /**
     * FUNGSI UTAMA YANG BERLAKU UNTUK SEMUA JENIS KONVERSI (IMAGE, VIDEO, AUDIO).
     * TIDAK ADA LAGI KODE FFMPEG DI SINI.
     * @param {string} type - Jenis konverter ('image', 'video', atau 'audio').
     */
    function setupConverter(type) {
        // Ambil semua elemen DOM yang dibutuhkan untuk satu konverter
        const input = document.getElementById(`${type}Input`);
        const fileName = document.getElementById(`${type}FileName`);
        const outputFormat = document.getElementById(`${type}OutputFormat`);
        const convertButton = document.getElementById(`convert${type.charAt(0).toUpperCase() + type.slice(1)}Button`);
        const statusMessage = document.getElementById(`${type}StatusMessage`);
        const downloadArea = document.getElementById(`${type}DownloadArea`);
        const convertedMedia = document.getElementById(`converted${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const downloadLink = document.getElementById(`download${type.charAt(0).toUpperCase() + type.slice(1)}Link`);
        
        let selectedFile = null;

        // Logika khusus untuk konverter gambar (menampilkan/menyembunyikan slider kualitas)
        if (type === 'image') {
            const qualityControl = document.getElementById('imageQualityControl');
            const qualitySlider = document.getElementById('imageQuality');
            const qualityValue = document.getElementById('imageQualityValue');

            const toggleQualityControl = () => {
                const format = outputFormat.value;
                qualityControl.style.display = (format === 'jpeg' || format === 'webp') ? 'flex' : 'none';
            };
            
            outputFormat.addEventListener('change', toggleQualityControl);
            qualitySlider.addEventListener('input', () => {
                qualityValue.textContent = `${qualitySlider.value}%`;
            });
            toggleQualityControl();
        }

        // Event listener saat pengguna memilih file
        input.addEventListener('change', (event) => {
            selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
            fileName.textContent = selectedFile ? `File dipilih: ${selectedFile.name}` : `Belum ada ${type} dipilih`;
            convertButton.disabled = !selectedFile;
            statusMessage.textContent = '';
            downloadArea.style.display = 'none';
        });

        // Event listener saat tombol "Konversi" diklik
        convertButton.addEventListener('click', async () => {
            if (!selectedFile) {
                statusMessage.textContent = `Silakan pilih file ${type} terlebih dahulu.`;
                statusMessage.className = 'status-message error';
                return;
            }

            // --- INILAH LOGIKA YANG BENAR: MENGIRIM FILE KE BACKEND ---
            convertButton.disabled = true;
            statusMessage.textContent = `Mengunggah & mengonversi "${selectedFile.name}"... Harap tunggu.`;
            statusMessage.className = 'status-message';
            downloadArea.style.display = 'none';

            const formData = new FormData();
            formData.append(type, selectedFile);
            formData.append('outputFormat', outputFormat.value);

            // Tambahkan data spesifik (kualitas/bitrate) ke FormData
            if (type === 'image') {
                const qualitySlider = document.getElementById('imageQuality');
                formData.append('quality', qualitySlider.value);
            } else if (type === 'video') {
                const videoBitrate = document.getElementById('videoBitrate');
                formData.append('videoBitrate', videoBitrate.value);
            } else if (type === 'audio') {
                const audioBitrate = document.getElementById('audioBitrate');
                formData.append('audioBitrate', audioBitrate.value);
            }

            try {
                // Kirim data ke backend menggunakan fetch API. Ini berlaku untuk semua tipe.
                const response = await fetch(`${backendUrl}/convert/${type}`, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    statusMessage.textContent = `Konversi ${type} selesai!`;
                    statusMessage.className = 'status-message success';
                    convertedMedia.src = result.downloadUrl;
                    downloadLink.href = result.downloadUrl;
                    const originalName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
                    downloadLink.download = `${originalName}_converted.${outputFormat.value}`;
                    downloadArea.style.display = 'block';
                } else {
                    throw new Error(result.message || 'Terjadi kesalahan di server.');
                }
            } catch (error) {
                console.error('Conversion Error:', error);
                statusMessage.textContent = `Gagal: ${error.message}`;
                statusMessage.className = 'status-message error';
            } finally {
                convertButton.disabled = false;
            }
        });
    }

    // ======================================================================
    // == FUNGSI BARU UNTUK STEGANOGRAFI (CLIENT-SIDE) ==
    // ======================================================================

    function setupSteganography() {
        const stegModeRadios = document.querySelectorAll('input[name="stegMode"]');
        const encodeSection = document.getElementById('steg-encode-section');
        const decodeSection = document.getElementById('steg-decode-section');

        // --- Elemen untuk Mode Encode (Sembunyikan) ---
        const encodeInput = document.getElementById('stegEncodeInput');
        const encodeFileName = document.getElementById('stegEncodeFileName');
        const secretMessageInput = document.getElementById('stegSecretMessage');
        const encodeButton = document.getElementById('encodeStegButton');
        const encodeStatus = document.getElementById('stegEncodeStatusMessage');
        const encodeDownloadArea = document.getElementById('stegEncodeDownloadArea');
        const encodedImage = document.getElementById('encodedStegImage');
        const downloadLink = document.getElementById('downloadStegEncodeLink');
        let encodeFile = null;

        // --- Elemen untuk Mode Decode (Tampilkan) ---
        const decodeInput = document.getElementById('stegDecodeInput');
        const decodeFileName = document.getElementById('stegDecodeFileName');
        const decodeButton = document.getElementById('decodeStegButton');
        const decodeStatus = document.getElementById('stegDecodeStatusMessage');
        const decodeResultArea = document.getElementById('stegDecodeResultArea');
        const decodedMessageText = document.getElementById('decodedMessage');
        let decodeFile = null;

        // --- Tambahan Baru: Elemen untuk Visualisasi ---
        const visualizeButton = document.getElementById('visualizeDiffButton');
        const visualizeArea = document.getElementById('stegVisualizeArea');
        const diffCanvas = document.getElementById('diffCanvas');
        const diffCtx = diffCanvas.getContext('2d');
        let originalImageData = null; // Kita akan simpan data gambar asli di sini

        // Fungsi untuk beralih antara mode Encode dan Decode
        stegModeRadios.forEach(radio => {
            radio.addEventListener('change', (event) => {
                if (event.target.value === 'encode') {
                    encodeSection.style.display = 'block';
                    decodeSection.style.display = 'none';
                } else {
                    encodeSection.style.display = 'none';
                    decodeSection.style.display = 'block';
                }
            });
        });

        // Event listener untuk input file di mode Encode
        encodeInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                encodeFile = e.target.files[0];
                encodeFileName.textContent = `File dipilih: ${encodeFile.name}`;
                encodeButton.disabled = false;
            } else {
                encodeFile = null;
                encodeFileName.textContent = 'Belum ada gambar dipilih';
                encodeButton.disabled = true;
            }
            encodeStatus.textContent = '';
            encodeDownloadArea.style.display = 'none';
        });

        // Event listener untuk input file di mode Decode
        decodeInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                decodeFile = e.target.files[0];
                decodeFileName.textContent = `File dipilih: ${decodeFile.name}`;
                decodeButton.disabled = false;
            } else {
                decodeFile = null;
                decodeFileName.textContent = 'Belum ada gambar dipilih';
                decodeButton.disabled = true;
            }
            decodeStatus.textContent = '';
            decodeResultArea.style.display = 'none';
        });

        // --- Logika Inti untuk Menyembunyikan Pesan (Encode) ---
        encodeButton.addEventListener('click', () => {
            if (!encodeFile || !secretMessageInput.value) {
                encodeStatus.textContent = 'Harap pilih gambar dan isi pesan rahasia.';
                encodeStatus.className = 'status-message error';
                return;
            }
            
            encodeStatus.textContent = 'Memproses... Harap tunggu.';
            encodeStatus.className = 'status-message';
            encodeDownloadArea.style.display = 'none';

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    // === TAMBAHAN: Simpan data gambar asli SEBELUM dimodifikasi ===
                    originalImageData = ctx.getImageData(0, 0, img.width, img.height);
                    // =============================================================

                    // Pesan diubah menjadi biner + delimiter untuk menandai akhir pesan
                    const message = secretMessageInput.value;
                    const messageAsBinary = toBinary(message) + '1111111111111110'; // Delimiter

                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data; // Array piksel [R,G,B,A, R,G,B,A, ...]

                    if (messageAsBinary.length > data.length * 0.75) {
                        encodeStatus.textContent = 'Error: Pesan terlalu panjang untuk gambar ini.';
                        encodeStatus.className = 'status-message error';
                        return;
                    }
                    
                    // Menyisipkan setiap bit pesan ke dalam LSB setiap komponen warna (R,G,B)
                    let dataIndex = 0;
                    for (let i = 0; i < messageAsBinary.length; i++) {
                        const bit = messageAsBinary[i];
                        // Mengubah LSB piksel. Mengabaikan channel Alpha (setiap 4 byte)
                        data[dataIndex] = (data[dataIndex] & 254) | parseInt(bit, 2);
                        if ((dataIndex + 2) % 4 !== 0) {
                            dataIndex++;
                        } else {
                            dataIndex += 2;
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);

                    const newImageDataUrl = canvas.toDataURL('image/png');
                    encodedImage.src = newImageDataUrl;
                    downloadLink.href = newImageDataUrl;
                    
                    encodeStatus.textContent = 'Pesan berhasil disembunyikan!';
                    encodeStatus.className = 'status-message success';
                    encodeDownloadArea.style.display = 'block';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(encodeFile);
        });
        
        // --- Logika Inti untuk Menampilkan Pesan (Decode) ---
        decodeButton.addEventListener('click', () => {
            if (!decodeFile) {
                decodeStatus.textContent = 'Harap pilih gambar yang berisi pesan.';
                decodeStatus.className = 'status-message error';
                return;
            }

            decodeStatus.textContent = 'Membaca pesan... Harap tunggu.';
            decodeStatus.className = 'status-message';
            decodeResultArea.style.display = 'none';

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data;
                    let binaryMessage = '';
                    
                    // Ekstrak LSB dari setiap komponen warna
                    for (let i = 0; i < data.length; i++) {
                         if ((i + 1) % 4 !== 0) { // Abaikan Alpha Channel
                            binaryMessage += (data[i] & 1);
                         }
                    }
                    
                    // Cari delimiter untuk menemukan akhir pesan
                    const delimiter = '1111111111111110';
                    const delimiterIndex = binaryMessage.indexOf(delimiter);

                    if (delimiterIndex === -1) {
                        decodeStatus.textContent = 'Error: Tidak ada pesan rahasia yang ditemukan atau gambar korup.';
                        decodeStatus.className = 'status-message error';
                        return;
                    }

                    const finalBinaryMessage = binaryMessage.substring(0, delimiterIndex);
                    const decodedMessage = fromBinary(finalBinaryMessage);
                    
                    decodedMessageText.textContent = decodedMessage;
                    decodeStatus.textContent = 'Pesan berhasil ditemukan!';
                    decodeStatus.className = 'status-message success';
                    decodeResultArea.style.display = 'block';

                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(decodeFile);
        });

        // === TAMBAHAN BARU: Event listener untuk tombol visualisasi ===
        visualizeButton.addEventListener('click', () => {
            if (!originalImageData) {
                alert('Silakan lakukan proses "Sembunyikan Pesan" terlebih dahulu.');
                return;
            }

            // Ambil data gambar yang sudah dimodifikasi dari canvas preview
            const encodedImgElement = document.getElementById('encodedStegImage');
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = encodedImgElement.naturalWidth;
            tempCanvas.height = encodedImgElement.naturalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(encodedImgElement, 0, 0);
            const encodedImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            // Siapkan canvas untuk peta perbedaan
            diffCanvas.width = originalImageData.width;
            diffCanvas.height = originalImageData.height;

            const diffImageData = diffCtx.createImageData(diffCanvas.width, diffCanvas.height);

            const originalData = originalImageData.data;
            const encodedData = encodedImageData.data;
            const diffData = diffImageData.data;

            // Bandingkan setiap piksel
            for (let i = 0; i < originalData.length; i += 4) {
                const rOriginal = originalData[i] & 1;
                const gOriginal = originalData[i + 1] & 1;
                const bOriginal = originalData[i + 2] & 1;

                const rEncoded = encodedData[i] & 1;
                const gEncoded = encodedData[i + 1] & 1;
                const bEncoded = encodedData[i + 2] & 1;

                // Jika ada perbedaan di salah satu channel, buat piksel putih
                if (rOriginal !== rEncoded || gOriginal !== gEncoded || bOriginal !== bEncoded) {
                    diffData[i] = 255;      // R
                    diffData[i + 1] = 255;  // G
                    diffData[i + 2] = 255;  // B
                } else {
                    diffData[i] = 0;        // R
                    diffData[i + 1] = 0;    // G
                    diffData[i + 2] = 0;    // B
                }
                diffData[i + 3] = 255; // Alpha (selalu opaque)
            }

            diffCtx.putImageData(diffImageData, 0, 0);
            visualizeArea.style.display = 'block';
        });

        // Fungsi pembantu untuk mengubah teks ke biner
        function toBinary(string) {
            return string.split('').map(char => {
                return char.charCodeAt(0).toString(2).padStart(8, '0');
            }).join('');
        }

        // Fungsi pembantu untuk mengubah biner ke teks
        function fromBinary(binary) {
            let text = '';
            for (let i = 0; i < binary.length; i += 8) {
                const byte = binary.substr(i, 8);
                if (byte.length === 8) {
                    text += String.fromCharCode(parseInt(byte, 2));
                }
            }
            return text;
        }
    }

    // Inisialisasi logika untuk setiap jenis fitur
    ['video', 'image', 'audio'].forEach(setupConverter); // Konverter lama
    setupSteganography(); // Fungsi baru untuk steganografi

    // Atur tab default yang aktif
    switchTab('video');
});
