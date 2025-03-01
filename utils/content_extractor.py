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

import os

def load_source_sites(test_mode: bool = False, raw: bool = False) -> List[str]:
    """
    Loads source sites from CSV file. 
    If test_mode is True, returns URLs from test_urls.csv.
    If raw is True, returns the raw URL strings without processing.
    """
    try:
        # Choose which file to load based on mode
        file_path = 'data/test_urls.csv' if test_mode else 'data/search_sites.csv'
        
        # Create default test file if it doesn't exist
        if test_mode and not os.path.exists(file_path):
            os.makedirs('data', exist_ok=True)
            with open(file_path, 'w') as f:
                f.write("https://www.wired.com/\n")
        
        # Load URLs from appropriate file
        sites = []
        with open(file_path, 'r') as f:
            for line in f:
                if line.strip():
                    sites.append(line.strip())

        # If raw mode, return unfiltered list
        if raw and not test_mode:
            return sites

        return sites
    except Exception as e:
        print(f"Error loading source sites: {e}")
        # Return a default URL if nothing else works
        return ["https://www.wired.com/"] if test_mode else []

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
    """
    Extract full content with multiple fallback strategies
    for better coverage across different site structures
    """
    max_retries = 3
    retry_delay = 2  # Increased to avoid rate limiting

    # Define extraction methods in order of preference
    extraction_methods = [
        _extract_with_trafilatura,
        _extract_with_newspaper,
        _extract_with_beautifulsoup
    ]

    # Try each method until success
    for method in extraction_methods:
        for attempt in range(max_retries):
            try:
                content = method(url)
                if content and len(content.strip()) > 100:  # Ensure we got meaningful content
                    # Clean content for better quality
                    content = _clean_extracted_content(content)
                    return content

            except Exception as e:
                logger.error(f"Error with {method.__name__} from {url} (attempt {attempt + 1}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                    continue

    # If all methods fail, return None
    logger.error(f"All extraction methods failed for {url}")
    return None

def _extract_with_trafilatura(url: str) -> Optional[str]:
    """Extract content using trafilatura library"""
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
        return content
    return None

def _extract_with_newspaper(url: str) -> Optional[str]:
    """Extract content using newspaper3k library"""
    try:
        # Only import if needed to avoid dependency issues
        import newspaper
        article = newspaper.Article(url)
        article.download()
        article.parse()
        return article.text
    except ImportError:
        logger.warning("newspaper3k library not available, skipping this extraction method")
        return None
    except Exception as e:
        logger.error(f"newspaper3k extraction error: {str(e)}")
        return None

def _extract_with_beautifulsoup(url: str) -> Optional[str]:
    """Extract content using BeautifulSoup with article detection heuristics"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            element.decompose()

        # Try common article containers
        article_containers = [
            soup.find('article'),
            soup.find(class_=lambda c: c and ('article' in c.lower() or 'content' in c.lower())),
            soup.find(id=lambda i: i and ('article' in i.lower() or 'content' in i.lower())),
            soup.find('div', class_=lambda c: c and ('post' in c.lower())),
            soup.find('main')
        ]

        for container in article_containers:
            if container:
                # Extract paragraphs from container
                paragraphs = container.find_all('p')
                if paragraphs:
                    return '\n\n'.join(p.get_text().strip() for p in paragraphs)

        # Fallback to extracting all paragraphs with length filtering
        all_paragraphs = soup.find_all('p')
        meaningful_paragraphs = [p.get_text().strip() for p in all_paragraphs if len(p.get_text().strip()) > 40]
        if meaningful_paragraphs:
            return '\n\n'.join(meaningful_paragraphs)

        return None
    except Exception as e:
        logger.error(f"BeautifulSoup extraction error: {str(e)}")
        return None

def _clean_extracted_content(content: str) -> str:
    """Clean and normalize extracted content"""
    import re

    # Remove excessive whitespace
    content = re.sub(r'\s+', ' ', content)

    # Remove common newsletter/subscription patterns
    content = re.sub(r'Subscribe to our newsletter.*?\.', '', content, flags=re.IGNORECASE)
    content = re.sub(r'Sign up for our.*?newsletter.*?\.', '', content, flags=re.IGNORECASE)

    # Remove URL artifacts
    content = re.sub(r'https?://\S+', '', content)

    # Split into paragraphs for better readability
    paragraphs = [p.strip() for p in content.split('\n') if p.strip()]
    content = '\n\n'.join(paragraphs)

    return content.strip()

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

def find_ai_articles(source_url, cutoff_time):
    """Find AI-related articles from a source URL"""
    print(f"Searching with cutoff time: {cutoff_time}")  # Debug logging
    articles = []
    seen_urls = set()
    seen_titles = []

    try:
        response = make_request_with_backoff(source_url)
        if not response:
            logger.error(f"Could not fetch content from {source_url}")
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

        logger.info(f"Scanning URL: {source_url}")

        for link in soup.find_all('a', href=True):
            try:
                href = link['href']
                if not href.startswith(('http://', 'https://')):
                    href = urljoin(source_url, href)

                link_text = (link.text or '').strip()
                title = link.get('title', '').strip() or link_text

                if ai_regex.search(title):
                    logger.info(f"Found potential AI article: {title}")
                    metadata = extract_metadata(href, cutoff_time)

                    if metadata:
                        # Parse the article date
                        try:
                            article_date = datetime.strptime(metadata['date'], '%Y-%m-%d')
                            # Add UTC timezone to match cutoff_time
                            article_date = pytz.UTC.localize(article_date)

                            # Ensure cutoff_time is timezone aware
                            if not cutoff_time.tzinfo:
                                cutoff_time = pytz.UTC.localize(cutoff_time)

                            # Only add articles that are newer than or equal to cutoff time
                            if article_date >= cutoff_time:
                                logger.info(f"Found AI article within time range: {title} ({metadata['date']})")
                                if metadata['url'] not in seen_urls:
                                    articles.append({
                                        'title': title,
                                        'url': href,
                                        'date': metadata['date'],
                                        'source': source_url
                                    })
                                    seen_urls.add(href)
                            else:
                                logger.info(f"Skipping article older than cutoff: {title} ({metadata['date']})")
                        except ValueError as e:
                            logger.error(f"Error parsing date for article {title}: {e}")
                            continue

            except Exception as e:
                logger.error(f"Error processing link: {str(e)}")
                continue

        logger.info(f"Found {len(articles)} articles from {source_url}")
        return articles

    except Exception as e:
        logger.error(f"Error finding AI articles from {source_url}: {str(e)}")
        return []