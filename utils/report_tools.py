from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import csv
from urllib.parse import quote

def generate_pdf_report(articles, output_path):
    """Generate a PDF report matching CSV format exactly"""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(letter),
        topMargin=0.5*inch,
        bottomMargin=0.5*inch,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch
    )

    # Create styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        textColor=colors.blue,
        underline=True,
        fontSize=8
    )
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=10
    )

    # Table header matches CSV exactly
    table_data = [['Title', 'URL', 'Date', 'Summary', 'AI Relevance']]

    # Process articles to match CSV format
    for article in articles:
        # Clean and format URL properly
        url = article["url"]
        # Clean any file path artifacts from URL
        if 'http' in url:
            url = 'http' + url.split('http')[-1]
            # Remove any URL encoding
            url = url.replace('%3A', ':').replace('%2F', '/')
        title = Paragraph(f'<para><a href="{url}" target="_blank">{article["title"]}</a></para>', title_style)
        url = Paragraph(article['url'], normal_style)
        date = article['date']
        summary = Paragraph(article.get('summary', 'No summary available'), normal_style)
        ai_relevance = Paragraph(article.get('ai_validation', 'Not validated'), normal_style)

        table_data.append([title, url, date, summary, ai_relevance])

    # Create table with proportional column widths
    table = Table(table_data, colWidths=[2*inch, 2*inch, 1*inch, 3*inch, 2*inch])

    # Style the table to match CSV presentation
    table.setStyle(TableStyle([
        # Header styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),

        # Content styling
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),

        # Grid
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))

    # Build the PDF
    doc.build([table])

def generate_csv_report(articles, output_path):
    """Generate CSV report with matching columns"""
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        # Match exact column headers
        writer.writerow(['Title', 'URL', 'Date', 'Summary', 'AI Relevance'])

        for article in articles:
            writer.writerow([
                article['title'],
                article['url'],
                article['date'],
                article.get('summary', 'No summary available'),
                article.get('ai_validation', 'Not validated')
            ])