from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
import csv

def generate_pdf_report(articles, output_path):
    """
    Generates PDF report in landscape format
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(letter)
    )
    
    styles = getSampleStyleSheet()
    elements = []
    
    # Create table data
    table_data = [['Title', 'Source', 'Relevance Score', 'Rationale']]
    for article in articles:
        table_data.append([
            Paragraph(article['title'], styles['Normal']),
            article['source'],
            str(article['relevance_score']),
            Paragraph(article['rationale'], styles['Normal'])
        ])
    
    # Create table
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(table)
    doc.build(elements)

def generate_csv_report(articles, output_path):
    """
    Generates CSV report
    """
    with open(output_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Title', 'URL', 'Source', 'Published Date', 'Relevance Score', 'Rationale'])
        
        for article in articles:
            writer.writerow([
                article['title'],
                article['url'],
                article['source'],
                article['published_date'],
                article['relevance_score'],
                article['rationale']
            ])
