"""
api-pdf/main.py — Pinturas Pireco PDF API
FastAPI + WeasyPrint + Jinja2
"""

import io
import os
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

import jinja2

try:
    from weasyprint import HTML
    WEASYPRINT_OK = True
except ImportError:
    WEASYPRINT_OK = False

# ── Rutas ─────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
FONT_PATH    = os.path.join(BASE_DIR, "fonts")
LOGO_PATH    = os.path.join(BASE_DIR, "assets", "logo_blanco.png")

# ── FastAPI ───────────────────────────────────────────────────────────────────
app = FastAPI(title="Pireco PDF API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # restringir en producción
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Jinja2 ────────────────────────────────────────────────────────────────────
jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(TEMPLATE_DIR),
    autoescape=False,             # HTML controlado por nosotros
)

# ── Datos por defecto ─────────────────────────────────────────────────────────
DEFAULT_COMPANY = {
    "name":         "Pinturas Pireco SL",
    "cif":          "B75852400",
    "address":      "Calle La Pitera 22B",
    "city":         "Vall de Uxó",
    "province":     "Castellón",
    "postal_code":  "12600",
    "phone":        "623 192 321",
    "email":        "info@pinturaspireco.com",
    "iban":         "ES21 0182 7518 3602 0170 5927",
    "swift":        "BBVAESMMXXX",
}

DEFAULT_CONDITIONS = [
    ("1. Materiales",
     "El precio cotizado incluye el coste de todos los materiales necesarios para la correcta ejecución del trabajo, según lo especificado en la descripción del proyecto."),
    ("2. Retoques y repasos",
     "Una vez finalizado el trabajo y realizada la inspección final, se contemplará un plazo de 3 días para notificar cualquier defecto o imperfección. Los trabajos de repaso derivados de estas notificaciones estarán cubiertos dentro del presupuesto original, siempre y cuando no sean consecuencia de un mal uso o causas ajenas a la ejecución del trabajo. Cualquier trabajo adicional solicitado posteriormente a este plazo o no contemplado en el alcance original será presupuestado por separado."),
    ("3. Desplazamientos y jornada reservada",
     "En caso de que los trabajos no puedan ejecutarse en la fecha prevista por causas ajenas a Pinturas Pireco S.L., incluyendo pero no limitándose a retrasos de obra, falta de suministro, ausencia de accesos o de las condiciones acordadas, se facturará el desplazamiento y la jornada reservada: 25 €/desplazamiento + 240 €/jornada bloqueada de 2 personas."),
    ("4. Pladur",
     "No se incluyen en este presupuesto reparaciones ni correcciones de desperfectos del pladur. Es responsabilidad de los pladuristas entregar paredes y techos lisos y listos para pintar."),
    ("5. Alcance del trabajo",
     "No se realizarán trabajos fuera de este presupuesto."),
    ("6. Protección del área circundante",
     "Cubrimos ventanas, puertas, muebles, suelos, jardines y elementos decorativos para evitar daños por salpicaduras de pintura o materiales."),
]

DEFAULT_ACCEPTANCE = [
    "El presente presupuesto deberá ser aceptado mediante firma manuscrita, firma digital o sello de la empresa, indicando conformidad con los precios, condiciones y formas de pago.",
    "La aceptación implica la conformidad íntegra con todas las condiciones generales y particulares descritas en este documento.",
    "La firma digital tendrá plena validez legal y será vinculante en los mismos términos que la manuscrita.",
    "El presupuesto tendrá una validez de 30 días naturales a partir de la fecha de emisión.",
    "Con la firma, el cliente autoriza a Pinturas Pireco S.L. a iniciar la planificación y ejecución de los trabajos en los términos acordados.",
]

TAG_LABELS = {"int": "Interior", "ext": "Exterior", "met": "Metal", "oth": "Otro"}

STATUS_LABELS = {
    "draft":    "Borrador",
    "sent":     "Enviado",
    "accepted": "Aceptado",
    "rejected": "Rechazado",
    "active":   "Activa",
    "converted":"Convertida",
    "pending":  "Pendiente",
    "paid":     "Pagada",
    "overdue":  "Vencida",
}

DOC_TYPE_LABELS = {
    "budget":   "Presupuesto",
    "proforma": "Proforma",
    "invoice":  "Factura",
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def fmt_money(value) -> str:
    if value is None:
        return "—"
    d = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    parts = f"{d:,.2f}".split(".")
    integer_part = parts[0].replace(",", ".")
    return f"{integer_part},{parts[1]}"

def fmt_date(value) -> str:
    if not value:
        return ""
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value).date()
        except ValueError:
            return value
    return value.strftime("%d/%m/%Y")

def calculate_totals(items: list, iva_pct: int):
    base = sum(
        Decimal(str(i.get("unit_price", 0))) * Decimal(str(i.get("quantity", 1)))
        for i in items
        if i.get("unit_price") and i.get("quantity")
    )
    base  = base.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    iva   = (base * Decimal(str(iva_pct)) / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total = base + iva
    return base, iva, total

# ── Core generator ────────────────────────────────────────────────────────────
def build_pdf(payload: dict) -> bytes:
    doc_type   = payload.get("doc_type", "budget")
    doc        = dict(payload["doc"])           # mutable copy
    client     = payload["client"]
    items      = [dict(i) for i in payload.get("items", [])]
    treatments = payload.get("treatments", [])
    company    = {**DEFAULT_COMPANY, **payload.get("company", {})}
    conditions_raw = payload.get("conditions", DEFAULT_CONDITIONS)
    acceptance = payload.get("acceptance", DEFAULT_ACCEPTANCE)

    # Normalizar condiciones
    conditions = []
    for c in conditions_raw:
        if isinstance(c, (list, tuple)):
            conditions.append({"title": c[0], "text": c[1]})
        else:
            conditions.append(c)

    # Totales
    iva_pct = int(doc.get("iva_pct", 21))
    if "base_amount" not in doc:
        base, iva, total = calculate_totals(items, iva_pct)
        doc["base_amount"]  = fmt_money(base)
        doc["iva_amount"]   = fmt_money(iva)
        doc["total_amount"] = fmt_money(total)
    else:
        doc["base_amount"]  = fmt_money(doc["base_amount"])
        doc["iva_amount"]   = fmt_money(doc["iva_amount"])
        doc["total_amount"] = fmt_money(doc["total_amount"])

    # Enriquecer items
    for item in items:
        item["tag_label"] = TAG_LABELS.get(item.get("tag", ""), "")
        if item.get("unit_price") and item.get("quantity"):
            item["total"]      = fmt_money(Decimal(str(item["unit_price"])) * Decimal(str(item["quantity"])))
            item["unit_price"] = fmt_money(item["unit_price"])
            item["quantity"]   = str(item["quantity"]).rstrip("0").rstrip(".")
        else:
            item["total"] = item["unit_price"] = item["quantity"] = None

    # Enriquecer doc
    doc["status_label"] = STATUS_LABELS.get(doc.get("status", "draft"), doc.get("status", ""))
    doc["issue_date"]   = fmt_date(doc.get("issue_date"))
    doc["expiry_date"]  = fmt_date(doc.get("expiry_date"))
    doc["due_date"]     = fmt_date(doc.get("due_date"))

    total_pages = 3 if treatments else 2

    # Logo: solo si existe el archivo
    logo_path = LOGO_PATH if os.path.exists(LOGO_PATH) else ""

    template  = jinja_env.get_template("pdf_template.html")
    html_str  = template.render(
        font_path             = FONT_PATH,
        logo_path             = logo_path,
        doc_type              = doc_type,
        doc_type_label        = DOC_TYPE_LABELS.get(doc_type, "Documento"),
        doc                   = doc,
        client                = client,
        items                 = items,
        treatments            = treatments,
        company               = company,
        conditions            = conditions,
        acceptance_conditions = acceptance,
        total_pages           = total_pages,
    )

    return HTML(string=html_str, base_url=BASE_DIR).write_pdf()

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "weasyprint": WEASYPRINT_OK}

@app.post("/generate")
async def generate(payload: dict[str, Any]):
    if not WEASYPRINT_OK:
        raise HTTPException(503, "WeasyPrint no disponible")
    if "doc" not in payload or "client" not in payload:
        raise HTTPException(400, "Faltan campos: doc, client")
    try:
        pdf_bytes = build_pdf(payload)
    except Exception as e:
        raise HTTPException(500, str(e))

    doc_number = payload.get("doc", {}).get("number", "documento")
    return Response(
        content     = pdf_bytes,
        media_type  = "application/pdf",
        headers     = {"Content-Disposition": f'inline; filename="{doc_number}.pdf"'},
    )
