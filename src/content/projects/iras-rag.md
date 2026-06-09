---
title: "iRAS-RAG"
description: "An intelligent Retrieval-Augmented Generation system for advisory services. Built a scalable API with document ingestion, embedding, and semantic search capabilities."
techStack:
  - ".NET 8"
  - "PostgreSQL"
  - "pgvector"
  - "Redis"
  - "Docker"
  - "OpenAI API"
githubUrl: "https://github.com/phnthnhnm/iras-rag"
featured: true
order: 1
---

Built a production-grade RAG (Retrieval-Augmented Generation) system that processes documents,
generates embeddings, and provides context-aware advisory responses. The system includes:

- **Document ingestion pipeline** with chunking and embedding generation
- **Semantic search** using pgvector for efficient vector similarity queries
- **Redis caching layer** for frequently accessed embeddings and responses
- **RESTful API** with clean architecture and comprehensive error handling
- **Docker Compose** setup for local development and testing
