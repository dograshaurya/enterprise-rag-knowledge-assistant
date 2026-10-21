
from pathlib import Path

import fitz


class DocumentProcessor:
    def extract_text(self, file_path: str) -> str:
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if path.suffix.lower() != ".pdf":
            raise ValueError("Only PDF files are supported currently.")

        pages: list[str] = []

        with fitz.open(path) as pdf:
            for page in pdf:
                text = page.get_text().strip()

                if text:
                    pages.append(text)

        extracted_text = "\n\n".join(pages)

        if not extracted_text.strip():
            raise ValueError(
                "No readable text found. Scanned PDFs may require OCR."
            )

        return extracted_text

    def split_text(
        self,
        text: str,
        chunk_size: int = 1000,
        overlap: int = 150,
    ) -> list[str]:
        if chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero.")

        if overlap < 0 or overlap >= chunk_size:
            raise ValueError("overlap must be >= 0 and less than chunk_size.")

        text = text.strip()

        if not text:
            return []

        chunks: list[str] = []
        start = 0

        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunk = text[start:end].strip()

            if chunk:
                chunks.append(chunk)

            if end == len(text):
                break

            start = end - overlap

        return chunks


document_processor = DocumentProcessor()
