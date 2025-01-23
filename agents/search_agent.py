import os
from utils.search_tools import search_web, search_arxiv, scrape_website
from datetime import datetime, timedelta

class SearchAgent:
    def __init__(self, config):
        self.config = config
        self.timeframe_days = config['search_timeframe_days']

    def search(self):
        """
        Aggregates articles from all configured sources
        """
        articles = []
        cutoff_date = datetime.now() - timedelta(days=self.timeframe_days)

        # Process each news source from config
        for source in self.config['news_sources']:
            if source['type'] == 'web_search' and source['enabled']:
                # Search web using SerpAPI
                if 'keywords' in source:
                    web_articles = search_web(
                        source['keywords'],
                        cutoff_date
                    )
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

        # Deduplicate articles based on URL
        unique_articles = {article['url']: article for article in articles}.values()
        return list(unique_articles)