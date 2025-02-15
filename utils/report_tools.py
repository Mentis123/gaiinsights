
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import csv
from urllib.parse import quote, unquote

def generate_pdf_report(articles):
    """Generate a PDF report with clean URLs and meaningful AI relevance"""
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
    link_style = ParagraphStyle(
        'LinkStyle',
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

    # Table header without AI Relevance column
    table_data = [['Title', 'URL', 'Date', 'Summary']]

    for article in articles:
        # Clean URL - ensure it's a proper web URL
        url = article['url']
        if 'file:///' in url:
            url = url.split('https://')[-1]
            url = f'https://{url}'
        url = unquote(url)  # Remove URL encoding

        # Create clickable title with clean URL
        title = Paragraph(f'<para><a href="{url}">{article["title"]}</a></para>', link_style)
        url_para = Paragraph(url, normal_style)
        date = article['date']
        summary = Paragraph(article.get('summary', 'No summary available'), normal_style)

        table_data.append([title, url_para, date, summary])

    # Adjust column widths without AI Relevance column
    table = Table(table_data, colWidths=[2.5*inch, 2.5*inch, 1*inch, 4*inch])

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

    doc.build([table])
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

def generate_csv_report(articles):
    """Generate CSV report matching PDF format"""
    output = BytesIO()
    writer = csv.writer(output)
    writer.writerow(['Title', 'URL', 'Date', 'Summary'])  # Headers without AI Relevance

    for article in articles:
        url = article['url']
        if 'file:///' in url:
            url = url.split('https://')[-1]
            url = f'https://{url}'
        url = unquote(url)

        writer.writerow([
            article['title'],
            url,
            article['date'],
            article.get('summary', 'No summary available')
        ])
    
    return output.getvalue()
