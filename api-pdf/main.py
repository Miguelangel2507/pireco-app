from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any
import jinja2
import io
import os

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

app = FastAPI(title="Pireco PDF API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(TEMPLATES_DIR),
    autoescape=jinja2.select_autoescape(["html", "xml"]),
)


class PDFRequest(BaseModel):
    template: str
    data: dict[str, Any]


@app.get("/health")
async def health():
    return {"status": "ok", "weasyprint": WEASYPRINT_AVAILABLE}


@app.post("/generate-pdf")
async def generate_pdf(request: PDFRequest):
    if not WEASYPRINT_AVAILABLE:
        raise HTTPException(status_code=500, detail="WeasyPrint not available")

    try:
        template = jinja_env.get_template(f"{request.template}.html")
    except jinja2.TemplateNotFound:
        raise HTTPException(status_code=404, detail=f"Template '{request.template}' not found")

    try:
        html_content = template.render(**request.data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Template render error: {str(e)}")

    try:
        pdf_bytes = HTML(string=html_content).write_pdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={request.template}.pdf"},
    )
