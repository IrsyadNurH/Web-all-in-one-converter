document.addEventListener('DOMContentLoaded', () => {
    // Pastikan URL ini sudah benar menunjuk ke backend Vercel/Render Anda
    const backendUrl = 'https://web-all-in-one-converter.vercel.app'; 

    const tabButtons = document.querySelectorAll('.tab-button');
    const converterSections = document.querySelectorAll('.converter-section');

    function switchTab(activeTabId) {
        tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === activeTabId));
        converterSections.forEach(section => {
            section.style.display = (section.id === `${activeTabId}-converter`) ? 'block' : 'none';
        });
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    function setupConverter(type) {
        const input = document.getElementById(`${type}Input`);
        const fileName = document.getElementById(`${type}FileName`);
        const outputFormat = document.getElementById(`${type}OutputFormat`);
        const convertButton = document.getElementById(`convert${type.charAt(0).toUpperCase() + type.slice(1)}Button`);
        const statusMessage = document.getElementById(`${type}StatusMessage`);
        const downloadArea = document.getElementById(`${type}DownloadArea`);
        const convertedMedia = document.getElementById(`converted${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const downloadLink = document.getElementById(`download${type.charAt(0).toUpperCase() + type.slice(1)}Link`);
        
        let selectedFile = null;

        if (type === 'image') {
            const qualityControl = document.getElementById('imageQualityControl');
            const qualitySlider = document.getElementById('imageQuality');
            const qualityValue = document.getElementById('imageQualityValue');

            const toggleQualityControl = () => {
                const format = outputFormat.value;
                if (format === 'jpeg' || format === 'webp') {
                    qualityControl.style.display = 'flex';
                } else {
                    qualityControl.style.display = 'none';
                }
            };
            
            outputFormat.addEventListener('change', toggleQualityControl);
            qualitySlider.addEventListener('input', () => {
                qualityValue.textContent = `${qualitySlider.value}%`;
            });
            toggleQualityControl();
        }

        input.addEventListener('change', (event) => {
            selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
            fileName.textContent = selectedFile ? `File dipilih: ${selectedFile.name}` : `Belum ada ${type} dipilih`;
            convertButton.disabled = !selectedFile;
            statusMessage.textContent = '';
            downloadArea.style.display = 'none';
        });

        convertButton.addEventListener('click', async () => {
            if (!selectedFile) {
                statusMessage.textContent = `Silakan pilih file ${type} terlebih dahulu.`;
                statusMessage.className = 'status-message';
                return;
            }

            convertButton.disabled = true;
            statusMessage.textContent = `Mengunggah dan mengonversi "${selectedFile.name}"... Ini mungkin butuh waktu.`;
            statusMessage.className = 'status-message';
            downloadArea.style.display = 'none';

            const formData = new FormData();
            formData.append(type, selectedFile);
            formData.append('outputFormat', outputFormat.value);

            // Menambahkan data kualitas/bitrate ke FormData
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
                statusMessage.className = 'status-message';
            } finally {
                convertButton.disabled = false;
            }
        });
    }

    ['video', 'image', 'audio'].forEach(setupConverter);
    switchTab('video');
});
