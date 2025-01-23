from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import csv
from urllib.parse import quote

def generate_pdf_report(articles, output_path):
    """
    Generates PDF report in landscape format with clickable URLs
    """
    doc = SimpleDocTemplate(
        output_path,
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
        underline=True
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
            article['published_date'].strftime('%Y-%m-%d'),
            f"{article['relevance_score']:.1f}/10",
            Paragraph(article['rationale'], styles['Normal'])
        ])

    # Create table with improved formatting
    col_widths = [4*inch, 1*inch, 0.8*inch, 4*inch]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        # Header formatting
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

        # Content formatting
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),

        # Borders and alignment
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 1), (2, -1), 'CENTER'),  # Center date and score columns
    ]))

    elements.append(table)
    doc.build(elements)

def generate_csv_report(articles, output_path):
    """
    Generates CSV report with clickable title and URL fields
    """
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Title', 'URL', 'Date', 'Score', 'Rationale'])

        for article in articles:
            # Create hyperlink formulas that work in Excel
            title_formula = f'=HYPERLINK("{article["url"]}","{article["title"]}")'
            url_formula = f'=HYPERLINK("{article["url"]}","{article["url"]}")'

            writer.writerow([
                title_formula,
                url_formula,
                article['published_date'].strftime('%Y-%m-%d'),
                f"{article['relevance_score']:.1f}",
                article['rationale']
            ])