import pymupdf

content = """
Enterprise RAG Knowledge Assistant

Retrieval-Augmented Generation (RAG) combines document retrieval
with a language model to answer questions using relevant context.

Our system stores document chunks and their 768-dimensional
embeddings in PostgreSQL with the pgvector extension.

Ollama runs the language model and embedding model locally,
without requiring a paid external API.
"""

doc = pymupdf.open()
page = doc.new_page()
page.insert_textbox(
    pymupdf.Rect(50, 50, 550, 750),
    content,
    fontsize=12,
)
doc.save("sample_knowledge.pdf")
doc.close()

print("Test PDF created: sample_knowledge.pdf")