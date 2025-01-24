import os
from openai import OpenAI
import json
from typing import Dict, Any

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def summarize_article(content: Dict[str, str]) -> Dict[str, Any]:
    """Summarize an article using OpenAI's GPT-4."""
    try:
        prompt = f"""
        Title: {content['title']}
        Content: {content['text']}
        
        Please provide a comprehensive analysis in JSON format with the following structure:
        {{
            "summary": "A concise summary of the article",
            "key_points": ["List of main points"],
            "ai_relevance": "Description of how this relates to AI",
            "impact_score": "Number 1-10 indicating significance to AI field"
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(response.choices[0].message.content)
        return {
            **analysis,
            "original_title": content['title'],
            "original_url": content['url'],
            "date": content['date']
        }
    except Exception as e:
        print(f"Error summarizing article: {e}")
        return None
