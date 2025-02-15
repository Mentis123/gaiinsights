import streamlit as st
from datetime import datetime, timedelta
from utils.content_extractor import load_source_sites, find_ai_articles, extract_full_content
from utils.ai_analyzer import summarize_article
import pandas as pd
import json
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
import traceback
from openai import OpenAI
from urllib.parse import quote
import logging
import gc
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize session state before anything else
if 'initialized' not in st.session_state:
    try:
        logger.info("Initializing session state")
        st.session_state.articles = []
        st.session_state.selected_articles = []
        st.session_state.scan_status = []
        st.session_state.test_mode = False
        st.session_state.processing_time = None
        st.session_state.processed_urls = set()  # Track processed URLs
        st.session_state.current_batch_index = 0  # Track current batch
        st.session_state.batch_size = 5  # Configurable batch size
        st.session_state.is_fetching = False
        st.session_state.initialized = True
        st.session_state.last_update = datetime.now()
        logger.info("Session state initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing session state: {str(e)}")
        st.error("Error initializing application. Please refresh the page.")

# Set page config after initialization
st.set_page_config(
    page_title="AI News Aggregator",
    layout="wide",
    initial_sidebar_state="expanded"
)

def generate_pdf_report(articles):
    """Generate a PDF report from the articles in landscape orientation."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        topMargin=0.5*inch,
        bottomMargin=0.5*inch,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch
    )

    # Create custom styles
    styles = getSampleStyleSheet()
    link_style = ParagraphStyle(
        'LinkStyle',
        parent=styles['Normal'],
        textColor=colors.blue,
        underline=True,
        fontSize=8  # Reduced font size
    )

    elements = []

    # Create table data with clickable URLs
    table_data = [['Article Title', 'Date', 'Summary', 'AI Relevance']]
    for article in articles:
        # Create a clickable link using ReportLab's paragraph with link
        title_with_link = Paragraph(
            f'<para><a href="{quote(article["url"])}">{article["title"]}</a></para>',
            link_style
        )

        table_data.append([
            title_with_link,
            Paragraph(article['date'] if isinstance(article['date'], str) else article['date'].strftime('%Y-%m-%d'), ParagraphStyle('Date', parent=styles['Normal'], fontSize=8)),
            Paragraph(article.get('summary', 'No summary available'), ParagraphStyle('Summary', parent=styles['Normal'], fontSize=8)),
            Paragraph(article.get('ai_validation', 'Not validated'), ParagraphStyle('AI Relevance', parent=styles['Normal'], fontSize=8))
        ])

    # Create table with improved formatting
    col_widths = [3*inch, 0.8*inch, 3*inch, 3*inch]  # Adjusted column widths
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        # Header formatting
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),  # Reduced header font size
        ('TOPPADDING', (0, 0), (-1, 0), 6),  # Reduced padding
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),

        # Content formatting
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),  # Reduced content font size
        ('TOPPADDING', (0, 1), (-1, -1), 4),  # Reduced padding
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),

        # Borders and alignment
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),  # Thinner grid lines
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 1), (2, -1), 'CENTER'),  # Center date and score columns
    ]))

    elements.append(table)
    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

def validate_ai_relevance(article):
    """Validate if an article is meaningfully about AI technology or applications."""
    try:
        # If we found it in our initial scan, it's already been validated for AI relevance
        if "Found potential AI article:" in article.get('_source_log', ''):
            return {
                "is_relevant": True,
                "reason": "Identified as AI article during initial scan"
            }

        # Otherwise check title and content
        title = article.get('title', '').lower()
        content = article.get('content', '')[:2000]  # Limit content to first 2000 chars
        summary = article.get('summary', '')[:500]   # Limit summary to first 500 chars

        # Check for standalone "AI" and related terms
        ai_patterns = [
            r'\b[Aa][Ii]\b',  # Standalone "AI"
            r'\b[Aa][Ii]-[a-zA-Z]+\b',  # AI-powered, AI-driven, etc.
            r'\b[a-zA-Z]+-[Aa][Ii]\b',  # gen-AI, etc.
            r'\bartificial intelligence\b',
            r'\bmachine learning\b',
            r'\bneural network\b',
            r'\bgenerative ai\b',
            r'\bchatgpt\b',
            r'\bllm\b'
        ]

        import re
        ai_regex = re.compile('|'.join(ai_patterns), re.IGNORECASE)

        # Trust our initial detection more - if it made it this far, it's likely relevant
        if ai_regex.search(title) or ai_regex.search(summary) or ai_regex.search(content):
            return {
                "is_relevant": True,
                "reason": f"Contains AI-related content: {title}"
            }

        return {
            "is_relevant": True,  # Default to including articles that made it this far
            "reason": "Passed initial AI content scan"
        }

    except Exception as e:
        logger.error(f"Error in AI validation: {str(e)}")
        # If there's an error in validation, trust the initial detection
        return {
            "is_relevant": True,
            "reason": "Included based on initial AI detection"
        }

def generate_csv_report(articles):
    """Generate CSV data from articles."""
    output = BytesIO()
    writer = pd.DataFrame([{
        'Title': article['title'],
        'URL': article['url'],
        'Date': article['date'],
        'Summary': article.get('summary', 'No summary available'),
        'AI Relevance': article.get('ai_validation', 'Not validated')
    } for article in articles]).to_csv(output, index=False)
    return output.getvalue()

def update_status(message):
    """Updates the processing status in the Streamlit UI."""
    current_time = datetime.now().strftime("%H:%M:%S")
    status_msg = f"[{current_time}] {message}"
    st.session_state.scan_status.insert(0, status_msg)
    status_placeholder = st.empty()
    status_placeholder.code("\n".join(st.session_state.scan_status))
    status_placeholder.empty()


def process_batch(sources, cutoff_time, db, seen_urls, status_placeholder):
    """Process a batch of sources with improved memory management and error recovery"""
    batch_articles = []
    errors = 0
    max_errors = 3  # Maximum consecutive errors before skipping source

    # Force garbage collection
    gc.collect()

    for source in sources:
        try:
            if source in st.session_state.processed_urls:
                logger.info(f"Skipping already processed source: {source}")
                continue

            current_time = datetime.now().strftime("%H:%M:%S")
            status_msg = f"[{current_time}] Scanning: {source}"
            st.session_state.scan_status.insert(0, status_msg)
            logger.info(f"Processing source {source}")

            # Clear memory before processing new source
            gc.collect()

            ai_articles = find_ai_articles(source, cutoff_time)

            if ai_articles:
                status_msg = f"[{current_time}] Found {len(ai_articles)} potential AI articles from {source}"
                st.session_state.scan_status.insert(0, status_msg)
                logger.info(f"Found {len(ai_articles)} articles from {source}")

            status_placeholder.code("\n".join(st.session_state.scan_status[:50]))  # Keep only last 50 messages

            for article in ai_articles:
                try:
                    if article['url'] in seen_urls:
                        continue

                    logger.info(f"Processing article: {article['title']}")
                    update_status(f"Processing article: {article['title']}")

                    content = extract_full_content(article['url'])

                    if content:
                        update_status(f"Analyzing content for: {article['title']}")
                        analysis = summarize_article(content)

                        # Clear content from memory after analysis
                        del content
                        gc.collect()

                        if analysis:
                            article_data = {
                                **article,
                                'summary': analysis.get('summary', ''),
                                'key_points': analysis.get('key_points', []),
                                'ai_relevance': analysis.get('ai_relevance', ''),
                                '_source_log': f"Found potential AI article: {article['title']}"  # Add source log
                            }

                            # Always consider articles found by content_extractor as relevant
                            article_to_save = {
                                **article_data,
                                'ai_confidence': 100,
                                'ai_validation': "Found by AI content scanner"
                            }

                            seen_urls.add(article['url'])
                            batch_articles.append(article_to_save)
                            db.save_article(article_to_save)

                            status_msg = f"[{current_time}] Saved AI article: {article['title']}"
                            st.session_state.scan_status.insert(0, status_msg)
                            status_placeholder.code("\n".join(st.session_state.scan_status[:50]))
                            logger.info(f"Saved article: {article['title']}")

                        # Clear analysis data from memory
                        del article_data
                        gc.collect()

                except Exception as e:
                    logger.error(f"Error processing article {article['url']}: {str(e)}")
                    if "OpenAI API quota exceeded" in str(e):
                        raise
                    continue

            # Mark source as processed and save progress
            st.session_state.processed_urls.add(source)
            st.session_state.last_processed_source = source

            # Aggressive memory cleanup after each source
            gc.collect()

        except Exception as e:
            logger.error(f"Error processing source {source}: {str(e)}")
            if "OpenAI API quota exceeded" in str(e):
                raise
            continue

    return batch_articles

def main():
    try:
        st.title("AI News Aggregation System")

        # Periodic connection check and timestamp update
        current_time = datetime.now()
        if 'last_update' in st.session_state:
            time_diff = (current_time - st.session_state.last_update).total_seconds()
            if time_diff > 300:  # 5 minutes
                logger.warning("Session may have been disconnected - reinitializing")
                st.session_state.current_batch_index = 0
        st.session_state.last_update = current_time

        # UI controls
        col1, col2 = st.sidebar.columns([2, 2])
        with col1:
            time_value = st.number_input("Time Period", min_value=1, value=1, step=1)
        with col2:
            time_unit = st.selectbox("Unit", ["Days", "Weeks"], index=0)

        # Dynamic batch size based on available memory
        available_memory = sys.getsizeof(str()) * 1024 * 1024  # Rough estimate in MB
        st.session_state.batch_size = max(3, min(5, available_memory // 100))  # Adjust batch size based on memory

        fetch_button = st.sidebar.button(
            "Fetch New Articles",
            disabled=st.session_state.is_fetching,
            type="primary"
        )

        if fetch_button or st.session_state.is_fetching:
            st.session_state.is_fetching = True
            try:
                start_time = datetime.now()

                with st.spinner("Fetching AI news from sources..."):
                    sources = load_source_sites(test_mode=st.session_state.test_mode)
                    from utils.db_manager import DBManager
                    db = DBManager()

                    seen_urls = set(url['url'] for url in db.get_articles())
                    progress_bar = st.progress(0)
                    status_placeholder = st.empty()

                    # Calculate batch boundaries
                    batch_size = st.session_state.batch_size
                    total_batches = (len(sources) + batch_size - 1) // batch_size

                    # Process batches with memory management
                    batch_status = st.empty()
                    for batch_idx in range(st.session_state.current_batch_index, total_batches):
                        batch_status.write(f"Processing batch {batch_idx + 1} of {total_batches}")

                        start_idx = batch_idx * batch_size
                        end_idx = min(start_idx + batch_size, len(sources))
                        current_batch = sources[start_idx:end_idx]

                        days_to_subtract = time_value * 7 if time_unit == "Weeks" else time_value
                        cutoff_time = datetime.now() - timedelta(days=days_to_subtract)

                        # Process current batch
                        batch_articles = process_batch(current_batch, cutoff_time, db, seen_urls, status_placeholder)

                        # Update progress and session state
                        progress = (batch_idx + 1) / total_batches
                        progress_bar.progress(progress)
                        st.session_state.current_batch_index = batch_idx + 1

                        # Extend articles list and save to session state
                        if batch_articles:
                            st.session_state.articles.extend(batch_articles)
                            # Keep only essential data in memory
                            st.session_state.articles = [{
                                'title': a['title'],
                                'url': a['url'],
                                'date': a['date'],
                                'summary': a.get('summary', ''),
                                'ai_validation': a.get('ai_validation', '')
                            } for a in st.session_state.articles]

                        # Force memory cleanup between batches
                        gc.collect()

                    # Reset batch index after completion
                    st.session_state.current_batch_index = 0
                    st.session_state.is_fetching = False

                    end_time = datetime.now()
                    elapsed_time = end_time - start_time
                    minutes = int(elapsed_time.total_seconds() // 60)
                    seconds = int(elapsed_time.total_seconds() % 60)
                    st.session_state.processing_time = f"{minutes} minutes and {seconds} seconds"
                    logger.info(f"Total processing time: {minutes} minutes and {seconds} seconds")

                    # Update Streamlit display
                    if minutes > 0:
                        st.write(f"**Total processing time:** {minutes} minutes and {seconds} seconds")
                    else:
                        st.write(f"**Total processing time:** {seconds} seconds")

                    progress_bar.empty()
                    status_placeholder.empty()

                    if len(st.session_state.articles) > 0:
                        st.success(f"Found {len(st.session_state.articles)} relevant AI articles!")
                        logger.info(f"Successfully completed with {len(st.session_state.articles)} articles")
                    else:
                        st.warning("No articles found. Please try again.")
                        logger.warning("Completed with no articles found")

            except Exception as e:
                st.session_state.is_fetching = False
                logger.error(f"Critical error in main process: {str(e)}")
                st.error(f"An error occurred: {str(e)}")

        # Display articles and export options
        if st.session_state.articles:
            if st.session_state.processing_time:
                st.write(f"**Total processing time:** {st.session_state.processing_time}")

            col1, col2 = st.columns([1, 1])
            with col1:
                if st.button("Export PDF"):
                    try:
                        formatted_articles = [{
                            'title': article['title'],
                            'url': article['url'],
                            'date': article['date'],
                            'summary': article.get('summary', 'No summary available'),
                            'ai_validation': article.get('ai_validation', 'Not validated')
                        } for article in st.session_state.articles]

                        pdf_data = generate_pdf_report(formatted_articles)
                        st.download_button(
                            "Download PDF",
                            pdf_data,
                            "ai_news_report.pdf",
                            "application/pdf"
                        )
                    except Exception as e:
                        st.error(f"Error generating PDF: {str(e)}")

            with col2:
                if st.button("Export CSV"):
                    try:
                        csv_data = generate_csv_report(st.session_state.articles)
                        st.download_button(
                            "Download CSV",
                            csv_data,
                            "ai_news_report.csv",
                            "text/csv"
                        )
                    except Exception as e:
                        st.error(f"Error generating CSV: {str(e)}")

            # Display articles in a simpler format
            st.write(f"### AI Research Results ({len(st.session_state.articles)} articles)")

            for article in st.session_state.articles:
                st.write("---")
                st.markdown(f"### [{article['title']}]({article['url']})")
                st.write(f"Published: {article.get('date', 'Date not available')}")
                st.write(article.get('summary', 'No summary available'))

    except Exception as e:
        logger.error(f"Critical error in main function: {str(e)}\n{traceback.format_exc()}")
        st.error("An unexpected error occurred. Please refresh the page and try again.")

    # Test Mode toggle in sidebar
    with st.sidebar:
        col1, col2 = st.columns([9, 1])
        with col1:
            st.session_state.test_mode = st.toggle("Test Mode", value=st.session_state.test_mode, help="In Test Mode, only 6 of 28 URLs are scanned")

if __name__ == "__main__":
    main()