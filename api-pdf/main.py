from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Any
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

app = FastAPI(title="Pireco PDF API")

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


class PDFRequest(BaseModel):
    template: str
    data: dict[str, Any]


@app.post("/generate-pdf")
async def generate_pdf(req: PDFRequest) -> Response:
    try:
        template = jinja_env.get_template(f"{req.template}.html")
    except Exception:
        raise HTTPException(status_code=404, detail=f"Template '{req.template}' not found")

    html_content = template.render(**req.data)

    try:
        pdf_bytes = HTML(string=html_content, base_url=TEMPLATES_DIR).write_pdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{req.template}.pdf"'},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
