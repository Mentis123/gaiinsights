import streamlit as st
from datetime import datetime
from utils.content_extractor import load_source_sites, find_ai_articles, extract_content
from utils.ai_analyzer import summarize_article
import pandas as pd
import json
import os

# Initialize session state
if 'articles' not in st.session_state:
    st.session_state.articles = []
if 'selected_articles' not in st.session_state:
    st.session_state.selected_articles = []
if 'scan_status' not in st.session_state:
    st.session_state.scan_status = []
if 'test_mode' not in st.session_state:
    st.session_state.test_mode = True

def main():
    st.set_page_config(
        page_title="AI News Aggregator",
        layout="wide",
        initial_sidebar_state="expanded",
        menu_items={
            'Get help': 'https://www.extremelycoolapp.com/help',
            'Report a bug': "https://www.extremelycoolapp.com/bug",
            'About': "# AI News Aggregation System",
            'settings': "settings"
        }
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
                st.session_state.scan_status.insert(0, f"Currently Scanning:\n{source}")

                ai_articles = find_ai_articles(source)
                if ai_articles:
                    st.session_state.scan_status.insert(0, f"Found {len(ai_articles)} AI articles from current source\n")
                    st.session_state.scan_status.insert(0, f"Analyzing and summarizing articles...\n")

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
            if st.button("Export"):
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

                if export_data:
                    df = pd.DataFrame(export_data)
                    csv = df.to_csv(index=False)
                    st.download_button(
                        "Download CSV",
                        csv,
                        "ai_news_report.csv",
                        "text/csv",
                        key='download-csv'
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

                st.markdown(f"**Industry relevance score:** {article.get('relevance_score', '0.0')}/10, {article.get('citations', '0')} citations, Relevance to retail/e-commerce: {article.get('retail_relevance', '0.0')}/10")
                st.markdown("**Summary:**")
                st.write(article.get('summary', 'No summary available'))
                st.markdown("**Key Points:**")
                for point in article.get('key_points', []):
                    st.markdown(f"- {point}")

    else:
        st.info("Click 'Fetch New Articles' to start gathering AI news.")

if __name__ == "__main__":
    main()