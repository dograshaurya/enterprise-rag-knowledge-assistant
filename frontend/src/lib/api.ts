
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface DocumentItem {
  id: number;
  filename: string;
  content_type: string | null;
  created_at: string;
}

export interface AnswerSource {
  document_id: number;
  chunk_id: number;
  filename: string;
  similarity: number;
  content: string;
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: AnswerSource[];
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const response = await fetch(`${API_URL}/api/documents/`);

  if (!response.ok) {
    throw new Error("Failed to load documents.");
  }

  return response.json();
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Document upload failed.");
  }

  return data;
}

export async function deleteDocument(documentId: number) {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: "DELETE",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || "Document deletion failed.");
  }

  return data;
}

export async function askQuestion(
  question: string
): Promise<AskResponse> {
  const response = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      top_k: 3,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail
        ? typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail)
        : "Failed to get an answer from the AI assistant."
    );
  }

  return data as AskResponse;
}