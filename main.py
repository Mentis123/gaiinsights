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
        st.session_state.pdf_data = None  # Initialize PDF data
        st.session_state.csv_data = None  # Initialize CSV data
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
        # Create a clickable link using just the URL
        title_link = Paragraph(
            f'{article["title"]}<br/><a href="{article["url"]}" color="blue">{article["url"]}</a>',
            link_style
        )

        table_data.append([
            title_link,
            Paragraph(article['date'] if isinstance(article['date'], str) else article['date'].strftime('%Y-%m-%d'), 
                     ParagraphStyle('Date', parent=styles['Normal'], fontSize=8)),
            Paragraph(article.get('summary', 'No summary available'), 
                     ParagraphStyle('Summary', parent=styles['Normal'], fontSize=8)),
            Paragraph(article.get('ai_validation', 'Not validated'), 
                     ParagraphStyle('AI Relevance', parent=styles['Normal'], fontSize=8))
        ])

    # Create table with improved formatting
    col_widths = [4*inch, 0.8*inch, 3*inch, 2*inch]  # Adjusted column widths
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        # Header formatting
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),

        # Content formatting
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),

        # Borders and alignment
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 1), (2, -1), 'CENTER'),
    ]))

    elements.append(table)

    try:
        doc.build(elements)
        pdf_data = buffer.getvalue()
        buffer.close()
        return pdf_data
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        st.error("Error generating PDF report. Please try again.")
        return None

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



def process_batch(sources, cutoff_time, db, seen_urls, status_placeholder):
    """Process a batch of sources with simplified article handling"""
    batch_articles = []

    for source in sources:
        try:
            if source in st.session_state.processed_urls:
                continue

            current_time = datetime.now().strftime("%H:%M:%S")
            status_msg = f"[{current_time}] Scanning: {source}"
            st.session_state.scan_status.insert(0, status_msg)

            # Find AI articles
            ai_articles = find_ai_articles(source, cutoff_time)

            if ai_articles:
                status_msg = f"[{current_time}] Found {len(ai_articles)} AI articles from {source}"
                st.session_state.scan_status.insert(0, status_msg)

                for article in ai_articles:
                    try:
                        if article['url'] in seen_urls:
                            continue

                        content = extract_full_content(article['url'])
                        if content:
                            # Get article summary if possible, but don't block if it fails
                            try:
                                analysis = summarize_article(content)
                            except Exception as e:
                                logger.warning(f"Summary generation failed for {article['title']}: {e}")
                                analysis = {'summary': 'Summary generation failed', 'key_points': []}

                            # Save the article
                            article_data = {
                                'title': article['title'],
                                'url': article['url'],
                                'date': article['date'],
                                'summary': analysis.get('summary', 'No summary available'),
                                'source': source,
                                'ai_validation': "AI-related article found in scan"
                            }

                            batch_articles.append(article_data)
                            seen_urls.add(article['url'])

                            try:
                                db.save_article(article_data)
                            except Exception as e:
                                logger.error(f"Failed to save article to database: {e}")

                            status_msg = f"[{current_time}] Added: {article['title']}"
                            st.session_state.scan_status.insert(0, status_msg)

                    except Exception as e:
                        logger.error(f"Error processing article {article['url']}: {str(e)}")
                        continue

            st.session_state.processed_urls.add(source)

        except Exception as e:
            logger.error(f"Error processing source {source}: {str(e)}")
            continue

    return batch_articles

def main():
    try:
        st.title("AI News Aggregation System")

        # Add test mode toggle back to sidebar
        with st.sidebar:
            st.session_state.test_mode = st.toggle(
                "Test Mode",
                value=st.session_state.get('test_mode', False),
                help="In Test Mode, only Wired.com is scanned"
            )

        col1, col2 = st.sidebar.columns([2, 2])
        with col1:
            time_value = st.number_input("Time Period", min_value=1, value=1, step=1)
        with col2:
            time_unit = st.selectbox("Unit", ["Days", "Weeks"], index=0)

        fetch_button = st.sidebar.button(
            "Fetch New Articles",
            disabled=st.session_state.is_fetching,
            type="primary"
        )

        # Initialize URL management state
        if 'show_url_editor' not in st.session_state:
            st.session_state.show_url_editor = False
        if 'edit_mode' not in st.session_state:
            st.session_state.edit_mode = 'source'  # 'source' or 'test'

        # URL Editor buttons in sidebar
        col1, col2 = st.sidebar.columns(2)
        with col1:
            if st.button("Edit Source URLs"):
                st.session_state.show_url_editor = True
                st.session_state.edit_mode = 'source'
                # Load source URLs
                try:
                    from utils.content_extractor import load_source_sites
                    source_urls = load_source_sites(raw=True)
                    st.session_state.current_urls = '\n'.join(source_urls)
                except Exception as e:
                    logger.error(f"Error loading source URLs: {str(e)}")
                    st.session_state.current_urls = ""

        with col2:
            if st.button("Edit Test URLs"):
                st.session_state.show_url_editor = True
                st.session_state.edit_mode = 'test'
                # Load test URLs
                try:
                    test_urls_file = 'data/test_urls.csv'
                    if not os.path.exists(test_urls_file):
                        with open(test_urls_file, 'w', newline='') as f:
                            f.write("https://www.wired.com/\n")  # Default test URL

                    test_urls = []
                    with open(test_urls_file, 'r') as f:
                        for line in f:
                            if line.strip():
                                test_urls.append(line.strip())

                    st.session_state.current_urls = '\n'.join(test_urls)
                except Exception as e:
                    logger.error(f"Error loading test URLs: {str(e)}")
                    st.session_state.current_urls = "https://www.wired.com/"

        # Display modal dialog for URL editing when enabled
        if st.session_state.show_url_editor:
            # Create a modal-like dialog with a container
            with st.container():
                st.markdown("### URL Editor")

                # Show which mode we're editing
                mode_title = "Source URLs" if st.session_state.edit_mode == 'source' else "Test Mode URLs"
                st.subheader(f"Edit {mode_title}")

                # Display editable text area with the URLs
                edited_urls = st.text_area(
                    f"Edit URLs (one per line)",
                    value=st.session_state.current_urls,
                    height=400,
                    key="url_editor_area"
                )

                # Buttons for saving or canceling
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Save Changes"):
                        try:
                            # Get edited URLs and split into list
                            urls_list = edited_urls.strip().split('\n')
                            # Filter out empty lines
                            urls_list = [url.strip() for url in urls_list if url.strip()]

                            # Determine which file to save to
                            file_path = 'data/search_sites.csv' if st.session_state.edit_mode == 'source' else 'data/test_urls.csv'

                            # Save to CSV file
                            with open(file_path, 'w', newline='') as f:
                                for url in urls_list:
                                    f.write(f"{url}\n")

                            st.success(f"{mode_title} saved successfully!")

                            # Clear processed URLs to ensure new sites are scanned
                            st.session_state.processed_urls = set()

                            # Close the editor
                            st.session_state.show_url_editor = False
                            # Force page refresh for changes to take effect
                            st.rerun()

                        except Exception as e:
                            logger.error(f"Error saving URLs: {str(e)}")
                            st.error(f"Error saving URLs: {str(e)}")

                with col2:
                    if st.button("Cancel"):
                        st.session_state.show_url_editor = False
                        st.rerun()

        if fetch_button or st.session_state.is_fetching:
            st.session_state.is_fetching = True
            try:
                start_time = datetime.now()

                with st.spinner("Fetching AI news from sources..."):
                    sources = load_source_sites(test_mode=st.session_state.test_mode)
                    from utils.db_manager import DBManager
                    db = DBManager()

                    seen_urls = set()  # Reset seen URLs each time
                    progress_bar = st.progress(0)
                    status_placeholder = st.empty()

                    batch_size = 5
                    total_batches = (len(sources) + batch_size - 1) // batch_size

                    st.session_state.articles = []  # Reset articles list

                    for batch_idx in range(total_batches):
                        start_idx = batch_idx * batch_size
                        end_idx = min(start_idx + batch_size, len(sources))
                        current_batch = sources[start_idx:end_idx]

                        # Calculate cutoff time based on selected unit
                        if time_unit == "Weeks":
                            days_to_subtract = time_value * 7
                        else:  # Days
                            days_to_subtract = time_value

                        cutoff_time = datetime.now() - timedelta(days=days_to_subtract)
                        
                        # Log which mode we're using and the time period
                        mode_str = "TEST MODE" if st.session_state.test_mode else "NORMAL MODE"
                        logger.info(f"{mode_str} active - Time period: {time_value} {time_unit}, Cutoff: {cutoff_time}")

                        # Process current batch
                        batch_articles = process_batch(current_batch, cutoff_time, db, seen_urls, status_placeholder)

                        # Add articles to session state
                        if batch_articles:
                            st.session_state.articles.extend(batch_articles)

                        # Update progress
                        progress = (batch_idx + 1) / total_batches
                        progress_bar.progress(progress)

                    # Reset fetching state
                    st.session_state.is_fetching = False

                    # Show completion message and stats
                    end_time = datetime.now()
                    elapsed_time = end_time - start_time
                    minutes = int(elapsed_time.total_seconds() // 60)
                    seconds = int(elapsed_time.total_seconds() % 60)

                    if st.session_state.articles:
                        st.success(f"Found {len(st.session_state.articles)} AI articles!")
                        st.write(f"Processing time: {minutes}m {seconds}s")

                        # Store articles in session state if not already there
                        if 'current_articles' not in st.session_state:
                            st.session_state.current_articles = st.session_state.articles

                        # Store reports in session state to prevent regeneration
                        if 'pdf_data' not in st.session_state or not st.session_state.pdf_data:
                            st.session_state.pdf_data = generate_pdf_report(st.session_state.current_articles)
                        if 'csv_data' not in st.session_state or not st.session_state.csv_data:
                            st.session_state.csv_data = generate_csv_report(st.session_state.current_articles)

                        # Show export options in an expander
                        with st.expander("Export Options", expanded=True):
                            export_col1, export_col2 = st.columns([1, 1])

                            with export_col1:
                                if st.session_state.pdf_data:
                                    st.download_button(
                                        "📄 Download PDF Report",
                                        st.session_state.pdf_data,
                                        "ai_news_report.pdf",
                                        "application/pdf",
                                        use_container_width=True
                                    )

                            with export_col2:
                                if st.session_state.csv_data:
                                    st.download_button(
                                        "📊 Download CSV Report",
                                        st.session_state.csv_data,
                                        "ai_news_report.csv",
                                        "text/csv",
                                        use_container_width=True
                                    )

                        # Then show articles
                        st.write("### Found AI Articles")
                        for article in st.session_state.articles:
                            st.write("---")
                            st.markdown(f"### [{article['title']}]({article['url']})")
                            st.write(f"Published: {article['date']}")
                            st.write(article['summary'])
                    else:
                        st.warning("No articles found. Please try adjusting the time period or check the source sites.")

            except Exception as e:
                st.session_state.is_fetching = False
                st.error(f"An error occurred: {str(e)}")
                logger.error(f"Error in main process: {str(e)}")

    except Exception as e:
        st.error("An unexpected error occurred. Please refresh the page.")
        logger.error(f"Critical error: {str(e)}")

if __name__ == "__main__":
    main()