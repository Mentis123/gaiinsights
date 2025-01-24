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
from openai import OpenAI # Import OpenAI library


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
    """Generate a PDF report from the articles in landscape orientation."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))  # Changed to landscape
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph("AI News Report", title_style))
    story.append(Spacer(1, 20))

    # Date
    date_style = ParagraphStyle(
        'DateStyle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", date_style))
    story.append(Spacer(1, 20))

    # Create table data
    table_data = [['Title', 'Summary', 'Key Points', 'Published Date']]

    # Articles
    for article in articles:
        # Prepare key points as bullet points
        key_points_text = ""
        if article.get('key_points'):
            key_points_text = "\n".join([f"• {point}" for point in article['key_points']])

        # Add article data to table
        table_data.append([
            Paragraph(f"<link href='{article['url']}'>{article['title']}</link>", 
                     ParagraphStyle('Link', parent=styles['Normal'], textColor=colors.blue)),
            Paragraph(article.get('summary', 'No summary available'), styles['Normal']),
            Paragraph(key_points_text, styles['Normal']),
            Paragraph(article.get('date', 'Date not available'), styles['Normal'])
        ])

    # Create table with column widths optimized for landscape
    col_widths = [3*inch, 4*inch, 4*inch, 1.5*inch]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    # Add table style
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))

    story.append(table)
    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

def validate_ai_relevance(article):
    """Validate if an article is truly AI-related."""
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    prompt = f"""
    Evaluate if this article is genuinely about artificial intelligence technology, development, or applications.

    Consider these criteria:
    1. The article should primarily discuss AI technology or its applications
    2. It should contain meaningful information about AI developments or impacts
    3. Filter out articles that:
       - Are primarily about celebrities or entertainment with only passing AI mentions
       - Only use "AI" as a buzzword without substantial AI content
       - Have no real connection to artificial intelligence technology

    Article Title: {article['title']}
    Summary: {article.get('summary', '')}
    Key Points: {', '.join(article.get('key_points', []))}

    Return a JSON response with:
    {{
        "is_relevant": true/false,
        "confidence": 0-100,
        "reason": "explanation of why this is or isn't an AI-related article"
    }}

    If it's genuinely about AI technology or its applications, mark as true.
    If it's clearly unrelated or only mentions AI in passing, mark as false.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)

        # Consider articles with moderate to high confidence
        if result.get('is_relevant', False) and result.get('confidence', 0) > 70:
            return result
        return {"is_relevant": False, "confidence": 0, "reason": result.get('reason', 'Did not meet AI relevance criteria')}
    except Exception as e:
        print(f"Error in AI validation: {str(e)}")
        return {"is_relevant": False, "confidence": 0, "reason": "Validation failed"}

def main():
    st.set_page_config(
        page_title="AI News Aggregator",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    st.title("AI News Aggregation System")

    # Fetch button in the sidebar
    if st.sidebar.button("Fetch New Articles"):
        try:
            with st.spinner("Fetching AI news from sources..."):
                sources = load_source_sites(test_mode=st.session_state.test_mode)
                all_articles = []
                seen_urls = set()  # Track unique URLs
                progress_bar = st.progress(0)

                status_container = st.empty()
                st.session_state.scan_status = []

                for idx, source in enumerate(reversed(sources)):
                    try:
                        st.session_state.scan_status.insert(0, f"Currently Scanning: {source}")

                        ai_articles = find_ai_articles(source)
                        if ai_articles:
                            st.session_state.scan_status.insert(0, f"Found {len(ai_articles)} potential AI articles from current source")
                            st.session_state.scan_status.insert(0, "Analyzing and validating articles...")

                        status_text = "\n".join(st.session_state.scan_status[:5])
                        status_container.markdown(status_text)

                        for article in ai_articles:
                            # Skip if we've already processed this URL
                            if article['url'] in seen_urls:
                                continue

                            content = extract_content(article['url'])
                            if content:
                                analysis = summarize_article(content)
                                if analysis:
                                    # Validate AI relevance immediately
                                    validation = validate_ai_relevance({**article, **analysis})
                                    if validation['is_relevant']:
                                        seen_urls.add(article['url'])  # Mark URL as seen
                                        all_articles.append({
                                            **article,
                                            **content,
                                            **analysis,
                                            'ai_confidence': validation['confidence'],
                                            'ai_validation': validation['reason']
                                        })

                        progress_bar.progress((idx + 1) / len(sources))
                    except Exception as e:
                        st.error(f"Error processing source {source}: {str(e)}")
                        print(f"Error details: {traceback.format_exc()}")
                        continue

                st.session_state.articles = all_articles
                st.session_state.scan_status = []
                status_container.empty()
                st.success(f"Found {len(all_articles)} unique, validated AI-related articles!")
        except Exception as e:
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

                    # Add validation status display
                    validation_status = st.empty()
                    validation_progress = st.progress(0)

                    # Validate AI relevance and deduplicate
                    validated_articles = []
                    seen_urls = set()
                    for idx, article in enumerate(articles_to_export):
                        # Skip if we've already included this URL
                        if article['url'] in seen_urls:
                            continue

                        validation_status.text(f"Validating article {idx + 1}/{len(articles_to_export)}")
                        validation = validate_ai_relevance(article)
                        if validation['is_relevant']:
                            seen_urls.add(article['url'])  # Mark URL as seen
                            article['ai_confidence'] = validation['confidence']
                            article['ai_validation'] = validation['reason']
                            validated_articles.append(article)
                        validation_progress.progress((idx + 1) / len(articles_to_export))

                    if validated_articles:
                        pdf_data = generate_pdf(validated_articles)
                        validation_status.success(f"Validation complete! {len(validated_articles)} unique articles confirmed as AI-relevant.")

                        # Create a download button for the PDF
                        st.download_button(
                            "Download PDF",
                            pdf_data,
                            "ai_news_report.pdf",
                            "application/pdf"
                        )
                    else:
                        st.error("No articles passed the AI relevance validation.")
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