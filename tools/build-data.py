from __future__ import annotations

import json
import re
import unicodedata
from colorsys import rgb_to_hls
from pathlib import Path

from openpyxl import load_workbook


WORKBOOK = Path("/Users/kei/Downloads/Tüpfeltabelle.xlsx")
SHEET_NAME = "RAW"
MARKER_SHEET_NAME = "Export important"
OUTPUT = Path("src/data.js")

PROPERTY_COLUMNS = {"Eigenfarbe", "Flammenfärbung", "pH-Papier", "extra Hinweise"}
PROPERTY_ROWS = {"Eigenfarbe", "pH-Papier", "extra Hinweise", "I2 + H+", "I2"}
MARKER_ROW_RANGE = range(2, 30)
MARKER_COLUMN_RANGE = range(2, 28)
MARKER_ROW_RANGE_LABEL = "A2:A29"
MARKER_COLUMN_RANGE_LABEL = "B1:AA1"


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


def marked_headers(sheet) -> tuple[list[str], list[str]]:
    rows = [
        clean(sheet.cell(row, 1).value)
        for row in MARKER_ROW_RANGE
        if sheet.cell(row, 1).fill.fill_type and clean(sheet.cell(row, 1).value)
    ]
    columns = [
        clean(sheet.cell(1, column).value)
        for column in MARKER_COLUMN_RANGE
        if sheet.cell(1, column).fill.fill_type
        and clean(sheet.cell(1, column).value)
    ]
    return rows, columns


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
    marker_sheet = workbook[MARKER_SHEET_NAME]
    headers = [clean(sheet.cell(1, column).value) for column in range(1, sheet.max_column + 1)]
    selected_rows, selected_columns = marked_headers(marker_sheet)
    selected_row_set = set(selected_rows)
    selected_column_set = set(selected_columns)
    cards = []
    fakes = []

    for row in range(2, sheet.max_row + 1):
        cation = clean(sheet.cell(row, 1).value)
        if cation not in selected_row_set:
            continue
        for column in range(2, sheet.max_column + 1):
            anion = headers[column - 1]
            if anion not in selected_column_set or not core_pair(cation, anion):
                continue

            cell = sheet.cell(row, column)
            product = clean(cell.value)
            rgb = fill_rgb(cell)
            pair = {"cation": cation, "anion": anion, "sourceCell": f"{SHEET_NAME}!{cell.coordinate}"}

            if product:
                cards.append(
                    {
                        "id": f"{slug(cation)}__{slug(anion)}",
                        **pair,
                        "product": product,
                        "fill": rgb[-6:] if is_pink_fill(rgb) else "",
                    }
                )
            elif not product:
                fakes.append({"id": f"fake__{slug(cation)}__{slug(anion)}", **pair})

    return {
        "source": {
            "workbook": WORKBOOK.name,
            "sheet": SHEET_NAME,
            "markerSheet": MARKER_SHEET_NAME,
            "selectedRowRange": f"{MARKER_SHEET_NAME}!{MARKER_ROW_RANGE_LABEL}",
            "selectedColumnRange": f"{MARKER_SHEET_NAME}!{MARKER_COLUMN_RANGE_LABEL}",
            "pinkRule": "Rows are selected only from A2:A29 when column A is filled; columns are selected only from B1:AA1 when row 1 is filled.",
            "selectedRows": selected_rows,
            "selectedColumns": selected_columns,
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
