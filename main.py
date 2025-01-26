import streamlit as st
from datetime import datetime
from utils.content_extractor import load_source_sites, find_ai_articles, extract_content
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
    """Validate if an article is truly AI-related with stricter criteria."""
    try:
        client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        prompt = f"""
        Strictly evaluate if this article is genuinely about artificial intelligence technology, development, or applications.

        Required Criteria - ALL must be met:
        1. The article MUST be primarily focused on AI technology, development, or direct applications
        2. It MUST contain specific technical details or concrete information about AI
        3. It MUST discuss actual AI systems, models, or implementations

        Automatic Rejection Criteria - ANY of these disqualify the article:
        1. Only mentions AI in passing or as a buzzword
        2. Primarily about business/stock news with minimal AI content
        3. Generic tech news that barely touches on AI
        4. Celebrity/entertainment news that happens to mention AI
        5. Articles that just speculate about AI without technical substance

        Article Title: {article['title']}
        Summary: {article.get('summary', '')}
        Key Points: {', '.join(article.get('key_points', []))}

        Return a JSON response with:
        {{
            "is_relevant": true/false,
            "confidence": 0-100,
            "reason": "Detailed explanation of why this is or isn't a genuine AI article"
        }}
        """

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)

            if result.get('is_relevant', False) and result.get('confidence', 0) >= 75:  # Increased threshold
                return result
            return {
                "is_relevant": False, 
                "confidence": 0, 
                "reason": result.get('reason', 'Did not meet strict AI relevance criteria')
            }
        except Exception as api_error:
            if "quota" in str(api_error).lower() or "rate limit" in str(api_error).lower():
                raise Exception("OpenAI API quota exceeded. Please check your API key balance.")
            raise  # Re-raise other API errors

    except Exception as e:
        print(f"Error in AI validation: {str(e)}")
        raise  # Re-raise the error to be handled by the calling function

def main():
    st.title("AI News Aggregation System")

    # Fetch button in the sidebar
    if st.sidebar.button("Fetch New Articles"):
        try:
            with st.spinner("Fetching AI news from sources..."):
                sources = load_source_sites(test_mode=st.session_state.test_mode)
                all_articles = []
                seen_urls = set()  # Track unique URLs
                progress_bar = st.progress(0)

                # Create a container for status messages with custom styling
                status_placeholder = st.empty()
                st.session_state.scan_status = []

                for idx, source in enumerate(reversed(sources)):
                    try:
                        # Add status message with timestamp
                        current_time = datetime.now().strftime("%H:%M:%S")
                        st.session_state.scan_status.insert(0, f"[{current_time}] Scanning: {source}")

                        ai_articles = find_ai_articles(source)
                        if ai_articles:
                            st.session_state.scan_status.insert(0, f"[{current_time}] Found {len(ai_articles)} potential AI articles")
                            st.session_state.scan_status.insert(0, f"[{current_time}] Analyzing and validating articles...")

                        # Display status messages with line breaks
                        status_text = "\n".join(st.session_state.scan_status[:10])  # Show last 10 messages
                        status_placeholder.markdown(f"```\n{status_text}\n```")

                        for article in ai_articles:
                            # Skip if we've already processed this URL
                            if article['url'] in seen_urls:
                                continue

                            try:
                                content = extract_content(article['url'])
                                if content:
                                    analysis = summarize_article(content)
                                    if analysis:
                                        validation = validate_ai_relevance({**article, **analysis})
                                        seen_urls.add(article['url'])
                                        all_articles.append({
                                            **article,
                                            **content,
                                            **analysis,
                                            'ai_confidence': validation['confidence'],
                                            'ai_validation': validation['reason']
                                        })
                            except Exception as article_error:
                                if "OpenAI API quota exceeded" in str(article_error):
                                    st.error("⚠️ OpenAI API quota exceeded. Please check your API key balance.")
                                    return  # Stop processing more articles
                                else:
                                    current_time = datetime.now().strftime("%H:%M:%S")
                                    st.session_state.scan_status.insert(0, f"[{current_time}] Error processing article: {article['url']}")
                                continue

                        progress_bar.progress((idx + 1) / len(sources))

                    except Exception as source_error:
                        if "OpenAI API quota exceeded" in str(source_error):
                            st.error("⚠️ OpenAI API quota exceeded. Please check your API key balance.")
                            return  # Stop processing more sources
                        current_time = datetime.now().strftime("%H:%M:%S")
                        st.session_state.scan_status.insert(0, f"[{current_time}] Error processing source: {source}")
                        continue

                # Clear progress indicators
                progress_bar.empty()
                status_placeholder.empty()

                # Update session state with found articles
                st.session_state.articles = all_articles

                if len(all_articles) > 0:
                    st.success(f"Found {len(all_articles)} unique, validated AI-related articles!")
                else:
                    st.warning("No articles found. Please try again.")

        except Exception as e:
            if "OpenAI API quota exceeded" in str(e):
                st.error("⚠️ OpenAI API quota exceeded. Please check your API key balance.")
            else:
                st.error(f"An error occurred while fetching articles: {str(e)}")
            print(f"Error details: {traceback.format_exc()}")

    # Main content area
    if st.session_state.articles:
        # Export options at the top
        col1, col2 = st.columns([1, 8])
        with col1:
            if st.button("Export All" if not st.session_state.selected_articles else "Export Selected"):
                try:
                    articles_to_export = st.session_state.selected_articles if st.session_state.selected_articles else st.session_state.articles
                    pdf_data = generate_pdf(articles_to_export)

                    # Create a download button for the PDF
                    st.download_button(
                        "Download PDF",
                        pdf_data,
                        "ai_news_report.pdf",
                        "application/pdf"
                    )
                except Exception as e:
                    st.error(f"Error generating PDF: {str(e)}")
                    print(f"Error details: {traceback.format_exc()}")


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