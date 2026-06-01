from __future__ import annotations

import json
import re
import unicodedata
from colorsys import rgb_to_hls
from pathlib import Path

from openpyxl import load_workbook


WORKBOOK = Path("/Users/kei/Downloads/Tüpfeltabelle.xlsx")
SHEET_NAME = "RAW"
OUTPUT = Path("src/data.js")

PROPERTY_COLUMNS = {"Eigenfarbe", "Flammenfärbung", "pH-Papier", "extra Hinweise"}
PROPERTY_ROWS = {"Eigenfarbe", "pH-Papier", "extra Hinweise", "I2 + H+", "I2"}


def clean(value: object) -> str:
    text = unicodedata.normalize("NFC", str(value or ""))
    return re.sub(r"\s+", " ", text).strip()


def slug(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-") or "blank"


def fill_rgb(cell) -> str:
    fill = cell.fill
    if not fill.fill_type or fill.fgColor.type != "rgb":
        return ""
    rgb = fill.fgColor.rgb
    return rgb if isinstance(rgb, str) else ""


def is_pink_fill(rgb: str) -> bool:
    if len(rgb) < 8:
        return False
    hex6 = rgb[-6:]
    red, green, blue = [int(hex6[index : index + 2], 16) for index in (0, 2, 4)]
    hue, lightness, _ = rgb_to_hls(red / 255, green / 255, blue / 255)
    degrees = hue * 360
    return 285 <= degrees <= 345 and blue >= 80 and red >= 110 and lightness >= 0.35


def core_pair(primary: str, secondary: str) -> bool:
    return (
        primary
        and secondary
        and primary != secondary
        and primary not in PROPERTY_ROWS
        and secondary not in PROPERTY_COLUMNS
    )


def build_data() -> dict[str, object]:
    workbook = load_workbook(WORKBOOK, data_only=True)
    sheet = workbook[SHEET_NAME]
    headers = [clean(sheet.cell(1, column).value) for column in range(1, sheet.max_column + 1)]
    cards = []
    fakes = []

    for row in range(2, sheet.max_row + 1):
        cation = clean(sheet.cell(row, 1).value)
        for column in range(2, sheet.max_column + 1):
            anion = headers[column - 1]
            if not core_pair(cation, anion):
                continue

            cell = sheet.cell(row, column)
            product = clean(cell.value)
            rgb = fill_rgb(cell)
            pair = {"cation": cation, "anion": anion, "sourceCell": f"{SHEET_NAME}!{cell.coordinate}"}

            if product and is_pink_fill(rgb):
                cards.append(
                    {
                        "id": f"{slug(cation)}__{slug(anion)}",
                        **pair,
                        "product": product,
                        "fill": rgb[-6:],
                    }
                )
            elif not product:
                fakes.append({"id": f"fake__{slug(cation)}__{slug(anion)}", **pair})

    return {
        "source": {
            "workbook": WORKBOOK.name,
            "sheet": SHEET_NAME,
            "pinkRule": "RGB fills with hue 285-345 degrees are treated as pink-marked.",
        },
        "cards": cards,
        "fakes": fakes,
    }


def write_module(data: dict[str, object]) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(data, ensure_ascii=False, indent=2)
    OUTPUT.write_text(
        "export const DECK_DATA = "
        + serialized
        + ";\n\nexport const REAL_CARDS = DECK_DATA.cards;\nexport const FAKE_CARDS = DECK_DATA.fakes;\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    write_module(build_data())
