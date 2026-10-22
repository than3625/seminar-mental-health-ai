from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
import pymupdf4llm
import requests
import trafilatura
from bs4 import BeautifulSoup

ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT_DIR / "raw_documents"
PROCESSED_DIR = ROOT_DIR / "processed_documents"

METADATA_PATH = RAW_DIR / "metadata.csv"
CLEANING_REPORT_PATH = PROCESSED_DIR / "cleaning_report.csv"

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    )
}

FOREIGN_CONTACT_REPLACEMENT = (
    "If you are in immediate distress or are thinking about hurting "
    "yourself, seek immediate support from a trusted person and "
    "appropriate local emergency or mental-health services."
)

FOREIGN_CONTACT_PATTERNS = [
    r"If you are in immediate distress.*?988lifeline\.org\.",
    r"call or text the 988 Suicide & Crisis Lifeline.*?988lifeline\.org\.",
    r"call or text the 988 Suicide & Crisis Lifeline at 988",
    r"chat at 988lifeline\.org",
    r"\b988 Suicide & Crisis Lifeline\b",
    r"\b988lifeline\.org\b",
    r"\b988\b",
    r"\b911\b",
]

NOISE_LINE_PATTERNS = [
    r"^page \d+",
    r"^\d+$",
    r"^nih publication no\.",
    r"^follow nimh on social media",
    r"^from the national institute of mental health$",
    r"^more resources$",
    r"^download$",
    r"^share$",
    r"^© world health organization",
    r"^creative commons",
    r"^isbn",
    r"^psychological first aid: guide for field workers",
]


@dataclass(frozen=True)
class DocumentMeta:
    source_id: str
    file_name: str
    title: str
    publisher: str
    url: str
    language: str
    doc_type: str
    topic: str
    recommendation_level: str
    accessed_at: str


@dataclass(frozen=True)
class CleanedDocument:
    source_id: str
    text: str
    page_count: int | None
    char_count: int
    contains_foreign_contacts: bool


def load_metadata() -> list[DocumentMeta]:
    if not METADATA_PATH.exists():
        raise FileNotFoundError(f"Metadata file not found: {METADATA_PATH}")

    frame = pd.read_csv(METADATA_PATH, keep_default_na=False)

    required_columns = {
        "source_id",
        "file_name",
        "title",
        "publisher",
        "url",
        "language",
        "doc_type",
        "topic",
        "recommendation_level",
        "accessed_at",
    }

    missing_columns = required_columns - set(frame.columns)
    if missing_columns:
        raise ValueError(
            f"Missing metadata columns: {sorted(missing_columns)}"
        )

    documents: list[DocumentMeta] = []

    for row in frame.to_dict(orient="records"):
        documents.append(
            DocumentMeta(
                source_id=str(row["source_id"]).strip(),
                file_name=str(row["file_name"]).strip(),
                title=str(row["title"]).strip(),
                publisher=str(row["publisher"]).strip(),
                url=str(row["url"]).strip(),
                language=str(row["language"]).strip(),
                doc_type=str(row["doc_type"]).strip(),
                topic=str(row["topic"]).strip(),
                recommendation_level=str(row["recommendation_level"]).strip(),
                accessed_at=str(row["accessed_at"]).strip(),
            )
        )

    return documents


def is_noise_line(line: str) -> bool:
    lowered = line.strip().lower()
    return any(
        re.search(pattern, lowered)
        for pattern in NOISE_LINE_PATTERNS
    )


def clean_markdown_text(text: str) -> str:
    """
    Làm sạch văn bản Markdown:
    - Vá lỗi ngắt dòng gãy từ (soft-hyphen / dash-newline)
    - Loại bỏ các dòng rác (headers/footers lặp lại)
    - Chuẩn hóa khoảng trắng nhưng giữ trật tự bảng & tiêu đề Markdown
    """
    text = text.replace("\u00ad", "").replace("\ufeff", "").replace("\u200b", "")

    # Nối từ gãy dòng: psy-\nchological -> psychological
    text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)

    lines = text.splitlines()
    cleaned_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            cleaned_lines.append("")
            continue

        # Bỏ qua các dòng số trang hoặc dòng rác bản quyền
        if is_noise_line(stripped):
            continue

        cleaned_lines.append(stripped)

    text = "\n".join(cleaned_lines)

    # Rút gọn khoảng trống dư thừa (tối đa 2 lần xuống dòng liên tiếp)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def contains_foreign_contacts(text: str) -> bool:
    lowered = text.lower()
    return any(
        re.search(pattern, lowered)
        for pattern in FOREIGN_CONTACT_PATTERNS
    )


def remove_foreign_contacts(text: str) -> str:
    for pattern in FOREIGN_CONTACT_PATTERNS:
        text = re.sub(
            pattern,
            FOREIGN_CONTACT_REPLACEMENT,
            text,
            flags=re.IGNORECASE | re.DOTALL,
        )
    return text


def extract_pdf_with_pymupdf4llm(pdf_path: Path) -> tuple[str, int]:
    """
    Sử dụng pymupdf4llm để chuyển PDF sang Markdown:
    - Tự động nhận diện layout đa cột (đọc xong cột trái rồi mới sang cột phải)
    - Tự động dựng bảng và giữ cấu trúc tiêu đề (#, ##, bullet points)
    """
    # 1. Trích xuất sang Markdown bằng layout engine của pymupdf4llm
    # write_images=False để không trích xuất và lưu ảnh rác vào ổ đĩa
    md_content = pymupdf4llm.to_markdown(str(pdf_path), write_images=False)

    # Đếm số trang thực tế của tài liệu
    import fitz
    with fitz.open(pdf_path) as doc:
        page_count = len(doc)

    # 2. Làm sạch nhiễu và thay thế số khẩn cấp nước ngoài
    cleaned_md = clean_markdown_text(md_content)
    final_text = remove_foreign_contacts(cleaned_md)

    return final_text, page_count


def fetch_html(url: str) -> str:
    response = requests.get(url, headers=REQUEST_HEADERS, timeout=30)
    response.raise_for_status()
    return response.text


def extract_main_text_from_html(html: str, url: str | None) -> str:
    extracted = trafilatura.extract(
        html,
        url=url,
        output_format="txt",
        include_comments=False,
        include_tables=False,
        favor_precision=True,
    )

    if extracted:
        text = clean_markdown_text(extracted)
    else:
        soup = BeautifulSoup(html, "html.parser")

        unwanted_selectors = [
            "script",
            "style",
            "noscript",
            "nav",
            "header",
            "footer",
            "aside",
            "iframe",
            "form",
            "[role='navigation']",
            ".social-share",
            ".related-links",
            ".newsletter-signup",
            ".cookie-banner",
        ]

        for selector in unwanted_selectors:
            for node in soup.select(selector):
                node.decompose()

        main_node = (
                soup.select_one("main")
                or soup.select_one("article")
                or soup.select_one("[role='main']")
                or soup.body
        )

        text = (
            main_node.get_text(separator="\n", strip=True)
            if main_node
            else ""
        )

        text = clean_markdown_text(text)

    return remove_foreign_contacts(text)


def clean_document(document: DocumentMeta) -> CleanedDocument:
    source_path = RAW_DIR / document.file_name

    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    suffix = source_path.suffix.lower()

    if suffix == ".pdf":
        text, page_count = extract_pdf_with_pymupdf4llm(source_path)
    elif suffix in {".html", ".htm"}:
        html = source_path.read_text(encoding="utf-8")
        text = extract_main_text_from_html(
            html,
            url=document.url or None,
        )
        page_count = None
    else:
        raise ValueError(
            f"Unsupported source file type: {source_path.suffix}"
        )

    foreign_contacts = contains_foreign_contacts(text)

    return CleanedDocument(
        source_id=document.source_id,
        text=text,
        page_count=page_count,
        char_count=len(text),
        contains_foreign_contacts=foreign_contacts,
    )


def write_cleaned_document(
        document: DocumentMeta,
        cleaned: CleanedDocument,
) -> Path:
    source_path = RAW_DIR / document.file_name
    # Lưu dạng .md (hoặc .txt) - Markdown rất tương thích cho các RecursiveTextSplitter sau này
    output_path = PROCESSED_DIR / source_path.with_suffix(".txt").name

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(cleaned.text, encoding="utf-8")

    return output_path


def write_cleaning_report(
        records: list[dict[str, object]],
) -> None:
    with CLEANING_REPORT_PATH.open(
            "w",
            encoding="utf-8",
            newline="",
    ) as file:
        fieldnames = [
            "source_id",
            "file_name",
            "status",
            "page_count",
            "char_count",
            "contains_foreign_contacts",
            "output_file",
        ]

        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def main() -> None:
    documents = load_metadata()

    if not documents:
        raise RuntimeError("No documents found in metadata.csv.")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    report_records: list[dict[str, object]] = []

    for document in documents:
        try:
            cleaned = clean_document(document)
            output_path = write_cleaned_document(document, cleaned)

            report_records.append(
                {
                    "source_id": document.source_id,
                    "file_name": document.file_name,
                    "status": "success",
                    "page_count": cleaned.page_count,
                    "char_count": cleaned.char_count,
                    "contains_foreign_contacts": cleaned.contains_foreign_contacts,
                    "output_file": str(output_path),
                }
            )

            print(
                f"[OK] {document.source_id}: "
                f"{cleaned.char_count} characters"
            )

        except Exception as error:
            report_records.append(
                {
                    "source_id": document.source_id,
                    "file_name": document.file_name,
                    "status": f"failed: {error}",
                    "page_count": None,
                    "char_count": 0,
                    "contains_foreign_contacts": False,
                    "output_file": "",
                }
            )

            print(f"[FAILED] {document.source_id}: {error}")

    write_cleaning_report(report_records)
    print(f"\nCleaning report written to: {CLEANING_REPORT_PATH}")


if __name__ == "__main__":
    main()