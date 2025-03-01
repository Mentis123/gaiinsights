import os
import json
import logging
import random
from datetime import datetime
from typing import Dict, Any, Optional, List
from openai import OpenAI

logger = logging.getLogger(__name__)

def summarize_article(content):
    """Summarize article content and extract key information with enhanced executive focus"""
    if not content or len(content) < 100:
        logger.warning("Content too short for summarization")
        return None

    try:
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        # Clean content - remove extra whitespace and normalize
        content = ' '.join(content.split())

        # Truncate content if too long to avoid token limits
        max_content_length = 15000
        if len(content) > max_content_length:
            content = content[:max_content_length] + "..."

        system_prompt = """
        You are an enterprise AI intelligence analyst providing tailored, high-value insights for C-suite executives.

        CRITICAL REQUIREMENTS:
        1. Generate UNIQUE insights for each article - avoid repetitive language or themes
        2. Focus on specific business outcomes relevant to the article's context
        3. The ai_business_value must be ONE actionable insight that:
           - Maps directly to executive priorities (revenue, market share, innovation, risk)
           - Provides a specific, measurable business outcome
           - Varies based on industry context and technology maturity
           - Uses diverse, executive-appropriate language
           - NEVER starts with generic phrases like "Adopt", "Leverage", "Implement"

        FORMAT EXAMPLES:
        ✓ "Real-time AI analytics could reduce supply chain disruptions by 35% while increasing inventory accuracy to 99.9%"
        ✓ "Integration of this computer vision technology could cut quality control costs by 40% and reduce defect rates to under 0.1%"
        ✓ "Deploying similar NLP capabilities across customer service could increase resolution rates by 45% while reducing response times by 60%"

        AVOID:
        × Generic recommendations about "improving efficiency"
        × Repetitive language about "competitive advantage"
        × Technical implementation details
        × Starting every insight with the same words
        """

        user_prompt = f"""
        Analyze this article from a C-suite executive's perspective, focusing on concrete business value:

        {content}

        Generate a JSON response with:
        1. summary: A concise executive summary (25-40 words)
        2. key_points: 2-3 key strategic takeaways
        3. ai_business_value: ONE specific insight about measurable business impact (15-25 words)

        The ai_business_value must be unique to this article and focus on quantifiable outcomes.
        """

        response = client.chat.completions.create(
            model="o3-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        # Add variety to business value statements
        if result and 'ai_business_value' in result:
            value = result['ai_business_value']

            # Remove common generic starts
            common_starts = ["Adopt", "Leverage", "Implement", "Consider", "Use"]
            for start in common_starts:
                if value.lower().startswith(start.lower()):
                    value = value[len(start):].strip()
                    # Add varied business-focused starter phrases
                    starters = [
                        f"This {value}",
                        f"Strategic implementation of {value}",
                        f"Organizations utilizing {value}",
                        f"Enterprise deployment of {value}",
                        f"Integration of {value}"
                    ]
                    value = random.choice(starters)

            result['ai_business_value'] = value

        return result

    except Exception as e:
        logger.error(f"Error in article summarization: {str(e)}")
        return {
            'summary': "Error processing content",
            'key_points': ["Article contains AI-related content"],
            'ai_business_value': "This AI development warrants evaluation for potential business value and competitive advantages"
        }

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

def analyze_sentiment_trends(articles):
    """Analyze sentiment trends across multiple articles"""
    if not articles:
        return None

    try:
        # Extract sentiment scores
        sentiment_scores = [a.get('sentiment_score', 0) for a in articles if 'sentiment_score' in a]

        if not sentiment_scores:
            return None

        # Calculate overall sentiment metrics
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        sentiment_distribution = {
            'very_negative': len([s for s in sentiment_scores if s <= -4]),
            'negative': len([s for s in sentiment_scores if -3 <= s <= -1]),
            'neutral': len([s for s in sentiment_scores if -0.9 <= s <= 0.9]),
            'positive': len([s for s in sentiment_scores if 1 <= s <= 3]),
            'very_positive': len([s for s in sentiment_scores if s >= 4])
        }

        return {
            'average_sentiment': avg_sentiment,
            'distribution': sentiment_distribution
        }

    except Exception as e:
        logger.error(f"Error analyzing sentiment trends: {str(e)}")
        return None

def generate_trend_insights(articles):
    """Generate insights from trends in article sentiment and content"""
    if not articles or len(articles) < 3:
        return {
            'insights': ["Not enough articles to generate meaningful insights."],
            'emerging_topics': []
        }

    try:
        # Prepare data from articles
        article_data = []
        for article in articles:
            article_data.append({
                'title': article.get('title', ''),
                'date': article.get('published_date') or article.get('date', ''),
                'key_points': article.get('key_points', []),
                'sentiment': article.get('sentiment_score', 0),
                'entities': article.get('entities', []),
                'tech_maturity': article.get('tech_maturity', '')
            })

        # Use AI to generate insights
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        prompt = f"""
        Analyze these {len(article_data)} articles about AI technology from an enterprise leadership perspective and identify:
        1. 3 strategic business implications or trends
        2. 2 emerging technologies with competitive advantage potential
        3. Implementation readiness assessment (experimental, early adoption, mainstream)
        4. Sentiment trajectory (improving, worsening, or stable)

        Format your response as a JSON object with these keys:
        strategic_implications, competitive_technologies, implementation_readiness, sentiment_trajectory

        Article data: 
        {json.dumps(article_data)}
        """

        response = client.chat.completions.create(
            model="o3-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        # Ensure the result has the expected structure
        for key in ['insights', 'emerging_topics', 'sentiment_trajectory']:
            if key not in result:
                result[key] = []

        return result

    except Exception as e:
        logger.error(f"Error generating trend insights: {str(e)}")
        return {
            'insights': ["Unable to generate insights due to processing error."],
            'emerging_topics': [],
            'sentiment_trajectory': "unknown"
        }

import re
from typing import Dict, Any, Optional, List