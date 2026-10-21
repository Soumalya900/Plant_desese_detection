// ============================================================================
// PlantGuard AI - Modern Animated Presentation Engine & Interactive Controller
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // 1. State Management
    // --------------------------------------------------------------------------
    const state = {
        currentSlide: 1,
        totalSlides: 10,
        autoplay: false,
        autoplayInterval: null,
        soundEnabled: true,
        ambientPlaying: false,
        language: 'en', // 'en' or 'hi'
        activeCropFilter: 'all',
        activeCategoryFilter: 'all',
        searchQuery: '',
        selectedTomatoClassId: 'Tomato___Early_blight',
        selectedDiagnosticSample: 'tomato_early_blight',
        gradCamVisible: true,
        speakerNotesOpen: false
    };

    // --------------------------------------------------------------------------
    // 2. Web Audio API Sound Synthesizer (Zero External Dependencies)
    // --------------------------------------------------------------------------
    let audioCtx = null;
    let ambientGainNode = null;
    let ambientOscillator = null;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!state.soundEnabled) return;
        try {
            initAudio();
            const now = audioCtx.currentTime;

            if (type === 'slide') {
                // Soft airy chime transition
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'click') {
                // Crisp click
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'scan') {
                // Diagnostic high-tech beep
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, now); // B5
                osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.warn('Audio synthesis issue:', e);
        }
    }

    function toggleAmbientSound() {
        initAudio();
        if (state.ambientPlaying) {
            if (ambientGainNode) {
                ambientGainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
                setTimeout(() => {
                    if (ambientOscillator) {
                        try { ambientOscillator.stop(); } catch (e) {}
                    }
                    state.ambientPlaying = false;
                    updateAudioUI();
                }, 500);
            }
        } else {
            // Synthesize tranquil forest wind & subtle nature drone
            const now = audioCtx.currentTime;
            ambientOscillator = audioCtx.createOscillator();
            ambientGainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            ambientOscillator.type = 'sine';
            ambientOscillator.frequency.setValueAtTime(146.83, now); // D3 ground note
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(280, now);

            ambientGainNode.gain.setValueAtTime(0.001, now);
            ambientGainNode.gain.exponentialRampToValueAtTime(0.03, now + 1.5);

            ambientOscillator.connect(filter);
            filter.connect(ambientGainNode);
            ambientGainNode.connect(audioCtx.destination);

            ambientOscillator.start(now);
            state.ambientPlaying = true;
            updateAudioUI();
        }
    }

    function updateAudioUI() {
        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
            soundBtn.innerHTML = state.soundEnabled 
                ? (state.ambientPlaying ? '🍃 Ambient: ON' : '🔊 Sound: ON')
                : '🔇 Sound: OFF';
            soundBtn.style.color = state.soundEnabled ? 'var(--accent-neon)' : 'var(--text-muted)';
        }
    }

    // --------------------------------------------------------------------------
    // 3. Floating Chlorophyll & Spore Canvas Particles
    // --------------------------------------------------------------------------
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = -Math.random() * 0.6 - 0.2;
            this.alpha = Math.random() * 0.5 + 0.15;
            this.color = Math.random() > 0.3 ? '#34d399' : '#10b981';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
                this.reset();
                this.y = canvas.height + 10;
            }
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < 45; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // --------------------------------------------------------------------------
    // 4. Slide Navigation Engine & Speaker Notes
    // --------------------------------------------------------------------------
    const speakerNotes = {
        1: {
            en: "Welcome everyone! Today we present PlantGuard AI — an end-to-end deep learning framework designed for automatic crop disease identification using the New Plant Diseases Dataset containing 87,000+ augmented images.",
            hi: "स्वागत है! आज हम PlantGuard AI प्रस्तुत कर रहे हैं—जो कि 87,000+ पत्तियों की छवियों वाले New Plant Diseases Dataset और EfficientNet-B0 ट्रांसफर लर्निंग पर आधारित एक आधुनिक AI सिस्टम है।"
        },
        2: {
            en: "This dataset covers 14 crucial agricultural crops and 38 granular classes. Notice the 80/20 train-validation split and comprehensive data augmentation applied to prevent overfitting.",
            hi: "इस डेटासेट में 14 मुख्य फसलें और 38 श्रेणियां हैं। 80% ट्रेनिंग और 20% वैलिडेशन स्प्लिट के साथ मॉडल को डेटा ऑग्मेंटेशन से ट्रेन किया गया है।"
        },
        3: {
            en: "Plant diseases are divided into 4 major biological taxonomies: Fungal (e.g. Blights and Mildew), Bacterial (Water-soaked lesions), Viral (Mosaics and Curls), and Pests/Spider Mites.",
            hi: "पौधों के रोग 4 मुख्य प्रकार के होते हैं: फंगल (झुलसा/फफूंद), बैक्टीरियल (जीवाणु धब्बे), वायरल (मोज़ेक व पत्ती मुड़ना), और कीट/स्पाइडर माइट्स।"
        },
        4: {
            en: "Here is our interactive database of all 38 classes. You can filter by crop or pathogen type, search any disease, and view instant management and chemical cures.",
            hi: "यह सभी 38 क्लासों का इंटरैक्टिव डेटाबेस है। आप किसी भी फसल या रोग को सर्च करके उसके लक्षण, कारण और दवाइयों की जानकारी देख सकते हैं।"
        },
        5: {
            en: "Focusing on our 5th Sem Project core: The Tomato subset has 10 classes including 9 devastating diseases like Bacterial Spot, Early & Late Blight, and Yellow Leaf Curl Virus.",
            hi: "हमारे 5वें सेमेस्टर प्रोजेक्ट का मुख्य केंद्र: टमाटर की 10 श्रेणियां (9 रोग + 1 स्वस्थ पत्ती), जैसे अगेती व पछेती झुलसा और येलो लीफ कर्ल वायरस।"
        },
        6: {
            en: "We utilize a Two-Stage Transfer Learning architecture with EfficientNet-B0. In Stage 1, we freeze the backbone and train the head. In Stage 2, we fine-tune the top 20 layers with a lower learning rate (1e-5).",
            hi: "हम EfficientNet-B0 के साथ 2-स्टेज ट्रांसफर लर्निंग का उपयोग करते हैं: स्टेज 1 में बेस मॉडल को फ्रीज करके हेड को ट्रेन करते हैं, और स्टेज 2 में टॉप 20 लेयर्स को 1e-5 लर्निंग रेट से फाइन-ट्यून करते हैं।"
        },
        7: {
            en: "Our Diagnostic Lab features simulated Grad-CAM heatmap visualizer. The neural network highlights exact leaf lesion regions to explain why it reached the 98.7% confidence score.",
            hi: "डायग्नोस्टिक लैब में Grad-CAM हीटमैप विजुअलाइज़र है। मॉडल दिखाता है कि पत्ती के किस संक्रमित हिस्से को देखकर उसने 98.7% सटीकता से निर्णय लिया।"
        },
        8: {
            en: "Evaluation metrics demonstrate a remarkable jump from 94.2% validation accuracy in Stage 1 to 98.7% in Stage 2, with near-zero confusion between Early Blight and Septoria.",
            hi: "मॉडल मेट्रिक्स: स्टेज 1 में 94.2% सटीकता थी जो स्टेज 2 फाइन-ट्यूनिंग के बाद 98.7% हो गई।"
        },
        9: {
            en: "For practical deployment, this lightweight 5.3M parameter model easily runs on edge devices, Android apps for farmers, and agricultural drone cameras for automated field surveys.",
            hi: "फील्ड पर उपयोग: केवल 5.3 मिलियन पैरामीटर्स के कारण यह मॉडल किसानों के मोबाइल ऐप और कृषि ड्रोन पर बिना इंटरनेट के भी आसानी से चल सकता है।"
        },
        10: {
            en: "In conclusion, PlantGuard AI bridges the gap between deep computer vision and field agronomy, saving billions in crop loss. Thank you! Any questions?",
            hi: "निष्कर्ष: PlantGuard AI कंप्यूटर विज़न और कृषि विज्ञान को जोड़कर फसल नुकसान को रोकता है। धन्यवाद! अब आप प्रश्न पूछ सकते हैं।"
        }
    };

    function goToSlide(slideNum) {
        if (slideNum < 1 || slideNum > state.totalSlides) return;
        state.currentSlide = slideNum;

        // Update slides visibility
        document.querySelectorAll('.slide').forEach((slide, idx) => {
            if (idx + 1 === slideNum) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Update Progress Bar & Dots
        const progressPercent = ((slideNum) / state.totalSlides) * 100;
        const fillBar = document.querySelector('.slide-progress-bar-fill');
        if (fillBar) fillBar.style.width = `${progressPercent}%`;

        document.querySelectorAll('.nav-dot').forEach((dot, idx) => {
            if (idx + 1 === slideNum) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update nav buttons
        const prevBtn = document.getElementById('prev-slide-btn');
        const nextBtn = document.getElementById('next-slide-btn');
        if (prevBtn) prevBtn.disabled = (slideNum === 1);
        if (nextBtn) nextBtn.disabled = (slideNum === state.totalSlides);

        // Update active top tab
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            const targetSlide = parseInt(btn.dataset.targetSlide);
            if (targetSlide === slideNum) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Speaker Notes
        updateSpeakerNotes();
        playSound('slide');

        // Scroll slide container to top
        const stage = document.querySelector('.slides-stage');
        if (stage) stage.scrollTop = 0;
    }

    function updateSpeakerNotes() {
        const notesContent = document.getElementById('speaker-notes-text');
        const notesNum = document.getElementById('speaker-slide-num');
        if (notesNum) notesNum.innerText = `Slide ${state.currentSlide}/${state.totalSlides}`;
        if (notesContent) {
            const currentText = speakerNotes[state.currentSlide][state.language] || speakerNotes[state.currentSlide]['en'];
            notesContent.innerHTML = `<p>${currentText}</p>`;
        }
    }

    // --------------------------------------------------------------------------
    // 5. Populate Dataset Architecture & Crop Matrix (Slide 2)
    // --------------------------------------------------------------------------
    function renderCropsMatrix() {
        const matrixContainer = document.getElementById('crops-matrix-container');
        if (!matrixContainer) return;

        matrixContainer.innerHTML = '';
        PLANT_DATASET.crops.forEach(crop => {
            const chip = document.createElement('div');
            chip.className = 'crop-chip';
            chip.dataset.cropId = crop.id;
            chip.innerHTML = `
                <div class="crop-emoji">${crop.icon}</div>
                <div class="crop-name">${state.language === 'hi' ? crop.hindi : crop.name}</div>
                <div class="crop-count">${crop.count} ${state.language === 'hi' ? 'क्लास' : 'Classes'}</div>
            `;
            chip.addEventListener('click', () => {
                playSound('click');
                state.activeCropFilter = crop.id;
                goToSlide(4); // Jump to Explorer
                filterExplorer();
            });
            matrixContainer.appendChild(chip);
        });
    }

    // --------------------------------------------------------------------------
    // 6. Populate Interactive Disease Explorer (Slide 4)
    // --------------------------------------------------------------------------
    function renderDiseaseCards() {
        const grid = document.getElementById('disease-cards-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const filtered = PLANT_DATASET.classes.filter(item => {
            const matchesCrop = (state.activeCropFilter === 'all' || item.crop === state.activeCropFilter);
            const matchesCategory = (state.activeCategoryFilter === 'all' || item.category === state.activeCategoryFilter);
            const matchesSearch = state.searchQuery === '' || 
                item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                item.pathogen.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                (item.hindiName && item.hindiName.toLowerCase().includes(state.searchQuery.toLowerCase()));

            return matchesCrop && matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">
                🌿 No plant diseases matching the selected criteria. Try resetting filters.
            </div>`;
            return;
        }

        filtered.forEach(item => {
            const cropObj = PLANT_DATASET.crops.find(c => c.id === item.crop);
            const catObj = PLANT_DATASET.categories[item.category] || { badgeClass: 'badge-healthy', name: 'Other' };
            
            const card = document.createElement('div');
            card.className = 'disease-card';
            card.innerHTML = `
                <div class="disease-card-header">
                    <div class="disease-card-crop">
                        <span>${cropObj ? cropObj.icon : '🌱'}</span>
                        <span>${cropObj ? (state.language === 'hi' ? cropObj.hindi : cropObj.name) : item.crop}</span>
                    </div>
                    <span class="disease-badge ${catObj.badgeClass}">${catObj.name}</span>
                </div>
                <div class="disease-card-title">${state.language === 'hi' ? (item.hindiName || item.name) : item.name}</div>
                <div class="disease-card-pathogen">${item.pathogen}</div>
                <div style="font-size: 12px; color: #94a3b8; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${state.language === 'hi' ? item.symptomsHindi : item.symptoms}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(52,211,153,0.1); font-size: 11px;">
                    <span style="color: var(--accent-neon); font-family: var(--font-mono);">${item.datasetSamples} Images</span>
                    <span style="color: var(--text-muted);">Click for details ➔</span>
                </div>
            `;
            card.addEventListener('click', () => {
                playSound('click');
                openDiseaseModal(item);
            });
            grid.appendChild(card);
        });

        // Update count indicator
        const countBadge = document.getElementById('explorer-count-badge');
        if (countBadge) countBadge.innerText = `${filtered.length} of ${PLANT_DATASET.classes.length} Classes`;
    }

    function filterExplorer() {
        renderDiseaseCards();
        // Update active filter pills styling
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const filterType = btn.dataset.filterType;
            const filterVal = btn.dataset.filterValue;
            if (filterType === 'category') {
                btn.classList.toggle('active', state.activeCategoryFilter === filterVal);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 7. Disease Modal Deep Dive
    // --------------------------------------------------------------------------
    function openDiseaseModal(item) {
        const modal = document.getElementById('disease-modal');
        const content = document.getElementById('modal-dynamic-content');
        if (!modal || !content) return;

        const cropObj = PLANT_DATASET.crops.find(c => c.id === item.crop);
        const catObj = PLANT_DATASET.categories[item.category] || { badgeClass: 'badge-healthy', name: 'Other' };

        content.innerHTML = `
            <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 12px;">
                <span style="font-size: 32px;">${cropObj ? cropObj.icon : '🌿'}</span>
                <div>
                    <h2 style="font-family: var(--font-heading); font-size: 24px; font-weight: 800; color: #fff;">
                        ${state.language === 'hi' ? (item.hindiName || item.name) : item.name}
                    </h2>
                    <p style="font-family: var(--font-mono); font-size: 13px; color: var(--accent-neon); font-style: italic;">
                        Pathogen: ${item.pathogen}
                    </p>
                </div>
                <div style="margin-left: auto;">
                    <span class="disease-badge ${catObj.badgeClass}" style="font-size: 12px; padding: 6px 12px;">${catObj.name}</span>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
                <div class="glass-card" style="padding: 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--accent-neon); text-transform: uppercase; margin-bottom: 6px;">
                        🚨 Severity & Impact
                    </div>
                    <div style="font-size: 14px; font-weight: 600; color: #f87171;">
                        ${item.severity}
                    </div>
                </div>
                <div class="glass-card" style="padding: 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--accent-neon); text-transform: uppercase; margin-bottom: 6px;">
                        📊 Dataset Sample Count
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">
                        ${item.datasetSamples} Augmented Images
                    </div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap: 16px;">
                <div class="glass-card" style="padding: 16px;">
                    <h4 style="color: #38bdf8; font-size: 14px; font-weight: 700; margin-bottom: 8px;">
                        🔍 ${state.language === 'hi' ? 'रोग के मुख्य लक्षण (Visible Symptoms)' : 'Visible Symptoms'}
                    </h4>
                    <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                        ${state.language === 'hi' ? item.symptomsHindi : item.symptoms}
                    </p>
                </div>

                <div class="glass-card" style="padding: 16px;">
                    <h4 style="color: #fbbf24; font-size: 14px; font-weight: 700; margin-bottom: 8px;">
                        🌧️ ${state.language === 'hi' ? 'संक्रमण के कारण व अनुकूल मौसम (Causes & Triggers)' : 'Causes & Environmental Conditions'}
                    </h4>
                    <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                        ${item.causes}
                    </p>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="glass-card" style="padding: 16px; border-left: 4px solid #10b981;">
                        <h4 style="color: #34d399; font-size: 14px; font-weight: 700; margin-bottom: 8px;">
                            🛡️ ${state.language === 'hi' ? 'रोकथाम (Prevention)' : 'Preventative Measures'}
                        </h4>
                        <p style="font-size: 13px; line-height: 1.5; color: #cbd5e1;">
                            ${item.prevention}
                        </p>
                    </div>

                    <div class="glass-card" style="padding: 16px; border-left: 4px solid #ef4444;">
                        <h4 style="color: #f87171; font-size: 14px; font-weight: 700; margin-bottom: 8px;">
                            💊 ${state.language === 'hi' ? 'उपचार व रासायनिक स्प्रे (Chemical & Organic Treatment)' : 'Treatment & Chemical Cures'}
                        </h4>
                        <p style="font-size: 13px; line-height: 1.5; color: #cbd5e1;">
                            ${item.treatment}
                        </p>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    const modalClose = document.getElementById('modal-close-btn');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            document.getElementById('disease-modal').classList.remove('active');
        });
    }

    // --------------------------------------------------------------------------
    // 8. Tomato Deep Dive Spotlight (Slide 5)
    // --------------------------------------------------------------------------
    function renderTomatoDeepDive() {
        const listContainer = document.getElementById('tomato-classes-list');
        if (!listContainer) return;

        const tomatoClasses = PLANT_DATASET.classes.filter(c => c.crop === 'tomato');
        listContainer.innerHTML = '';

        tomatoClasses.forEach(item => {
            const div = document.createElement('div');
            div.className = `tomato-class-item ${item.id === state.selectedTomatoClassId ? 'active' : ''}`;
            const catObj = PLANT_DATASET.categories[item.category];
            div.innerHTML = `
                <span class="name">${state.language === 'hi' ? item.hindiName.split('(')[0] : item.name.replace('Tomato ', '')}</span>
                <span class="disease-badge ${catObj.badgeClass}">${catObj.name.split(' ')[0]}</span>
            `;
            div.addEventListener('click', () => {
                playSound('click');
                state.selectedTomatoClassId = item.id;
                renderTomatoDeepDive();
                updateTomatoDetailPanel(item);
            });
            listContainer.appendChild(div);
        });

        const selectedItem = tomatoClasses.find(c => c.id === state.selectedTomatoClassId) || tomatoClasses[0];
        updateTomatoDetailPanel(selectedItem);
    }

    function updateTomatoDetailPanel(item) {
        const panel = document.getElementById('tomato-detail-panel');
        if (!panel) return;

        const catObj = PLANT_DATASET.categories[item.category];
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="font-family: var(--font-heading); font-size: 22px; font-weight: 800; color: #fff;">
                        🍅 ${state.language === 'hi' ? item.hindiName : item.name}
                    </h3>
                    <p style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-neon); font-style:italic; margin-top:2px;">
                        Pathogen: ${item.pathogen}
                    </p>
                </div>
                <span class="disease-badge ${catObj.badgeClass}">${catObj.name}</span>
            </div>

            <div style="background: rgba(12,24,22,0.8); border: 1px solid var(--border-glass); border-radius: 12px; padding: 14px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--accent-neon); text-transform:uppercase; margin-bottom: 4px;">
                    👁️ Key Diagnostic Signs
                </div>
                <div style="display:flex; flex-wrap:wrap; gap: 6px; margin-top: 6px;">
                    ${item.keyFeatures.map(f => `<span class="pillar-symptom-tag">${f}</span>`).join('')}
                </div>
            </div>

            <div style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <strong style="color: #fff;">Symptoms:</strong> ${state.language === 'hi' ? item.symptomsHindi : item.symptoms}
            </div>

            <div style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <strong style="color: #38bdf8;">Spread Triggers:</strong> ${item.causes}
            </div>

            <div style="background: rgba(16,185,129,0.08); border-left: 3px solid var(--accent-neon); padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 12px; line-height: 1.5;">
                <strong style="color: var(--accent-neon);">Agronomist Recommendation:</strong> ${item.treatment}
            </div>
        `;
    }

    // --------------------------------------------------------------------------
    // 9. Diagnostic Lab & Grad-CAM Heatmap Simulator (Slide 7)
    // --------------------------------------------------------------------------
    const diagnosticSamples = [
        {
            id: 'tomato_early_blight',
            crop: 'Tomato',
            disease: 'Tomato Early Blight (Alternaria solani)',
            confidence: 98.8,
            category: 'fungal',
            top3: [
                { name: 'Tomato Early Blight', prob: 98.8 },
                { name: 'Tomato Septoria Leaf Spot', prob: 0.9 },
                { name: 'Tomato Target Spot', prob: 0.3 }
            ],
            diagnosis: 'Alternaria solani conidial infection detected with classic concentric zonate rings. Risk of rapid lower canopy defoliation.',
            prescription: 'Apply Mancozeb 75% WP @ 2g/L or Chlorothalonil immediately. Increase spacing and prune lower ground-touching leaves.',
            svgBg: 'radial-gradient(circle at 45% 50%, #451a03 0%, #1e3a1e 40%, #14532d 100%)',
            camPattern: 'radial-gradient(circle at 45% 50%, rgba(239,68,68,0.95) 0%, rgba(245,158,11,0.8) 30%, rgba(16,185,129,0.1) 60%, transparent 80%)'
        },
        {
            id: 'potato_late_blight',
            crop: 'Potato',
            disease: 'Potato Late Blight (Phytophthora infestans)',
            confidence: 99.4,
            category: 'fungal',
            top3: [
                { name: 'Potato Late Blight', prob: 99.4 },
                { name: 'Potato Early Blight', prob: 0.5 },
                { name: 'Tomato Late Blight', prob: 0.1 }
            ],
            diagnosis: 'Phytophthora infestans water mold detected at leaf apex with high sporulation density. Extreme threat to entire field.',
            prescription: 'Apply systemic Metalaxyl-M + Mancozeb spray within 24 hours. Destroy heavily rotted plants.',
            svgBg: 'radial-gradient(circle at 60% 40%, #2e1065 0%, #1c1917 35%, #14532d 100%)',
            camPattern: 'radial-gradient(circle at 60% 40%, rgba(239,68,68,0.95) 0%, rgba(168,85,247,0.8) 35%, rgba(6,182,212,0.1) 65%, transparent 80%)'
        },
        {
            id: 'tomato_healthy',
            crop: 'Tomato',
            disease: 'Tomato Healthy Leaf (No Pathogen)',
            confidence: 99.8,
            category: 'healthy',
            top3: [
                { name: 'Tomato Healthy', prob: 99.8 },
                { name: 'Pepper Bell Healthy', prob: 0.1 },
                { name: 'Potato Healthy', prob: 0.1 }
            ],
            diagnosis: 'Healthy cellular chlorophyll matrix. Zero chlorosis, necrotic lesions, or viral mottling detected.',
            prescription: 'No chemical intervention required. Continue regular scouting and preventive organic sprays.',
            svgBg: 'radial-gradient(circle at 50% 50%, #15803d 0%, #166534 50%, #14532d 100%)',
            camPattern: 'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.3) 0%, transparent 70%)'
        },
        {
            id: 'apple_scab',
            crop: 'Apple',
            disease: 'Apple Scab (Venturia inaequalis)',
            confidence: 97.6,
            category: 'fungal',
            top3: [
                { name: 'Apple Scab', prob: 97.6 },
                { name: 'Apple Black Rot', prob: 2.1 },
                { name: 'Apple Cedar Rust', prob: 0.3 }
            ],
            diagnosis: 'Olive-green velvety fungal lesions on leaf cuticle indicative of active Venturia conidia dispersal.',
            prescription: 'Apply Difenoconazole 25 EC or Captan 50 WP. Rake fallen foliage to prevent overwintering ascocarps.',
            svgBg: 'radial-gradient(circle at 35% 65%, #365314 0%, #14532d 60%, #064e3b 100%)',
            camPattern: 'radial-gradient(circle at 35% 65%, rgba(239,68,68,0.9) 0%, rgba(245,158,11,0.7) 40%, transparent 75%)'
        }
    ];

    function updateDiagnosticLab() {
        const sample = diagnosticSamples.find(s => s.id === state.selectedDiagnosticSample) || diagnosticSamples[0];
        
        // Update leaf visual container
        const preview = document.getElementById('diagnostic-leaf-preview');
        const heatmap = document.getElementById('gradcam-heatmap-layer');
        if (preview) {
            preview.style.background = sample.svgBg;
        }
        if (heatmap) {
            heatmap.style.background = sample.camPattern;
            heatmap.style.display = state.gradCamVisible ? 'block' : 'none';
        }

        // Update confidence & predictions
        const titleEl = document.getElementById('diag-disease-title');
        const confFill = document.getElementById('diag-conf-fill');
        const confNum = document.getElementById('diag-conf-val');
        const diagDesc = document.getElementById('diag-diagnosis-desc');
        const rxDesc = document.getElementById('diag-prescription-desc');
        const top3Container = document.getElementById('diag-top3-bars');

        if (titleEl) titleEl.innerText = sample.disease;
        if (confFill) confFill.style.width = `${sample.confidence}%`;
        if (confNum) confNum.innerText = `${sample.confidence}%`;
        if (diagDesc) diagDesc.innerText = sample.diagnosis;
        if (rxDesc) rxDesc.innerText = sample.prescription;

        if (top3Container) {
            top3Container.innerHTML = sample.top3.map(t => `
                <div style="margin-bottom: 8px;">
                    <div style="display:flex; justify-content:space-between; font-size: 11px; margin-bottom: 3px;">
                        <span>${t.name}</span>
                        <span style="font-family: var(--font-mono); color: var(--accent-neon);">${t.prob}%</span>
                    </div>
                    <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow:hidden;">
                        <div style="height:100%; width:${t.prob}%; background: ${t.prob > 50 ? 'var(--accent-neon)' : '#64748b'}; border-radius:3px;"></div>
                    </div>
                </div>
            `).join('');
        }
    }

    // --------------------------------------------------------------------------
    // 10. Event Listeners & Interactive Controls
    // --------------------------------------------------------------------------

    // Slide navigation buttons
    document.getElementById('prev-slide-btn')?.addEventListener('click', () => {
        goToSlide(state.currentSlide - 1);
    });

    document.getElementById('next-slide-btn')?.addEventListener('click', () => {
        goToSlide(state.currentSlide + 1);
    });

    // Navigation dots
    document.querySelectorAll('.nav-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const target = parseInt(dot.dataset.slideIndex);
            goToSlide(target);
        });
    });

    // Top Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = parseInt(btn.dataset.targetSlide);
            goToSlide(target);
        });
    });

    // Explorer Search & Category Filter
    document.getElementById('explorer-search-input')?.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        filterExplorer();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            const val = btn.dataset.filterValue;
            state.activeCategoryFilter = val;
            filterExplorer();
        });
    });

    // Diagnostic Leaf Selector buttons
    document.querySelectorAll('.sample-leaf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('scan');
            state.selectedDiagnosticSample = btn.dataset.sampleId;
            document.querySelectorAll('.sample-leaf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateDiagnosticLab();
        });
    });

    // Grad-CAM Heatmap toggle
    document.getElementById('toggle-gradcam-btn')?.addEventListener('click', () => {
        playSound('click');
        state.gradCamVisible = !state.gradCamVisible;
        const btn = document.getElementById('toggle-gradcam-btn');
        if (btn) btn.innerText = state.gradCamVisible ? '🔥 Heatmap: ON' : '👁️ Heatmap: OFF';
        updateDiagnosticLab();
    });

    // Sound Toggle & Ambient Audio
    document.getElementById('sound-toggle-btn')?.addEventListener('click', () => {
        toggleAmbientSound();
    });

    // Language Toggle (English <-> Hindi)
    document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
        playSound('click');
        state.language = (state.language === 'en') ? 'hi' : 'en';
        document.getElementById('lang-toggle-btn').innerText = state.language === 'en' ? '🌐 EN' : '🌐 HI';
        renderCropsMatrix();
        filterExplorer();
        renderTomatoDeepDive();
        updateSpeakerNotes();
    });

    // Speaker Notes Drawer Toggle
    document.getElementById('notes-toggle-btn')?.addEventListener('click', () => {
        playSound('click');
        state.speakerNotesOpen = !state.speakerNotesOpen;
        document.getElementById('speaker-notes-drawer')?.classList.toggle('open', state.speakerNotesOpen);
    });

    document.getElementById('notes-close-btn')?.addEventListener('click', () => {
        state.speakerNotesOpen = false;
        document.getElementById('speaker-notes-drawer')?.classList.remove('open');
    });

    // Fullscreen Mode Toggle
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return; // Ignore inside input fields

        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
            e.preventDefault();
            goToSlide(state.currentSlide + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            goToSlide(state.currentSlide - 1);
        } else if (e.key === 's' || e.key === 'S') {
            state.speakerNotesOpen = !state.speakerNotesOpen;
            document.getElementById('speaker-notes-drawer')?.classList.toggle('open', state.speakerNotesOpen);
        } else if (e.key === 'f' || e.key === 'F') {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        } else if (e.key === 'Escape') {
            document.getElementById('disease-modal')?.classList.remove('active');
            state.speakerNotesOpen = false;
            document.getElementById('speaker-notes-drawer')?.classList.remove('open');
        }
    });

    // --------------------------------------------------------------------------
    // 11. Initial Startup Initialization
    // --------------------------------------------------------------------------
    renderCropsMatrix();
    filterExplorer();
    renderTomatoDeepDive();
    updateDiagnosticLab();
    goToSlide(1);
    updateAudioUI();

    // Start presentation button on Hero
    document.getElementById('hero-start-btn')?.addEventListener('click', () => {
        playSound('click');
        goToSlide(2);
    });

    document.getElementById('hero-explorer-btn')?.addEventListener('click', () => {
        playSound('click');
        goToSlide(4);
    });
});
