# Repository Agent Instructions

## graphify

This repository has a generated knowledge graph in `graphify-out/`.

- Before answering questions about architecture, code relationships, call paths, or project structure, query the existing graph with `graphify query "<question>"`.
- Use `graphify path "<source>" "<target>"` to trace connections between concepts.
- Use `graphify explain "<node>"` for a focused explanation of a graph node.
- After changing code, refresh the graph with `graphify . --update`.
- After changing documentation or images, also run `graphify . --update` so semantic content is re-extracted.
- Rebuild with `graphify .` only when a full extraction is explicitly needed.
- Treat `graphify-out/graph.json` as generated output; do not edit it manually.
- Cite source locations returned by graph queries when making codebase-specific claims.
