
import os
import json
import logging
from typing import List, Dict, Optional
from openai import OpenAI
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CriteriaAgent:
    """
    An agent that can dynamically adapt search criteria based on results
    to improve search quality and relevance
    """
    
    def __init__(self, config=None):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.model = "o3-mini"
        self.config = config or {}
        self.history = []
        
    def analyze_results(self, criteria: str, articles: List[Dict]) -> Dict:
        """
        Analyze search results and provide feedback on criteria quality
        
        Args:
            criteria: Original search criteria
            articles: List of article results
            
        Returns:
            Dict with analysis information
        """
        try:
            # Record for history
            self.history.append({
                'timestamp': datetime.now().isoformat(),
                'criteria': criteria,
                'result_count': len(articles)
            })
            
            if not articles:
                return self._handle_no_results(criteria)
                
            # Prepare article data for analysis
            article_data = []
            for article in articles[:10]:  # Limit to 10 articles for analysis
                article_data.append({
                    'title': article.get('title', ''),
                    'relevance_score': article.get('relevance_score', 0),
                    'summary': article.get('summary', '')[:200]  # Truncate summary
                })
                
            # Use AI to analyze results
            prompt = f"""
            Analyze these search results for the following AI news search criteria:
            
            Original criteria: "{criteria}"
            
            Article results ({len(articles)} total):
            {json.dumps(article_data)}
            
            Provide the following analysis:
            1. Quality score (0-10) for how well the results match the criteria
            2. Identified gaps or missing aspects from the original criteria
            3. 2-3 suggested improvements to the criteria
            4. 2-3 alternative criteria formulations that might yield better results
            5. Specific technical terms that should be included for better results
            
            Format your response as a JSON object with these keys:
            quality_score, identified_gaps, suggested_improvements, alternative_criteria, technical_terms
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add additional metadata
            result['timestamp'] = datetime.now().isoformat()
            result['original_criteria'] = criteria
            result['result_count'] = len(articles)
            
            # Save analysis to history
            self.history[-1]['analysis'] = result
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing search results: {str(e)}")
            return {
                'quality_score': 5,
                'identified_gaps': ['Analysis error occurred'],
                'suggested_improvements': ['Retry with more specific criteria'],
                'alternative_criteria': [criteria],
                'technical_terms': [],
                'timestamp': datetime.now().isoformat(),
                'original_criteria': criteria,
                'result_count': len(articles)
            }
            
    def _handle_no_results(self, criteria: str) -> Dict:
        """Generate analysis when no results are found"""
        try:
            prompt = f"""
            The following AI news search criteria yielded NO RESULTS:
            
            "{criteria}"
            
            Analyze the criteria and provide:
            1. Likely reasons for no results (too specific, time range issues, etc.)
            2. 3 suggested improvements to get better results
            3. 3 alternative criteria formulations
            4. Whether to broaden the time range
            
            Format as JSON with keys:
            reasons_for_no_results, suggested_improvements, alternative_criteria, broaden_timeframe
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add standard fields for consistency
            result['quality_score'] = 0
            result['identified_gaps'] = result.get('reasons_for_no_results', [])
            result['technical_terms'] = []
            result['timestamp'] = datetime.now().isoformat()
            result['original_criteria'] = criteria
            result['result_count'] = 0
            
            return result
            
        except Exception as e:
            logger.error(f"Error handling no results: {str(e)}")
            return {
                'quality_score': 0,
                'identified_gaps': ['The search yielded no results'],
                'suggested_improvements': [
                    'Broaden the search criteria',
                    'Use more general AI-related terms',
                    'Extend the time range'
                ],
                'alternative_criteria': [
                    'Recent AI developments and news',
                    'AI technology breakthrough reports',
                    'Machine learning industry updates'
                ],
                'technical_terms': [],
                'timestamp': datetime.now().isoformat(),
                'original_criteria': criteria,
                'result_count': 0,
                'broaden_timeframe': True
            }
            
    def generate_improved_criteria(self, original_criteria: str, analysis: Dict) -> str:
        """Generate improved search criteria based on analysis"""
        try:
            # Extract improvement suggestions
            improvements = analysis.get('suggested_improvements', [])
            alt_criteria = analysis.get('alternative_criteria', [])
            technical_terms = analysis.get('technical_terms', [])
            
            prompt = f"""
            Original search criteria: "{original_criteria}"
            
            Analysis:
            - Quality score: {analysis.get('quality_score', 'N/A')}/10
            - Identified gaps: {', '.join(analysis.get('identified_gaps', []))}
            - Suggested improvements: {', '.join(improvements)}
            - Alternative criteria: {', '.join(alt_criteria)}
            - Technical terms to include: {', '.join(technical_terms)}
            
            Based on this analysis, generate ONE improved search criteria that:
            1. Addresses the identified gaps
            2. Incorporates the suggested improvements
            3. Includes relevant technical terms
            4. Is specific enough to yield relevant results
            5. Is concise (under 50 words)
            
            Return ONLY the improved criteria text, without explanations or metadata.
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=200
            )
            
            improved_criteria = response.choices[0].message.content.strip()
            
            # Save to history
            self.history[-1]['improved_criteria'] = improved_criteria
            
            return improved_criteria
            
        except Exception as e:
            logger.error(f"Error generating improved criteria: {str(e)}")
            return original_criteria
            
    def get_search_history(self) -> List[Dict]:
        """Get the agent's search history"""
        return self.history
        
    def save_criteria(self, criteria: str, name: str = None) -> Dict:
        """Save criteria with optional name for future reference"""
        saved_criteria = {
            'criteria': criteria,
            'timestamp': datetime.now().isoformat(),
            'name': name or f"Criteria {len(self.history) + 1}"
        }
        
        # If we have a database, save it there
        try:
            from utils.db_manager import DBManager
            db = DBManager()
            db.save_criteria(saved_criteria)
        except Exception as e:
            logger.error(f"Error saving criteria to database: {str(e)}")
        
        return saved_criteria
