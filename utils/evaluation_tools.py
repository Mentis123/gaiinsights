from openai import OpenAI
import os

def calculate_relevance_score(content, criteria):
    """
    Calculates relevance score using OpenAI embeddings
    """
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    # Generate embeddings for content and criteria
    content_embedding = get_embedding(content, client)
    criteria_embedding = get_embedding(criteria, client)
    
    # Calculate cosine similarity
    similarity = cosine_similarity(content_embedding, criteria_embedding)
    
    # Convert similarity to 1-10 score
    score = round(similarity * 10)
    
    return max(1, min(10, score))

def get_embedding(text, client):
    """
    Gets embedding vector for text using OpenAI API
    """
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text[:8000]  # Limit text length
    )
    return response.data[0].embedding

def cosine_similarity(vec1, vec2):
    """
    Calculates cosine similarity between two vectors
    """
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = sum(a * a for a in vec1) ** 0.5
    norm2 = sum(b * b for b in vec2) ** 0.5
    return dot_product / (norm1 * norm2)
