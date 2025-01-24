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
    if 'test_mode' not in st.session_state:
        st.session_state.test_mode = True

def main():
    # Initialize session state first
    init_session_state()

    st.set_page_config(
        page_title="AI News Aggregator",
        layout="wide",
        initial_sidebar_state="expanded",
        menu_items={
            'Get Help': 'https://www.extremelycoolapp.com/help',
            'Report a bug': "https://www.extremelycoolapp.com/bug",
            'About': "# AI News Aggregation System",
            'Settings': {
                'Test Mode': st.session_state.test_mode
            }
        }
    )

    st.title("AI News Aggregation System")

    # Sidebar for controls
    with st.sidebar:
        st.header("Controls")
        if st.button("Fetch New Articles"):
            with st.spinner("Fetching AI news from sources..."):
                sources = load_source_sites(test_mode=st.session_state.test_mode)
                st.write(f"Debug: Found {len(sources)} sources")  # Debug line
                all_articles = []
                progress_bar = st.progress(0)

                # Create a placeholder for the source status
                status_container = st.empty()

                # Process sources in reverse order for display
                for idx, source in enumerate(reversed(sources)):
                    # Update the status at the top
                    status_container.markdown(f"**Currently Scanning:** {source}")

                    # Debug logging
                    st.write(f"Debug: Searching {source}")
                    ai_articles = find_ai_articles(source)
                    st.write(f"Debug: Found {len(ai_articles)} AI articles from {source}")

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
                # Clear the status container after completion
                status_container.empty()
                st.success(f"Found {len(all_articles)} AI-related articles!")

    # Main content area
    if st.session_state.articles:
        st.write(f"Showing {len(st.session_state.articles)} articles")

        # Display articles
        for idx, article in enumerate(st.session_state.articles):
            with st.expander(f"{article['title']}"):
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
                    'AI Relevance': article.get('ai_relevance', '')
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
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet

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