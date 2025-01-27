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
    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                try:
                    extracted = trafilatura.extract(
                        downloaded,
                        include_links=True,
                        include_images=True,
                        include_tables=True,
                        with_metadata=True
                    )

                    if extracted:
                        # Handle metadata extraction
                        metadata = {}
                        if isinstance(extracted, dict):
                            metadata = extracted
                            content = metadata.get('text', '')
                            title = metadata.get('title', '')
                            date = metadata.get('date', '')
                        else:
                            # If not a dict, treat as plain text content
                            content = extracted
                            title = ''
                            date = datetime.now().strftime('%Y-%m-%d')

                        # Validate the date
                        if date:
                            try:
                                date_obj = datetime.strptime(str(date)[:10], '%Y-%m-%d')
                                now = datetime.now()
                                # Include articles from today and yesterday (last 24 hours)
                                cutoff_time = now - timedelta(days=1)
                                if date_obj < cutoff_time:
                                    print(f"Article too old (cutoff {cutoff_time.date()}): {date}")
                                    return None
                            except ValueError:
                                print(f"Invalid date format: {date}")
                                date = datetime.now().strftime('%Y-%m-%d')

                        return {
                            'title': title,
                            'text': content,
                            'date': date,
                            'url': url
                        }

                except Exception as e:
                    print(f"Error parsing content from {url}: {str(e)}")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        continue
                    return None

        except Exception as e:
            print(f"Error downloading content from {url}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
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

        # AI implementation and news keywords (strict matching)
        ai_keywords = [
            'ai', 'artificial intelligence', 'machine learning',
            'deep learning', 'neural network', 'generative ai',
            'chatgpt', 'large language model', 'llm',
            'ai development', 'ai technology', 'ai solution',
            'ai platform', 'ai integration', 'ai implementation'
        ]

        # AI applications and use cases (less strict matching)
        ai_applications = [
            'automation', 'robotics', 'computer vision',
            'nlp', 'natural language', 'predictive',
            'algorithm', 'data science', 'analytics',
            'intelligent', 'smart', 'autonomous',
            'cognitive', 'digital assistant', 'virtual assistant'
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

            # Check for AI keywords (strict matching)
            ai_keyword_matches = sum(1 for keyword in ai_keywords if keyword.lower() in combined_text)

            # Check for AI applications (less strict matching)
            ai_application_matches = sum(1 for app in ai_applications if app.lower() in combined_text)

            # Include article if:
            # 1. Contains at least one AI keyword, or
            # 2. Contains multiple AI application terms
            if ai_keyword_matches > 0 or ai_application_matches >= 2:
                articles.append({
                    'url': href,
                    'title': link.text.strip() or link.get('title', '').strip()
                })

        return articles
    except Exception as e:
        print(f"Error finding AI articles from {url}: {e}")
        return []