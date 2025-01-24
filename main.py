import streamlit as st
from datetime import datetime
from utils.content_extractor import load_source_sites, find_ai_articles, extract_content
from utils.ai_analyzer import summarize_article
import pandas as pd
import json
import os

def init_session_state():
    if 'articles' not in st.session_state:
        st.session_state.articles = []
    if 'selected_articles' not in st.session_state:
        st.session_state.selected_articles = []

def main():
    st.set_page_config(
        page_title="AI News Aggregator",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    init_session_state()

    st.title("AI News Aggregation System")

    # Sidebar for controls and filtering
    with st.sidebar:
        st.header("Controls")
        if st.button("Fetch New Articles"):
            with st.spinner("Fetching AI news from sources..."):
                sources = load_source_sites()
                all_articles = []
                progress_bar = st.progress(0)

                for idx, source in enumerate(sources):
                    st.write(f"Scanning: {source}")
                    ai_articles = find_ai_articles(source)
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
                st.success(f"Found {len(all_articles)} AI-related articles!")

        # Filtering options
        st.header("Filters")
        min_impact = st.slider("Minimum Impact Score", 1, 10, 1)

    # Main content area
    if st.session_state.articles:
        # Filter articles based on impact score
        filtered_articles = [
            article for article in st.session_state.articles 
            if article.get('impact_score', 0) >= min_impact
        ]

        st.write(f"Showing {len(filtered_articles)} articles")

        # Display articles
        for idx, article in enumerate(filtered_articles):
            with st.expander(f"{article['title']} - Impact: {article.get('impact_score', 'N/A')}/10"):
                cols = st.columns([3, 1])
                with cols[0]:
                    st.markdown(f"**Source:** [{article['url']}]({article['url']})")
                    st.markdown("**Summary:**")
                    st.write(article.get('summary', 'No summary available'))
                    st.markdown("**Key Points:**")
                    for point in article.get('key_points', []):
                        st.markdown(f"- {point}")
                with cols[1]:
                    st.markdown("**AI Relevance:**")
                    st.write(article.get('ai_relevance', 'Not analyzed'))
                    if st.checkbox("Select for Report", key=f"select_{idx}"):
                        if article not in st.session_state.selected_articles:
                            st.session_state.selected_articles.append(article)
                    elif article in st.session_state.selected_articles:
                        st.session_state.selected_articles.remove(article)

        # Export options
        if st.session_state.selected_articles:
            st.header("Export Options")
            cols = st.columns(2)

            # Prepare export data
            export_data = []
            for article in st.session_state.selected_articles:
                export_data.append({
                    'Title': article['title'],
                    'URL': article['url'],
                    'Date': article.get('date', ''),
                    'Summary': article.get('summary', ''),
                    'Key Points': ', '.join(article.get('key_points', [])),
                    'AI Relevance': article.get('ai_relevance', ''),
                    'Impact Score': article.get('impact_score', '')
                })

            # CSV Export
            with cols[0]:
                df = pd.DataFrame(export_data)
                csv = df.to_csv(index=False)
                st.download_button(
                    "Download CSV",
                    csv,
                    "ai_news_report.csv",
                    "text/csv",
                    key='download-csv'
                )

            # PDF Export
            with cols[1]:
                from reportlab.lib import colors
                from reportlab.lib.pagesizes import letter
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

                pdf_path = "reports/ai_news_report.pdf"
                os.makedirs("reports", exist_ok=True)

                doc = SimpleDocTemplate(pdf_path, pagesize=letter)
                styles = getSampleStyleSheet()
                story = []

                # Title
                story.append(Paragraph(f"AI News Report - {datetime.now().strftime('%Y-%m-%d')}", styles['Heading1']))
                story.append(Spacer(1, 12))

                # Articles
                for article in st.session_state.selected_articles:
                    story.append(Paragraph(article['title'], styles['Heading2']))
                    story.append(Paragraph(f"Source: {article['url']}", styles['BodyText']))
                    story.append(Paragraph("Summary:", styles['Heading3']))
                    story.append(Paragraph(article.get('summary', 'No summary available'), styles['BodyText']))
                    story.append(Paragraph("Key Points:", styles['Heading3']))
                    for point in article.get('key_points', []):
                        story.append(Paragraph(f"• {point}", styles['BodyText']))
                    story.append(Paragraph(f"Impact Score: {article.get('impact_score', 'N/A')}/10", styles['BodyText']))
                    story.append(Spacer(1, 12))

                doc.build(story)

                with open(pdf_path, "rb") as pdf_file:
                    st.download_button(
                        "Download PDF",
                        pdf_file,
                        "ai_news_report.pdf",
                        "application/pdf",
                        key='download-pdf'
                    )

    else:
        st.info("Click 'Fetch New Articles' to start gathering AI news.")

if __name__ == "__main__":
    main()