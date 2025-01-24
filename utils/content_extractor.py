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
                return None
    except Exception as e:
        print(f"Error downloading content from {url}: {e}")
        return None

def find_ai_articles(url: str) -> List[Dict[str, str]]:
    """Find AI-related articles from a given source URL with stricter filtering."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        articles = []

        # More specific AI-related keywords focusing on direct applications and use cases
        primary_keywords = [
            'artificial intelligence implementation',
            'ai application',
            'machine learning deployment',
            'ai use case',
            'ai solution',
            'ai technology implementation',
            'ai integration',
            'machine learning solution',
            'ai automation',
            'practical ai'
        ]

        secondary_keywords = [
            'chatgpt', 'llm', 'gpt-4', 'openai',
            'deep learning', 'neural network',
            'generative ai', 'mlops'
        ]

        for link in soup.find_all('a', href=True):
            href = link['href']
            if not href.startswith('http'):
                if href.startswith('/'):
                    href = url.rstrip('/') + href
                else:
                    continue

            link_text = (link.text or '').lower()
            title = link.get('title', '').lower()
            combined_text = f"{link_text} {title}"

            # Check for primary keywords (requires at least one)
            has_primary = any(keyword in combined_text for keyword in primary_keywords)
            # Check for secondary keywords
            has_secondary = any(keyword in combined_text for keyword in secondary_keywords)

            # Only include if it has a primary keyword or at least two secondary keywords
            if has_primary or (has_secondary and len([k for k in secondary_keywords if k in combined_text]) >= 2):
                articles.append({
                    'url': href,
                    'title': link.text.strip() or link.get('title', '').strip()
                })

        return articles
    except Exception as e:
        print(f"Error finding AI articles from {url}: {e}")
        return []