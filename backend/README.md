# UDL Converter Backend

Flask backend for the Universal UDL Converter application.

## Setup

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   python app.py
   ```

The server will start at `http://localhost:8000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/process` | POST | Process all steps at once |
| `/process/extraction` | POST | Extract text from files |
| `/process/simplification` | POST | Simplify text |
| `/process/translation` | POST | Translate text |
| `/process/similarity` | POST | Compute semantic similarity |
| `/process/bias` | POST | Detect bias |
| `/process/wcag` | POST | Check WCAG compliance |
| `/process/signlanguage` | POST | Generate sign language gloss |
| `/process/alttext` | POST | Generate image alt text |
| `/process/transcript` | POST | Transcribe audio |

## Adding Your Models

1. Create model files in `backend/models/` directory
2. Import them in `app.py`
3. Replace the placeholder handler functions with your model calls

Example:
```python
# In app.py
from models.simplification import simplify_text

def simplify_text_handler(text):
    return simplify_text(text)  # Call your model
