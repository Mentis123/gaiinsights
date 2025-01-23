import requests
from serpapi import GoogleSearch
from datetime import datetime
import trafilatura
import os

def search_web(keywords, cutoff_date):
    """
    Searches for articles using SerpAPI
    """
    articles = []
    api_key = os.environ.get("SERPAPI_API_KEY")
    
    for keyword in keywords:
        params = {
            "engine": "google",
            "q": f"{keyword} news",
            "tbm": "nws",
            "api_key": api_key
        }
        
        search = GoogleSearch(params)
        results = search.get_dict().get("news_results", [])
        
        for result in results:
            pub_date = datetime.strptime(result['date'], '%Y-%m-%d')
            if pub_date >= cutoff_date:
                articles.append({
                    'title': result['title'],
                    'url': result['link'],
                    'source': result['source'],
                    'published_date': pub_date,
                    'content': get_article_content(result['link'])
                })
    
    return articles

def search_arxiv(cutoff_date):
    """
    Searches for articles on ArXiv
    """
    # Implementation using arxiv API
    return []

def scrape_website(url, source_name, cutoff_date):
    """
    Scrapes articles from a specific website
    """
    articles = []
    downloaded = trafilatura.fetch_url(url)
    
    if downloaded:
        content = trafilatura.extract(downloaded)
        if content:
            articles.append({
                'title': source_name,  # Would need better title extraction
                'url': url,
                'source': source_name,
                'published_date': datetime.now(),  # Would need better date extraction
                'content': content
            })
    
    return articles

def get_article_content(url):
    """
    Extracts content from article URL
    """
    try:
        downloaded = trafilatura.fetch_url(url)
        content = trafilatura.extract(downloaded)
        return content or ""
    except Exception:
        return ""
