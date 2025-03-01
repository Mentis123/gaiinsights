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
import os
import json
import logging
from datetime import datetime
from openai import OpenAI

logger = logging.getLogger(__name__)

def summarize_article(content):
    """Summarize article content and extract key information using a multi-tiered approach"""
    if not content or len(content) < 100:
        logger.warning("Content too short for summarization")
        return None

    # Track attempts for fallback methods
    result = None
    methods_tried = []

    # Method 1: Use OpenAI API for comprehensive analysis
    try:
        methods_tried.append("openai_comprehensive")
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        # Clean content - remove extra whitespace and normalize
        content = ' '.join(content.split())

        # Truncate content if too long to avoid token limits
        max_content_length = 15000
        if len(content) > max_content_length:
            content = content[:max_content_length] + "..."

        system_prompt = """
        You are an enterprise AI intelligence analyst providing concise, high-value insights directly for C-suite executives.

        IMPORTANT FORMATTING REQUIREMENTS:
        1. Keep summaries extremely concise (25-40 words maximum)
        2. Do NOT use brackets, parentheses, or metadata markers in your text
        3. Focus exclusively on business implications, competitive advantage, and practical use cases
        4. The ai_business_value field MUST be ONE clear, actionable sentence (15-25 words) that:
           - Speaks directly to a C-suite executive about their organization's GenAI adoption strategy
           - Highlights how this information relates to their internal AI implementation plans
           - Focuses on practical organizational use cases, not investment opportunities
           - Connects to enterprise digital transformation priorities and operational improvements
           - Provides specific insights on how to apply similar AI approaches in their organization
        5. Avoid technical jargon that wouldn't resonate with executive leadership
        6. Use confident, decisive language appropriate for strategic decision-makers
        """

        user_prompt = f"""
        Analyze this article from the perspective of a Chief AI Officer or CEO making strategic investment decisions:

        {content}

        Provide ONLY a JSON response with:
        1. summary: An extremely concise 1-2 sentence executive summary (25-40 words maximum)
        2. key_points: 2-3 key strategic takeaways for enterprise leadership
        3. entities: Key companies or technologies mentioned
        4. sentiment_score: Rating from -5 (negative) to +5 (positive)
        5. relevance_score: How relevant to enterprise AI strategy (0-100)
        6. article_type: Classification (news, analysis, research, implementation)
        7. ai_business_value: ONE specific sentence about how this AI technology delivers measurable business value that would convince a CEO to invest (15-25 words). This must focus on competitive advantage, revenue growth, or operational efficiency that impacts bottom line.
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

        # Verify we got a valid summary
        if result and 'summary' in result and len(result['summary']) > 20:
            logger.info("Successfully generated summary using OpenAI comprehensive method")

            # Ensure all expected fields exist
            for key in ['summary', 'key_points', 'entities', 'sentiment_score', 'relevance_score', 'article_type', 'ai_business_value']:
                if key not in result:
                    if key in ['key_points', 'entities'] and not result.get(key):
                        result[key] = []
                    else:
                        result[key] = "Not available"

            # Format summary to ensure it's properly displayed
            if result['summary'].startswith('"') and result['summary'].endswith('"'):
                result['summary'] = result['summary'][1:-1]


            # Add enterprise-focused AI relevance statement based on score
            relevance = result.get('relevance_score', 50)

            # Ensure we have the new ai_business_value field for consistency
            if 'ai_business_value' not in result or not result['ai_business_value']:
                if relevance > 85:
                    result['ai_business_value'] = "Enterprise leaders should incorporate this AI approach in their current digital transformation roadmap to enhance operational efficiency across departments"
                elif relevance > 70:
                    result['ai_business_value'] = "This AI application demonstrates a practical use case that could be adapted for your organization's customer service and process automation needs"
                elif relevance > 50:
                    result['ai_business_value'] = "Consider exploring how this AI capability could address existing workflow challenges in your organization's daily operations"
                elif relevance > 30:
                    result['ai_business_value'] = "Organizations should evaluate similar GenAI implementations to identify potential internal applications that align with business objectives"
                else:
                    result['ai_business_value'] = "Monitor this AI development for potential organizational adoption as the technology matures and use cases become more defined"

            # Also maintain backward compatibility with ai_validation field
            result['ai_validation'] = result.get('ai_business_value', "AI-related article found in scan")

            return result
    except Exception as e:
        logger.error(f"Error in comprehensive summarization: {str(e)}")
        # Continue to fallback methods

    # Method 2: Try a simpler extraction approach with fewer tokens
    if not result or 'summary' not in result or len(result.get('summary', '')) < 20:
        try:
            methods_tried.append("openai_focused")
            client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

            # Extract just intro paragraphs to reduce token count
            intro_content = ' '.join(content.split()[:500])

            prompt = f"""
            Extract from this article intro for enterprise leadership:

            {intro_content}

            Respond with ONLY a JSON object containing:
            1. summary: A concise 2-sentence strategic summary
            2. ai_relevance: Business implications of this AI technology
            """

            response = client.chat.completions.create(
                model="o3-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            focused_result = json.loads(response.choices[0].message.content)

            if focused_result and 'summary' in focused_result and len(focused_result['summary']) > 10:
                logger.info("Generated summary using focused extraction method")

                # Create a standardized result structure
                result = {
                    'summary': focused_result['summary'],
                    'key_points': [],
                    'entities': [],
                    'sentiment_score': 0,
                    'relevance_score': 50,
                    'article_type': "news",
                    'tech_maturity': "unknown",
                    'ai_business_value': focused_result.get('ai_relevance', "AI-related article found in scan")
                }

                return result
        except Exception as e:
            logger.error(f"Error in focused summarization: {str(e)}")
            # Continue to fallback methods

    # Method 3: Algorithmic fallback - extract intro sentences
    if not result or 'summary' not in result or len(result.get('summary', '')) < 10:
        try:
            methods_tried.append("algorithmic")

            # Simple extractive summary - get first 2-3 sentences
            sentences = content.split('.')
            extractive_summary = '. '.join(sentences[:3]) + '.'

            # Clean up the summary
            extractive_summary = extractive_summary.replace('\n', ' ').strip()
            extractive_summary = ' '.join(extractive_summary.split())

            if len(extractive_summary) > 20:
                logger.info("Generated summary using algorithmic extraction method")

                result = {
                    'summary': extractive_summary,
                    'key_points': [],
                    'entities': [],
                    'sentiment_score': 0,
                    'relevance_score': 50,
                    'article_type': "news",
                    'tech_maturity': "unknown",
                    'ai_business_value': "AI-related article found in scan"
                }

                return result
        except Exception as e:
            logger.error(f"Error in algorithmic summarization: {str(e)}")

    # Final fallback - if all methods failed
    logger.warning(f"All summarization methods failed: {', '.join(methods_tried)}")
    return {
        'summary': "This article discusses AI technology and its applications. The exact content could not be summarized automatically.",
        'key_points': ["Article contains AI-related content"],
        'entities': [],
        'sentiment_score': 0,
        'relevance_score': 50,
        'article_type': "unknown",
        'tech_maturity': "unknown",
        'ai_business_value': "AI-related article found in scan"
    }

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

        # Calculate sentiment over time if dates available
        time_series = []
        for article in articles:
            if 'sentiment_score' in article and ('published_date' in article or 'date' in article):
                date_str = article.get('published_date') or article.get('date')
                if isinstance(date_str, str):
                    try:
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                        time_series.append((date, article['sentiment_score']))
                    except ValueError:
                        continue

        # Sort by date
        time_series.sort(key=lambda x: x[0])

        # Group by date
        daily_sentiment = {}
        for date, score in time_series:
            date_str = date.strftime('%Y-%m-%d')
            if date_str not in daily_sentiment:
                daily_sentiment[date_str] = []
            daily_sentiment[date_str].append(score)

        # Calculate average sentiment per day
        sentiment_trend = [
            {'date': date, 'sentiment': sum(scores)/len(scores)}
            for date, scores in daily_sentiment.items()
        ]

        return {
            'average_sentiment': avg_sentiment,
            'distribution': sentiment_distribution,
            'trend': sentiment_trend
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