import trafilatura
import pandas as pd
from typing import List, Dict, Optional, Tuple
import requests
from bs4 import BeautifulSoup
import logging
import time
from datetime import datetime, timedelta
import pytz

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

                                    if date_obj < cutoff_utc:
                                        print(f"Article too old (cutoff {cutoff_time.date()}): {date_str}")
                                        return None
                                    break
                                except ValueError:
                                    continue
                        except Exception as e:
                            print(f"Date parsing error for {date_str}: {e}")
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
                    print(f"JSON parsing error for {url}: {e}")
                    # Even if metadata parsing fails, try to return basic info
                    return {
                        'title': "Article from " + url.split('/')[2],
                        'date': datetime.now(pytz.UTC).strftime('%Y-%m-%d'),
                        'url': url
                    }

    except Exception as e:
        print(f"Error extracting metadata from {url}: {str(e)}")
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
            print(f"Error extracting content from {url}: {str(e)}")
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

def find_ai_articles(url: str, cutoff_time: datetime) -> List[Dict[str, str]]:
    """Find AI-related articles from a given source URL with date validation."""
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

        # AI keywords (expanded but still focused)
        ai_keywords = [
            'ai', 'artificial intelligence', 'machine learning',
            'deep learning', 'neural network', 'generative ai',
            'chatgpt', 'large language model', 'llm',
            'ai development', 'ai technology', 'ai solution',
            'ai research', 'ai breakthrough', 'ai innovation'
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

            # Check for AI keywords
            if any(keyword in combined_text for keyword in ai_keywords):
                # Extract and validate metadata first
                metadata = extract_metadata(href, cutoff_time)
                if metadata:  # Only include if metadata with valid date was found
                    print(f"Found potential article: {metadata['title']}")
                    articles.append(metadata)

        return articles

    except Exception as e:
        print(f"Error finding AI articles from {url}: {str(e)}")
        return []