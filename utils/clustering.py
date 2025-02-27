
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from typing import List, Dict, Tuple, Set, Optional
import logging

logger = logging.getLogger(__name__)

class ArticleClusterer:
    """Handles article clustering to identify similar content and duplicates"""
    
    def __init__(self, similarity_threshold: float = 0.75):
        self.similarity_threshold = similarity_threshold
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.85
        )
        
    def preprocess_text(self, text: str) -> str:
        """Clean and normalize text for better comparison"""
        if not text:
            return ""
            
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters, keeping alphabets, numbers and spaces
        text = re.sub(r'[^\w\s]', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
        
    def cluster_articles(self, articles: List[Dict]) -> List[List[Dict]]:
        """
        Group articles into clusters of similar content
        
        Args:
            articles: List of article dictionaries
            
        Returns:
            List of article clusters (each cluster is a list of articles)
        """
        if not articles or len(articles) < 2:
            return [[a] for a in articles]
            
        # Extract titles and content for comparison
        docs = []
        for article in articles:
            title = article.get('title', '')
            content = article.get('content', '') or article.get('summary', '')
            # Give more weight to title by repeating it
            combined = f"{title} {title} {title} {content}"
            docs.append(self.preprocess_text(combined))
            
        # Skip vectorization if no valid documents
        if not any(docs):
            return [[a] for a in articles]
            
        try:
            # Calculate TF-IDF vectors
            tfidf_matrix = self.vectorizer.fit_transform(docs)
            
            # Calculate similarity matrix
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # Cluster articles
            clusters = self._form_clusters(similarity_matrix, articles)
            
            logger.info(f"Clustered {len(articles)} articles into {len(clusters)} groups")
            return clusters
            
        except Exception as e:
            logger.error(f"Error clustering articles: {str(e)}")
            # Return each article as its own cluster if clustering fails
            return [[a] for a in articles]
            
    def _form_clusters(self, similarity_matrix: np.ndarray, articles: List[Dict]) -> List[List[Dict]]:
        """Form clusters based on similarity matrix"""
        # Create adjacency list for similar articles
        n = len(articles)
        adjacency = [[] for _ in range(n)]
        
        # Populate adjacency list
        for i in range(n):
            for j in range(i+1, n):
                if similarity_matrix[i, j] >= self.similarity_threshold:
                    adjacency[i].append(j)
                    adjacency[j].append(i)
                    
        # Use DFS to form clusters
        visited = [False] * n
        clusters = []
        
        for i in range(n):
            if not visited[i]:
                cluster = []
                self._dfs(i, adjacency, visited, cluster)
                clusters.append([articles[idx] for idx in cluster])
                
        return clusters
        
    def _dfs(self, node: int, adjacency: List[List[int]], visited: List[bool], cluster: List[int]):
        """Depth-first search to find connected components"""
        visited[node] = True
        cluster.append(node)
        
        for neighbor in adjacency[node]:
            if not visited[neighbor]:
                self._dfs(neighbor, adjacency, visited, cluster)
                
    def select_representative_articles(self, clusters: List[List[Dict]], max_per_cluster: int = 2) -> List[Dict]:
        """
        Select representative articles from each cluster
        
        Args:
            clusters: List of article clusters
            max_per_cluster: Maximum number of articles to select from each cluster
            
        Returns:
            List of selected representative articles
        """
        selected_articles = []
        
        for cluster in clusters:
            if not cluster:
                continue
                
            # Sort cluster by published date and AI confidence
            sorted_cluster = sorted(
                cluster,
                key=lambda x: (
                    x.get('ai_confidence', 0),
                    x.get('published_date', '2000-01-01')
                ),
                reverse=True
            )
            
            # Select top articles from cluster
            selected = sorted_cluster[:max_per_cluster]
            
            # Mark related articles
            if len(cluster) > 1:
                for article in selected:
                    related_titles = [a.get('title') for a in cluster if a != article]
                    article['related_articles'] = related_titles[:3]  # Store up to 3 related articles
                    
            selected_articles.extend(selected)
            
        return selected_articles
