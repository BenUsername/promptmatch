# PromptMatch

A neutral, opt-in prompt collector and page-to-prompt matching tool.

- Chrome extension: ChatGPT, Gemini, Claude
- Storage: MongoDB Atlas
- Server: Next.js on Vercel
- Matching: deterministic lexical coverage, no external LLM API
- Privacy: random collector key, delete-all endpoint, one-year TTL

The page-fit score is explicitly not presented as a citation probability.
