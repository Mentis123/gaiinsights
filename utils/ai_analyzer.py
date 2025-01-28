import os
from openai import OpenAI
import json
from typing import Dict, Any, Optional, List
import re

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def split_into_chunks(content: str, max_chunk_size: int = 6000) -> List[str]:
    """Split content into chunks based on paragraphs while respecting token limits."""
    # Split by double newlines to preserve paragraph structure
    paragraphs = re.split(r'\n\s*\n', content)

    chunks = []
    current_chunk = []
    current_size = 0

    for paragraph in paragraphs:
        # Rough estimate: 1 token ≈ 4 characters
        paragraph_size = len(paragraph) // 4

        if current_size + paragraph_size > max_chunk_size:
            if current_chunk:  # Save current chunk if it exists
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
        prompt = f"""
        Analyze the following article content and provide a comprehensive analysis using this exact format:

        {{
            "summary": "A concise summary of the article section",
            "key_points": ["List of main points from this section"],
            "ai_relevance": "Description of how this relates to AI"
        }}

        Article Content:
        {chunk}
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful AI that provides analysis in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"Error processing chunk: {str(e)}")
        return None

def _combine_summaries(summaries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Combine multiple chunk summaries into a single coherent summary."""
    if not summaries:
        return None

    if len(summaries) == 1:
        return summaries[0]

    # Combine all summaries and key points
    combined_text = "\n\n".join(s["summary"] for s in summaries if s)
    all_key_points = [point for s in summaries if s for point in s["key_points"]]
    ai_relevance_points = [s["ai_relevance"] for s in summaries if s]

    # Generate a final summary of the combined content
    try:
        final_prompt = f"""
        Combine these section summaries into a single coherent analysis in JSON format:

        Summaries: {combined_text}

        Key Points: {all_key_points}

        AI Relevance: {ai_relevance_points}

        Return in this format:
        {{
            "summary": "Single coherent summary of the entire article",
            "key_points": ["Most important points, deduplicated and consolidated"],
            "ai_relevance": "Overall AI relevance assessment"
        }}
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful AI that provides analysis in valid JSON format."},
                {"role": "user", "content": final_prompt}
            ],
            temperature=0.7
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"Error combining summaries: {str(e)}")
        # Fallback to simpler combination if GPT call fails
        return {
            "summary": combined_text[:1000],  # Limit length of concatenated summary
            "key_points": list(set(all_key_points))[:5],  # Deduplicate and limit key points
            "ai_relevance": " ".join(ai_relevance_points)
        }

def summarize_article(content: str) -> Optional[Dict[str, Any]]:
    """Summarize an article using OpenAI's GPT-4 with chunking for long content."""
    try:
        # Split content into manageable chunks
        chunks = split_into_chunks(content)

        if not chunks:
            return None

        # Process each chunk
        chunk_summaries = []
        for chunk in chunks:
            summary = _process_chunk(chunk)
            if summary:
                chunk_summaries.append(summary)

        # Combine results from all chunks
        return _combine_summaries(chunk_summaries)

    except Exception as e:
        print(f"Error summarizing article: {str(e)}")
        return None