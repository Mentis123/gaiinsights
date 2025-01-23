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

        # Display articles for review
        for idx, article in enumerate(st.session_state.articles):
            with st.container():
                col1, col2 = st.columns([8, 2])
                with col1:
                    st.markdown(f"### {article['title']}")
                    st.markdown(f"**Source:** {article['source']}")
                    st.markdown(f"**URL:** [{article['url']}]({article['url']})")
                    st.markdown(f"**Published:** {article['published_date'].strftime('%Y-%m-%d')}")
                    st.markdown(f"**Relevance Score:** {article['relevance_score']:.1f}/10")
                    st.markdown("**Rationale:**")
                    rationale = st.text_area("Edit rationale", article['rationale'], key=f"rationale_{idx}")
                    article['rationale'] = rationale

                with col2:
                    if st.checkbox("Select", key=f"select_{idx}"):
                        if article not in st.session_state.selected_articles:
                            st.session_state.selected_articles.append(article)
                    else:
                        if article in st.session_state.selected_articles:
                            st.session_state.selected_articles.remove(article)

                st.divider()

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