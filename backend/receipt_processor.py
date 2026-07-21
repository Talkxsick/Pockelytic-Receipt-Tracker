"""
Sends a receipt photo to Gemini's vision API and gets back structured
line-item data. This is the "real Gen AI" part of the app -- no OCR
library, no regex-based parsing, the model reads the receipt directly.

Uses Google's Gemini API, which has a free tier (no credit card
required) -- get a key at https://aistudio.google.com/apikey
"""
import json
import os

from google import genai
from google.genai import types

from database import CATEGORIES

MODEL = "gemini-2.5-flash"  # free-tier eligible, vision-capable

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Get a free key at "
                "https://aistudio.google.com/apikey, then export it before "
                "starting the server, e.g. `export GEMINI_API_KEY=...`"
            )
        _client = genai.Client(api_key=api_key)
    return _client


SYSTEM_PROMPT = f"""You are a receipt-reading assistant. You will be shown a \
photo of a paper receipt. Extract every purchased line item and return ONLY \
valid JSON -- no markdown code fences, no commentary before or after.

Use exactly this shape:
{{
  "merchant": string,
  "date": "YYYY-MM-DD",
  "items": [
    {{"name": string, "price": number, "category": string}}
  ],
  "total": number
}}

Rules:
- "category" must be one of: {", ".join(CATEGORIES)}.
- Ignore subtotal/tax/tip lines as items, but fold tax/tip into "total" if shown.
- If the date is missing or unreadable, use today's date.
- If a price is unreadable, make the best reasonable estimate rather than \
  omitting the item.
- "total" should be the receipt's printed total; if missing, sum the items.
- Return ONLY the JSON object, nothing else.
"""


def process_receipt_image(image_bytes: bytes, media_type: str) -> dict:
    client = _get_client()

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=media_type),
            "Extract this receipt as JSON, following the schema exactly.",
        ],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0,
        ),
    )

    text = (response.text or "").strip()
    if not text:
        raise ValueError("Gemini returned an empty response for this receipt.")

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model did not return valid JSON: {text[:300]}") from exc

    # Defensive cleanup in case the model wanders slightly off-schema.
    data.setdefault("merchant", "Unknown merchant")
    data.setdefault("items", [])
    for item in data["items"]:
        item.setdefault("category", "Other")
        if item["category"] not in CATEGORIES:
            item["category"] = "Other"
        item["price"] = float(item.get("price", 0) or 0)
    data["total"] = float(data.get("total", sum(i["price"] for i in data["items"])) or 0)

    return data
