import streamlit as st
from agents.search_agent import SearchAgent
from agents.evaluation_agent import EvaluationAgent
from agents.rationale_agent import RationaleAgent
from agents.review_agent import ReviewAgent
import yaml
import os

# Load configuration
with open('config.yaml', 'r') as file:
    config = yaml.safe_load(file)

def init_session_state():
    if 'articles' not in st.session_state:
        st.session_state.articles = []
    if 'selected_articles' not in st.session_state:
        st.session_state.selected_articles = []
    if 'current_step' not in st.session_state:
        st.session_state.current_step = 'search'

def main():
    st.set_page_config(
        page_title="AI News Aggregator",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    init_session_state()

    st.title("AI News Aggregation System")

    # Initialize agents
    search_agent = SearchAgent(config)
    evaluation_agent = EvaluationAgent()
    rationale_agent = RationaleAgent()
    review_agent = ReviewAgent()

    # Sidebar for controls
    with st.sidebar:
        st.header("Controls")
        if st.button("Start New Search"):
            st.session_state.current_step = 'search'
            st.session_state.articles = []
            st.session_state.selected_articles = []

    # Main workflow
    if st.session_state.current_step == 'search':
        st.subheader("🔍 Searching for Articles")
        with st.spinner("Fetching recent AI news..."):
            articles = search_agent.search()
            st.session_state.articles = articles
            st.session_state.current_step = 'evaluate'
            st.rerun()

    elif st.session_state.current_step == 'evaluate':
        st.subheader("⚖️ Evaluating Articles")
        with st.spinner("Evaluating article relevance..."):
            evaluated_articles = evaluation_agent.evaluate(st.session_state.articles)
            st.session_state.articles = evaluated_articles
            st.session_state.current_step = 'rationale'
            st.rerun()

    elif st.session_state.current_step == 'rationale':
        st.subheader("💡 Generating Rationales")
        with st.spinner("Generating article rationales..."):
            articles_with_rationales = rationale_agent.generate_rationales(st.session_state.articles)
            st.session_state.articles = articles_with_rationales
            st.session_state.current_step = 'review'
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
                    st.markdown(f"**Relevance Score:** {article['relevance_score']}/10")
                    st.markdown(f"**Rationale:**")
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
        
        with st.spinner("Generating reports..."):
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

if __name__ == "__main__":
    main()
