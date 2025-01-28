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

# Initialize session state
if 'articles' not in st.session_state:
    st.session_state.articles = []
if 'selected_articles' not in st.session_state:
    st.session_state.selected_articles = []
if 'scan_status' not in st.session_state:
    st.session_state.scan_status = []
if 'test_mode' not in st.session_state:
    st.session_state.test_mode = True

st.set_page_config(
    page_title="AI News Aggregator",
    layout="wide",
    initial_sidebar_state="expanded"
)

def generate_pdf(articles):
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
    table_data = [['Article Title', 'Date', 'Score', 'Rationale']]
    for article in articles:
        # Create a clickable link using ReportLab's paragraph with link
        title_with_link = Paragraph(
            f'<para><a href="{quote(article["url"])}">{article["title"]}</a></para>',
            link_style
        )

        table_data.append([
            title_with_link,
            Paragraph(article['date'] if isinstance(article['date'], str) else article['date'].strftime('%Y-%m-%d'), ParagraphStyle('Date', parent=styles['Normal'], fontSize=8)),
            Paragraph(f"{article['ai_confidence']:.1f}/100", ParagraphStyle('Score', parent=styles['Normal'], fontSize=8)),
            Paragraph(article['ai_validation'], ParagraphStyle('Rationale', parent=styles['Normal'], fontSize=8))
        ])

    # Create table with improved formatting
    col_widths = [4*inch, 0.8*inch, 0.7*inch, 4*inch]  # Adjusted column widths
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
        prompt = f"""
        Evaluate if this article contains meaningful AI-related content and return a JSON response in this format:
        {{"is_relevant": true/false, "reason": "explanation"}}

        Accept articles that:
        1. Discuss AI technology, development, or applications
        2. Provide insights about AI implementations or impact
        3. Cover AI research or industry developments
        4. Discuss practical applications of AI in various fields

        Reject only if:
        1. AI is mentioned purely as a buzzword without substance
        2. The article has no real connection to AI technology
        3. AI is only mentioned in passing without any meaningful context

        Article Title: {article['title']}
        Content: {article.get('content', '')}
        Summary: {article.get('summary', '')}
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse the response text as JSON
        import json
        result = json.loads(response.choices[0].message.content)

        return {
            "is_relevant": result.get('is_relevant', False),
            "reason": result.get('reason', 'Not sufficiently AI-related')
        }

    except Exception as e:
        print(f"Error in AI validation: {str(e)}")
        raise

def generate_csv(articles):
    """Generate CSV data from articles."""
    output = BytesIO()
    writer = pd.DataFrame([{
        'Title': article['title'],
        'URL': article['url'],
        'Date': article['date'],
        'Summary': article.get('summary', 'No summary available'),
        'AI Relevance': article.get('ai_validation', 'Not validated'),
        'Source': article.get('source', 'Unknown source')
    } for article in articles]).to_csv(output, index=False)
    return output.getvalue()

def main():
    st.title("AI News Aggregation System")

    # Fetch button in the sidebar
    if st.sidebar.button("Fetch New Articles"):
        try:
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

                        print(f"Processing source {idx + 1}/{len(sources)}: {source}")
                        cutoff_time = datetime.now() - timedelta(days=1)
                        ai_articles = find_ai_articles(source, cutoff_time)
                        if ai_articles:
                            status_msg = f"[{current_time}] Found {len(ai_articles)} potential AI articles from {source}"
                            st.session_state.scan_status.insert(0, status_msg)
                            print(f"Found {len(ai_articles)} potential AI articles")

                        # Display all status messages
                        status_placeholder.code("\n".join(st.session_state.scan_status))

                        for article in ai_articles:
                            if article['url'] in seen_urls:
                                continue

                            try:
                                print(f"Processing article: {article['title']}")
                                content = extract_full_content(article['url'])
                                if content:
                                    analysis = summarize_article(content)
                                    if analysis:
                                        validation = validate_ai_relevance({
                                            **article,
                                            'content': content,
                                            **analysis
                                        })

                                        if validation['is_relevant']:
                                            seen_urls.add(article['url'])
                                            all_articles.append({
                                                **article,
                                                'content': content,
                                                **analysis,
                                                'ai_confidence': 100,
                                                'ai_validation': validation['reason']
                                            })

                                            # Add status message for validated article
                                            status_msg = f"[{current_time}] Validated AI article: {article['title']}"
                                            st.session_state.scan_status.insert(0, status_msg)
                                            status_placeholder.code("\n".join(st.session_state.scan_status))
                                            print(f"Successfully validated article: {article['title']}")

                            except Exception as e:
                                print(f"Error processing article {article['url']}: {str(e)}")  # Enhanced error logging
                                if "OpenAI API quota exceeded" in str(e):
                                    st.error("⚠️ OpenAI API quota exceeded")
                                    return
                                continue

                        progress_bar.progress((idx + 1) / len(sources))

                    except Exception as e:
                        print(f"Error processing source {source}: {str(e)}")  # Enhanced error logging
                        if "OpenAI API quota exceeded" in str(e):
                            st.error("⚠️ OpenAI API quota exceeded")
                            return
                        continue

                progress_bar.empty()
                status_placeholder.empty()

                st.session_state.articles = all_articles

                if len(all_articles) > 0:
                    st.success(f"Found {len(all_articles)} relevant AI articles!")
                    print(f"Successfully completed with {len(all_articles)} articles")  # Added logging
                else:
                    st.warning("No articles found. Please try again.")
                    print("Completed with no articles found")  # Added logging

        except Exception as e:
            print(f"Critical error in main process: {str(e)}")  # Enhanced error logging
            st.error(f"An error occurred: {str(e)}")

    # Display articles and export options
    if st.session_state.articles:
        col1, col2 = st.columns([1, 1])
        with col1:
            if st.button("Export PDF"):
                try:
                    pdf_data = generate_pdf(st.session_state.articles)
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
                    csv_data = generate_csv(st.session_state.articles)
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

    else:
        st.info("Click 'Fetch New Articles' to start gathering AI news.")

    # Settings in sidebar
    with st.sidebar:
        with st.expander("Settings", expanded=False):
            st.session_state.test_mode = st.toggle("Test Mode", value=st.session_state.test_mode)

if __name__ == "__main__":
    main()