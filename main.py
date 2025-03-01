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
import logging
import gc
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize session state before anything else
if 'initialized' not in st.session_state:
    try:
        logger.info("Initializing session state")
        st.session_state.articles = []
        st.session_state.selected_articles = []
        st.session_state.scan_status = []
        st.session_state.test_mode = False
        st.session_state.processing_time = None
        st.session_state.processed_urls = set()  # Track processed URLs
        st.session_state.current_batch_index = 0  # Track current batch
        st.session_state.batch_size = 5  # Configurable batch size
        st.session_state.is_fetching = False
        st.session_state.pdf_data = None  # Initialize PDF data
        st.session_state.csv_data = None  # Initialize CSV data
        st.session_state.show_url_editor = False  # URL editor visibility
        st.session_state.edit_mode = None  # Default to no edit mode
        st.session_state.current_urls = ""  # Current URLs being edited
        st.session_state.sidebar_collapsed = False  # Sidebar state
        st.session_state.dark_mode = True  # Theme state
        st.session_state.initialized = True
        st.session_state.last_update = datetime.now()
        logger.info("Session state initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing session state: {str(e)}")
        st.error("Error initializing application. Please refresh the page.")

# Set page config after initialization
st.set_page_config(
    page_title="AI News Aggregator",
    layout="wide",
    initial_sidebar_state="expanded"
)

def generate_pdf_report(articles):
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
    table_data = [['Article Title', 'Date', 'Summary', 'AI Relevance']]
    for article in articles:
        # Create a clickable link using just the URL
        title_link = Paragraph(
            f'{article["title"]}<br/><a href="{article["url"]}" color="blue">{article["url"]}</a>',
            link_style
        )

        table_data.append([
            title_link,
            Paragraph(article['date'] if isinstance(article['date'], str) else article['date'].strftime('%Y-%m-%d'), 
                     ParagraphStyle('Date', parent=styles['Normal'], fontSize=8)),
            Paragraph(article.get('summary', 'No summary available'), 
                     ParagraphStyle('Summary', parent=styles['Normal'], fontSize=8)),
            Paragraph(article.get('ai_validation', 'Not validated'), 
                     ParagraphStyle('AI Relevance', parent=styles['Normal'], fontSize=8))
        ])

    # Create table with improved formatting
    col_widths = [4*inch, 0.8*inch, 3*inch, 2*inch]  # Adjusted column widths
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        # Header formatting
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),

        # Content formatting
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),

        # Borders and alignment
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 1), (2, -1), 'CENTER'),
    ]))

    elements.append(table)

    try:
        doc.build(elements)
        pdf_data = buffer.getvalue()
        buffer.close()
        return pdf_data
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        st.error("Error generating PDF report. Please try again.")
        return None

def generate_csv_report(articles):
    """Generate CSV data from articles."""
    output = BytesIO()
    writer = pd.DataFrame([{
        'Title': article['title'],
        'URL': article['url'],
        'Date': article['date'],
        'Summary': article.get('summary', 'No summary available'),
        'AI Relevance': article.get('ai_validation', 'Not validated')
    } for article in articles]).to_csv(output, index=False)
    return output.getvalue()

def update_status(message):
    """Updates the processing status in the Streamlit UI."""
    current_time = datetime.now().strftime("%H:%M:%S")
    status_msg = f"[{current_time}] {message}"
    st.session_state.scan_status.insert(0, status_msg)



def process_batch(sources, cutoff_time, db, seen_urls, status_placeholder):
    """Process a batch of sources with simplified article handling"""
    batch_articles = []

    for source in sources:
        try:
            if source in st.session_state.processed_urls:
                continue

            current_time = datetime.now().strftime("%H:%M:%S")
            status_msg = f"[{current_time}] Scanning: {source}"
            st.session_state.scan_status.insert(0, status_msg)

            # Find AI articles
            from utils.content_extractor import find_ai_articles
            ai_articles = find_ai_articles(source, cutoff_time)

            if ai_articles:
                status_msg = f"[{current_time}] Found {len(ai_articles)} AI articles from {source}"
                st.session_state.scan_status.insert(0, status_msg)

                for article in ai_articles:
                    try:
                        if article['url'] in seen_urls:
                            continue

                        content = extract_full_content(article['url'])
                        if content:
                            # Get article summary if possible, but don't block if it fails
                            try:
                                analysis = summarize_article(content)
                            except Exception as e:
                                logger.warning(f"Summary generation failed for {article['title']}: {e}")
                                analysis = {'summary': 'Summary generation failed', 'key_points': []}

                            # Save the article
                            article_data = {
                                'title': article['title'],
                                'url': article['url'],
                                'date': article['date'],
                                'summary': analysis.get('summary', 'No summary available'),
                                'source': source,
                                'ai_validation': "AI-related article found in scan"
                            }

                            batch_articles.append(article_data)
                            seen_urls.add(article['url'])

                            try:
                                db.save_article(article_data)
                            except Exception as e:
                                logger.error(f"Failed to save article to database: {e}")

                            status_msg = f"[{current_time}] Added: {article['title']}"
                            st.session_state.scan_status.insert(0, status_msg)

                    except Exception as e:
                        logger.error(f"Error processing article {article['url']}: {str(e)}")
                        continue

            st.session_state.processed_urls.add(source)

        except Exception as e:
            logger.error(f"Error processing source {source}: {str(e)}")
            continue

    return batch_articles

def main():
    try:
        # Enhanced CSS for a modern, professional UI
        st.markdown("""
        <style>
        /* Main Styles */
        .main-app-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* Header Styles */
        .main-header {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(90deg, #7D56F4, #AD7BFF);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
            text-align: center;
            letter-spacing: -0.5px;
        }
        
        .subheader {
            font-size: 1.2rem;
            color: #cccccc;
            margin-bottom: 2rem;
            text-align: center;
            font-weight: 300;
        }
        
        /* Section Headers */
        .section-header {
            font-weight: 600;
            border-bottom: 1px solid rgba(125, 86, 244, 0.3);
            padding-bottom: 0.5rem;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            color: #7D56F4;
            letter-spacing: 0.5px;
        }
        
        /* Cards and Containers */
        .article-container {
            border: 1px solid rgba(125, 86, 244, 0.2);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.2rem;
            background-color: rgba(20, 20, 35, 0.7);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .article-container:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            border-color: rgba(125, 86, 244, 0.4);
        }
        
        .article-title {
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 0.7rem;
            line-height: 1.3;
        }
        
        .article-meta {
            font-size: 0.85rem;
            color: #bbbbbb;
            margin-bottom: 0.8rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .article-summary {
            font-size: 1rem;
            line-height: 1.6;
            color: #e0e0e0;
        }
        
        /* Buttons and Interactive Elements */
        .custom-button {
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s;
            letter-spacing: 0.3px;
        }
        
        /* Status Indicators */
        .status-container {
            background-color: rgba(20, 20, 35, 0.7);
            border-radius: 8px;
            padding: 0.8rem;
            border: 1px solid rgba(125, 86, 244, 0.2);
            margin-top: 1rem;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .status-item {
            padding: 6px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.9rem;
        }
        
        /* URL Editor */
        .url-editor-container {
            background-color: rgba(20, 20, 35, 0.9);
            border-radius: 8px;
            border: 1px solid rgba(125, 86, 244, 0.3);
            padding: 1.5rem;
            margin-top: 1rem;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        
        /* Sidebar Refinements */
        .sidebar-header {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #7D56F4;
        }
        
        .sidebar-section {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-title {
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #e0e0e0;
        }
        
        /* Dashboard Cards */
        .dashboard-card {
            background-color: rgba(20, 20, 35, 0.7);
            border-radius: 8px;
            padding: 1.2rem;
            border: 1px solid rgba(125, 86, 244, 0.2);
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #7D56F4;
            margin-bottom: 0.3rem;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #cccccc;
        }
        
        /* Error messages */
        .error-container {
            background-color: rgba(169, 48, 48, 0.2);
            border: 1px solid rgba(220, 53, 69, 0.4);
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        /* Loading indicators */
        .loader-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        
        /* Toggle button enhancements */
        .toggle-label {
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* Export section */
        .export-section {
            margin-top: 1.5rem;
            background-color: rgba(20, 20, 35, 0.7);
            border-radius: 8px;
            padding: 1.2rem;
            border: 1px solid rgba(125, 86, 244, 0.2);
        }
        
        /* Hide default Streamlit elements */
        #MainMenu {visibility: hidden;}
        .stDeployButton {display:none;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        
        /* Make elements more compact in the sidebar */
        .sidebar .stSelectbox, .sidebar .stNumberInput {
            margin-bottom: 0.5rem;
        }
        
        /* Custom scrollbar for dark theme */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(20, 20, 35, 0.7);
        }
        
        ::-webkit-scrollbar-thumb {
            background: rgba(125, 86, 244, 0.5);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(125, 86, 244, 0.7);
        }
        </style>
        """, unsafe_allow_html=True)

        # Main header with elegant presentation
        st.markdown('<div class="main-header">AI News Aggregation System</div>', unsafe_allow_html=True)
        st.markdown('<div class="subheader">Discover and analyze cutting-edge AI developments from trusted sources</div>', unsafe_allow_html=True)

        # Redesigned sidebar with improved organization and visual hierarchy
        with st.sidebar:
            st.markdown('<div class="sidebar-header">Configuration</div>', unsafe_allow_html=True)
            
            # Scan Settings with improved layout
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown('<div class="sidebar-title">Scan Settings</div>', unsafe_allow_html=True)
            
            # Test mode toggle with custom styling
            test_mode_col1, test_mode_col2 = st.columns([4, 1])
            with test_mode_col1:
                st.session_state.test_mode = st.toggle(
                    "Test Mode",
                    value=st.session_state.get('test_mode', False),
                    help="When enabled, only test URLs will be scanned"
                )
            with test_mode_col2:
                st.markdown("ⓘ", help="Test mode uses a limited set of URLs for faster scanning and testing")
                
            # Time Range with improved layout
            st.markdown('<div class="sidebar-title">Time Range</div>', unsafe_allow_html=True)
            col1, col2 = st.columns([1, 1])
            with col1:
                time_value = st.number_input("Period", min_value=1, value=1, step=1)
            with col2:
                time_unit = st.selectbox("Unit", ["Days", "Weeks"], index=0)
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Actions section with prominent button
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown('<div class="sidebar-title">Actions</div>', unsafe_allow_html=True)
            
            fetch_button = st.button(
                "🔍 Fetch New Articles" if not st.session_state.is_fetching else "⏳ Fetching...",
                disabled=st.session_state.is_fetching,
                type="primary",
                use_container_width=True
            )
            st.markdown('</div>', unsafe_allow_html=True)
            
            # URL management section with improved buttons
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown('<div class="sidebar-title">Source Management</div>', unsafe_allow_html=True)
            
            # Initialize button states if not present
            if 'sources_button_active' not in st.session_state:
                st.session_state.sources_button_active = False
            if 'test_urls_button_active' not in st.session_state:
                st.session_state.test_urls_button_active = False
                
            # Set the correct button text based on the current state
            sources_button_text = "📋 Close Editor" if st.session_state.show_url_editor and st.session_state.edit_mode == 'source' else "📋 Edit Sources"
            test_button_text = "🧪 Close Editor" if st.session_state.show_url_editor and st.session_state.edit_mode == 'test' else "🧪 Edit Test URLs"
            
            col1, col2 = st.columns(2)
            with col1:
                # Toggle button for Edit Sources with immediate text change
                if st.button(sources_button_text, use_container_width=True, key="edit_sources_button"):
                    # Toggle the editor state
                    if st.session_state.show_url_editor and st.session_state.edit_mode == 'source':
                        # Close the editor
                        st.session_state.show_url_editor = False
                        st.session_state.edit_mode = None
                        st.rerun()
                    else:
                        # Open the editor in source mode
                        st.session_state.show_url_editor = True
                        st.session_state.edit_mode = 'source'
                        
                        # Load source URLs
                        try:
                            from utils.content_extractor import load_source_sites
                            source_urls = load_source_sites(raw=True)
                            st.session_state.current_urls = '\n'.join(source_urls)
                        except Exception as e:
                            logger.error(f"Error loading source URLs: {str(e)}")
                            st.session_state.current_urls = ""
                        
                        st.rerun()

            with col2:
                # Toggle button for Edit Test URLs with immediate text change
                if st.button(test_button_text, use_container_width=True, key="edit_test_urls_button"):
                    # Toggle the editor state
                    if st.session_state.show_url_editor and st.session_state.edit_mode == 'test':
                        # Close the editor
                        st.session_state.show_url_editor = False
                        st.session_state.edit_mode = None
                        st.rerun()
                    else:
                        # Open the editor in test mode
                        st.session_state.show_url_editor = True
                        st.session_state.edit_mode = 'test'
                        
                        # Load test URLs
                        try:
                            test_urls_file = 'data/test_urls.csv'
                            if not os.path.exists(test_urls_file):
                                with open(test_urls_file, 'w', newline='') as f:
                                    f.write("https://www.wired.com/\n")  # Default test URL

                            test_urls = []
                            with open(test_urls_file, 'r') as f:
                                for line in f:
                                    if line.strip():
                                        test_urls.append(line.strip())

                            st.session_state.current_urls = '\n'.join(test_urls)
                        except Exception as e:
                            logger.error(f"Error loading test URLs: {str(e)}")
                            st.session_state.current_urls = "https://www.wired.com/"
                        
                        st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Stats display when articles are available
            if hasattr(st.session_state, 'articles') and st.session_state.articles:
                st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
                st.markdown('<div class="sidebar-title">Statistics</div>', unsafe_allow_html=True)
                
                stats_col1, stats_col2 = st.columns(2)
                with stats_col1:
                    st.markdown(f"""
                    <div class="dashboard-card">
                        <div class="stat-number">{len(st.session_state.articles)}</div>
                        <div class="stat-label">Articles Found</div>
                    </div>
                    """, unsafe_allow_html=True)
                
                with stats_col2:
                    sources_count = len(set([a.get('source', '') for a in st.session_state.articles]))
                    st.markdown(f"""
                    <div class="dashboard-card">
                        <div class="stat-number">{sources_count}</div>
                        <div class="stat-label">Sources</div>
                    </div>
                    """, unsafe_allow_html=True)
                
                st.markdown('</div>', unsafe_allow_html=True)

        # Enhanced modal dialog for URL editing when enabled
        if st.session_state.show_url_editor:
            # Create a modern, card-like dialog with a container
            with st.container():
                st.markdown('<div class="url-editor-container">', unsafe_allow_html=True)
                
                # Enhanced header with mode information
                mode_title = "Source URLs" if st.session_state.edit_mode == 'source' else "Test Mode URLs"
                mode_icon = "🌐" if st.session_state.edit_mode == 'source' else "🧪"
                
                st.markdown(f"""
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <h2 style="margin: 0; color: #7D56F4;">{mode_icon} Edit {mode_title}</h2>
                </div>
                """, unsafe_allow_html=True)
                
                # Help text explaining the purpose
                help_text = (
                    "Add or remove websites where AI news will be searched." 
                    if st.session_state.edit_mode == 'source' 
                    else "Edit URLs used during test mode for faster development and testing."
                )
                
                st.markdown(f"""
                <div style="margin-bottom: 1rem; color: #cccccc; font-size: 0.9rem;">
                    {help_text} Enter one URL per line.
                </div>
                """, unsafe_allow_html=True)

                # Display editable text area with the URLs and validation
                edited_urls = st.text_area(
                    "URLs",
                    value=st.session_state.current_urls,
                    height=300,
                    key="url_editor_area",
                    help="Enter one URL per line. Each URL should start with http:// or https://"
                )
                
                # URL validation
                urls_list = edited_urls.strip().split('\n')
                valid_urls = [url.strip() for url in urls_list if url.strip()]
                
                # Show URL count
                st.markdown(f"""
                <div style="margin-top: 0.5rem; color: #cccccc; font-size: 0.9rem; text-align: right;">
                    {len(valid_urls)} URLs added
                </div>
                """, unsafe_allow_html=True)

                # Enhanced buttons for saving or canceling
                col1, col2, col3 = st.columns([2, 2, 3])
                with col1:
                    if st.button("💾 Save Changes", use_container_width=True, type="primary"):
                        try:
                            # Filter out empty lines
                            urls_list = [url.strip() for url in urls_list if url.strip()]

                            # Determine which file to save to
                            file_path = 'data/search_sites.csv' if st.session_state.edit_mode == 'source' else 'data/test_urls.csv'

                            # Save to CSV file
                            with open(file_path, 'w', newline='') as f:
                                for url in urls_list:
                                    f.write(f"{url}\n")

                            st.success(f"{mode_title} saved successfully!")

                            # Clear processed URLs to ensure new sites are scanned
                            st.session_state.processed_urls = set()

                            # Close the editor and reset button states
                            st.session_state.show_url_editor = False
                            st.session_state.sources_button_active = False
                            st.session_state.test_urls_button_active = False
                            # Force page refresh for changes to take effect
                            st.rerun()

                        except Exception as e:
                            logger.error(f"Error saving URLs: {str(e)}")
                            st.error(f"Error saving URLs: {str(e)}")

                with col2:
                    if st.button("❌ Cancel", use_container_width=True):
                        st.session_state.show_url_editor = False
                        st.session_state.sources_button_active = False
                        st.session_state.test_urls_button_active = False
                        st.rerun()
                
                st.markdown('</div>', unsafe_allow_html=True)

        # Main content area with refined design
        if not st.session_state.show_url_editor:  # Only show main content when URL editor isn't active
            # Display the status log and scanning progress in a collapsible section
            if st.session_state.scan_status:
                with st.expander("Scan Log", expanded=False):
                    st.markdown('<div class="status-container">', unsafe_allow_html=True)
                    for status in st.session_state.scan_status[:50]:  # Show just the last 50 messages
                        st.markdown(f'<div class="status-item">{status}</div>', unsafe_allow_html=True)
                    st.markdown('</div>', unsafe_allow_html=True)
            
            # Fetch process with enhanced visuals
            if fetch_button or st.session_state.is_fetching:
                st.session_state.is_fetching = True
                try:
                    start_time = datetime.now()
                    
                    # Enhanced fetching visual with animation
                    st.markdown("""
                    <div style="text-align: center; margin: 2rem 0;">
                        <div style="font-size: 1.2rem; margin-bottom: 1rem; color: #7D56F4; font-weight: 500;">
                            Fetching AI news from trusted sources...
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Fetch sources and setup
                    from utils.content_extractor import load_source_sites
                    sources = load_source_sites(test_mode=st.session_state.test_mode)
                    from utils.db_manager import DBManager
                    db = DBManager()

                    seen_urls = set()  # Reset seen URLs each time
                    
                    # Enhanced progress display
                    progress_col1, progress_col2 = st.columns([3, 1])
                    with progress_col1:
                        progress_bar = st.progress(0)
                    with progress_col2:
                        progress_text = st.empty()
                    
                    status_placeholder = st.empty()

                    batch_size = 5
                    total_batches = (len(sources) + batch_size - 1) // batch_size
                    total_sources = len(sources)

                    st.session_state.articles = []  # Reset articles list

                    for batch_idx in range(total_batches):
                        start_idx = batch_idx * batch_size
                        end_idx = min(start_idx + batch_size, len(sources))
                        current_batch = sources[start_idx:end_idx]

                        # Calculate cutoff time based on selected unit
                        if time_unit == "Weeks":
                            days_to_subtract = time_value * 7
                        else:  # Days
                            days_to_subtract = time_value

                        cutoff_time = datetime.now() - timedelta(days=days_to_subtract)

                        # Log which mode we're using and the time period
                        mode_str = "TEST MODE" if st.session_state.test_mode else "NORMAL MODE"
                        logger.info(f"{mode_str} active - Time period: {time_value} {time_unit}, Cutoff: {cutoff_time}")

                        # Process current batch
                        batch_articles = process_batch(current_batch, cutoff_time, db, seen_urls, status_placeholder)

                        # Add articles to session state
                        if batch_articles:
                            st.session_state.articles.extend(batch_articles)

                        # Update progress with percentage
                        progress = (batch_idx + 1) / total_batches
                        progress_bar.progress(progress)
                        progress_text.markdown(f"<div style='text-align: center; font-weight: 500;'>{int(progress*100)}%</div>", unsafe_allow_html=True)

                    # Reset fetching state
                    st.session_state.is_fetching = False

                    # Show completion message and stats
                    end_time = datetime.now()
                    elapsed_time = end_time - start_time
                    minutes = int(elapsed_time.total_seconds() // 60)
                    seconds = int(elapsed_time.total_seconds() % 60)

                    if st.session_state.articles:
                        # Success message with animation
                        st.markdown(f"""
                        <div style="text-align: center; margin: 1.5rem 0; background: linear-gradient(90deg, rgba(13, 152, 69, 0.1), rgba(13, 152, 69, 0.2)); padding: 1rem; border-radius: 8px; border: 1px solid rgba(13, 152, 69, 0.3);">
                            <div style="font-size: 1.4rem; color: #0d9845; font-weight: 500; margin-bottom: 0.5rem;">
                                ✅ Found {len(st.session_state.articles)} AI Articles!
                            </div>
                            <div style="font-size: 0.9rem; color: #cccccc;">
                                Processing time: {minutes}m {seconds}s
                            </div>
                        </div>
                        """, unsafe_allow_html=True)

                        # Store articles in session state if not already there
                        if 'current_articles' not in st.session_state:
                            st.session_state.current_articles = st.session_state.articles

                        # Store reports in session state to prevent regeneration
                        if 'pdf_data' not in st.session_state or not st.session_state.pdf_data:
                            st.session_state.pdf_data = generate_pdf_report(st.session_state.current_articles)
                        if 'csv_data' not in st.session_state or not st.session_state.csv_data:
                            st.session_state.csv_data = generate_csv_report(st.session_state.current_articles)

                        # Enhanced export section with attractive design
                        st.markdown('<div class="export-section">', unsafe_allow_html=True)
                        st.markdown('<h3 style="margin-top: 0; font-size: 1.3rem; color: #7D56F4; margin-bottom: 1rem;">Export Reports</h3>', unsafe_allow_html=True)
                        
                        export_col1, export_col2 = st.columns([1, 1])
                        with export_col1:
                            if st.session_state.pdf_data:
                                st.download_button(
                                    "📄 Download PDF Report",
                                    st.session_state.pdf_data,
                                    "ai_news_report.pdf",
                                    "application/pdf",
                                    use_container_width=True
                                )

                        with export_col2:
                            if st.session_state.csv_data:
                                st.download_button(
                                    "📊 Download CSV Report",
                                    st.session_state.csv_data,
                                    "ai_news_report.csv",
                                    "text/csv",
                                    use_container_width=True
                                )
                        st.markdown('</div>', unsafe_allow_html=True)

                        # Then show articles with elegant cards
                        st.markdown('<h2 class="section-header">AI News Articles</h2>', unsafe_allow_html=True)
                        
                        # Display filters and sorting options
                        filter_col1, filter_col2, filter_col3 = st.columns([2, 2, 1])
                        with filter_col1:
                            # Get unique sources for filtering
                            sources = list(set([a.get('source', 'Unknown') for a in st.session_state.articles]))
                            selected_source = st.selectbox(
                                "Filter by Source",
                                ["All Sources"] + sources,
                                index=0
                            )
                            
                        with filter_col2:
                            sort_options = ["Most Recent", "Oldest First", "Alphabetical (A-Z)"]
                            sort_by = st.selectbox("Sort Articles", sort_options, index=0)
                        
                        with filter_col3:
                            st.markdown("<br>", unsafe_allow_html=True)  # Add spacing for alignment
                            show_summaries = st.checkbox("Show Summaries", value=True)
                        
                        # Apply filters and sorting
                        filtered_articles = st.session_state.articles
                        if selected_source != "All Sources":
                            filtered_articles = [a for a in filtered_articles if a.get('source', 'Unknown') == selected_source]
                        
                        # Apply sorting
                        if sort_by == "Most Recent":
                            filtered_articles = sorted(filtered_articles, key=lambda x: x.get('date', ''), reverse=True)
                        elif sort_by == "Oldest First":
                            filtered_articles = sorted(filtered_articles, key=lambda x: x.get('date', ''))
                        elif sort_by == "Alphabetical (A-Z)":
                            filtered_articles = sorted(filtered_articles, key=lambda x: x.get('title', '').lower())
                        
                        # Show filtered count
                        st.markdown(f"<div style='margin-bottom: 1rem; font-size: 0.9rem; color: #cccccc;'>Showing {len(filtered_articles)} of {len(st.session_state.articles)} articles</div>", unsafe_allow_html=True)
                        
                        # Display articles in modern cards
                        for article in filtered_articles:
                            # Parse date if needed
                            if isinstance(article['date'], str):
                                try:
                                    display_date = article['date']
                                except:
                                    display_date = article['date']
                            else:
                                display_date = article['date'].strftime('%Y-%m-%d')
                            
                            # Create a beautiful card for each article
                            st.markdown(f"""
                            <div class="article-container">
                                <div class="article-title">
                                    <a href="{article['url']}" target="_blank" style="text-decoration: none; color: #7D56F4;">
                                        {article['title']}
                                    </a>
                                </div>
                                <div class="article-meta">
                                    <span>📅 {display_date}</span>
                                    <span style="margin-left: 10px;">🔍 Source: {article.get('source', 'Unknown')}</span>
                                </div>
                                {f'<div class="article-summary">{article["summary"]}</div>' if show_summaries else ''}
                            </div>
                            """, unsafe_allow_html=True)
                    else:
                        # No articles found message with helpful suggestions
                        st.markdown("""
                        <div style="text-align: center; margin: 3rem 0; background: rgba(255, 193, 7, 0.1); padding: 2rem; border-radius: 8px; border: 1px solid rgba(255, 193, 7, 0.3);">
                            <div style="font-size: 5rem; margin-bottom: 1rem;">🔍</div>
                            <div style="font-size: 1.4rem; color: #ffc107; font-weight: 500; margin-bottom: 1rem;">
                                No AI articles found
                            </div>
                            <div style="font-size: 1rem; color: #cccccc; max-width: 500px; margin: 0 auto;">
                                Try adjusting the time period in the sidebar, checking your source URLs, or switching to Test Mode to verify functionality.
                            </div>
                        </div>
                        """, unsafe_allow_html=True)

                except Exception as e:
                    st.session_state.is_fetching = False
                    error_message = str(e)
                    logger.error(f"Error in main process: {error_message}")
                    traceback_details = traceback.format_exc()
                    
                    # Enhanced error display
                    st.markdown(f"""
                    <div class="error-container">
                        <div style="display: flex; align-items: flex-start;">
                            <div style="color: #dc3545; font-size: 1.5rem; margin-right: 0.5rem;">⚠️</div>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem; color: #dc3545; margin-bottom: 0.5rem;">An error occurred</div>
                                <div style="font-family: monospace; font-size: 0.9rem; color: #e0e0e0; white-space: pre-wrap; word-break: break-word;">{error_message}</div>
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    with st.expander("Show detailed error information"):
                        st.code(traceback_details, language="python")
            
            # Display previously fetched articles if available
            elif hasattr(st.session_state, 'articles') and st.session_state.articles:
                st.markdown('<h2 class="section-header">AI News Articles</h2>', unsafe_allow_html=True)
                
                # Show export options if reports are available
                if hasattr(st.session_state, 'pdf_data') and st.session_state.pdf_data:
                    st.markdown('<div class="export-section">', unsafe_allow_html=True)
                    st.markdown('<h3 style="margin-top: 0; font-size: 1.3rem; color: #7D56F4; margin-bottom: 1rem;">Export Reports</h3>', unsafe_allow_html=True)
                    
                    export_col1, export_col2 = st.columns([1, 1])
                    with export_col1:
                        st.download_button(
                            "📄 Download PDF Report",
                            st.session_state.pdf_data,
                            "ai_news_report.pdf",
                            "application/pdf",
                            use_container_width=True
                        )

                    with export_col2:
                        if hasattr(st.session_state, 'csv_data') and st.session_state.csv_data:
                            st.download_button(
                                "📊 Download CSV Report",
                                st.session_state.csv_data,
                                "ai_news_report.csv",
                                "text/csv",
                                use_container_width=True
                            )
                    st.markdown('</div>', unsafe_allow_html=True)
                
                # Display each article in a card
                for article in st.session_state.articles:
                    # Parse date if needed
                    if isinstance(article['date'], str):
                        try:
                            display_date = article['date']
                        except:
                            display_date = article['date']
                    else:
                        display_date = article['date'].strftime('%Y-%m-%d')
                    
                    # Create a beautiful card for each article
                    st.markdown(f"""
                    <div class="article-container">
                        <div class="article-title">
                            <a href="{article['url']}" target="_blank" style="text-decoration: none; color: #7D56F4;">
                                {article['title']}
                            </a>
                        </div>
                        <div class="article-meta">
                            <span>📅 {display_date}</span>
                            <span style="margin-left: 10px;">🔍 Source: {article.get('source', 'Unknown')}</span>
                        </div>
                        <div class="article-summary">{article["summary"]}</div>
                    </div>
                    """, unsafe_allow_html=True)
            
            # Display welcome message for first-time users
            else:
                st.markdown("""
                <div style="text-align: center; margin: 3rem 0;">
                    <div style="font-size: 5rem; margin-bottom: 1rem;">👋</div>
                    <div style="font-size: 1.4rem; color: #7D56F4; font-weight: 500; margin-bottom: 1rem;">
                        Welcome to the AI News Aggregator!
                    </div>
                    <div style="font-size: 1rem; color: #cccccc; max-width: 600px; margin: 0 auto;">
                        Get started by clicking the "Fetch New Articles" button in the sidebar to scan for the latest AI news.
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # Show quick tips expander
                with st.expander("Quick Tips"):
                    st.markdown("""
                    - **Test Mode**: Enable this for faster scanning with fewer sources
                    - **Time Range**: Adjust to scan for newer or older articles
                    - **Source Management**: Customize which websites are scanned
                    - **Reports**: After fetching, download reports in PDF or CSV format
                    """)

    except Exception as e:
        st.error("An unexpected error occurred. Please refresh the page.")
        logger.error(f"Critical error: {str(e)}")

if __name__ == "__main__":
    main()