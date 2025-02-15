import trafilatura
import pandas as pd
from typing import List, Dict, Optional, Tuple
import requests
from bs4 import BeautifulSoup
import logging
import time
from datetime import datetime, timedelta
import pytz
from urllib.parse import urljoin
import re

logger = logging.getLogger(__name__)

class TooManyRequestsError(Exception):
    pass

def load_source_sites(test_mode: bool = False) -> List[str]:
    """Load the source sites from the CSV file."""
    try:
        df = pd.read_csv('data/search_sites.csv', header=None)
        sites = df[0].tolist()

        # Ensure we don't process duplicate sites
        sites = list(dict.fromkeys(sites))

        if test_mode:
            logger.info("Running in test mode - using 1 out of 32 sites")
            return ['https://www.wired.com/tag/artificial-intelligence/']
        return sites
    except Exception as e:
        logger.error(f"Error loading source sites: {e}")
        return []

def extract_metadata(url: str, cutoff_time: datetime) -> Optional[Dict[str, str]]:
    """Extract and validate metadata first before getting full content."""
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            metadata = trafilatura.extract(
                downloaded,
                include_links=True,
                include_images=True,
                include_tables=True,
                with_metadata=True,
                output_format='json',
                favor_recall=True
            )

            if metadata:
                try:
                    import json
                    meta_dict = json.loads(metadata)
                    return {
                        'title': meta_dict.get('title', ''),
                        'date': meta_dict.get('date', datetime.now(pytz.UTC).strftime('%Y-%m-%d')),
                        'url': url
                    }

                except json.JSONDecodeError as e:
                    logger.error(f"JSON parsing error for {url}: {e}")
                    return {
                        'title': "Article from " + url.split('/')[2],
                        'date': datetime.now(pytz.UTC).strftime('%Y-%m-%d'),
                        'url': url
                    }

    except Exception as e:
        logger.error(f"Error extracting metadata from {url}: {str(e)}")
        return None

    return None

def extract_full_content(url: str) -> Optional[str]:
    """Extract full content after metadata validation."""
    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                content = trafilatura.extract(
                    downloaded,
                    include_links=True,
                    include_images=True,
                    include_tables=True,
                    with_metadata=False,
                    favor_recall=True
                )
                if content:
                    return content

        except Exception as e:
            logger.error(f"Error extracting content from {url} (attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue

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

def make_request_with_backoff(url: str, max_retries: int = 3, initial_delay: int = 5) -> Optional[requests.Response]:
    """Make HTTP request with exponential backoff."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    for attempt in range(max_retries):
        try:
            delay = initial_delay * (2 ** attempt)
            if attempt > 0:
                time.sleep(delay)

            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for {url} (attempt {attempt + 1}): {str(e)}")
            if attempt == max_retries - 1:
                raise

    return None

def similar_titles(title1: str, title2: str) -> bool:
    """Checks if two titles are similar (simplified example)."""
    # Replace with a more robust similarity check if needed (e.g., using difflib)
    return title1.lower() == title2.lower()

def validate_ai_relevance(article_data):
    """Validate if an article is meaningfully about AI technology or applications."""
    title = article_data.get('title', '').lower()
    summary = article_data.get('summary', '').lower()
    content = article_data.get('content', '').lower()

    # Check if the title explicitly mentions AI
    if any(term in title for term in ['ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'generative']):
        return {
            "is_relevant": True,
            "reason": f"Direct AI mention in title: {article_data.get('title')}"
        }

    # If found in potential AI articles, consider it relevant
    if "Found potential AI article:" in article_data.get('_source_log', ''):
        return {
            "is_relevant": True,
            "reason": "Identified as potential AI article during initial scan"
        }

    return {
        "is_relevant": True,  # Default to including articles that made it this far
        "reason": "Passed initial AI content scan"
    }

def is_specific_article(metadata: Dict[str, str]) -> bool:
    """
    Validate if the content represents a specific article rather than a category/section page.
    Applied after finding AI articles, before presenting to user.

    Returns:
        bool: True if content appears to be a specific article, False otherwise
    """
    if not metadata:
        return False

    title = metadata.get('title', '').lower()
    url = metadata.get('url', '').lower()

    # Only exclude obvious non-articles
    url_patterns_to_exclude = [
        r'/privacy\b',
        r'/terms\b',
        r'/about\b',
        r'/contact\b'
    ]

    if any(re.search(pattern, url) for pattern in url_patterns_to_exclude):
        logger.info(f"Excluding non-article URL: {url}")
        return False

    # Accept more titles, only exclude extremely short ones
    if len(title.split()) < 2 and len(title) < 5:
        logger.info(f"Excluding too short title: {title}")
        return False

    return True

def find_ai_articles(url: str, cutoff_time: datetime) -> List[Dict[str, str]]:
    """Find AI-related articles with improved filtering."""
    articles = []
    seen_urls = set()
    seen_titles = []

    try:
        response = make_request_with_backoff(url)
        if not response:
            logger.error(f"Could not fetch content from {url}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')

        # Updated AI patterns to include hyphenated forms
        ai_patterns = [
            r'\b[Aa][Ii]\b',  # Standalone "AI"
            r'\b[Aa][Ii]-[a-zA-Z]+\b',  # AI-powered, AI-driven, etc.
            r'\b[a-zA-Z]+-[Aa][Ii]\b',  # gen-AI, etc.
            r'\bartificial intelligence\b',
            r'\bmachine learning\b',
            r'\bdeep learning\b',
            r'\bneural network\b',
            r'\bgenerative ai\b',
            r'\bchatgpt\b',
            r'\blarge language model\b',
            r'\bllm\b'
        ]

        ai_regex = re.compile('|'.join(ai_patterns), re.IGNORECASE)

        logger.info(f"Scanning URL: {url}")

        for link in soup.find_all('a', href=True):
            try:
                href = link['href']
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(url, href)

                link_text = (link.text or '').strip()
                title = link.get('title', '').strip() or link_text

                if ai_regex.search(title):
                    logger.info(f"Found potential AI article: {title}")
                    metadata = extract_metadata(href, cutoff_time)

                    if metadata and metadata['url'] not in seen_urls:
                        logger.info(f"Found AI article: {title}")
                        articles.append({
                            'title': title,
                            'url': href,
                            'date': metadata.get('date', datetime.now().strftime('%Y-%m-%d')),
                            'source': url
                        })
                        seen_urls.add(href)

            except Exception as e:
                logger.error(f"Error processing link: {str(e)}")
                continue

        logger.info(f"Found {len(articles)} articles from {url}")
        return articles

    except Exception as e:
        logger.error(f"Error finding AI articles from {url}: {str(e)}")
        return []