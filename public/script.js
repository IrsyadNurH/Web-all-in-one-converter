document.addEventListener('DOMContentLoaded', () => {
    // URL backend yang akan di-deploy di Render
    // GANTI DENGAN URL ANDA SENDIRI DI LANGKAH TERAKHIR
    const backendUrl = 'https://NAMA-APP-ANDA.onrender.com'; 

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

    // Generic setup function for each converter type
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

            // UI feedback
            convertButton.disabled = true;
            statusMessage.textContent = `Mengunggah dan mengonversi "${selectedFile.name}"... Ini mungkin butuh waktu.`;
            statusMessage.className = 'status-message';
            downloadArea.style.display = 'none';

            const formData = new FormData();
            formData.append(type, selectedFile);
            formData.append('outputFormat', outputFormat.value);

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
                    downloadLink.download = `converted_${selectedFile.name}.${outputFormat.value}`;
                    downloadArea.style.display = 'block';

                } else {
                    throw new Error(result.message || 'Terjadi kesalahan di server.');
                }
            } catch (error) {
                console.error('Conversion Error:', error);
                statusMessage.textContent = `Gagal: ${error.message}`;
                statusMessage.className = 'status-message';
            } finally {
                // Re-enable button
                convertButton.disabled = false;
            }
        });
    }

    // Initialize all converters
    ['video', 'image', 'audio'].forEach(setupConverter);

    // Initial state
    switchTab('video');
});