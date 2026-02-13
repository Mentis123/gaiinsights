
import re
import pandas as pd
from typing import List, Dict, Optional, Set
import datetime
import logging

logger = logging.getLogger(__name__)

class ContextualFilter:
    """
    Provides advanced filtering capabilities for article search results
    based on context, content, and metadata
    """
    
    def __init__(self):
        self.entity_patterns = self._compile_entity_patterns()
        
    def _compile_entity_patterns(self) -> Dict[str, re.Pattern]:
        """Compile regex patterns for common entity types"""
        return {
            'companies': re.compile(r'\b(Google|Microsoft|OpenAI|Meta|Facebook|Apple|Amazon|IBM|Tesla|Nvidia|Intel|AMD|Anthropic|DeepMind)\b', re.IGNORECASE),
            'technologies': re.compile(r'\b(LLM|GPT-4|GPT-5|Gemini|Claude|Mistral|DALLE|Midjourney|Stable Diffusion|Transformer|Vision Transformer|Self-Attention|Diffusion Model)\b', re.IGNORECASE),
            'people': re.compile(r'\b(Sam Altman|Sundar Pichai|Satya Nadella|Elon Musk|Mark Zuckerberg|Demis Hassabis|Jeff Dean|Andrej Karpathy|Yann LeCun|Geoffrey Hinton|Andrew Ng)\b'),
            'research_orgs': re.compile(r'\b(Stanford|MIT|Berkeley|Carnegie Mellon|Harvard|Oxford|Cambridge|ETH Zurich|Google Research|DeepMind|FAIR|Microsoft Research)\b')
        }
    
    def apply_filters(self, articles: List[Dict], filters: Dict) -> List[Dict]:
        """
        Apply multiple filters to articles
        
        Args:
            articles: List of article dictionaries
            filters: Dictionary of filter criteria
                - date_range: (start_date, end_date) tuple
                - min_relevance: Minimum relevance score (0-100)
                - sentiment: List of sentiment ranges to include
                - entities: Dict of entity types and whether to include/exclude
                - article_type: List of article types to include
                - search_within: Additional keywords to search within content
                
        Returns:
            Filtered list of articles
        """
        if not articles:
            return []
            
        filtered_articles = articles.copy()
        
        # Apply date filter
        if 'date_range' in filters:
            filtered_articles = self._filter_by_date(filtered_articles, filters['date_range'])
        
        # Apply relevance filter
        if 'min_relevance' in filters:
            filtered_articles = self._filter_by_relevance(filtered_articles, filters['min_relevance'])
            
        # Apply sentiment filter
        if 'sentiment' in filters:
            filtered_articles = self._filter_by_sentiment(filtered_articles, filters['sentiment'])
            
        # Apply entity filter
        if 'entities' in filters:
            filtered_articles = self._filter_by_entities(filtered_articles, filters['entities'])
            
        # Apply article type filter
        if 'article_type' in filters:
            filtered_articles = self._filter_by_type(filtered_articles, filters['article_type'])
            
        # Apply content keyword filter
        if 'search_within' in filters and filters['search_within']:
            filtered_articles = self._filter_by_content_keywords(filtered_articles, filters['search_within'])
            
        # Apply source filter
        if 'sources' in filters:
            filtered_articles = self._filter_by_sources(filtered_articles, filters['sources'])
            
        logger.info(f"Applied filters: {len(articles)} articles → {len(filtered_articles)} articles")
        return filtered_articles
        
    def _filter_by_date(self, articles: List[Dict], date_range: tuple) -> List[Dict]:
        """Filter articles by date range"""
        start_date, end_date = date_range
        
        # Convert to datetime if strings
        if isinstance(start_date, str):
            start_date = datetime.datetime.strptime(start_date, '%Y-%m-%d')
        if isinstance(end_date, str):
            end_date = datetime.datetime.strptime(end_date, '%Y-%m-%d')
            
        filtered = []
        for article in articles:
            date_str = article.get('published_date') or article.get('date')
            
            if not date_str:
                continue
                
            # Parse date
            if isinstance(date_str, str):
                try:
                    article_date = datetime.datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    continue
            elif isinstance(date_str, datetime.datetime):
                article_date = date_str
            else:
                continue
                
            # Check if within range
            if start_date <= article_date <= end_date:
                filtered.append(article)
                
        return filtered
        
    def _filter_by_relevance(self, articles: List[Dict], min_relevance: float) -> List[Dict]:
        """Filter articles by minimum relevance score"""
        return [a for a in articles if float(a.get('relevance_score', 0)) >= min_relevance]
        
    def _filter_by_sentiment(self, articles: List[Dict], sentiment_ranges: List[str]) -> List[Dict]:
        """Filter articles by sentiment ranges"""
        # Define sentiment ranges
        ranges = {
            'very_negative': (-5, -3.1),
            'negative': (-3, -0.1),
            'neutral': (-0.1, 0.1),
            'positive': (0.1, 3),
            'very_positive': (3.1, 5)
        }
        
        # Get all allowed sentiment values
        allowed_ranges = []
        for sentiment in sentiment_ranges:
            if sentiment in ranges:
                allowed_ranges.append(ranges[sentiment])
                
        if not allowed_ranges:
            return articles
            
        filtered = []
        for article in articles:
            sentiment = float(article.get('sentiment_score', 0))
            
            # Check if within any allowed range
            if any(low <= sentiment <= high for low, high in allowed_ranges):
                filtered.append(article)
                
        return filtered
        
    def _filter_by_entities(self, articles: List[Dict], entity_filters: Dict) -> List[Dict]:
        """Filter articles by entity mentions (include or exclude)"""
        filtered = []
        
        for article in articles:
            content = article.get('content', '') or article.get('summary', '')
            include_article = True
            
            for entity_type, inclusion in entity_filters.items():
                if entity_type not in self.entity_patterns:
                    continue
                    
                pattern = self.entity_patterns[entity_type]
                has_entity = bool(pattern.search(content))
                
                # Exclude article if:
                # - inclusion is true but no entity found
                # - inclusion is false but entity found
                if (inclusion and not has_entity) or (not inclusion and has_entity):
                    include_article = False
                    break
                    
            if include_article:
                filtered.append(article)
                
        return filtered
        
    def _filter_by_type(self, articles: List[Dict], article_types: List[str]) -> List[Dict]:
        """Filter articles by type"""
        if not article_types:
            return articles
            
        return [
            a for a in articles 
            if a.get('article_type', '').lower() in [t.lower() for t in article_types]
        ]
        
    def _filter_by_content_keywords(self, articles: List[Dict], keywords: List[str]) -> List[Dict]:
        """Filter articles containing specific keywords in content"""
        if not keywords:
            return articles
            
        filtered = []
        for article in articles:
            content = article.get('content', '') or article.get('summary', '')
            
            if content:
                content = content.lower()
                
                # Check if all keywords are in content
                if all(k.lower() in content for k in keywords):
                    filtered.append(article)
                    
        return filtered
        
    def _filter_by_sources(self, articles: List[Dict], sources: List[str]) -> List[Dict]:
        """Filter articles by source"""
        if not sources:
            return articles
            
        # Lowercase sources for case-insensitive comparison
        sources_lower = [s.lower() for s in sources]
        
        filtered = []
        for article in articles:
            source = article.get('source', '')
            
            if source and source.lower() in sources_lower:
                filtered.append(article)
                
        return filtered
        
    def extract_common_entities(self, articles: List[Dict], top_n: int = 10) -> Dict[str, List[str]]:
        """Extract common entities mentioned across articles"""
        if not articles:
            return {category: [] for category in self.entity_patterns}
            
        entity_counts = {category: {} for category in self.entity_patterns}
        
        for article in articles:
            content = article.get('content', '') or article.get('summary', '')
            
            if not content:
                continue
                
            # Find entities in content
            for category, pattern in self.entity_patterns.items():
                matches = pattern.findall(content)
                
                for match in matches:
                    if match not in entity_counts[category]:
                        entity_counts[category][match] = 0
                    entity_counts[category][match] += 1
                    
        # Get top N entities for each category
        top_entities = {}
        for category, counts in entity_counts.items():
            top_entities[category] = [
                entity for entity, count in 
                sorted(counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
            ]
            
        return top_entities
