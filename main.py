import streamlit as st
from datetime import datetime
from utils.content_extractor import load_source_sites, find_ai_articles, extract_content
from utils.ai_analyzer import summarize_article
import pandas as pd
import json
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO

# Initialize session state
if 'articles' not in st.session_state:
    st.session_state.articles = []
if 'selected_articles' not in st.session_state:
    st.session_state.selected_articles = []
if 'scan_status' not in st.session_state:
    st.session_state.scan_status = []
if 'test_mode' not in st.session_state:
    st.session_state.test_mode = True

def generate_pdf(articles):
    """Generate a PDF report from the articles."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30
    )
    story.append(Paragraph("AI News Report", title_style))
    story.append(Spacer(1, 20))

    # Date
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=30
    )
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", date_style))
    story.append(Spacer(1, 20))

    # Articles
    for article in articles:
        # Article Title with URL
        title_style = ParagraphStyle(
            'ArticleTitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=10
        )
        story.append(Paragraph(f"{article['title']}", title_style))
        story.append(Paragraph(f"Source: {article['url']}", styles['Italic']))
        story.append(Spacer(1, 10))

        # Summary
        if article.get('summary'):
            story.append(Paragraph("<b>Summary:</b>", styles['Normal']))
            story.append(Paragraph(article['summary'], styles['Normal']))
            story.append(Spacer(1, 10))

        # Key Points
        if article.get('key_points'):
            story.append(Paragraph("<b>Key Points:</b>", styles['Normal']))
            for point in article['key_points']:
                story.append(Paragraph(f"• {point}", styles['Normal']))

        story.append(Paragraph(f"Published: {article.get('date', 'Date not available')}", styles['Normal']))
        story.append(Spacer(1, 20))

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

def main():
    st.set_page_config(
        page_title="AI News Aggregator",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    st.title("AI News Aggregation System")

    # Fetch button in the sidebar
    if st.sidebar.button("Fetch New Articles"):
        with st.spinner("Fetching AI news from sources..."):
            sources = load_source_sites(test_mode=st.session_state.test_mode)
            all_articles = []
            progress_bar = st.progress(0)

            # Create a placeholder for the source status
            status_container = st.empty()
            st.session_state.scan_status = []  # Clear previous status

            # Process sources in reverse order for display
            for idx, source in enumerate(reversed(sources)):
                # Update the status at the top
                st.session_state.scan_status.insert(0, f"Currently Scanning: {source}")

                ai_articles = find_ai_articles(source)
                if ai_articles:
                    st.session_state.scan_status.insert(0, f"Found {len(ai_articles)} AI articles from current source")
                    st.session_state.scan_status.insert(0, "Analyzing and summarizing articles...")

                # Show last 5 status messages with proper line breaks
                status_text = "\n".join(st.session_state.scan_status[:5])
                status_container.markdown(status_text)

                for article in ai_articles:
                    content = extract_content(article['url'])
                    if content:
                        analysis = summarize_article(content)
                        if analysis:
                            all_articles.append({
                                **article,
                                **content,
                                **analysis
                            })
                progress_bar.progress((idx + 1) / len(sources))

            st.session_state.articles = all_articles
            st.session_state.scan_status = []  # Clear status after completion
            status_container.empty()
            st.success(f"Found {len(all_articles)} AI-related articles!")

    # Main content area
    if st.session_state.articles:
        # Export options at the top
        col1, col2 = st.columns([1, 8])
        with col1:
            if st.button("Export All" if not st.session_state.selected_articles else "Export Selected"):
                articles_to_export = st.session_state.selected_articles if st.session_state.selected_articles else st.session_state.articles
                pdf_data = generate_pdf(articles_to_export)

                # Create a download button for the PDF
                st.download_button(
                    "Download PDF",
                    pdf_data,
                    "ai_news_report.pdf",
                    "application/pdf"
                )

        # Display articles with selection checkboxes
        st.write(f"Research Results")
        st.caption(f"Found {len(st.session_state.articles)} relevant articles from the past week")

        for idx, article in enumerate(st.session_state.articles):
            with st.container():
                st.write("---")
                col1, col2 = st.columns([8, 1])
                with col1:
                    st.markdown(f"### [{article['title']}]({article['url']})")
                with col2:
                    if st.checkbox("Select", key=f"select_{idx}"):
                        if article not in st.session_state.selected_articles:
                            st.session_state.selected_articles.append(article)
                    elif article in st.session_state.selected_articles:
                        st.session_state.selected_articles.remove(article)

                st.markdown("**Summary:**")
                st.write(article.get('summary', 'No summary available'))
                st.markdown("**Key Points:**")
                for point in article.get('key_points', []):
                    st.markdown(f"- {point}")
                st.markdown(f"Published: {article.get('date', 'Date not available')}")

    else:
        st.info("Click 'Fetch New Articles' to start gathering AI news.")

    # Settings in sidebar - at the bottom
    with st.sidebar:
        with st.expander("Settings", expanded=False):
            st.session_state.test_mode = st.toggle("Test Mode", value=st.session_state.test_mode)

if __name__ == "__main__":
    main()