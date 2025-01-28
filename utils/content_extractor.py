import trafilatura
import pandas as pd
from typing import List, Dict, Optional, Tuple
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
                # Parse metadata
                try:
                    import json
                    meta_dict = json.loads(metadata)
                    date_str = meta_dict.get('date', '')

                    # Validate date immediately
                    if date_str:
                        try:
                            date_obj = datetime.strptime(str(date_str)[:10], '%Y-%m-%d')
                            if date_obj < cutoff_time:
                                print(f"Article too old (cutoff {cutoff_time.date()}): {date_str}")
                                return None
                        except ValueError:
                            # If can't parse date, assume it's recent
                            date_str = datetime.now().strftime('%Y-%m-%d')

                    return {
                        'title': meta_dict.get('title', ''),
                        'date': date_str,
                        'url': url
                    }
                except json.JSONDecodeError:
                    # If JSON parsing fails, try to extract basic metadata
                    return {
                        'title': '',
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'url': url
                    }

    except Exception as e:
        print(f"Error extracting metadata from {url}: {str(e)}")
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
                    with_metadata=False
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

        # AI keywords (strict matching)
        ai_keywords = [
            'ai', 'artificial intelligence', 'machine learning',
            'deep learning', 'neural network', 'generative ai',
            'chatgpt', 'large language model', 'llm',
            'ai development', 'ai technology', 'ai solution'
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

            # Check for AI keywords (strict matching)
            if any(keyword in combined_text for keyword in ai_keywords):
                # Extract and validate metadata first
                metadata = extract_metadata(href, cutoff_time)
                if metadata:  # Only include if metadata with valid date was found
                    articles.append(metadata)

        return articles

    except Exception as e:
        print(f"Error finding AI articles from {url}: {str(e)}")
        return []