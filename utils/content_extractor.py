import trafilatura
import pandas as pd
from typing import List, Dict
import requests
from bs4 import BeautifulSoup

def load_source_sites(test_mode: bool = True) -> List[str]:
    """Load the source sites from the CSV file."""
    try:
        df = pd.read_csv('attached_assets/search_sites.csv', header=None)
        if test_mode:
            # Return only the first three sources in test mode
            return df[0].head(3).tolist()
        return df[0].tolist()
    except Exception as e:
        print(f"Error loading source sites: {e}")
        return []

def extract_content(url: str) -> Dict[str, str]:
    """Extract content from a given URL using trafilatura."""
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            content = trafilatura.extract(downloaded, include_links=True, 
                                        include_images=True, 
                                        include_tables=True,
                                        output_format='json',
                                        with_metadata=True)
            if content:
                return {
                    'title': content.get('title', ''),
                    'text': content.get('text', ''),
                    'date': content.get('date', ''),
                    'url': url
                }
    except Exception as e:
        print(f"Error extracting content from {url}: {e}")
    return None

def find_ai_articles(url: str) -> List[Dict[str, str]]:
    """Find AI-related articles from a given source URL."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find all links
        articles = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            # Make sure the URL is absolute
            if not href.startswith('http'):
                if href.startswith('/'):
                    href = url.rstrip('/') + href
                else:
                    continue

            # Check if the link contains AI-related keywords
            link_text = link.text.lower()
            if any(keyword in link_text for keyword in ['ai', 'artificial intelligence', 'machine learning', 'ml', 'chatgpt', 'llm']):
                articles.append({
                    'url': href,
                    'title': link.text.strip()
                })

        return articles
    except Exception as e:
        print(f"Error finding AI articles from {url}: {e}")
        return []