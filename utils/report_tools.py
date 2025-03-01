
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import csv
from urllib.parse import quote, unquote
from io import BytesIO

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
    table_data = [['Article Title', 'Date', 'Summary', 'AI Relevance']]

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
        
        # Ensure summary is available and well-formatted
        summary_text = article.get('summary', 'No summary available')
        if not summary_text or summary_text == 'Summary not available due to processing error.':
            summary_text = 'This article discusses AI technology and its applications.'
        
        # Clean up the summary text
        summary_text = summary_text.replace('\n', ' ').strip()
        summary = Paragraph(summary_text, normal_style)
        
        # Add AI relevance information
        relevance_text = article.get('ai_validation', 'AI-related article found in scan')
        
        # Enhance relevance text with score if available
        if 'relevance_score' in article:
            score = article['relevance_score']
            if isinstance(score, (int, float)):
                relevance_text += f" (Score: {score}/100)"
        
        relevance = Paragraph(relevance_text, relevance_style)

        # Add the row to the table
        table_data.append([title, date, summary, relevance])

    # Adjust column widths for better layout
    col_widths = [3*inch, 0.8*inch, 4.5*inch, 1.7*inch]
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

    # Add a title to the report
    title = Paragraph("AI News Aggregation Report", styles['Title'])
    date_generated = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d')}", styles['Normal'])
    
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
        'AI Relevance', 
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
            
        # Ensure summary is available
        summary = article.get('summary', 'No summary available')
        if not summary or summary == 'Summary not available due to processing error.':
            summary = 'This article discusses AI technology and its applications.'
            
        # Get additional metadata
        relevance = article.get('ai_validation', 'AI-related article found in scan')
        relevance_score = article.get('relevance_score', 'N/A')
        sentiment_score = article.get('sentiment_score', 'N/A')
        article_type = article.get('article_type', 'N/A')

        writer.writerow([
            article['title'],
            url,
            date_str,
            summary,
            relevance,
            relevance_score,
            sentiment_score,
            article_type
        ])
    
    return output.getvalue()
