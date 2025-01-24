import trafilatura
import pandas as pd
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
import logging

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
            try:
                content = trafilatura.extract(
                    downloaded,
                    include_links=True,
                    include_images=True,
                    include_tables=True,
                    output_format='json',
                    with_metadata=True
                )

                if content:
                    # Parse the JSON string into a dictionary
                    if isinstance(content, str):
                        import json
                        content = json.loads(content)

                    return {
                        'title': content.get('title', ''),
                        'text': content.get('text', ''),
                        'date': content.get('date', ''),
                        'url': url
                    }
            except Exception as e:
                print(f"Error parsing content from {url}: {e}")
    except Exception as e:
        print(f"Error downloading content from {url}: {e}")
    return None

def find_ai_articles(url: str) -> List[Dict[str, str]]:
    """Find AI-related articles from a given source URL."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
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
            link_text = (link.text or '').lower()
            title = link.get('title', '').lower()
            combined_text = f"{link_text} {title}"

            if any(keyword in combined_text for keyword in [
                'ai', 'artificial intelligence', 'machine learning', 'ml', 
                'chatgpt', 'llm', 'gpt', 'openai', 'deep learning', 
                'neural network', 'generative ai'
            ]):
                articles.append({
                    'url': href,
                    'title': link.text.strip() or link.get('title', '').strip()
                })

        return articles
    except Exception as e:
        print(f"Error finding AI articles from {url}: {e}")
        return []