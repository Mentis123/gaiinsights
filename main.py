import streamlit as st
from agents.search_agent import SearchAgent
from agents.evaluation_agent import EvaluationAgent
from agents.rationale_agent import RationaleAgent
from agents.review_agent import ReviewAgent
import yaml
import os
import docx2txt
from datetime import datetime

def init_session_state():
    if 'articles' not in st.session_state:
        st.session_state.articles = []
    if 'selected_articles' not in st.session_state:
        st.session_state.selected_articles = []
    if 'current_step' not in st.session_state:
        st.session_state.current_step = 'upload_criteria'
    if 'evaluation_criteria' not in st.session_state:
        st.session_state.evaluation_criteria = None

def main():
    st.set_page_config(
        page_title="AI News Aggregator",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    init_session_state()

    st.title("AI News Aggregation System")

    # Initialize agents
    search_agent = None
    evaluation_agent = None
    rationale_agent = None
    review_agent = None

    # Sidebar for controls and status
    with st.sidebar:
        st.header("Progress")
        st.write(f"Current step: {st.session_state.current_step}")
        if st.button("Reset Process"):
            st.session_state.current_step = 'upload_criteria'
            st.session_state.articles = []
            st.session_state.selected_articles = []
            st.session_state.evaluation_criteria = None
            st.rerun()

    # Main workflow
    if st.session_state.current_step == 'upload_criteria':
        st.subheader("📄 Upload Evaluation Criteria")
        st.write("Please upload your evaluation criteria document (Word format)")

        uploaded_file = st.file_uploader("Choose a file", type=['docx'])

        if uploaded_file is not None:
            with st.spinner("Processing document..."):
                # Extract text from the Word document
                criteria_text = docx2txt.process(uploaded_file)
                st.session_state.evaluation_criteria = criteria_text

                st.success("Criteria uploaded successfully!")
                st.markdown("### Preview of uploaded criteria:")
                st.text_area("Criteria content", criteria_text, height=200)

                if st.button("Proceed to Search"):
                    st.session_state.current_step = 'search'
                    st.rerun()

    elif st.session_state.current_step == 'search':
        st.subheader("🔍 Searching for Articles")
        if st.session_state.evaluation_criteria:
            progress_bar = st.progress(0)
            status_text = st.empty()

            try:
                with st.spinner("Fetching relevant AI news..."):
                    status_text.text("Initializing search...")
                    progress_bar.progress(10)

                    search_agent = SearchAgent(yaml.safe_load(open('config.yaml')))
                    status_text.text("Searching for articles...")
                    progress_bar.progress(30)

                    articles = search_agent.search(st.session_state.evaluation_criteria)

                    if not articles:
                        st.error("No articles found. Please try again with different criteria.")
                        return

                    status_text.text(f"Found {len(articles)} articles...")
                    progress_bar.progress(100)

                    st.session_state.articles = articles
                    st.session_state.current_step = 'evaluate'
                    st.rerun()
            except Exception as e:
                st.error(f"Error during search: {str(e)}")
                if st.button("Retry Search"):
                    st.rerun()
        else:
            st.error("No evaluation criteria found. Please upload criteria first.")
            st.session_state.current_step = 'upload_criteria'
            st.rerun()

    elif st.session_state.current_step == 'evaluate':
        st.subheader("⚖️ Evaluating Articles")
        try:
            with st.spinner("Evaluating articles against your criteria..."):
                evaluation_agent = EvaluationAgent()
                evaluated_articles = evaluation_agent.evaluate(
                    st.session_state.articles,
                    st.session_state.evaluation_criteria
                )
                st.session_state.articles = evaluated_articles
                st.session_state.current_step = 'rationale'
                st.rerun()
        except Exception as e:
            st.error(f"Error during evaluation: {str(e)}")
            if st.button("Retry Evaluation"):
                st.rerun()

    elif st.session_state.current_step == 'rationale':
        st.subheader("💡 Generating Rationales")
        try:
            with st.spinner("Generating article rationales..."):
                rationale_agent = RationaleAgent()
                articles_with_rationales = rationale_agent.generate_rationales(
                    st.session_state.articles,
                    st.session_state.evaluation_criteria
                )
                st.session_state.articles = articles_with_rationales
                st.session_state.current_step = 'review'
                st.rerun()
        except Exception as e:
            st.error(f"Error generating rationales: {str(e)}")
            if st.button("Retry Rationale Generation"):
                st.rerun()

    elif st.session_state.current_step == 'review':
        st.subheader("👀 Review and Select Articles")

        # Add filter and sort options
        col1, col2 = st.columns(2)
        with col1:
            sort_by = st.selectbox(
                "Sort by",
                ["Relevance Score", "Date"],
                key="sort_by"
            )
        with col2:
            min_score = st.slider(
                "Minimum Score",
                0.0, 10.0, 0.0,
                step=0.5,
                key="min_score"
            )

        # Sort articles
        if sort_by == "Relevance Score":
            st.session_state.articles.sort(
                key=lambda x: x['relevance_score'],
                reverse=True
            )
        else:  # Date
            st.session_state.articles.sort(
                key=lambda x: x['published_date'],
                reverse=True
            )

        # Filter by score
        filtered_articles = [
            article for article in st.session_state.articles
            if article['relevance_score'] >= min_score
        ]

        # Display articles in a compact format
        for idx, article in enumerate(filtered_articles):
            with st.container():
                # Use columns for better layout
                select_col, content_col = st.columns([1, 6])

                with select_col:
                    if st.checkbox("Select", key=f"select_{idx}", value=article in st.session_state.selected_articles):
                        if article not in st.session_state.selected_articles:
                            st.session_state.selected_articles.append(article)
                    else:
                        if article in st.session_state.selected_articles:
                            st.session_state.selected_articles.remove(article)

                with content_col:
                    # Title and metadata row
                    title_col, meta_col = st.columns([3, 1])
                    with title_col:
                        st.markdown(f"### [{article['title']}]({article['url']})")
                    with meta_col:
                        st.markdown(
                            f"**Score:** {article['relevance_score']:.1f}/10 | "
                            f"**Date:** {article['published_date'].strftime('%Y-%m-%d')}"
                        )

                    # Rationale with edit option
                    st.markdown("**Rationale:**")
                    new_rationale = st.text_area(
                        "Edit rationale",
                        article['rationale'],
                        key=f"rationale_{idx}",
                        height=80
                    )
                    article['rationale'] = new_rationale

                st.divider()

        # Show selected count and generate report button
        st.markdown(f"**Selected Articles:** {len(st.session_state.selected_articles)}")
        if st.button("Generate Reports"):
            if len(st.session_state.selected_articles) > 0:
                st.session_state.current_step = 'report'
                st.rerun()
            else:
                st.warning("Please select at least one article.")

    elif st.session_state.current_step == 'report':
        st.subheader("📊 Generated Reports")

        try:
            with st.spinner("Generating reports..."):
                review_agent = ReviewAgent()
                pdf_path, csv_path = review_agent.generate_reports(st.session_state.selected_articles)

                col1, col2 = st.columns(2)
                with col1:
                    with open(pdf_path, 'rb') as pdf_file:
                        st.download_button(
                            label="Download PDF Report",
                            data=pdf_file,
                            file_name="ai_news_report.pdf",
                            mime="application/pdf"
                        )

                with col2:
                    with open(csv_path, 'rb') as csv_file:
                        st.download_button(
                            label="Download CSV Report",
                            data=csv_file,
                            file_name="ai_news_report.csv",
                            mime="text/csv"
                        )
        except Exception as e:
            st.error(f"Error generating reports: {str(e)}")
            if st.button("Retry Report Generation"):
                st.rerun()

if __name__ == "__main__":
    main()