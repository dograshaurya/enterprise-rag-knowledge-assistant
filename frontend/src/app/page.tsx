"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  askQuestion,
  deleteDocument,
  getDocuments,
  uploadDocument,
  type AnswerSource,
  type DocumentItem,
} from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AnswerSource[];
}

const suggestedQuestions = [
  {
    title: "Summarize a document",
    question: "Summarize the key information in my documents.",
  },
  {
    title: "Find technical details",
    question: "How does this system store document embeddings?",
  },
  {
    title: "Search the knowledge base",
    question: "What information is available in my documents?",
  },
  {
    title: "Check a specific fact",
    question: "Which technologies are used by this system?",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "documents">("chat");

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setDocuments(await getDocuments());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load documents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "documents") {
      void loadDocuments();
    }
  }, [activeTab, loadDocuments]);

  useEffect(() => {
    const handleSuggestedQuestion = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (typeof customEvent.detail === "string") {
        setQuestion(customEvent.detail);
      }
    };

    window.addEventListener("suggest-question", handleSuggestedQuestion);

    return () => {
      window.removeEventListener(
        "suggest-question",
        handleSuggestedQuestion
      );
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  async function handleAsk(
    event?: React.FormEvent<HTMLFormElement>,
    overrideQuestion?: string
  ) {
    event?.preventDefault();

    const text = (overrideQuestion ?? question).trim();

    if (!text || asking) return;

    setError("");
    setQuestion("");
    setAsking(true);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const result = await askQuestion(text);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        sources: result.sources ?? [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not get an answer. Please try again."
      );
    } finally {
      setAsking(false);
    }
  }

  function handleFileChange(file: File | undefined) {
    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The PDF must be 10 MB or smaller.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await uploadDocument(selectedFile);

      setSuccess(`"${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(document: DocumentItem) {
    if (deletingId !== null) return;

    if (!window.confirm(`Delete "${document.filename}" and its chunks?`)) {
      return;
    }

    setDeletingId(document.id);
    setError("");
    setSuccess("");

    try {
      await deleteDocument(document.id);
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id)
      );
      setSuccess(`"${document.filename}" was deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document deletion failed.");
      await loadDocuments();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900/70 p-6 md:flex md:flex-col">
          <div className="mb-10">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold">
              K
            </div>
            <h1 className="text-lg font-semibold">Knowledge AI</h1>
            <p className="mt-1 text-xs text-slate-400">
              Enterprise Knowledge Assistant
            </p>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <button
            onClick={() => setActiveTab("chat")}
            className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
              activeTab === "chat"
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>✳</span> AI Assistant
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
              activeTab === "documents"
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>▤</span> Knowledge Base
          </button>

          <div className="mt-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium">Local AI stack</span>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              FastAPI · Ollama · PostgreSQL
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-800 px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs text-slate-400">
                WORKSPACE / KNOWLEDGE AI
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {activeTab === "chat" ? "AI Assistant" : "Knowledge Base"}
              </h2>
            </div>
            <div className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
              Local environment
            </div>
          </header>

          <div className="mx-auto w-full max-w-5xl flex-1 p-5 sm:p-8">
            {activeTab === "chat" ? (
              <div className="flex min-h-[75vh] flex-col">
                {messages.length === 0 ? (
                  <>
                    <div className="mb-8">
                      <p className="mb-3 text-sm font-medium text-indigo-300">
                        YOUR PRIVATE KNOWLEDGE ASSISTANT
                      </p>
                      <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Ask your documents.
                        <br />
                        <span className="text-slate-400">
                          Get answers with context.
                        </span>
                      </h3>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                        Ask questions about your PDFs. The assistant retrieves
                        relevant passages and generates answers using your
                        document context.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {suggestedQuestions.map((item) => (
                        <button
                          key={item.title}
                          onClick={() => setQuestion(item.question)}
                          className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-indigo-500/60 hover:bg-slate-900"
                        >
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            {item.question}
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-sm font-medium">
                        Build your knowledge base
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Upload PDFs before asking questions about their
                        contents.
                      </p>
                      <button
                        onClick={() => setActiveTab("documents")}
                        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium transition hover:bg-indigo-500"
                      >
                        Manage documents →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mb-6 space-y-6">
                    {messages.map((message) => (
                      <div key={message.id}>
                        <div
                          className={`rounded-2xl p-4 sm:p-5 ${
                            message.role === "user"
                              ? "ml-6 bg-indigo-600/20 sm:ml-16"
                              : "mr-2 border border-slate-800 bg-slate-900/70 sm:mr-8"
                          }`}
                        >
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {message.role === "user" ? "You" : "Knowledge AI"}
                          </p>

                          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
                            {message.content}
                          </div>

                          {message.role === "assistant" &&
                            message.sources &&
                            message.sources.length > 0 && (
                              <div className="mt-5 border-t border-slate-700 pt-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                                  Retrieved sources
                                </p>

                                <div className="space-y-3">
                                  {message.sources.map((source) => (
                                    <div
                                      key={`${source.document_id}-${source.chunk_id}`}
                                      className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                                    >
                                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                                        <span>
                                          {source.filename} · Chunk #{source.chunk_id}
                                        </span>
                                        <span>
                                          Similarity:{" "}
                                          {(
                                            source.similarity * 100
                                          ).toFixed(1)}
                                          %
                                        </span>
                                      </div>
                                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                        {source.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}

                    {asking && (
                      <div className="mr-8 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <p className="text-sm font-medium text-indigo-300">
                          Knowledge AI is thinking...
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Retrieving relevant passages and generating an
                          answer with your local model.
                        </p>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                <form
                  onSubmit={(event) => void handleAsk(event)}
                  className="sticky bottom-0 mt-auto border border-slate-700 bg-slate-900 p-3 shadow-xl sm:rounded-2xl sm:p-4"
                >
                  <label htmlFor="chat-question" className="sr-only">
                    Ask a question about your documents
                  </label>
                  <textarea
                    id="chat-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        void handleAsk();
                      }
                    }}
                    placeholder="Ask a question about your documents..."
                    maxLength={4000}
                    rows={2}
                    disabled={asking}
                    className="w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-60"
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                    <span className="text-xs text-slate-500">
                      Enter to send · Shift+Enter for a new line
                    </span>
                    <button
                      type="submit"
                      disabled={!question.trim() || asking}
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {asking ? "Thinking..." : "Send ↑"}
                    </button>
                  </div>
                </form>

                <p className="mt-3 text-center text-xs text-slate-500">
                  Answers are generated locally and may need verification
                  against the cited source passages.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold">Knowledge Base</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Manage the documents that power your AI assistant.
                    </p>
                  </div>

                  <button
                    onClick={() => void loadDocuments()}
                    disabled={loading}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    role="status"
                    className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
                  >
                    {success}
                  </div>
                )}

                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl text-indigo-300">
                    ↑
                  </div>

                  <h4 className="font-medium">Upload your knowledge</h4>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                    Add PDF documents to make their content searchable by your
                    local AI assistant.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={uploading}
                    onChange={(event) =>
                      handleFileChange(event.target.files?.[0])
                    }
                    className="mx-auto mt-5 block w-full max-w-sm text-sm text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-600 disabled:opacity-50"
                  />

                  {selectedFile && (
                    <p className="mt-3 break-all text-sm text-indigo-300">
                      Selected: {selectedFile.name}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-slate-500">
                    PDF format · Maximum 10 MB
                  </p>

                  <button
                    onClick={() => void handleUpload()}
                    disabled={!selectedFile || uploading}
                    className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? "Uploading and processing..." : "Upload PDF"}
                  </button>

                  {uploading && (
                    <p className="mt-3 text-xs text-slate-400">
                      Extracting text and generating embeddings...
                    </p>
                  )}
                </div>

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
                    <div>
                      <h4 className="font-medium">Document library</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {documents.length}{" "}
                        {documents.length === 1 ? "document" : "documents"}{" "}
                        stored
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <p className="p-6 text-sm text-slate-400">
                      Loading documents...
                    </p>
                  ) : documents.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-300">
                        No documents found.
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Upload a PDF above to populate your knowledge base.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-wrap items-center justify-between gap-4 p-5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-semibold text-indigo-300">
                              PDF
                            </div>

                            <div className="min-w-0">
                              <p className="break-all text-sm font-medium text-slate-200">
                                {document.filename}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {document.content_type || "PDF document"}
                                {" · "}
                                {document.created_at
                                  ? new Date(
                                      document.created_at
                                    ).toLocaleString()
                                  : "Date unavailable"}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => void handleDelete(document)}
                            disabled={deletingId !== null || uploading}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === document.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}