#!/usr/bin/env python3
"""
generate_pix_payloads.py

Reads:
  - config.json                      (on same dir as this script, contains fixed Pix BR Code parameters:
                                      "pix_key", "merchant_name", "merchant_city")
  - public/assets/gifts_source.json  (gift list: name, price, image, claimed -- no payload yet)

Writes:
  - public/assets/gifts.json         (same gift list, each entry enriched with a valid
                                static Pix BR Code payload string, ready for the
                                frontend to feed directly into a QR renderer and a unique,
                                incremental id for indexing purposes, if needed)

This script performs no network calls and depends only on the Python 3
standard library. Run it manually whenever gifts_source.json or config.json
changes:

    python3 scripts/generate_pix_payloads.py

Optional flags:
    --base-dir PATH   Override the base "assets" directory (default: ./assets)
    --dry-run         Print the resulting JSON to stdout instead of writing it
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any


# --------------------------------------------------------------------------
# EMV / Pix BR Code field IDs (see https://www.bcb.gov.br/ -> Pix manuals)
# --------------------------------------------------------------------------
ID_PAYLOAD_FORMAT_INDICATOR = "00"
ID_MERCHANT_ACCOUNT_INFO = "26"
ID_MERCHANT_CATEGORY_CODE = "52"
ID_TRANSACTION_CURRENCY = "53"
ID_TRANSACTION_AMOUNT = "54"
ID_COUNTRY_CODE = "58"
ID_MERCHANT_NAME = "59"
ID_MERCHANT_CITY = "60"
ID_ADDITIONAL_DATA_FIELD = "62"
ID_CRC16 = "63"

# Sub-fields of field 26 (Merchant Account Information - Pix)
ID_GUI = "00"
ID_PIX_KEY = "01"
ID_PIX_DESCRIPTION = "02"

# Sub-field of field 62 (Additional Data Field Template)
ID_TXID = "05"

GUI_PIX = "br.gov.bcb.pix"
CURRENCY_BRL = "986"
COUNTRY_BR = "BR"
DEFAULT_TXID = "***"  # means "no specific txid" per the Pix spec

MAX_MERCHANT_NAME_LEN = 25
MAX_MERCHANT_CITY_LEN = 15
MAX_GUI_DESCRIPTION_LEN = 99  # generous EMV sub-field cap; Pix itself doesn't fix an exact limit here


class PixPayloadError(ValueError):
    """Raised when the input data cannot produce a valid Pix payload."""


# --------------------------------------------------------------------------
# TLV helpers
# --------------------------------------------------------------------------
def tlv(field_id: str, value: str) -> str:
    """
    Build a single EMV TLV (Tag-Length-Value) chunk.

    field_id must be exactly 2 digits. The length is the value's length in
    bytes (after encoding) -- for ASCII-only Pix payloads, len(value) is
    correct since each char is one byte.
    """
    if len(field_id) != 2 or not field_id.isdigit():
        raise PixPayloadError(f"Invalid field id: {field_id!r} (must be 2 digits)")

    encoded_len = len(value.encode("ascii"))
    if encoded_len > 99:
        raise PixPayloadError(
            f"Value for field {field_id} is {encoded_len} bytes, exceeds 99-byte TLV limit: {value!r}"
        )

    return f"{field_id}{encoded_len:02d}{value}"


def crc16_ccitt_false(payload: str) -> str:
    """
    CRC16/CCITT-FALSE checksum required by the EMV QR Code spec for field 63.
    Polynomial 0x1021, initial value 0xFFFF, no final XOR.
    Returns 4 uppercase hex digits.
    """
    crc = 0xFFFF
    for ch in payload:
        crc ^= (ord(ch) << 8) & 0xFFFF
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return f"{crc:04X}"


# --------------------------------------------------------------------------
# Text sanitization
# --------------------------------------------------------------------------
def to_ascii_upper(text: str) -> str:
    """
    Pix merchant name/city must be plain ASCII. Strip accents
    (e.g. "São Paulo" -> "SAO PAULO") and uppercase the result.
    """
    normalized = unicodedata.normalize("NFKD", text)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    # Collapse any leftover non-alphanumeric noise from stripped characters,
    # but keep spaces, since merchant name/city are free text.
    ascii_only = re.sub(r"[^A-Za-z0-9 ]", "", ascii_only)
    return ascii_only.upper().strip()


def sanitize_description(text: str) -> str:
    """
    Sanitize an optional free-text description (field 26/02). Pix allows a
    broader character set here than name/city in practice, but we keep it
    ASCII-safe to avoid edge cases with different banks' QR readers.
    """
    normalized = unicodedata.normalize("NFKD", text)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_only.strip()


def format_amount(amount: float) -> str:
    """Format a price as a Pix-compliant decimal string, e.g. 250 -> '250.00'."""
    if amount <= 0:
        raise PixPayloadError(f"Transaction amount must be positive, got {amount!r}")
    return f"{amount:.2f}"


# --------------------------------------------------------------------------
# Payload assembly
# --------------------------------------------------------------------------
def build_merchant_account_info(pix_key: str, description: str | None) -> str:
    sub_fields = tlv(ID_GUI, GUI_PIX) + tlv(ID_PIX_KEY, pix_key)
    if description:
        clean_description = sanitize_description(description)
        if clean_description:
            sub_fields += tlv(ID_PIX_DESCRIPTION, clean_description[:MAX_GUI_DESCRIPTION_LEN])
    return tlv(ID_MERCHANT_ACCOUNT_INFO, sub_fields)


def build_additional_data_field(txid: str) -> str:
    sub_fields = tlv(ID_TXID, txid)
    return tlv(ID_ADDITIONAL_DATA_FIELD, sub_fields)


def generate_pix_payload(
    *,
    pix_key: str,
    merchant_name: str,
    merchant_city: str,
    amount: float,
    description: str | None = None,
    txid: str = DEFAULT_TXID,
) -> str:
    """
    Build a complete, CRC-validated static Pix BR Code payload string.
    """
    if not pix_key or not pix_key.strip():
        raise PixPayloadError("pix_key must not be empty")

    clean_name = to_ascii_upper(merchant_name)[:MAX_MERCHANT_NAME_LEN]
    clean_city = to_ascii_upper(merchant_city)[:MAX_MERCHANT_CITY_LEN]

    if not clean_name:
        raise PixPayloadError(f"merchant_name resolved to empty string after sanitization: {merchant_name!r}")
    if not clean_city:
        raise PixPayloadError(f"merchant_city resolved to empty string after sanitization: {merchant_city!r}")

    # omit the amount field if zero, user will be able to input any value on its bank app when reading the qr code
    if amount == 0.00:
        body = (
            tlv(ID_PAYLOAD_FORMAT_INDICATOR, "01")
            + build_merchant_account_info(pix_key.strip(), description)
            + tlv(ID_MERCHANT_CATEGORY_CODE, "0000")
            + tlv(ID_TRANSACTION_CURRENCY, CURRENCY_BRL)
            + tlv(ID_COUNTRY_CODE, COUNTRY_BR)
            + tlv(ID_MERCHANT_NAME, clean_name)
            + tlv(ID_MERCHANT_CITY, clean_city)
            + build_additional_data_field(txid)
        )

    else:
        body = (
            tlv(ID_PAYLOAD_FORMAT_INDICATOR, "01")
            + build_merchant_account_info(pix_key.strip(), description)
            + tlv(ID_MERCHANT_CATEGORY_CODE, "0000")
            + tlv(ID_TRANSACTION_CURRENCY, CURRENCY_BRL)
            + tlv(ID_TRANSACTION_AMOUNT, format_amount(amount))
            + tlv(ID_COUNTRY_CODE, COUNTRY_BR)
            + tlv(ID_MERCHANT_NAME, clean_name)
            + tlv(ID_MERCHANT_CITY, clean_city)
            + build_additional_data_field(txid)
        )

    # The CRC is computed over the payload including the "6304" tag+length
    # prefix of the CRC field itself, but not its value.
    payload_for_crc = body + ID_CRC16 + "04"
    checksum = crc16_ccitt_false(payload_for_crc)

    return payload_for_crc + checksum


# --------------------------------------------------------------------------
# I/O orchestration
# --------------------------------------------------------------------------
def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Required input file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_config(config: dict) -> dict:
    required_keys = ["pix_key", "merchant_name", "merchant_city"]
    missing = [k for k in required_keys if not config.get(k)]
    if missing:
        raise PixPayloadError(f"config.json is missing required field(s): {', '.join(missing)}")
    return config


def process_gift(gift: dict, config: dict, index: int) -> dict:
    if "price" not in gift:
        f"Price undefined, will be removed from pix payload (setting as zero)"
        gift["price"] = 0.00

    try:
        price = float(gift["price"])
    except (TypeError, ValueError) as exc:
        raise PixPayloadError(f"Gift entry #{index} has a non-numeric price: {gift['price']!r}") from exc

    description = gift.get("name")  # shows up in some banking apps' confirmation screen
    txid = gift.get("txid", DEFAULT_TXID)

    payload = generate_pix_payload(
        pix_key=config["pix_key"],
        merchant_name=config["merchant_name"],
        merchant_city=config["merchant_city"],
        amount=price,
        description=description,
        txid=txid,
    )

    enriched = {"id": index, **dict(gift)}
    if price == 0.00: del enriched["price"]
    enriched["pixPayload"] = payload
    return enriched


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path("public/assets"),
        help="Base directory containing gifts_source.json (default: public/assets)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the resulting gifts.json content to stdout instead of writing the file",
    )
    args = parser.parse_args()

    base_dir: Path = args.base_dir
    config_path = Path(__file__).parent.resolve() / "config.json"
    source_path = base_dir / "gifts_source.json"
    output_path = base_dir / "gifts.json"
    print("\n🚀 [PYTHON] generate_pix_payloads script has started running...")

    try:
        config = validate_config(load_json(config_path))
        gifts_source = load_json(source_path)

        if not isinstance(gifts_source, list):
            raise PixPayloadError(f"{source_path} must contain a JSON array of gift objects")

        enriched_gifts = []
        for index, gift in enumerate(gifts_source):
            enriched_gifts.append(process_gift(gift, config, index))

    except (FileNotFoundError, PixPayloadError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    output_text = json.dumps(enriched_gifts, indent=2, ensure_ascii=False)

    if args.dry_run:
        print(output_text)
    else:
        output_path.write_text(output_text + "\n", encoding="utf-8")
        print(f"Wrote {len(enriched_gifts)} gift(s) with Pix payloads to {output_path}")

    print("✅ [PYTHON] generate_pix_payloads completed successfully!\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
