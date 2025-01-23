import os
from datetime import datetime, timedelta
import re
from openai import OpenAI
from llama_index import VectorStoreIndex, SimpleDirectoryReader
from llama_index.node_parser import SimpleNodeParser
from llama_index.readers import BeautifulSoupWebReader
from bs4 import BeautifulSoup
import requests
from serpapi import Client as SerpAPIClient

class SearchAgent:
    def __init__(self, config):
        self.config = config
        self.timeframe_days = config['search_timeframe_days']
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        self.model = "gpt-4o"
        self.min_articles = 6
        self.max_retries = 3

    def extract_keywords_from_criteria(self, criteria_text):
        """
        Use OpenAI to extract relevant search keywords from criteria with broader scope
        """
        prompt = f"""
        Extract 8-10 search keywords or phrases from the following evaluation criteria.
        Include both specific technical terms and broader related concepts to ensure
        comprehensive coverage. Format the output as a JSON array of strings.

        Criteria:
        {criteria_text}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=300,
        )

        try:
            keywords = eval(response.choices[0].message.content)['keywords']
            # Add variations to increase coverage
            expanded_keywords = []
            for kw in keywords:
                expanded_keywords.extend([
                    f"AI {kw}",
                    f"artificial intelligence {kw}",
                    f"machine learning {kw}"
                ])
            return expanded_keywords
        except:
            # Broader fallback keywords
            return [
                "artificial intelligence news",
                "AI technology breakthroughs",
                "machine learning developments",
                "AI industry updates",
                "AI research papers",
                "artificial intelligence innovation",
                "AI startup news",
                "machine learning applications",
                "AI business impact"
            ]

    def fetch_article_content(self, url):
        """
        Fetch and process article content using LlamaIndex
        """
        try:
            reader = BeautifulSoupWebReader()
            documents = reader.load_data([url])

            if documents:
                parser = SimpleNodeParser()
                nodes = parser.get_nodes_from_documents(documents)

                if nodes:
                    return nodes[0].text

            # Fallback to basic request if LlamaIndex fails
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            # Remove scripts and styles
            for script in soup(["script", "style"]):
                script.decompose()
            return soup.get_text()
        except Exception as e:
            print(f"Error fetching content from {url}: {str(e)}")
            return ""

    def parse_date(self, date_str):
        """
        Parse various date formats and relative dates
        """
        try:
            # Try direct parsing
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            # Handle relative dates
            if 'ago' in date_str:
                num = int(re.search(r'\d+', date_str).group())
                if 'hour' in date_str:
                    return datetime.now() - timedelta(hours=num)
                elif 'day' in date_str:
                    return datetime.now() - timedelta(days=num)
                elif 'week' in date_str:
                    return datetime.now() - timedelta(weeks=num)
                elif 'month' in date_str:
                    return datetime.now() - timedelta(days=num*30)

            # Try other common formats
            for fmt in ['%b %d, %Y', '%B %d, %Y', '%Y/%m/%d', '%d-%m-%Y']:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue

            return datetime.now()

    def search(self, criteria_text=None):
        """
        Aggregates articles from all configured sources with retry logic
        """
        articles = []
        cutoff_date = datetime.now() - timedelta(days=self.timeframe_days)

        # Start with normal search
        keywords = self.extract_keywords_from_criteria(criteria_text)
        articles = self._search_with_keywords(keywords, cutoff_date)

        # If we don't have enough articles, gradually expand search
        retries = 0
        while len(articles) < self.min_articles and retries < self.max_retries:
            retries += 1
            # Expand timeframe
            cutoff_date = datetime.now() - timedelta(days=self.timeframe_days * (retries + 1))
            # Get more general keywords
            broader_keywords = [k.replace("artificial intelligence", "AI").split()[-1] for k in keywords]
            broader_keywords.extend(["AI", "artificial intelligence", "machine learning"])
            # Search again
            new_articles = self._search_with_keywords(broader_keywords, cutoff_date)
            # Add new unique articles
            articles.extend([a for a in new_articles if a['url'] not in [existing['url'] for existing in articles]])

        # Final deduplication and sorting
        unique_articles = {}
        for article in articles:
            if article['url'] not in unique_articles:
                if isinstance(article['published_date'], str):
                    article['published_date'] = self.parse_date(article['published_date'])
                unique_articles[article['url']] = article

        return list(unique_articles.values())

    def _search_with_keywords(self, keywords, cutoff_date):
        """
        Helper method to search with a set of keywords
        """
        articles = []
        api_key = os.environ.get("SERPAPI_API_KEY")
        client = SerpAPIClient(api_key=api_key)

        for keyword in keywords:
            params = {
                "engine": "google",
                "q": f"{keyword}",
                "tbm": "nws",
            }

            try:
                results = client.search(params).get("news_results", [])

                for result in results:
                    # Fetch full content using LlamaIndex
                    content = self.fetch_article_content(result['link'])

                    articles.append({
                        'title': result['title'],
                        'url': result['link'],
                        'source': result['source'],
                        'published_date': result.get('date', datetime.now().strftime('%Y-%m-%d')),
                        'content': content
                    })
            except Exception as e:
                print(f"Error searching for keyword {keyword}: {str(e)}")

        return articles