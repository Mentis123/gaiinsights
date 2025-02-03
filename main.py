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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize session state with error handling
def init_session_state():
    try:
        if 'initialized' not in st.session_state:
            logger.info("Initializing session state")
            st.session_state.articles = []
            st.session_state.selected_articles = []
            st.session_state.scan_status = []
            st.session_state.test_mode = False
            st.session_state.processing_time = None
            st.session_state.initialized = True
            st.session_state.last_update = datetime.now()
            logger.info("Session state initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing session state: {str(e)}")
        st.error("Error initializing application. Please refresh the page.")

# Call initialization
init_session_state()

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
        client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

        # Truncate content and summary to manage token count
        content = article.get('content', '')[:2000]  # Limit content to first 2000 chars
        summary = article.get('summary', '')[:500]   # Limit summary to first 500 chars

        prompt = f"""Strictly evaluate if this article is about artificial intelligence, machine learning, or direct AI applications. Return JSON: {{"is_relevant": true/false, "reason": "brief reason"}}

        Only mark as relevant if the article primarily focuses on AI technology, not just mentions technical terms.

        Title: {article['title']}
        Content excerpt: {content}
        Summary excerpt: {summary}"""

        response = client.chat.completions.create(
            model="o3-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        # Parse the response text as JSON
        import json
        result = json.loads(response.choices[0].message.content)

        return {
            "is_relevant": result.get('is_relevant', False),
            "reason": result.get('reason', 'Not sufficiently AI-related')
        }

    except Exception as e:
        logger.error(f"Error in AI validation: {str(e)}")
        raise

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

def main():
    try:
        st.title("AI News Aggregation System")

        # Periodically check connection and update timestamp
        current_time = datetime.now()
        if 'last_update' in st.session_state:
            time_diff = (current_time - st.session_state.last_update).total_seconds()
            if time_diff > 300:  # 5 minutes
                logger.warning("Session may have been disconnected - reinitializing")
                init_session_state()
        st.session_state.last_update = current_time

        col1, col2 = st.sidebar.columns([2, 2])
        with col1:
            time_value = st.number_input("Time Period", min_value=1, value=1, step=1)
        with col2:
            time_unit = st.selectbox("Unit", ["Days", "Weeks"], index=0)

        # Add loading state to session if not present
        if 'is_fetching' not in st.session_state:
            st.session_state.is_fetching = False

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
                    all_articles = []
                    seen_urls = set()
                    progress_bar = st.progress(0)

                    status_placeholder = st.empty()
                    st.session_state.scan_status = []

                    for idx, source in enumerate(sources):
                        try:
                            current_time = datetime.now().strftime("%H:%M:%S")
                            status_msg = f"[{current_time}] Scanning: {source}"
                            st.session_state.scan_status.insert(0, status_msg)
                            logger.info(f"Processing source {source}")

                            days_to_subtract = time_value * 7 if time_unit == "Weeks" else time_value
                            cutoff_time = datetime.now() - timedelta(days=days_to_subtract)
                            ai_articles = find_ai_articles(source, cutoff_time)

                            if ai_articles:
                                status_msg = f"[{current_time}] Found {len(ai_articles)} potential AI articles from {source}"
                                st.session_state.scan_status.insert(0, status_msg)
                                logger.info(f"Found {len(ai_articles)} articles from {source}")

                            status_placeholder.code("\n".join(st.session_state.scan_status))

                            for article in ai_articles:
                                try:
                                    if article['url'] in seen_urls:
                                        continue

                                    logger.info(f"Processing article: {article['title']}")
                                    content = extract_full_content(article['url'])

                                    if content:
                                        analysis = summarize_article(content)
                                        if analysis:
                                            article_data = {
                                                **article,
                                                'content': content,
                                                'summary': analysis.get('summary', ''),
                                                'key_points': analysis.get('key_points', []),
                                                'ai_relevance': analysis.get('ai_relevance', '')
                                            }

                                            validation = validate_ai_relevance(article_data)

                                            if validation['is_relevant']:
                                                seen_urls.add(article['url'])
                                                all_articles.append({
                                                    **article_data,
                                                    'ai_confidence': 100,
                                                    'ai_validation': validation['reason']
                                                })

                                                status_msg = f"[{current_time}] Validated AI article: {article['title']}"
                                                st.session_state.scan_status.insert(0, status_msg)
                                                status_placeholder.code("\n".join(st.session_state.scan_status))
                                                logger.info(f"Validated article: {article['title']}")

                                except Exception as e:
                                    logger.error(f"Error processing article {article['url']}: {str(e)}")
                                    if "OpenAI API quota exceeded" in str(e):
                                        st.error("⚠️ OpenAI API quota exceeded")
                                        return
                                    continue

                            progress_bar.progress((idx + 1) / len(sources))

                        except Exception as e:
                            logger.error(f"Error processing source {source}: {str(e)}")
                            if "OpenAI API quota exceeded" in str(e):
                                st.error("⚠️ OpenAI API quota exceeded")
                                return
                            continue

                    progress_bar.empty()
                    status_placeholder.empty()

                    end_time = datetime.now()
                    elapsed_time = end_time - start_time
                    minutes = int(elapsed_time.total_seconds() // 60)
                    seconds = int(elapsed_time.total_seconds() % 60)
                    st.session_state.processing_time = f"{minutes} minutes and {seconds} seconds"

                    st.session_state.articles = all_articles

                    if len(all_articles) > 0:
                        st.success(f"Found {len(all_articles)} relevant AI articles!")
                        logger.info(f"Successfully completed with {len(all_articles)} articles")
                    else:
                        st.warning("No articles found. Please try again.")
                        logger.warning("Completed with no articles found")

                    st.session_state.is_fetching = False

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