import os
from openai import OpenAI
import json
from typing import Dict, Any, Optional, List
import re

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def split_into_chunks(content: str, max_chunk_size: int = 2000) -> List[str]:
    """Split content into smaller chunks based on paragraphs."""
    # Split by double newlines to preserve paragraph structure
    paragraphs = re.split(r'\n\s*\n', content)

    # Pre-process paragraphs to remove extra whitespace and long strings
    paragraphs = [re.sub(r'\s+', ' ', p.strip()) for p in paragraphs if p.strip()]

    chunks = []
    current_chunk = []
    current_size = 0

    for paragraph in paragraphs:
        # Rough estimate: 1 token ≈ 4 characters
        paragraph_size = len(paragraph) // 4

        if current_size + paragraph_size > max_chunk_size:
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
            current_chunk = [paragraph]
            current_size = paragraph_size
        else:
            current_chunk.append(paragraph)
            current_size += paragraph_size

    if current_chunk:  # Add the last chunk
        chunks.append('\n\n'.join(current_chunk))

    return chunks

def _process_chunk(chunk: str) -> Optional[Dict[str, Any]]:
    """Process a single chunk of content."""
    try:
        # Keep prompt minimal and avoid f-string with JSON
        prompt = (
            "Analyze this text section: " + chunk + "\n\n"
            'Output JSON format only: {"summary": "Brief summary", "key_points": ["Main points"], "ai_relevance": "AI relevance"}'
        )

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500  # Further reduced for safety
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"Error processing chunk: {str(e)}")
        return None

def _combine_summaries(summaries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Combine chunk summaries with a more efficient prompt."""
    if not summaries:
        return None

    if len(summaries) == 1:
        return summaries[0]

    try:
        # Create a more compact combined text
        combined_text = " ".join(s["summary"] for s in summaries if s and "summary" in s)
        key_points = list({point for s in summaries if s and "key_points" in s for point in s["key_points"]})[:5]
        relevance = "; ".join(set(s.get("ai_relevance", "") for s in summaries if s))[:500]

        prompt = f"Combine these summaries into one JSON: {combined_text[:1500]}\nPoints: {', '.join(key_points)}\nAI Relevance: {relevance}"

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"Error combining summaries: {str(e)}")
        # Fallback to simple combination
        return {
            "summary": combined_text[:1000] if 'combined_text' in locals() else "Error processing content",
            "key_points": key_points[:5] if 'key_points' in locals() else ["Error processing points"],
            "ai_relevance": relevance[:300] if 'relevance' in locals() else "Unknown AI relevance"
        }

def summarize_article(content: str) -> Optional[Dict[str, Any]]:
    """Summarize an article using OpenAI's GPT-4 with improved chunking."""
    try:
        # Clean content before chunking
        content = re.sub(r'\s+', ' ', content.strip())
        chunks = split_into_chunks(content)

        if not chunks:
            return None

        # Process chunks with improved logging
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            chunk_tokens = len(chunk) // 4
            print(f"Processing chunk {i+1}/{len(chunks)} (~{chunk_tokens} tokens)")

            if chunk_tokens > 2500:  # Skip chunks that are still too large
                print(f"Chunk {i+1} too large ({chunk_tokens} tokens), skipping")
                continue

            summary = _process_chunk(chunk)
            if summary:
                chunk_summaries.append(summary)

        if not chunk_summaries:
            return {"summary": "Content too large to process", "key_points": [], "ai_relevance": "Unknown"}

        return _combine_summaries(chunk_summaries)

    except Exception as e:
        print(f"Error summarizing article: {str(e)}")
        return None