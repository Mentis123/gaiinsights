import os
from utils.search_tools import search_web, search_arxiv, scrape_website
from datetime import datetime, timedelta
import re
from openai import OpenAI

class SearchAgent:
    def __init__(self, config):
        self.config = config
        self.timeframe_days = config['search_timeframe_days']
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        self.model = "gpt-4o"

    def extract_keywords_from_criteria(self, criteria_text):
        """
        Use OpenAI to extract relevant search keywords from criteria
        """
        prompt = f"""
        Extract 4-5 specific search keywords or phrases from the following evaluation criteria.
        Focus on technical and specific terms that would be useful for finding relevant AI news articles.
        Format the output as a JSON array of strings.

        Criteria:
        {criteria_text}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=200,
        )

        try:
            keywords = eval(response.choices[0].message.content)['keywords']
            return [f"AI {kw}" for kw in keywords]  # Prefix with AI to focus results
        except:
            # Fallback to default keywords if extraction fails
            return [
                "artificial intelligence news",
                "AI technology breakthroughs",
                "machine learning developments",
                "AI industry updates"
            ]

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

            # If all parsing fails, return current date
            return datetime.now()

    def search(self, criteria_text=None):
        """
        Aggregates articles from all configured sources
        """
        articles = []
        cutoff_date = datetime.now() - timedelta(days=self.timeframe_days)

        # Extract keywords from criteria if provided
        keywords = (self.extract_keywords_from_criteria(criteria_text) 
                   if criteria_text else self.config['news_sources'][3]['keywords'])

        # Process each news source from config
        for source in self.config['news_sources']:
            try:
                if source['type'] == 'web_search' and source['enabled']:
                    # Search web using SerpAPI with extracted keywords
                    web_articles = search_web(keywords, cutoff_date)
                    articles.extend(web_articles)
                elif source['type'] == 'arxiv' and source['enabled']:
                    # Search ArXiv
                    arxiv_articles = search_arxiv(cutoff_date)
                    articles.extend(arxiv_articles)
                elif source['type'] == 'website':
                    # Scrape configured websites
                    website_articles = scrape_website(
                        source['url'],
                        source['name'],
                        cutoff_date
                    )
                    articles.extend(website_articles)
            except Exception as e:
                print(f"Error processing source {source['type']}: {str(e)}")

        # Deduplicate articles based on URL and filter by date
        unique_articles = {}
        for article in articles:
            if article['url'] not in unique_articles:
                # Parse and set the date
                if isinstance(article['published_date'], str):
                    article['published_date'] = self.parse_date(article['published_date'])

                # Only include articles within timeframe
                if article['published_date'] >= cutoff_date:
                    unique_articles[article['url']] = article

        return list(unique_articles.values())