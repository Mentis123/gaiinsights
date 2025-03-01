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
import random

def generate_executive_relevance(article):
    """Generate enterprise executive-focused AI relevance assessment"""
    # First try to use the AI-generated business value if available
    if 'ai_business_value' in article and article['ai_business_value'] and len(article['ai_business_value']) > 10:
        return article['ai_business_value']

    # Next try to use the ai_validation field if it exists and is meaningful
    if 'ai_validation' in article and article['ai_validation'] and article['ai_validation'] != "AI-related article found in scan":
        return article['ai_validation']

    # Combined text for comprehensive analysis
    title = article.get('title', '').lower()
    summary = article.get('summary', '').lower()
    text = title + " " + summary

    # Dynamic opening phrases based on content analysis
    opening_phrases = {
        'strategy': [
            "Consider implementing",
            "Explore opportunities with",
            "Evaluate the potential of",
            "Capitalize on",
            "Integrate"
        ],
        'innovation': [
            "Stay competitive by leveraging",
            "Transform operations through",
            "Accelerate growth with",
            "Pioneer new solutions using",
            "Maximize efficiency through"
        ],
        'risk': [
            "Mitigate risks by implementing",
            "Strengthen security with",
            "Protect assets using",
            "Enhance compliance through",
            "Safeguard operations with"
        ],
        'customer': [
            "Enhance customer experience using",
            "Drive engagement through",
            "Personalize services with",
            "Improve satisfaction using",
            "Revolutionize interactions via"
        ],
        'efficiency': [
            "Optimize processes with",
            "Streamline operations using",
            "Boost productivity through",
            "Reduce costs by implementing",
            "Scale operations with"
        ]
    }

    # Content-based phrase selection
    phrase_category = 'strategy'  # default
    if any(word in text for word in ['innovate', 'transform', 'future', 'breakthrough']):
        phrase_category = 'innovation'
    elif any(word in text for word in ['risk', 'security', 'protect', 'compliance']):
        phrase_category = 'risk'
    elif any(word in text for word in ['customer', 'user', 'experience', 'service']):
        phrase_category = 'customer'
    elif any(word in text for word in ['efficiency', 'optimize', 'streamline', 'productivity']):
        phrase_category = 'efficiency'

    opening = random.choice(opening_phrases[phrase_category])

    # Industry-specific strategic relevance with enterprise adoption focus
    industries = {
        'retail': "these retail-focused AI solutions to enhance customer personalization and streamline inventory management",
        'fashion': "AI-driven trend analysis to improve demand forecasting and create responsive supply chains",
        'manufacturing': "smart manufacturing systems to reduce defects and optimize production workflows",
        'healthcare': "healthcare-specific AI solutions to improve clinical workflows and enhance patient care",
        'finance': "financial AI tools to strengthen risk assessment and automate compliance monitoring",
        'banking': "banking-focused AI to enhance fraud detection and deliver personalized experiences",
        'education': "educational AI applications to develop personalized learning experiences",
        'media': "media-optimized AI to enhance content creation and audience targeting",
        'language': "language AI technologies to improve global collaboration",
        'customer': "AI-powered customer service solutions to enhance support operations",
        'security': "AI security systems to strengthen threat detection and automate responses",
        'supply chain': "supply chain AI to improve forecasting accuracy and operational resilience"
    }

    # Technology-specific business implications
    technologies = {
        'generative ai': "generative AI capabilities to enhance content creation and knowledge work",
        'llm': "large language model applications to augment knowledge workers and streamline information access",
        'machine learning': "machine learning solutions to improve decision-making and forecasting accuracy",
        'neural network': "neural network technologies to enhance pattern recognition and quality control",
        'computer vision': "computer vision systems to automate inspection and enhance quality assurance",
        'natural language': "natural language processing to improve response efficiency and service quality",
        'automation': "intelligent automation to streamline workflows and reduce manual processing",
        'predictive': "predictive analytics to improve planning accuracy and resource allocation"
    }

    # Check for industry-specific relevance
    for industry, relevance in industries.items():
        if industry in text:
            return f"{opening} {relevance}."

    # Check for technology-specific implications
    for tech, relevance in technologies.items():
        if tech in text:
            return f"{opening} {relevance}."

    # Default response with varied phrasing
    default_relevances = [
        f"{opening} AI solutions to drive operational efficiency and enhance competitive positioning.",
        f"{opening} artificial intelligence to transform business processes and create strategic advantages.",
        f"{opening} AI capabilities to improve decision-making and accelerate innovation.",
        f"{opening} intelligent solutions to optimize operations and drive business growth."
    ]

    return random.choice(default_relevances)

def clean_summary(summary_text):
    """Clean and condense summary for executive-friendly format"""
    if not summary_text:
        return "This article discusses AI technology applications and implications."

    # Remove metadata formatting
    summary_text = re.sub(r'\[(.*?)\]', '', summary_text)
    summary_text = re.sub(r'\([^)]*\)', '', summary_text)

    # Remove quotes that may have been added by LLMs
    summary_text = summary_text.replace('"', '').replace('"', '')

    # Remove strange characters but preserve meaningful punctuation
    summary_text = re.sub(r'[^\w\s.,;:!?-]', '', summary_text)

    # Normalize whitespace
    summary_text = re.sub(r'\s+', ' ', summary_text).strip()

    # Ensure extreme conciseness (max 2 sentences)
    sentences = re.split(r'(?<=[.!?])\s+', summary_text)

    if len(sentences) > 2:
        summary_text = ' '.join(sentences[:2])

    # Apply strict length constraint (maximum 30 words for PDF reports)
    # Increased slightly to better preserve meaning in business context
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
        title = Paragraph(f'<para><a href="{url}" target="_blank">{article["title"]}</a></para>', title_style)

        # Format the date
        date_str = article['date']
        if hasattr(date_str, 'strftime'):
            date_str = date_str.strftime('%Y-%m-%d')
        date = Paragraph(date_str, normal_style)

        # Clean up the summary text for better formatting
        summary_text = clean_summary(article.get('summary', 'No summary available'))
        summary = Paragraph(summary_text, normal_style)

        # Always prioritize ai_business_value for executive relevance 
        if 'ai_business_value' in article and article['ai_business_value'] and len(article['ai_business_value']) > 10:
            exec_relevance = article['ai_business_value']
        elif 'ai_validation' in article and article['ai_validation'] and article['ai_validation'] != "AI-related article found in scan":
            exec_relevance = article['ai_validation']
        else:
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

        # Always prioritize ai_business_value for executive relevance
        if 'ai_business_value' in article and article['ai_business_value'] and len(article['ai_business_value']) > 10:
            exec_relevance = article['ai_business_value']
        elif 'ai_validation' in article and article['ai_validation'] and article['ai_validation'] != "AI-related article found in scan":
            exec_relevance = article['ai_validation']
        else:
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