
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import csv
from urllib.parse import quote, unquote
from io import BytesIO
from datetime import datetime
import re

def generate_executive_relevance(article):
    """Generate executive-focused AI relevance content based on article context"""
    title = article.get('title', '').lower()
    summary = article.get('summary', '').lower()
    
    # Default relevance if we can't determine anything specific
    default_relevance = "AI implementation with potential enterprise value"
    
    # Look for industry-specific indicators
    industries = {
        'retail': "Strategic for retail digital transformation, customer experience enhancement through AI",
        'fashion': "AI innovation in fashion industry supply chain and manufacturing processes",
        'manufacturing': "AI-driven manufacturing optimization and quality control applications",
        'healthcare': "Healthcare AI applications that could transform patient care and operations",
        'finance': "Financial services AI implementation that may impact risk management or customer experience",
        'banking': "Banking sector AI applications with regulatory and customer service implications",
        'education': "Educational technology AI developments relevant to training and development",
        'media': "Media industry AI applications that impact content distribution and localization",
        'language': "Language AI technology with global communication implications for multinational enterprises",
        'customer': "Customer-facing AI implementations that may impact service delivery",
        'security': "Security-related AI applications relevant to enterprise risk management",
        'supply chain': "Supply chain optimization through AI with operational efficiency implications"
    }
    
    # Check for specific AI technologies
    technologies = {
        'generative ai': "Generative AI with potential for content creation and automation",
        'llm': "Large Language Model deployment with enterprise communication applications",
        'machine learning': "Machine learning implementation with data-driven decision making potential",
        'neural network': "Neural network technology with pattern recognition capabilities",
        'computer vision': "Computer vision applications for quality control and process monitoring",
        'natural language': "Natural language processing for customer service and documentation",
        'automation': "AI-driven process automation with efficiency implications",
        'predictive': "Predictive analytics for business forecasting and planning"
    }
    
    # Combined text for analysis
    text = title + " " + summary
    
    # Check for industry relevance
    for industry, relevance in industries.items():
        if industry in text:
            return relevance
    
    # Check for technology relevance
    for tech, relevance in technologies.items():
        if tech in text:
            return relevance
    
    return default_relevance

def clean_summary(summary_text):
    """Clean summary text to remove strange characters and formatting issues"""
    if not summary_text:
        return "This article discusses AI technology applications."
    
    # Replace square brackets, parentheses and their contents when they look like metadata
    summary_text = re.sub(r'\[(.*?)\]', '', summary_text)
    summary_text = re.sub(r'\([^)]*\)', '', summary_text)
    
    # Remove quotes that may have been added by LLMs
    summary_text = summary_text.replace('"', '').replace('"', '')
    
    # Remove strange characters
    summary_text = re.sub(r'[^\w\s.,;:!?-]', '', summary_text)
    
    # Normalize whitespace
    summary_text = re.sub(r'\s+', ' ', summary_text).strip()
    
    # Limit length to make it more concise (about 2-3 sentences)
    words = summary_text.split()
    if len(words) > 40:
        summary_text = ' '.join(words[:40]) + '...'
    
    return summary_text

def get_timestamped_filename(prefix):
    """Generate a filename with timestamp"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    return f"{prefix}_{timestamp}"

def generate_pdf_report(articles):
    """Generate a comprehensive PDF report with enhanced formatting"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        topMargin=0.5*inch,
        bottomMargin=0.5*inch,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch
    )

    styles = getSampleStyleSheet()
    
    # Enhanced styles for better readability
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        textColor=colors.blue,
        underline=True,
        fontSize=9,
        leading=11
    )
    
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=10
    )
    
    relevance_style = ParagraphStyle(
        'RelevanceStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.darkgreen
    )

    # Include AI Relevance in the report
    table_data = [['Article Title', 'Date', 'Summary', 'Executive AI Relevance']]

    for article in articles:
        # Clean and normalize the URL
        url = article['url']
        if 'file:///' in url:
            url = url.replace('file:///', '')
            if 'https://' in url:
                url = url.split('https://', 1)[1]
            elif 'http://' in url:
                url = url.split('http://', 1)[1]
            url = f'https://{url}'
        url = unquote(url)

        # Format the title with the URL as a clickable link
        title = Paragraph(f'<para><a href="{url}">{article["title"]}</a></para>', title_style)
        
        # Format the date
        date_str = article['date']
        if hasattr(date_str, 'strftime'):
            date_str = date_str.strftime('%Y-%m-%d')
        date = Paragraph(date_str, normal_style)
        
        # Clean up the summary text for better formatting
        summary_text = clean_summary(article.get('summary', 'No summary available'))
        summary = Paragraph(summary_text, normal_style)
        
        # Generate executive-relevant AI information
        exec_relevance = generate_executive_relevance(article)
        relevance = Paragraph(exec_relevance, relevance_style)

        # Add the row to the table
        table_data.append([title, date, summary, relevance])

    # Adjust column widths for better layout
    col_widths = [3*inch, 0.8*inch, 3.5*inch, 2.7*inch]
    table = Table(table_data, colWidths=col_widths)

    # Enhanced table styling
    table.setStyle(TableStyle([
        # Header row styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Content row styling
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        
        # Date column
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        
        # Grid and vertical alignment
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        
        # Alternating row colors for better readability
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
    ]))

    # Add a title to the report with current date
    current_date = datetime.now().strftime('%Y-%m-%d')
    title = Paragraph(f"AI News Aggregation Report - {current_date}", styles['Title'])
    date_generated = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal'])
    
    # Build the document
    doc.build([title, Spacer(1, 0.2*inch), date_generated, Spacer(1, 0.3*inch), table])
    
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

def generate_csv_report(articles):
    """Generate enhanced CSV report with all relevant fields"""
    output = BytesIO()
    writer = csv.writer(output)
    
    # Add more fields to CSV for comprehensive data export
    writer.writerow([
        'Title', 
        'URL', 
        'Date', 
        'Summary', 
        'Executive AI Relevance', 
        'Relevance Score', 
        'Sentiment Score', 
        'Article Type'
    ])

    for article in articles:
        # Clean URL
        url = article['url']
        if 'file:///' in url:
            url = url.replace('file:///', '')
            if 'https://' in url:
                url = url.split('https://', 1)[1]
            elif 'http://' in url:
                url = url.split('http://', 1)[1]
            url = f'https://{url}'
        url = unquote(url)

        # Format date
        date_str = article['date']
        if hasattr(date_str, 'strftime'):
            date_str = date_str.strftime('%Y-%m-%d')
            
        # Clean up summary
        summary = clean_summary(article.get('summary', 'No summary available'))
        
        # Generate executive-relevant AI information
        exec_relevance = generate_executive_relevance(article)
        
        # Get additional metadata
        relevance_score = article.get('relevance_score', 'N/A')
        sentiment_score = article.get('sentiment_score', 'N/A')
        article_type = article.get('article_type', 'N/A')

        writer.writerow([
            article['title'],
            url,
            date_str,
            summary,
            exec_relevance,
            relevance_score,
            sentiment_score,
            article_type
        ])
    
    return output.getvalue()
