import os
import io
import json
import base64
from pathlib import Path
from PIL import Image

import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__)

# Base paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "plant_disease_model.pth"
CLASS_INDICES_PATH = BASE_DIR / "class_indices.json"
DISEASE_INFO_PATH = BASE_DIR / "disease_info.json"
TEST_SAMPLES_DIR = BASE_DIR / "test"

# Global Model & Data Placeholders
model = None
classes = []
class_to_idx = {}
idx_to_class = {}
disease_info = {}

# Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Image Preprocessing Transformation
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_resources():
    global model, classes, class_to_idx, idx_to_class, disease_info

    # 1. Load Disease Info
    if DISEASE_INFO_PATH.exists():
        with open(DISEASE_INFO_PATH, "r", encoding="utf-8") as f:
            disease_info = json.load(f)
        print(f"Loaded info for {len(disease_info)} disease classes.")

    # 2. Load Class Indices
    if CLASS_INDICES_PATH.exists():
        with open(CLASS_INDICES_PATH, "r", encoding="utf-8") as f:
            c_data = json.load(f)
            classes = c_data.get("classes", [])
            class_to_idx = c_data.get("class_to_idx", {})
            idx_to_class = c_data.get("idx_to_class", {str(i): c for i, c in enumerate(classes)})
        print(f"Loaded {len(classes)} class labels.")

    # 3. Load Model
    if MODEL_PATH.exists() and classes:
        num_classes = len(classes)
        net = models.mobilenet_v2(weights=None)
        in_features = net.classifier[1].in_features
        net.classifier = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes)
        )
        net.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        net.to(device)
        net.eval()
        model = net
        print("Model loaded successfully into memory.")
    else:
        print("Model file not found or classes not loaded yet. Will reload upon request if ready.")

# Initialize resources
load_resources()

def get_disease_type(class_name: str, disease_name: str) -> str:
    c_lower = (class_name + " " + disease_name).lower()
    if "healthy" in c_lower:
        return "None (Healthy)"
    if "virus" in c_lower or "viroid" in c_lower or "mosaic" in c_lower or "curl" in c_lower:
        return "Viral"
    if "bacterial" in c_lower or "bacteria" in c_lower:
        return "Bacterial"
    if "mite" in c_lower or "insect" in c_lower or "pest" in c_lower:
        return "Pest Infestation"
    return "Fungal"

def get_affected_area(class_name: str, disease_name: str) -> str:
    c_lower = (class_name + " " + disease_name).lower()
    if "healthy" in c_lower:
        return "Foliage / Whole Plant"
    if "scab" in c_lower or "rot" in c_lower or "blight" in c_lower:
        return "Leaf & Fruit"
    if "spot" in c_lower or "rust" in c_lower or "mildew" in c_lower:
        return "Leaf"
    return "Leaf & Stem"

def get_treatment_suggestions(is_healthy: bool, disease_type: str, disease_name: str):
    if is_healthy:
        return [
            {"icon": "fa-sun", "text": "Provide optimal sunlight"},
            {"icon": "fa-droplet", "text": "Maintain regular watering"},
            {"icon": "fa-seedling", "text": "Apply balanced fertilizer"},
            {"icon": "fa-shield-halved", "text": "Routine pest inspection"}
        ]
    
    if disease_type == "Viral":
        return [
            {"icon": "fa-scissors", "text": "Remove infected plants"},
            {"icon": "fa-bug-slash", "text": "Control insect vectors"},
            {"icon": "fa-hand-sparkles", "text": "Sanitize pruning tools"},
            {"icon": "fa-seedling", "text": "Plant virus-resistant crops"}
        ]
    elif disease_type == "Bacterial":
        return [
            {"icon": "fa-scissors", "text": "Prune infected leaves"},
            {"icon": "fa-spray-can", "text": "Apply copper bactericide"},
            {"icon": "fa-wind", "text": "Improve air circulation"},
            {"icon": "fa-droplet-slash", "text": "Avoid overhead watering"}
        ]
    else:  # Fungal default
        fungicide_text = "Use fungicide (Copper spray)"
        if "blight" in disease_name.lower():
            fungicide_text = "Use fungicide (Mancozeb)"
        elif "rust" in disease_name.lower():
            fungicide_text = "Apply rust fungicide"
        elif "mildew" in disease_name.lower():
            fungicide_text = "Apply sulfur/neem spray"
            
        return [
            {"icon": "fa-leaf", "text": "Remove affected leaves"},
            {"icon": "fa-spray-can", "text": fungicide_text},
            {"icon": "fa-wind", "text": "Improve air circulation"},
            {"icon": "fa-droplet-slash", "text": "Avoid overhead watering"}
        ]

def run_prediction(image: Image.Image):
    global model
    if model is None:
        load_resources()
        if model is None:
            return {"error": "Model is currently training or not yet available. Please try again shortly."}

    # Preprocess
    img_t = transform(image.convert("RGB")).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_t)
        probs = torch.softmax(outputs, dim=1)[0]
        top_probs, top_indices = torch.topk(probs, k=min(3, len(classes)))

    top_idx = int(top_indices[0].item())
    top_prob = float(top_probs[0].item())
    class_name = idx_to_class.get(str(top_idx), classes[top_idx] if top_idx < len(classes) else "Unknown")

    # Format Top 3 predictions
    top_3 = []
    for p, idx in zip(top_probs, top_indices):
        c_name = idx_to_class.get(str(idx.item()), classes[idx.item()])
        c_info = disease_info.get(c_name, {})
        display_name = c_info.get("disease", c_name.replace("___", " - ").replace("_", " "))
        plant_name = c_info.get("plant", c_name.split("___")[0])
        top_3.append({
            "class_raw": c_name,
            "plant": plant_name,
            "disease": display_name,
            "confidence": round(float(p.item()) * 100, 2),
            "is_healthy": c_info.get("is_healthy", "healthy" in c_name.lower())
        })

    # Retrieve disease advice & metadata
    info = disease_info.get(class_name, {})
    is_healthy = info.get("is_healthy", "healthy" in class_name.lower())
    display_disease = info.get("disease", class_name.replace("___", " - ").replace("_", " "))
    plant_name = info.get("plant", class_name.split("___")[0])
    disease_type = get_disease_type(class_name, display_disease)
    affected_area = get_affected_area(class_name, display_disease)
    
    severity_raw = info.get("severity", "None" if is_healthy else "Moderate")
    severity = "None" if is_healthy else ("Moderate" if severity_raw == "Medium" else severity_raw)
    recommended_action = "Routine care & monitoring" if is_healthy else ("Immediate intervention required" if severity == "High" else "Treatment advised")

    # Construct About description
    if is_healthy:
        about_text = f"The {plant_name} plant shows healthy, vigorous foliage with no visible signs of pathogen infection or nutritional deficiency. Regular maintenance will preserve its health."
    else:
        symptoms_str = info.get("symptoms", "")
        about_text = f"{display_disease} is a common {disease_type.lower()} disease that affects {plant_name} plants, causing {symptoms_str.lower() if symptoms_str else 'foliar damage'}. It can reduce yield and vitality if not managed in time."

    suggestions = get_treatment_suggestions(is_healthy, disease_type, display_disease)

    return {
        "success": True,
        "class_raw": class_name,
        "plant": plant_name,
        "disease": display_disease,
        "scientific_name": info.get("scientific_name", "N/A"),
        "is_healthy": is_healthy,
        "disease_type": disease_type,
        "affected_area": affected_area,
        "severity": severity,
        "recommended_action": recommended_action,
        "confidence": round(top_prob * 100, 1),
        "about": about_text,
        "symptoms": info.get("symptoms", "No symptom information available."),
        "treatment": info.get("treatment", "No treatment needed." if is_healthy else "Consult local agricultural extension."),
        "prevention": info.get("prevention", "Maintain general good plant hygiene."),
        "treatment_suggestions": suggestions,
        "top_predictions": top_3
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/privacy")
def privacy():
    return render_template("privacy.html")

@app.route("/terms")
def terms():
    return render_template("terms.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        image = None
        # Handle file upload
        if "file" in request.files:
            file = request.files["file"]
            if file and file.filename:
                image = Image.open(file.stream)
        # Handle base64 image (webcam capture)
        elif request.is_json and "image_base64" in request.json:
            b64_str = request.json["image_base64"].split(",")[-1]
            image_data = base64.b64decode(b64_str)
            image = Image.open(io.BytesIO(image_data))
        # Handle sample filename
        elif request.is_json and "sample_name" in request.json:
            sample_name = request.json["sample_name"]
            sample_path = TEST_SAMPLES_DIR / sample_name
            if sample_path.exists():
                image = Image.open(sample_path)
            else:
                return jsonify({"error": f"Sample image {sample_name} not found."}), 404

        if image is None:
            return jsonify({"error": "No valid image provided."}), 400

        result = run_prediction(image)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/samples")
def get_samples():
    if not TEST_SAMPLES_DIR.exists():
        return jsonify({"samples": []})

    all_files = []
    for root, _, files in os.walk(TEST_SAMPLES_DIR):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                full_path = Path(root) / f
                rel_path = full_path.relative_to(TEST_SAMPLES_DIR).as_posix()
                all_files.append((rel_path, f))

    # Pick sample files
    sample_list = []
    for rel_path, f in all_files[:16]:
        display_label = f.replace(".JPG", "").replace(".jpg", "").replace(".png", "")
        # Add spaces before capital letters for readability
        formatted = "".join([" " + c if c.isupper() and i > 0 and not display_label[i-1].isupper() else c for i, c in enumerate(display_label)]).strip()
        sample_list.append({
            "filename": rel_path,
            "title": formatted,
            "url": f"/sample-image/{rel_path}"
        })

    return jsonify({"samples": sample_list})

@app.route("/sample-image/<path:filename>")
def serve_sample(filename):
    return send_from_directory(TEST_SAMPLES_DIR, filename)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
