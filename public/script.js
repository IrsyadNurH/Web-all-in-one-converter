// Jalankan skrip setelah semua elemen HTML dimuat
document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURASI PENTING ---
    // Pastikan URL ini sudah benar menunjuk ke backend Vercel Anda.
    const backendUrl = 'https://web-all-in-one-converter.vercel.app';

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

    // Inisialisasi logika yang SAMA untuk setiap jenis konverter
    ['video', 'image', 'audio'].forEach(setupConverter);

    // Atur tab 'video' sebagai tab default
    switchTab('video');
});
