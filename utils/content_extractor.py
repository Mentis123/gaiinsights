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

def load_source_sites(test_mode: bool = True) -> List[str]:
    """Load the source sites from the CSV file."""
    try:
        df = pd.read_csv('attached_assets/search_sites.csv', header=None)
        if test_mode:
            return df[0].head(6).tolist()
        return df[0].tolist()
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
                include_links=False,
                include_images=False,
                include_tables=False,
                with_metadata=True,
                output_format='json',
                favor_recall=True
            )

            if metadata:
                try:
                    import json
                    meta_dict = json.loads(metadata)
                    date_str = meta_dict.get('date', '')
                    title = meta_dict.get('title', '')

                    # More flexible date parsing
                    if date_str:
                        try:
                            # Try parsing with multiple formats
                            for date_format in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%SZ']:
                                try:
                                    date_obj = datetime.strptime(str(date_str)[:19], date_format)
                                    # Convert to UTC for consistent comparison
                                    if date_obj.tzinfo is None:
                                        date_obj = pytz.UTC.localize(date_obj)

                                    # Compare with cutoff time (also in UTC)
                                    cutoff_utc = pytz.UTC.localize(cutoff_time)

                                    # Fixed: Keep articles that are newer than or equal to the cutoff date
                                    if date_obj.date() < cutoff_utc.date():
                                        return None
                                    break
                                except ValueError:
                                    continue
                        except Exception as e:
                            logger.error(f"Date parsing error for {date_str}: {e}")
                            # If we can't parse the date, assume it's recent
                            date_str = datetime.now(pytz.UTC).strftime('%Y-%m-%d')

                    else:
                        # If no date is provided, assume it's recent
                        date_str = datetime.now(pytz.UTC).strftime('%Y-%m-%d')

                    # Always include the URL even if we couldn't get a title
                    if not title:
                        title = "Article from " + url.split('/')[2]  # Use domain as fallback title

                    return {
                        'title': title,
                        'date': date_str,
                        'url': url
                    }

                except json.JSONDecodeError as e:
                    logger.error(f"JSON parsing error for {url}: {e}")
                    # Even if metadata parsing fails, try to return basic info
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
                    favor_recall=True  # Added to improve content extraction
                )
                if content:
                    return content

        except Exception as e:
            logger.error(f"Error extracting content from {url}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue

        time.sleep(retry_delay)

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
            delay = initial_delay * (2 ** attempt)  # Exponential backoff
            if attempt > 0:
                logger.info(f"Retry attempt {attempt + 1}/{max_retries} for {url}, waiting {delay} seconds")
                time.sleep(delay)

            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 429:
                logger.warning(f"Rate limit hit for {url}, backing off...")
                continue

            if response.status_code == 404:
                logger.warning(f"URL not found: {url}")
                return None

            response.raise_for_status()
            return response

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for {url}: {str(e)}")
            if attempt == max_retries - 1:
                raise

    raise TooManyRequestsError(f"Max retries exceeded for {url}")

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

    # Generic title patterns to exclude
    generic_titles = {
        'technology', 'sustainability', 'retail', 'business', 'news',
        'home', 'index', 'main', 'category', 'section', 'topics',
        'about', 'contact', 'privacy policy', 'terms'
    }

    # Check for generic single-word titles
    if title.strip() in generic_titles:
        logger.info(f"Excluding generic title: {title}")
        return False

    # Check for overly short titles (likely section headers)
    if len(title.split()) < 2:
        logger.info(f"Excluding too short title: {title}")
        return False

    # URL pattern checks
    url_patterns_to_exclude = [
        r'/category/',
        r'/section/',
        r'/topics?/',
        r'/tag/',
        r'/index',
        r'/about\b',
        r'/contact\b',
        r'/privacy\b',
        r'/terms\b',
        r'\?utm_'  # Exclude marketing UTM parameter URLs
    ]

    if any(re.search(pattern, url) for pattern in url_patterns_to_exclude):
        logger.info(f"Excluding category/section URL: {url}")
        return False

    # Minimum title length requirement (excluding very short titles)
    if len(title) < 20:  # Arbitrary minimum length for a reasonable article title
        logger.info(f"Excluding too short title: {title}")
        return False

    return True

def find_ai_articles(url: str, cutoff_time: datetime) -> List[Dict[str, str]]:
    """Find AI-related articles with improved filtering."""
    articles = []
    try:
        response = make_request_with_backoff(url)
        if not response:
            logger.error(f"Could not fetch content from {url}")
            return []

        # Additional delay between source processing
        time.sleep(2)

        soup = BeautifulSoup(response.text, 'html.parser')
        ai_keywords = [
            'ai', 'artificial intelligence', 'machine learning',
            'deep learning', 'neural network', 'generative ai',
            'chatgpt', 'large language model', 'llm',
            'ai development', 'ai technology', 'ai solution',
            'ai research', 'ai breakthrough', 'ai innovation'
        ]

        for link in soup.find_all('a', href=True):
            try:
                href = link['href']
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(url, href)

                link_text = (link.text or '').lower()
                title = link.get('title', '').lower()
                combined_text = f"{link_text} {title}"

                if any(keyword in combined_text for keyword in ai_keywords):
                    metadata = extract_metadata(href, cutoff_time)
                    if metadata:  # Removed early filtering here
                        articles.append(metadata)

            except Exception as e:
                logger.error(f"Error processing link {href}: {str(e)}")
                continue

        # Apply filtering only after gathering all articles
        filtered_articles = [
            article for article in articles 
            if is_specific_article(article)
        ]

        if filtered_articles:
            logger.info(f"Found {len(filtered_articles)} specific articles from {url}")

        return filtered_articles

    except TooManyRequestsError as e:
        logger.error(f"Rate limit exceeded for {url}: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Error finding AI articles from {url}: {str(e)}")
        return []