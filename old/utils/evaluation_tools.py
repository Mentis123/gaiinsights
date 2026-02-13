from openai import OpenAI
from llama_index.core import Document
from llama_index.embeddings.openai import OpenAIEmbedding
import os

def calculate_relevance_score(content, criteria):
    """
    Calculates relevance score using LlamaIndex and OpenAI embeddings
    """
    try:
        # Initialize OpenAI embedding model
        embed_model = OpenAIEmbedding()

        # Create documents
        content_doc = Document(text=content)
        criteria_doc = Document(text=criteria)

        # Get embeddings
        content_embedding = embed_model.get_text_embedding(content_doc.text)
        criteria_embedding = embed_model.get_text_embedding(criteria_doc.text)

        # Calculate cosine similarity
        similarity = cosine_similarity(content_embedding, criteria_embedding)

        # Convert similarity to 1-10 score
        score = round(similarity * 10)
        return max(1, min(10, score))

    except Exception as e:
        print(f"Error calculating relevance score: {str(e)}")
        return 1  # Return minimum score on error

def cosine_similarity(vec1, vec2):
    """
    Calculates cosine similarity between two vectors
    """
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = sum(a * a for a in vec1) ** 0.5
    norm2 = sum(b * b for b in vec2) ** 0.5
    return dot_product / (norm1 * norm2)

def validate_ai_relevance(article_data):
    """
    Evaluate article relevance to AI with improved scoring system

    Args:
        article_data: Dictionary with article information

    Returns:
        Dictionary with validation results
    """
    # Extract content for analysis
    title = article_data.get('title', '').lower()
    content = article_data.get('content', '').lower()
    summary = article_data.get('summary', '').lower()

    # If no content to analyze, reject
    if not content and not summary:
        return {
            "is_relevant": False,
            "confidence": 0,
            "reason": "No content available for analysis"
        }

    # Define AI-related terms with assigned weights
    ai_terms = {
        # Core AI terms (high weight)
        'artificial intelligence': 10,
        'machine learning': 10,
        'deep learning': 9,
        'neural network': 9,
        'generative ai': 10,
        'ai model': 9,

        # Specific AI technologies (medium-high weight)
        'large language model': 8,
        'llm': 8,
        'transformer': 7,
        'gpt': 8,
        'chatgpt': 8,
        'diffusion model': 7,
        'stable diffusion': 7,
        'midjourney': 7,
        'dall-e': 7,
        'claude': 7,
        'gemini': 7,
        'mistral': 7,

        # AI concepts (medium weight)
        'computer vision': 6,
        'natural language processing': 6,
        'nlp': 6,
        'reinforcement learning': 6,
        'ai ethics': 6,
        'neural net': 6,
        'semantic search': 5,
        'vector database': 5,
        'fine-tuning': 5,
        'prompt engineering': 5,

        # AI applications (medium-low weight)
        'ai-driven': 4,
        'ai-powered': 4,
        'ai application': 4,
        'ai tool': 4,
        'ai assistant': 4,
        'ai algorithm': 4,
        'ai technology': 4,
        'ai innovation': 4,
        'ai strategy': 5,
        'ai marketing': 5,
        'ai fueled': 5,
        'ai agent': 5,
        'ai service': 4,
        'intelligent automation': 4,
        'supply chain ai': 5,
        'retail ai': 5,
        'grounding': 3,
        'ad creative': 3,
        'ad approval': 3,
        
        # Vendor/product specific (medium weight)
        'azure ai': 6,
        'bing search': 5,
        'meta ai': 6,
        'nestle ai': 6,
        'circana': 5,
        'broadsign': 4,
        'church & dwight': 3,
        
        # Generic terms (low weight)
        'algorithm': 2,
        'automation': 2,
        'data science': 3,
        'predictive': 2,
        'insight': 2,
        'innovation': 2
    }

    # Calculate relevance score
    score = 0
    matched_terms = []

    # Check title (with 2x weight)
    for term, weight in ai_terms.items():
        if term in title:
            score += weight * 2
            matched_terms.append(f"{term} (title)")

    # Check content
    text_to_analyze = content or summary
    for term, weight in ai_terms.items():
        if term in text_to_analyze:
            # Count occurrences (with diminishing returns)
            occurrences = text_to_analyze.count(term)
            if occurrences > 0:
                term_score = weight * min(occurrences, 3)  # Cap at 3 occurrences
                score += term_score
                matched_terms.append(f"{term} ({occurrences}x)")

    # Normalize score (0-100)
    max_possible_score = 150  # Approximate max possible score
    normalized_score = min(100, int((score / max_possible_score) * 100))

    # Lower threshold for relevance to capture more business-oriented AI content
    threshold = 25  # Reduced from 40
    is_relevant = normalized_score >= threshold

    # Generate reason
    if is_relevant:
        if normalized_score >= 80:
            confidence_level = "high"
            reason = f"Highly relevant AI content detected with multiple key terms: {', '.join(matched_terms[:5])}"
        elif normalized_score >= 60:
            confidence_level = "medium"
            reason = f"Moderately relevant AI content with several key terms: {', '.join(matched_terms[:3])}"
        else:
            confidence_level = "low"
            reason = f"Somewhat relevant AI content with a few key terms: {', '.join(matched_terms[:2])}"
    else:
        confidence_level = "very low"
        if matched_terms:
            reason = f"Insufficient AI relevance. Only found: {', '.join(matched_terms[:2])}"
        else:
            reason = "No AI-related terms detected in content"

    # Check for exclusion patterns (non-AI uses of terms)
    exclusion_patterns = [
        "ai as in adobe illustrator",
        "ai file format",
        "allen iverson",
        "american idol",
        "artificial insemination",
        "ai wei wei"
    ]

    for pattern in exclusion_patterns:
        if pattern in text_to_analyze.lower():
            normalized_score = max(0, normalized_score - 30)  # Heavy penalty
            reason = f"Detected non-AI use of term: '{pattern}'"
            is_relevant = normalized_score >= threshold

    return {
        "is_relevant": is_relevant,
        "confidence": normalized_score,
        "confidence_level": confidence_level,
        "reason": reason,
        "matched_terms": matched_terms[:5]  # Include top 5 matched terms
    }