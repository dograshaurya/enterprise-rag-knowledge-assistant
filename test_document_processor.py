from app.ingestion.document_processor import document_processor


def main():
    sample_text = (
        "Retrieval-Augmented Generation combines document retrieval "
        "with language models to answer questions using relevant context. "
    ) * 30

    chunks = document_processor.split_text(
        sample_text,
        chunk_size=300,
        overlap=50,
    )

    print("Chunks generated:", len(chunks))
    print("First chunk length:", len(chunks[0]))
    print("First chunk preview:", chunks[0][:100])


if __name__ == "__main__":
    main()