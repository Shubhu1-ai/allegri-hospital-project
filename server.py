import torch
import torchvision
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision import transforms as T
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io, base64, cv2, uuid, sqlite3, numpy as np
from datetime import datetime

# --- CONFIGURATION ---
MODEL_PATH = "fasterrcnn_malaria.pth"
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
CATEGORIES = ["background", "difficult", "gametocyte", "leukocyte", "red blood cell", "ring", "schizont", "trophozoite"]

# Couleurs BGR pour OpenCV (Vibrant pour mobile)
COLORS_MAP = {
    "gametocyte": (0, 0, 255),      # Rouge
    "leukocyte": (255, 0, 0),       # Bleu
    "red blood cell": (0, 255, 0),  # Vert
    "ring": (0, 255, 255),          # Jaune
    "schizont": (255, 0, 255),      # Rose
    "trophozoite": (0, 165, 255),   # Orange
    "difficult": (128, 128, 128)    # Gris
}

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Chargement du modèle
def load_model():
    model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights=None)
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, len(CATEGORIES))
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.to(DEVICE).eval()
    return model

model = load_model()

class ImageRequest(BaseModel):
    image: str

@app.post("/analyze")
async def analyze(request: ImageRequest):
    try:
        # 1. Décodage de l'image entrante
        header, encoded = request.image.split(",", 1)
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 2. Inférence IA
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        img_tensor = T.ToTensor()(Image.fromarray(img_rgb)).to(DEVICE).unsqueeze(0)
        with torch.no_grad():
            pred = model(img_tensor)[0]

        scores = pred["scores"].cpu().numpy()
        labels = pred["labels"].cpu().numpy()
        boxes = pred["boxes"].cpu().numpy()
        
        counts = {}
        found_any = False
        for box, score, label in zip(boxes, scores, labels):
            if score > 0.35: # Seuil de détection
                found_any = True
                name = CATEGORIES[label]
                counts[name] = counts.get(name, 0) + 1
                
                # Dessin des carrés (Épaisseur 4 pour mobile)
                x1, y1, x2, y2 = box.astype(int)
                color = COLORS_MAP.get(name, (0, 255, 0))
                cv2.rectangle(img_cv, (x1, y1), (x2, y2), color, 4)
                cv2.putText(img_cv, f"{name}", (x1, y1-15), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        # 3. Encodage en base64 PUR (sans le header data:image...)
        _, buffer = cv2.imencode('.jpg', img_cv)
        img_raw_base64 = base64.b64encode(buffer).decode('utf-8')

        summary = ", ".join([f"{v} {k}" for k, v in counts.items()]) if found_any else "Negative"

        return {
            "id": str(uuid.uuid4())[:8],
            "bacteriaType": summary,
            "confidence": 85.0,
            "imageProcessed": img_raw_base64 # On envoie les données brutes
        }
    except Exception as e:
        print(f"Erreur: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)