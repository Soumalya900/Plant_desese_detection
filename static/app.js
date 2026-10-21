// LeafCheck - Client Application Controller

document.addEventListener("DOMContentLoaded", () => {
    // DOM Selectors - Main App
    const input = document.getElementById('file');
    const cam = document.getElementById('cam');
    const btnTakePhoto = document.getElementById('btnTakePhoto');
    const drop = document.getElementById('drop');
    const prev = document.getElementById('prev');
    const prev2 = document.getElementById('prev2');
    const empty = document.getElementById('empty');
    const go = document.getElementById('go');
    const err = document.getElementById('err');
    const clr = document.getElementById('clear');
    const res = document.getElementById('result');
    const samplesCarousel = document.getElementById('samplesCarousel');

    // DOM Selectors - Camera Viewfinder Modal
    const cameraModal = document.getElementById('cameraModal');
    const btnCloseCam = document.getElementById('btnCloseCam');
    const btnCancelCam = document.getElementById('btnCancelCam');
    const btnSnapPhoto = document.getElementById('btnSnapPhoto');
    const webcamVideo = document.getElementById('webcamVideo');
    const webcamCanvas = document.getElementById('webcamCanvas');

    // Result Output Elements
    const statusNote = document.getElementById('statusNote');
    const resDiseaseName = document.getElementById('resDiseaseName');
    const resScientificName = document.getElementById('resScientificName');
    const resMeter = document.getElementById('resMeter');
    const resMatchText = document.getElementById('resMatchText');
    const resSymptoms = document.getElementById('resSymptoms');
    const resTreatmentList = document.getElementById('resTreatmentList');
    const resDiseaseType = document.getElementById('resDiseaseType');
    const resAffectedArea = document.getElementById('resAffectedArea');
    const resSeverity = document.getElementById('resSeverity');
    const resAction = document.getElementById('resAction');
    const resTopPredictions = document.getElementById('resTopPredictions');
    const resExpertAdvice = document.getElementById('resExpertAdvice');
    const specimenLabel = document.getElementById('specimenLabel');

    // State Variables
    let currentFile = null;
    let currentSampleName = null;
    let currentBase64Image = null;
    let currentImageUrl = null;
    let mediaStream = null;

    // 1. Load Benchmark Test Samples
    async function loadSamples() {
        try {
            const response = await fetch('/api/samples');
            const data = await response.json();
            if (data.samples && data.samples.length > 0) {
                samplesCarousel.innerHTML = '';
                data.samples.forEach(s => {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = 'sample-chip';
                    chip.title = `Test specimen: ${s.title}`;
                    chip.innerHTML = `
                        <img src="${s.url}" alt="${s.title}" loading="lazy">
                        <span>${s.title}</span>
                    `;
                    chip.addEventListener('click', () => {
                        selectSample(s.filename, s.url, s.title);
                    });
                    samplesCarousel.appendChild(chip);
                });
            } else {
                samplesCarousel.innerHTML = '<span style="font-size:.85rem;color:var(--muted)">No test samples available</span>';
            }
        } catch (e) {
            console.error("Error loading samples:", e);
            samplesCarousel.innerHTML = '<span style="font-size:.85rem;color:var(--muted)">Sample loading error</span>';
        }
    }

    // Select sample chip
    function selectSample(sampleFilename, imageUrl, title) {
        currentFile = null;
        currentBase64Image = null;
        currentSampleName = sampleFilename;
        currentImageUrl = imageUrl;
        err.textContent = '';

        prev.src = imageUrl;
        if (prev2) prev2.src = imageUrl;
        if (specimenLabel) specimenLabel.textContent = `Specimen: ${title}`;

        prev.hidden = false;
        empty.hidden = true;
        go.disabled = false;
        clr.hidden = false;
        res.hidden = true;
    }

    // 2. Handle File Upload
    function loadFile(f) {
        err.textContent = '';
        if (!f) return;
        if (!/^image\/(jpeg|png|webp|jpg)$/i.test(f.type)) {
            err.textContent = 'This file type is not supported. Choose a JPG, PNG or WebP image.';
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            err.textContent = 'This photo is over 10 MB. Choose a smaller one.';
            return;
        }

        currentFile = f;
        currentSampleName = null;
        currentBase64Image = null;

        const reader = new FileReader();
        reader.onload = () => {
            currentImageUrl = reader.result;
            prev.src = currentImageUrl;
            if (prev2) prev2.src = currentImageUrl;
            if (specimenLabel) specimenLabel.textContent = `Uploaded Specimen: ${f.name}`;

            prev.hidden = false;
            empty.hidden = true;
            go.disabled = false;
            clr.hidden = false;
            res.hidden = true;
        };
        reader.readAsDataURL(f);
    }

    if (input) input.addEventListener('change', e => loadFile(e.target.files[0]));
    if (cam) cam.addEventListener('change', e => loadFile(e.target.files[0]));

    // Drag and Drop
    if (drop) {
        ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => {
            e.preventDefault();
            drop.classList.add('over');
        }));
        ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => {
            e.preventDefault();
            drop.classList.remove('over');
        }));
        drop.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));
    }

    // 3. Live Camera Viewfinder Modal
    async function startCamera() {
        err.textContent = '';

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            err.textContent = 'Your browser does not support camera access. Please use Chrome, Edge, or Firefox.';
            return;
        }

        // Detect if user is on mobile/tablet or laptop/desktop
        const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                                 (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

        // Laptop/desktop preference: user (webcam)
        // Mobile/tablet preference: environment (back cam)
        const preferredFacing = isMobileOrTablet ? "environment" : "user";
        const fallbackFacing = isMobileOrTablet ? "user" : "environment";

        const configs = [
            { video: { facingMode: { exact: preferredFacing }, width: { ideal: 1280 }, height: { ideal: 720 } } },
            { video: { facingMode: { ideal: preferredFacing }, width: { ideal: 1280 }, height: { ideal: 720 } } },
            { video: { facingMode: preferredFacing } },
            { video: { facingMode: fallbackFacing } },
            { video: true }
        ];

        for (const constraints of configs) {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                webcamVideo.srcObject = mediaStream;
                cameraModal.classList.remove('hidden');
                cameraModal.hidden = false;
                
                // Play stream cleanly to prevent black screen
                await webcamVideo.play().catch(e => console.warn("Video play error:", e));
                return; // success, stop trying
            } catch (e) {
                console.warn("Camera attempt failed with constraints:", constraints, e);
            }
        }

        // All attempts failed
        err.textContent = 'Could not open camera. Please allow camera permission in your browser and try again.';
    }

    function stopCamera() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (webcamVideo) webcamVideo.srcObject = null;
        if (cameraModal) {
            cameraModal.classList.add('hidden');
            cameraModal.hidden = true;
        }
    }

    function snapCameraPhoto() {
        if (!webcamVideo || !webcamVideo.videoWidth) return;

        const width = webcamVideo.videoWidth;
        const height = webcamVideo.videoHeight;
        webcamCanvas.width = width;
        webcamCanvas.height = height;

        const ctx = webcamCanvas.getContext('2d');
        ctx.drawImage(webcamVideo, 0, 0, width, height);

        currentBase64Image = webcamCanvas.toDataURL('image/jpeg', 0.9);
        currentFile = null;
        currentSampleName = null;
        currentImageUrl = currentBase64Image;

        prev.src = currentImageUrl;
        if (prev2) prev2.src = currentImageUrl;
        if (specimenLabel) specimenLabel.textContent = 'Camera Specimen Capture';

        prev.hidden = false;
        empty.hidden = true;
        go.disabled = false;
        clr.hidden = false;
        res.hidden = true;

        stopCamera();
    }

    if (btnTakePhoto) btnTakePhoto.addEventListener('click', startCamera);
    if (btnCloseCam) btnCloseCam.addEventListener('click', stopCamera);
    if (btnCancelCam) btnCancelCam.addEventListener('click', stopCamera);
    if (btnSnapPhoto) btnSnapPhoto.addEventListener('click', snapCameraPhoto);

    if (cameraModal) {
        cameraModal.addEventListener('click', (e) => {
            if (e.target === cameraModal) stopCamera();
        });
    }

    // Clear Selection
    if (clr) {
        clr.addEventListener('click', () => {
            currentFile = null;
            currentSampleName = null;
            currentBase64Image = null;
            currentImageUrl = null;
            if (input) input.value = '';
            if (cam) cam.value = '';
            prev.hidden = true;
            prev.removeAttribute('src');
            if (prev2) prev2.removeAttribute('src');
            empty.hidden = false;
            go.disabled = true;
            clr.hidden = true;
            res.hidden = true;
            err.textContent = '';
        });
    }

    // 4. Diagnose Action ("Check this leaf")
    if (go) {
        go.addEventListener('click', async () => {
            if (!currentFile && !currentSampleName && !currentBase64Image) return;

            go.disabled = true;
            go.textContent = 'Analyzing leaf pathology...';
            err.textContent = '';

            try {
                let response;
                if (currentBase64Image) {
                    response = await fetch('/predict', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image_base64: currentBase64Image })
                    });
                } else if (currentFile) {
                    const formData = new FormData();
                    formData.append('file', currentFile);
                    response = await fetch('/predict', { method: 'POST', body: formData });
                } else if (currentSampleName) {
                    response = await fetch('/predict', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sample_name: currentSampleName })
                    });
                }

                const data = await response.json();
                go.disabled = false;
                go.textContent = 'Check this leaf';

                if (data.error) {
                    err.textContent = `Diagnosis error: ${data.error}`;
                    return;
                }

                renderReport(data);

            } catch (e) {
                console.error("Prediction error:", e);
                go.disabled = false;
                go.textContent = 'Check this leaf';
                err.textContent = 'Failed to analyze leaf photo. Please check server connection.';
            }
        });
    }

    // 5. Render Pathology Report
    function renderReport(data) {
        if (data.is_healthy) {
            resDiseaseName.textContent = 'Healthy Specimen';
            resScientificName.textContent = `${data.plant} foliage - No disease detected`;
            statusNote.innerHTML = '<b>Diagnosis complete:</b> The specimen displays healthy foliage with no visible pathogen infection.';
        } else {
            resDiseaseName.textContent = data.disease || 'Plant Disease';
            resScientificName.textContent = data.scientific_name && data.scientific_name !== 'N/A' 
                ? `${data.scientific_name}, on ${data.plant.toLowerCase()}` 
                : `Pathogen infection on ${data.plant}`;
            statusNote.innerHTML = '<b>Diagnosis complete:</b> Automated MobileNet neural pathology report generated below.';
        }

        // Match Strength Meter
        const conf = data.confidence || 85;
        let meterBars = '';
        let strengthLabel = 'High';

        if (conf >= 85) {
            meterBars = '<i class="on"></i><i class="on"></i><i class="on"></i>';
            strengthLabel = 'High';
        } else if (conf >= 60) {
            meterBars = '<i class="on"></i><i class="on"></i><i></i>';
            strengthLabel = 'Moderate';
        } else {
            meterBars = '<i class="on"></i><i></i><i></i>';
            strengthLabel = 'Low';
        }

        if (resMeter) resMeter.innerHTML = meterBars;
        if (resMatchText) resMatchText.textContent = `Match strength: ${strengthLabel} (${conf}% model confidence)`;

        // Symptoms & Description
        if (resSymptoms) {
            resSymptoms.textContent = data.about || data.symptoms || 'Foliage spots and discoloration observed.';
        }

        // Treatment Steps List
        if (resTreatmentList) {
            resTreatmentList.innerHTML = '';
            const suggestions = data.treatment_suggestions || [];
            if (suggestions.length > 0) {
                suggestions.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.text;
                    resTreatmentList.appendChild(li);
                });
            } else if (data.treatment) {
                const li = document.createElement('li');
                li.textContent = data.treatment;
                resTreatmentList.appendChild(li);
            } else {
                const defaultSteps = [
                    'Remove and bin affected leaves. Do not compost them.',
                    'Water at the base of the plant, not over the foliage.',
                    'Apply fungicide labelled for this disease according to pack dose.',
                    'Inspect plant progress after 7 days.'
                ];
                defaultSteps.forEach(step => {
                    const li = document.createElement('li');
                    li.textContent = step;
                    resTreatmentList.appendChild(li);
                });
            }
        }

        // Diagnostic Parameters
        if (resDiseaseType) resDiseaseType.textContent = data.disease_type || (data.is_healthy ? 'None' : 'Fungal');
        if (resAffectedArea) resAffectedArea.textContent = data.affected_area || 'Leaf Foliage';
        if (resSeverity) resSeverity.textContent = data.severity || (data.is_healthy ? 'None' : 'Moderate');
        if (resAction) resAction.textContent = data.recommended_action || (data.is_healthy ? 'Routine care' : 'Treatment advised');

        // Other Possible Causes Evaluated
        if (resTopPredictions) {
            resTopPredictions.innerHTML = '';
            if (data.top_predictions && data.top_predictions.length > 1) {
                data.top_predictions.slice(1).forEach(pred => {
                    const li = document.createElement('li');
                    li.textContent = `${pred.disease} (${pred.confidence}% match)`;
                    resTopPredictions.appendChild(li);
                });
            } else {
                resTopPredictions.innerHTML = '<li>No secondary pathogen detected above threshold</li>';
            }
        }

        // Expert Advice Note
        if (resExpertAdvice) {
            if (data.is_healthy) {
                resExpertAdvice.textContent = 'Foliage yellowing or wilting develops across multiple plant stems.';
            } else {
                resExpertAdvice.textContent = 'Lesions reach new leaf growth within 7 days, or more than a quarter of the plants show similar symptoms.';
            }
        }

        // Show Results Section and scroll into view
        res.hidden = false;
        res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 6. Router for Single Page Views (#home, #privacy, #terms, #how)
    function route() {
        const hash = location.hash.slice(1);
        const view = (hash === 'privacy' || hash === 'terms') ? hash : 'home';
        document.querySelectorAll('[data-view]').forEach(e => {
            e.hidden = e.dataset.view !== view;
        });

        if (hash === 'how') {
            const howEl = document.getElementById('how');
            if (howEl) howEl.scrollIntoView({ behavior: 'smooth' });
        } else if (hash === 'custom-domain') {
            const domainEl = document.getElementById('custom-domain');
            if (domainEl) domainEl.scrollIntoView({ behavior: 'smooth' });
        } else if (hash === 'privacy' || hash === 'terms') {
            window.scrollTo(0, 0);
        }

        document.title = view === 'privacy' 
            ? 'Privacy Policy | LeafCheck' 
            : view === 'terms' 
            ? 'Terms and Conditions | LeafCheck' 
            : 'LeafCheck | Plant disease check from a leaf photo';
    }

    window.addEventListener('hashchange', route);
    route();

    // Initialize benchmark samples
    loadSamples();
});
