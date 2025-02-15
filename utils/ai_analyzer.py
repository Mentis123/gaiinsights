import os
from openai import OpenAI
import json
from typing import Dict, Any, Optional, List
import re

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def split_into_chunks(content: str, max_chunk_size: int = 100000) -> List[str]:
    """Split content into larger chunks based on paragraphs and sentences."""
    # Clean and normalize content
    content = re.sub(r'\s+', ' ', content.strip())

    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)

    chunks = []
    current_chunk = []
    current_size = 0

    # Using a more accurate token estimation: 1 token ≈ 3 characters
    char_per_token = 3

    for sentence in sentences:
        sentence_size = len(sentence) // char_per_token

        if sentence_size > max_chunk_size:
            # Split very long sentences
            words = sentence.split()
            temp_chunk = []
            temp_size = 0

            for word in words:
                word_size = len(word) // char_per_token
                if temp_size + word_size > max_chunk_size:
                    chunks.append(' '.join(temp_chunk))
                    temp_chunk = [word]
                    temp_size = word_size
                else:
                    temp_chunk.append(word)
                    temp_size += word_size

            if temp_chunk:
                chunks.append(' '.join(temp_chunk))
        elif current_size + sentence_size > max_chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]
            current_size = sentence_size
        else:
            current_chunk.append(sentence)
            current_size += sentence_size

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks

def _process_chunk(chunk: str) -> Optional[Dict[str, Any]]:
    """Process a single chunk of content with increased token limit."""
    try:
        prompt = (
            "Analyze this text section for AI/artificial intelligence relevance and respond with ONLY valid JSON. " +
            "Consider business applications, implementations, and strategic uses of AI. Be inclusive of AI-related content:\n\n" + 
            chunk + "\n\n" +
            "Required format: {\"summary\": \"Brief summary highlighting AI aspects\", \"key_points\": [\"Main AI-related points\"], \"ai_relevance\": \"AI relevance and implementation details\"}"
        )

        response = client.chat.completions.create(
            model="o3-mini",
            messages=[
                {"role": "system", "content": "You must respond with valid JSON only. No other text."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=2000,  # Increased for larger summaries
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content.strip()
        return json.loads(content)

    except Exception as e:
        print(f"Error processing chunk: {str(e)}")
        return None

def _combine_summaries(summaries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Combine chunk summaries with increased token limits."""
    if not summaries:
        return None

    if len(summaries) == 1:
        return summaries[0]

    try:
        # Create a more comprehensive combined text
        combined_text = " ".join(s["summary"] for s in summaries if s and "summary" in s)
        key_points = list({point for s in summaries if s and "key_points" in s for point in s["key_points"]})[:10]  # Increased from 5
        relevance = "; ".join(set(s.get("ai_relevance", "") for s in summaries if s))[:2000]  # Increased from 500

        prompt = (
            "Combine these summaries into a single JSON with this exact format:\n"
            '{"summary": "comprehensive combined summary", "key_points": ["point1", "point2"], "ai_relevance": "relevance"}\n\n'
            f"Text: {combined_text[:50000]}\nPoints: {', '.join(key_points)}\nAI Relevance: {relevance}"  # Increased text limit
        )

        response = client.chat.completions.create(
            model="o3-mini",
            messages=[
                {"role": "system", "content": "You must respond with valid JSON only. No other text."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=2000,  # Increased for larger summaries
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content.strip()
        return json.loads(content)

    except Exception as e:
        print(f"Error combining summaries: {str(e)}")
        # Fallback to simple combination with increased limits
        return {
            "summary": combined_text[:5000] if 'combined_text' in locals() else "Error processing content",  # Increased from 1000
            "key_points": key_points[:10] if 'key_points' in locals() else ["Error processing points"],  # Increased from 5
            "ai_relevance": relevance[:1000] if 'relevance' in locals() else "Unknown AI relevance"  # Increased from 300
        }

def summarize_article(content: str) -> Optional[Dict[str, Any]]:
    """Summarize an article using GPT-4O-mini with larger chunks."""
    try:
        # Clean content before chunking
        content = re.sub(r'\s+', ' ', content.strip())
        chunks = split_into_chunks(content)

        if not chunks:
            return None

        # Process chunks with improved logging
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            chunk_tokens = len(chunk) // 3  # Updated token estimation ratio
            print(f"Processing chunk {i+1}/{len(chunks)} (~{chunk_tokens} tokens)")

            if chunk_tokens > 120000:  # Safety margin below 128k limit
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