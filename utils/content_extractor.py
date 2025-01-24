import trafilatura
import pandas as pd
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
import logging
import time
from datetime import datetime, timedelta

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

                    # Parse and validate the date
                    article_date = content.get('date', '')
                    if article_date:
                        try:
                            date_obj = datetime.strptime(article_date[:10], '%Y-%m-%d')
                            week_ago = datetime.now() - timedelta(days=7)
                            if date_obj < week_ago:
                                print(f"Article too old: {article_date}")
                                return None
                        except ValueError:
                            print(f"Invalid date format: {article_date}")
                            return None

                    return {
                        'title': content.get('title', ''),
                        'text': content.get('text', ''),
                        'date': article_date,
                        'url': url
                    }
            except Exception as e:
                print(f"Error parsing content from {url}: {e}")
                return None
    except Exception as e:
        print(f"Error downloading content from {url}: {e}")
        return None
    return None

def is_consent_or_main_page(text: str) -> bool:
    """Check if the page is a consent form or main landing page."""
    consent_indicators = [
        'cookie policy',
        'privacy notice',
        'consent form',
        'accept cookies',
        'terms of use',
        'privacy policy'
    ]
    text_lower = text.lower()
    return any(indicator in text_lower for indicator in consent_indicators)

def find_ai_articles(url: str) -> List[Dict[str, str]]:
    """Find AI-related articles from a given source URL with enhanced filtering."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # Add a small delay to prevent too rapid scanning
        time.sleep(1)

        soup = BeautifulSoup(response.text, 'html.parser')
        articles = []

        # AI-related keywords focusing on actual news and implementations
        ai_keywords = [
            'launches ai', 'implements ai', 'deploys ai',
            'ai technology', 'ai solution', 'ai platform',
            'artificial intelligence', 'ai tool',
            'machine learning', 'chatgpt', 'llm',
            'ai-powered', 'ai startup', 'neural',
            'generative ai', 'ai model', 'ai system',
            'ai application', 'ai development',
            'ai partnership', 'ai research'
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

            # Skip if it looks like a consent form or main page
            if is_consent_or_main_page(combined_text):
                continue

            # Include if it contains actual AI implementation/news keywords
            if any(keyword in combined_text for keyword in ai_keywords):
                articles.append({
                    'url': href,
                    'title': link.text.strip() or link.get('title', '').strip()
                })

        return articles
    except Exception as e:
        print(f"Error finding AI articles from {url}: {e}")
        return []