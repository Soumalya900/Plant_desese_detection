# 🌿 Plant Disease Detection (LeafCheck)

An end-to-end deep learning web application to diagnose plant diseases and nutritional deficiencies directly from leaf photographs. Powered by PyTorch, TorchVision, and Flask.

---

## 🚀 Overview

**LeafCheck** allows farmers, gardeners, and agronomists to upload a leaf photograph and receive:
1. **Disease Identification:** Precise classification of disease or healthy status across dozens of plant varieties.
2. **Confidence Score:** Model probability for the top prediction.
3. **Comprehensive Treatment Advice:** Practical steps including biological controls, organic management, and chemical remedies.

---

## 📁 Project Structure

```text
├── app.py                   # Flask web server & inference pipeline
├── class_indices.json       # Mapping of class IDs to disease categories
├── disease_info.json        # Treatment guides, symptoms, and disease descriptions
├── requirements.txt         # Project dependencies
├── models/
│   ├── plant_disease_model.pth  # PyTorch model weights (~10MB)
│   └── model.keras              # Keras / TensorFlow model weights (~10MB)
├── notebooks/               # Jupyter notebook for model exploration & training
├── presentation/            # Interactive slides / showcase web app
├── static/                  # Frontend assets (CSS, JS, icons)
├── templates/               # HTML templates (Flask UI)
└── test/                    # Sample test images for quick verification
```

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Soumalya900/plant-disease-detection.git
cd plant-disease-detection
```

### 2. Set Up Virtual Environment (Recommended)
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Web App
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🧪 Quick Test

Sample leaf images are included in the `test/` directory. You can drag and drop any image from `test/` directly into the web UI to test predictions.

---

## 📊 Dataset Reference

Trained on the **New Plant Diseases Dataset (Augmented)** consisting of 38 distinct crop-disease classes across crops like Tomato, Apple, Grape, Corn, Potato, Peach, Pepper, Strawberry, and more.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
