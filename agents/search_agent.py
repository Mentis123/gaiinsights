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
        # Fixed incorrect model name
        self.model = "gpt-4"
        self.min_articles = 6
        self.max_retries = 3
        self.request_timeout = 10  # seconds
        self.max_keywords = 5  # Limit number of keywords per search

    def extract_keywords_from_criteria(self, criteria_text):
        """
        Extract focused keywords from criteria
        """
        try:
            prompt = f"""
            Extract 5 specific and focused search keywords from the criteria below.
            Focus on technical terms that would yield relevant AI news articles.
            Return the keywords in this format: {{"keywords": ["keyword1", "keyword2", ...]}}

            Criteria:
            {criteria_text}
            """

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse the response text as JSON
            result = json.loads(response.choices[0].message.content)
            keywords = result.get('keywords', [])
            return keywords[:self.max_keywords]

        except Exception as e:
            print(f"Error extracting keywords: {str(e)}")
            return [
                "artificial intelligence news",
                "AI developments",
                "machine learning updates"
            ]

    def fetch_article_content(self, url):
        """
        Fetch and process article content using LlamaIndex with timeout
        """
        try:
            response = requests.get(url, timeout=self.request_timeout)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Remove scripts, styles, and other non-content elements
            for element in soup(['script', 'style', 'meta', 'link', 'header', 'footer', 'nav']):
                element.decompose()

            # Get main content
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
            return datetime.now()

    def search(self, criteria_text=None):
        """
        Aggregates articles from all configured sources with retry logic
        """
        articles = []
        cutoff_date = datetime.now() - timedelta(days=self.timeframe_days)  # Now using 1 day from config

        try:
            # Start with focused search using limited keywords
            keywords = self.extract_keywords_from_criteria(criteria_text)[:self.max_keywords]
            articles = self._search_with_keywords(keywords, cutoff_date)

            print(f"Initial search found {len(articles)} articles")

            # If we don't have enough articles, expand search scope but maintain date restriction
            retries = 0
            while len(articles) < self.min_articles and retries < self.max_retries:
                retries += 1
                print(f"Retry {retries}: Not enough articles ({len(articles)})")

                # Use more general keywords but keep the same timeframe
                broader_keywords = [
                    "artificial intelligence news",
                    "AI developments",
                    "machine learning updates"
                ]

                print(f"Searching with broader keywords: {broader_keywords}")
                new_articles = self._search_with_keywords(broader_keywords, cutoff_date)

                # Add only unique articles
                for article in new_articles:
                    if article['url'] not in [a['url'] for a in articles]:
                        articles.append(article)

        # Final processing
        processed_articles = []
        for article in articles:
            try:
                if isinstance(article['published_date'], str):
                    article['published_date'] = self.parse_date(article['published_date'])
                processed_articles.append(article)
            except Exception as e:
                print(f"Error processing article: {str(e)}")
                continue

        # Sort by date
        processed_articles.sort(key=lambda x: x['published_date'], reverse=True)

        print(f"Final article count: {len(processed_articles)}")
        return processed_articles

        except Exception as e:
            print(f"Error in search process: {str(e)}")
            raise Exception(f"Search failed: {str(e)}")

    def _search_with_keywords(self, keywords, cutoff_date):
        """
        Helper method to search with a set of keywords
        """
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
                    # Basic validation
                    if not all(key in result for key in ['title', 'link', 'source']):
                        continue

                    # Get article content with timeout
                    content = self.fetch_article_content(result['link'])

                    if content:  # Only add articles where we got content
                        articles.append({
                            'title': result['title'],
                            'url': result['link'],
                            'source': result['source'],
                            'published_date': result.get('date', datetime.now().strftime('%Y-%m-%d')),
                            'content': content
                        })

            except Exception as e:
                print(f"Error searching for keyword {keyword}: {str(e)}")
                continue

        return articles