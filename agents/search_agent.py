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

        # Search web using SerpAPI
        if self.config['news_sources']['web_search']['enabled']:
            web_articles = search_web(
                self.config['news_sources']['keywords'],
                cutoff_date
            )
            articles.extend(web_articles)

        # Search ArXiv
        if self.config['news_sources']['arxiv']['enabled']:
            arxiv_articles = search_arxiv(cutoff_date)
            articles.extend(arxiv_articles)

        # Scrape configured websites
        for source in self.config['news_sources']:
            if source['type'] == 'website':
                website_articles = scrape_website(
                    source['url'],
                    source['name'],
                    cutoff_date
                )
                articles.extend(website_articles)

        # Deduplicate articles based on URL
        unique_articles = {article['url']: article for article in articles}.values()
        return list(unique_articles)
