import os
from openai import OpenAI
import json
from typing import Dict, Any, Optional

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def summarize_article(content: str) -> Optional[Dict[str, Any]]:
    """Summarize an article using OpenAI's GPT-4."""
    try:
        prompt = f"""
        Analyze the following article content and provide a comprehensive analysis using this exact format:

        {{
            "summary": "A concise summary of the article",
            "key_points": ["List of main points"],
            "ai_relevance": "Description of how this relates to AI"
        }}

        Article Content: {content}
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful AI that provides analysis in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        # Ensure we have a valid JSON response
        try:
            analysis = json.loads(response.choices[0].message.content)
            # Validate the required fields
            required_fields = ["summary", "key_points", "ai_relevance"]
            if all(field in analysis for field in required_fields):
                return analysis
            else:
                print("Missing required fields in OpenAI response")
                return None
        except json.JSONDecodeError as e:
            print(f"Error parsing OpenAI response: {e}")
            return None

    except Exception as e:
        print(f"Error summarizing article: {e}")
        return None