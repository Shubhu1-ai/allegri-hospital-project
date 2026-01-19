from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from PIL import Image
import io
import sqlite3
import uuid
from datetime import datetime

app = FastAPI()

# Autoriser le Frontend React à communiquer avec le serveur
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION DU MODÈLE ---
# On charge le modèle une seule fois au démarrage
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')

# Remplace ceci par la structure exacte de ton modèle si elle diffère
model = fasterrcnn_resnet50_fpn(weights=None, num_classes=2) # Exemple: 2 classes (Fond + Parasite)
model.load_state_dict(torch.load("../fasterrcnn_malaria.pth", map_location=device))
model.to(device)
model.eval()

# --- BASE DE DONNÉES ---
def init_db():
    conn = sqlite3.connect('allegri_hospital.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scan_history (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            result_label TEXT,
            confidence REAL,
            status TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # 1. Lire l'image envoyée par le Frontend
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    
    # 2. Prétraitement (à adapter selon ton script inference_palu1.py)
    from torchvision import transforms
    transform = transforms.Compose([transforms.ToTensor()])
    img_tensor = transform(image).to(device).unsqueeze(0)

    # 3. Inférence IA
    with torch.no_grad():
        prediction = model(img_tensor)
    
    # Logique simplifiée : on prend le score le plus élevé
    # À adapter selon ce que ton modèle renvoie (boîtes englobantes, etc.)
    scores = prediction[0]['scores']
    if len(scores) > 0:
        confidence = float(scores[0].item())
        label = "Parasite Detected" if confidence > 0.5 else "Clear"
    else:
        confidence = 0.0
        label = "No Detection"

    # 4. Sauvegarde en Base de Données
    scan_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = sqlite3.connect('allegri_hospital.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO scan_history VALUES (?, ?, ?, ?, ?)",
                   (scan_id, timestamp, label, confidence, "Completed"))
    conn.commit()
    conn.close()

    return {
        "id": scan_id,
        "label": label,
        "confidence": confidence,
        "timestamp": timestamp
    }

@app.get("/history")
async def get_history():
    conn = sqlite3.connect('allegri_hospital.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scan_history ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)