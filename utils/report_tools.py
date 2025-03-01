
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
    """Generate enterprise executive-focused AI relevance assessment"""
    title = article.get('title', '').lower()
    summary = article.get('summary', '').lower()
    
    # Default relevance for enterprise context
    default_relevance = "Potential business value through AI implementation"
    
    # Industry-specific strategic relevance
    industries = {
        'retail': "Strategic retail transformation opportunity through AI-enhanced customer experience",
        'fashion': "Supply chain optimization and manufacturing innovation via AI technology",
        'manufacturing': "Production efficiency and quality control improvements through AI integration",
        'healthcare': "Operational transformation and care delivery enhancement through AI applications",
        'finance': "Risk management and customer experience improvements via AI implementation",
        'banking': "Regulatory compliance and service delivery optimization through AI technology",
        'education': "Training effectiveness and skills development advancements via AI tools",
        'media': "Content distribution optimization and global reach through AI-powered localization",
        'language': "Cross-border communication enhancement through advanced language AI",
        'customer': "Service quality and satisfaction improvements via AI-driven interaction",
        'security': "Risk mitigation and threat detection capabilities through AI systems",
        'supply chain': "Operational efficiency and resilience improvements through AI optimization"
    }
    
    # Technology-specific business implications
    technologies = {
        'generative ai': "Content creation automation and scalability through generative AI",
        'llm': "Communication efficiency and knowledge management through large language models",
        'machine learning': "Data-driven decision making and predictive capabilities via machine learning",
        'neural network': "Pattern recognition and anomaly detection through neural network technology",
        'computer vision': "Visual data processing and monitoring efficiency via computer vision",
        'natural language': "Customer interaction and documentation efficiency through NLP",
        'automation': "Process optimization and resource allocation through AI automation",
        'predictive': "Strategic planning and risk assessment through predictive analytics"
    }
    
    # Combined text for comprehensive analysis
    text = title + " " + summary
    
    # Check for industry-specific strategic relevance
    for industry, relevance in industries.items():
        if industry in text:
            return relevance
    
    # Check for technology-specific business implications
    for tech, relevance in technologies.items():
        if tech in text:
            return relevance
    
    return default_relevance

def clean_summary(summary_text):
    """Clean and condense summary for executive-friendly format"""
    if not summary_text:
        return "This article discusses AI technology applications and implications."
    
    # Remove metadata formatting
    summary_text = re.sub(r'\[(.*?)\]', '', summary_text)
    summary_text = re.sub(r'\([^)]*\)', '', summary_text)
    
    # Remove quotes that may have been added by LLMs
    summary_text = summary_text.replace('"', '').replace('"', '')
    
    # Remove strange characters
    summary_text = re.sub(r'[^\w\s.,;:!?-]', '', summary_text)
    
    # Normalize whitespace
    summary_text = re.sub(r'\s+', ' ', summary_text).strip()
    
    # Ensure conciseness (2-3 sentences max)
    sentences = re.split(r'(?<=[.!?])\s+', summary_text)
    
    if len(sentences) > 3:
        summary_text = ' '.join(sentences[:3])
    
    # Further length constraint (maximum 30 words)
    words = summary_text.split()
    if len(words) > 30:
        summary_text = ' '.join(words[:30]) + '...'
    
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
    
    # Enhanced styles for executive presentation
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        textColor=colors.navy,
        fontName='Helvetica-Bold',
        underline=True,
        fontSize=9,
        leading=11
    )
    
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10
    )
    
    relevance_style = ParagraphStyle(
        'RelevanceStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.darkblue
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

    # Add a title to the report with executive focus
    current_date = datetime.now().strftime('%Y-%m-%d')
    title = Paragraph(f"Enterprise AI Intelligence Brief - {current_date}", styles['Title'])
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
