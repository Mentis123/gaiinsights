import os
from datetime import datetime, timedelta
import re
from openai import OpenAI
from llama_index.core import Document
from llama_index.readers.web import BeautifulSoupWebReader
from bs4 import BeautifulSoup
import requests
from serpapi import Client as SerpAPIClient
import json

class SearchAgent:
    def __init__(self, config):
        self.config = config
        self.timeframe_days = config['search_timeframe_days']
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.model = "o3-mini"
        self.min_articles = 6
        self.max_retries = 3
        self.request_timeout = 10  # seconds
        self.max_keywords = 5  # Limit number of keywords per search

    def extract_keywords_from_criteria(self, criteria_text):
        """
        Extract focused keywords from criteria with contextual understanding
        """
        try:
            prompt = f"""
            Analyze the following criteria and extract the most effective search keywords.
            Consider:
            1. Technical specificity (prefer "reinforcement learning" over generic "AI")
            2. Trending terminology (include current industry-specific terms)
            3. Balanced coverage (mix of technical, application, and industry terms)
            4. Query effectiveness (terms likely to appear in relevant articles)
            
            Return exactly 5 keywords in this format: {{"keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]}}
            
            For each keyword, add a "category" field indicating if it's "technical", "application", or "industry".
            For each keyword, add a "specificity" rating from 1-5 (5 being most specific).
            
            Example:
            {{"keywords": [
                {{"term": "reinforcement learning", "category": "technical", "specificity": 4}},
                {{"term": "AI healthcare diagnostics", "category": "application", "specificity": 5}},
                ...
            ]}}

            Criteria:
            {criteria_text}
            """

            response = self.client.chat.completions.create(
                model="o3-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            
            # Extract keywords with better handling
            if 'keywords' in result and isinstance(result['keywords'], list):
                # Handle both simple string list and complex object list
                if result['keywords'] and isinstance(result['keywords'][0], dict) and 'term' in result['keywords'][0]:
                    keywords = [k['term'] for k in result['keywords']]
                else:
                    keywords = result['keywords']
                
                # Store full metadata for later use
                self.keyword_metadata = result['keywords']
                
                return keywords[:self.max_keywords]
            else:
                raise ValueError("Invalid keyword format returned")

        except Exception as e:
            print(f"Error extracting keywords: {str(e)}")
            return [
                "artificial intelligence news",
                "AI developments",
                "machine learning updates",
                "neural networks research",
                "generative AI applications"
            ]

    def fetch_article_content(self, url):
        """
        Fetch and process article content using LlamaIndex with timeout
        """
        try:
            response = requests.get(url, timeout=self.request_timeout)
            soup = BeautifulSoup(response.text, 'html.parser')

            for element in soup(['script', 'style', 'meta', 'link', 'header', 'footer', 'nav']):
                element.decompose()

            article = soup.find('article') or soup.find('main') or soup.find('body')
            if article:
                return article.get_text(strip=True)
            return soup.get_text(strip=True)

        except Exception as e:
            print(f"Error fetching content from {url}: {str(e)}")
            return ""

    def parse_date(self, date_str):
        """Parse date with fallback"""
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            try:
                return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                print(f"Could not parse date: {date_str}, using current time")
                return datetime.now()

    def search(self, criteria_text=None):
        """
        Aggregates articles from multiple sources with parallel processing and advanced validation
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed
        import threading
        
        # Thread-safe collection
        article_lock = threading.Lock()
        all_articles = []
        
        # Calculate cutoff time
        days_to_subtract = self.timeframe_days * 7 if self.config.get('time_unit') == "Weeks" else self.timeframe_days
        cutoff_time = datetime.now() - timedelta(days=days_to_subtract)
        
        try:
            # Extract primary and secondary keywords with different strategies
            primary_keywords = self.extract_keywords_from_criteria(criteria_text)[:self.max_keywords]
            
            # Generate expanded keywords by combining terms
            expanded_keywords = primary_keywords.copy()
            for i in range(min(3, len(primary_keywords))):
                for j in range(i+1, min(4, len(primary_keywords))):
                    combined = f"{primary_keywords[i]} {primary_keywords[j]}"
                    expanded_keywords.append(combined)
            
            print(f"Using cutoff time: {cutoff_time}")
            print(f"Primary keywords: {primary_keywords}")
            print(f"Expanded keywords: {expanded_keywords}")
            
            # Define search sources based on config
            search_sources = [
                {"type": "keyword", "keywords": primary_keywords},
                {"type": "websites", "sources": load_source_sites(test_mode=self.config.get('test_mode', False))}
            ]
            
            # Optional: Add specialized sources if configured
            if self.config.get('include_arxiv', False):
                search_sources.append({"type": "arxiv"})
            
            if self.config.get('include_twitter', False):
                search_sources.append({"type": "twitter"})
            
            # Execute searches in parallel
            with ThreadPoolExecutor(max_workers=5) as executor:
                future_to_source = {}
                
                # Submit keyword searches
                for source in search_sources:
                    if source["type"] == "keyword":
                        for keyword in source["keywords"]:
                            future = executor.submit(
                                self._search_with_keyword, 
                                keyword, 
                                cutoff_time
                            )
                            future_to_source[future] = f"Keyword: {keyword}"
                    
                    elif source["type"] == "websites":
                        # Batch website sources to avoid too many threads
                        for i in range(0, len(source["sources"]), 3):
                            batch = source["sources"][i:i+3]
                            future = executor.submit(
                                self._search_websites,
                                batch,
                                cutoff_time
                            )
                            future_to_source[future] = f"Websites batch {i//3 + 1}"
                    
                    elif source["type"] == "arxiv":
                        future = executor.submit(
                            self._search_arxiv,
                            primary_keywords,
                            cutoff_time
                        )
                        future_to_source[future] = "ArXiv"
                    
                    elif source["type"] == "twitter":
                        future = executor.submit(
                            self._search_twitter,
                            primary_keywords,
                            cutoff_time
                        )
                        future_to_source[future] = "Twitter"
                
                # Collect results as they complete
                for future in as_completed(future_to_source):
                    source_name = future_to_source[future]
                    try:
                        results = future.result()
                        print(f"Source {source_name} returned {len(results)} results")
                        with article_lock:
                            all_articles.extend(results)
                    except Exception as e:
                        print(f"Source {source_name} generated an exception: {str(e)}")
            
            # Deduplicate articles
            seen_urls = set()
            unique_articles = []
            for article in all_articles:
                if article['url'] not in seen_urls:
                    seen_urls.add(article['url'])
                    unique_articles.append(article)
            
            print(f"Found {len(unique_articles)} unique potential articles")
            
            # Add deep scanning for manually specified URLs that might have been missed
            additional_urls_to_scan = [
                "https://consumergoods.com/beware-doom-loop-early-generative-ai-supply-chain-developments-show-productivity-paradox-gartner",
                "https://consumergoods.com/church-dwight-maps-out-ai-fueled-marketing-strategy",
                "https://www.adweek.com/brand-marketing/meta-nestle-circana-ai-innovation-evolving-commerce/",
                "https://ppc.land/broadsign-debuts-ai-tool-for-out-of-home-ad-creative-approvals/",
                "https://ppc.land/grounding-with-bing-search-enhances-azure-ai-agent-service/"
            ]
            
            # Enable deep scanning for articles (additional fallback)
            deep_scanned_articles = []
            for url in additional_urls_to_scan:
                if url not in seen_urls:
                    articles_from_deep_scan = deep_scan_for_ai_content(url, self.cutoff_time)
                    deep_scanned_articles.extend(articles_from_deep_scan)
                    for article in articles_from_deep_scan:
                        seen_urls.add(article['url'])
            
            # Add deep-scanned articles to the pool
            unique_articles.extend(deep_scanned_articles)
            print(f"Added {len(deep_scanned_articles)} articles from deep scanning")
            
            # Batch validation for better performance
            validated_articles = self._validate_articles_batch(unique_articles)
            
            # Sort by relevance and date
            validated_articles.sort(key=lambda x: (x.get('ai_confidence', 0), x.get('published_date')), reverse=True)
            
            print(f"Final validated article count: {len(validated_articles)}")
            return validated_articles

        except Exception as e:
            print(f"Error in search process: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def _validate_articles_batch(self, articles, batch_size=5):
        """Validate articles in batches for better performance"""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        import threading
        
        validated_articles = []
        article_lock = threading.Lock()
        
        # Process in batches to avoid overloading
        for i in range(0, len(articles), batch_size):
            batch = articles[i:i+batch_size]
            
            with ThreadPoolExecutor(max_workers=batch_size) as executor:
                future_to_article = {
                    executor.submit(self._validate_single_article, article): article
                    for article in batch
                }
                
                for future in as_completed(future_to_article):
                    article = future_to_article[future]
                    try:
                        result = future.result()
                        if result:
                            with article_lock:
                                validated_articles.append(result)
                                print(f"Validated article: {result['title']}")
                    except Exception as e:
                        print(f"Error validating article {article['title']}: {str(e)}")
                        if "OpenAI API quota exceeded" in str(e):
                            raise
        
        return validated_articles
    
    def _validate_single_article(self, article):
        """Validate a single article and return if relevant"""
        try:
            content = extract_full_content(article['url'])
            if not content:
                return None
                
            analysis = summarize_article(content)
            if not analysis:
                return None
                
            validation = validate_ai_relevance({
                **article,
                'content': content,
                **analysis
            })
            
            if validation['is_relevant']:
                # Calculate confidence score based on validation and analysis
                confidence = int(validation.get('confidence', 85))
                
                # Adjust confidence based on keyword presence in content
                if hasattr(self, 'keyword_metadata') and self.keyword_metadata:
                    for keyword_info in self.keyword_metadata:
                        if isinstance(keyword_info, dict):
                            term = keyword_info.get('term', '')
                            if term and term.lower() in content.lower():
                                specificity = keyword_info.get('specificity', 3)
                                confidence += specificity # Boost by specificity rating
                
                # Cap at 100
                confidence = min(100, confidence)
                
                return {
                    **article,
                    'content': content,
                    **analysis,
                    'ai_confidence': confidence,
                    'ai_validation': validation['reason']
                }
            
            return None
                
        except Exception as e:
            print(f"Error in article validation: {str(e)}")
            return None
    
    def _search_websites(self, website_urls, cutoff_time):
        """Search specific websites for AI articles"""
        articles = []
        for url in website_urls:
            try:
                site_articles = find_ai_articles(url, cutoff_time)
                articles.extend(site_articles)
            except Exception as e:
                print(f"Error searching website {url}: {str(e)}")
        return articles
    
    def _search_arxiv(self, keywords, cutoff_time):
        """Search ArXiv for AI papers (placeholder - implement with arxiv API)"""
        # This would use the arxiv library to search for papers
        return []
    
    def _search_twitter(self, keywords, cutoff_time):
        """Search Twitter for AI news mentions (placeholder)"""
        # This would require Twitter/X API integration
        return []
    
    def _search_with_keyword(self, keyword, cutoff_time):
        """Search with a single keyword"""
        try:
            params = {
                "engine": "google",
                "q": keyword,
                "tbm": "nws",
                "num": 5,
            }
            
            api_key = os.environ.get("SERPAPI_API_KEY")
            if not api_key:
                raise Exception("SERPAPI_API_KEY not found")
                
            client = SerpAPIClient(api_key=api_key)
            results = client.search(params).get("news_results", [])
            print(f"Found {len(results)} results for keyword: {keyword}")
            
            articles = []
            for result in results:
                if not all(key in result for key in ['title', 'link', 'source']):
                    continue
                    
                metadata = extract_metadata(result['link'], cutoff_time)
                if metadata:
                    articles.append({
                        'title': result['title'],
                        'url': result['link'],
                        'source': result['source'],
                        'published_date': metadata['date'],
                        'keyword_match': keyword
                    })
                    
            return articles
            
        except Exception as e:
            print(f"Error searching for keyword {keyword}: {str(e)}")
            return []

    def _search_with_keywords(self, keywords, cutoff_time):
        """Helper method to search with a set of keywords"""
        articles = []
        api_key = os.environ.get("SERPAPI_API_KEY")

        if not api_key:
            raise Exception("SERPAPI_API_KEY not found")

        client = SerpAPIClient(api_key=api_key)

        for keyword in keywords:
            try:
                params = {
                    "engine": "google",
                    "q": keyword,
                    "tbm": "nws",
                    "num": 5,  # Limit results per keyword
                }

                results = client.search(params).get("news_results", [])
                print(f"Found {len(results)} results for keyword: {keyword}")

                for result in results:
                    if not all(key in result for key in ['title', 'link', 'source']):
                        continue

                    metadata = extract_metadata(result['link'], cutoff_time)
                    if metadata:
                        articles.append({
                            'title': result['title'],
                            'url': result['link'],
                            'source': result['source'],
                            'published_date': metadata['date']
                        })

            except Exception as e:
                print(f"Error searching for keyword {keyword}: {str(e)}")
                continue

        return articles


def extract_metadata(url, cutoff_time):
    #Implementation needed here.  Returns a dict with at least a 'date' key or None if invalid
    return {"date": datetime.now()}


def extract_full_content(url):
    #Implementation needed here. Returns article content or "" if error
    return "Article content placeholder"


def summarize_article(content):
    #Implementation needed here.  Returns a dict with analysis or None if error
    return {"summary": "Summary placeholder"}


def validate_ai_relevance(article_data):
    #Implementation needed here. Returns a dict with {'is_relevant':bool, 'reason':str}
    return {"is_relevant": True, "reason": "Placeholder reason"}