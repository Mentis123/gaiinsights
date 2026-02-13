
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
import logging

logger = logging.getLogger(__name__)

class TimeAnalyzer:
    """Analyzes article timestamps to identify optimal time windows"""
    
    def __init__(self):
        self.min_window_days = 1
        self.max_window_days = 30
        
    def analyze_timeframe(self, articles: List[Dict]) -> Dict:
        """
        Analyze the optimal timeframe for the given articles
        
        Args:
            articles: List of article dictionaries with timestamp information
            
        Returns:
            Dict with analysis results:
                'optimal_timeframe': Recommended timeframe in days
                'density_chart': Base64 encoded image of density chart
                'hotspots': List of date ranges with high article density
        """
        if not articles:
            return {
                'optimal_timeframe': 7,  # Default
                'density_chart': None,
                'hotspots': []
            }
            
        # Extract dates
        dates = []
        for article in articles:
            date_str = article.get('published_date') or article.get('date')
            if isinstance(date_str, str):
                try:
                    # Handle different date formats
                    date = pd.to_datetime(date_str)
                    dates.append(date)
                except:
                    continue
            elif isinstance(date_str, datetime):
                dates.append(date_str)
                
        if not dates:
            return {
                'optimal_timeframe': 7,  # Default
                'density_chart': None,
                'hotspots': []
            }
            
        # Create date series
        date_series = pd.Series(dates)
        
        # Find earliest and latest dates
        min_date = min(dates)
        max_date = max(dates)
        date_range = (max_date - min_date).days
        
        # Calculate optimal timeframe based on date distribution
        optimal_days = self._calculate_optimal_timeframe(dates)
        
        # Generate density chart
        density_chart = self._generate_density_chart(dates)
        
        # Find hotspots (periods with high article density)
        hotspots = self._find_hotspots(dates)
        
        return {
            'optimal_timeframe': optimal_days,
            'density_chart': density_chart,
            'hotspots': hotspots,
            'date_range': {
                'min_date': min_date.strftime('%Y-%m-%d'),
                'max_date': max_date.strftime('%Y-%m-%d'),
                'span_days': date_range
            }
        }
        
    def _calculate_optimal_timeframe(self, dates: List[datetime]) -> int:
        """Calculate optimal timeframe based on article density"""
        if not dates:
            return 7
            
        # Convert to pandas datetime for easier analysis
        date_series = pd.Series(dates)
        
        # Calculate daily frequency
        daily_counts = date_series.dt.date.value_counts().sort_index()
        
        if len(daily_counts) <= 1:
            return 7
            
        # Calculate rolling article counts for different window sizes
        densities = {}
        for window in range(self.min_window_days, min(self.max_window_days, len(daily_counts))):
            rolling_density = daily_counts.rolling(window).sum() / window
            if not rolling_density.empty:
                max_density = rolling_density.max()
                densities[window] = max_density
                
        if not densities:
            return 7
            
        # Find the window size with the best density
        optimal_window = max(densities.items(), key=lambda x: x[1])[0]
        
        # Round to standard intervals (1, 3, 7, 14, 30 days)
        standard_intervals = [1, 3, 7, 14, 30]
        optimal_days = min(standard_intervals, key=lambda x: abs(x - optimal_window))
        
        return optimal_days
        
    def _generate_density_chart(self, dates: List[datetime]) -> Optional[str]:
        """Generate a time density chart as base64 encoded image"""
        if not dates or len(dates) < 2:
            return None
            
        try:
            # Create figure and axis
            fig, ax = plt.subplots(figsize=(10, 4))
            
            # Convert to pandas datetime
            date_series = pd.Series(dates)
            
            # Get date range
            min_date = min(dates).date()
            max_date = max(dates).date()
            
            # Create date range with all days
            all_dates = pd.date_range(min_date, max_date, freq='D')
            
            # Count articles per day
            date_counts = date_series.dt.date.value_counts().sort_index()
            
            # Ensure all dates are in the counts (fill missing with zeros)
            date_counts = date_counts.reindex(all_dates.date, fill_value=0)
            
            # Plot daily counts
            ax.bar(date_counts.index, date_counts.values, color='skyblue')
            
            # Add 7-day moving average
            if len(date_counts) > 7:
                rolling_avg = date_counts.rolling(7, center=True).mean()
                ax.plot(rolling_avg.index, rolling_avg.values, color='red', 
                        linewidth=2, label='7-day average')
                
            # Format x-axis
            ax.set_xlabel('Date')
            ax.set_ylabel('Article Count')
            ax.set_title('Article Frequency Over Time')
            
            # Rotate dates for better readability
            plt.xticks(rotation=45)
            
            # Add legend if applicable
            if len(date_counts) > 7:
                ax.legend()
                
            # Tight layout
            plt.tight_layout()
            
            # Convert to base64
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            plt.close()
            
            return image_base64
            
        except Exception as e:
            logger.error(f"Error generating density chart: {str(e)}")
            return None
            
    def _find_hotspots(self, dates: List[datetime]) -> List[Dict]:
        """Identify date ranges with high article density"""
        if not dates or len(dates) < 3:
            return []
            
        try:
            # Convert to pandas datetime
            date_series = pd.Series(dates)
            
            # Count articles per day
            daily_counts = date_series.dt.date.value_counts().sort_index()
            
            # Calculate mean and standard deviation
            mean_count = daily_counts.mean()
            std_count = daily_counts.std()
            
            # Define threshold for hotspot (mean + 1 standard deviation)
            threshold = mean_count + std_count
            
            # Find days above threshold
            hotspot_days = daily_counts[daily_counts >= threshold].index
            
            if len(hotspot_days) == 0:
                return []
                
            # Group consecutive days into ranges
            ranges = []
            current_range = {'start': hotspot_days[0], 'count': daily_counts[hotspot_days[0]]}
            
            for i in range(1, len(hotspot_days)):
                current_day = hotspot_days[i]
                prev_day = hotspot_days[i-1]
                
                # Check if days are consecutive
                if (current_day - prev_day).days <= 2:  # Allow 1-day gaps
                    current_range['count'] += daily_counts[current_day]
                else:
                    # Finalize previous range
                    current_range['end'] = prev_day
                    current_range['days'] = (current_range['end'] - current_range['start']).days + 1
                    ranges.append(current_range)
                    
                    # Start new range
                    current_range = {'start': current_day, 'count': daily_counts[current_day]}
                    
            # Add the last range
            if current_range:
                current_range['end'] = hotspot_days[-1]
                current_range['days'] = (current_range['end'] - current_range['start']).days + 1
                ranges.append(current_range)
                
            # Format ranges for output
            formatted_ranges = []
            for r in ranges:
                formatted_ranges.append({
                    'start_date': r['start'].strftime('%Y-%m-%d'),
                    'end_date': r['end'].strftime('%Y-%m-%d'),
                    'days': r['days'],
                    'article_count': r['count'],
                    'articles_per_day': r['count'] / r['days']
                })
                
            # Sort by articles_per_day
            formatted_ranges.sort(key=lambda x: x['articles_per_day'], reverse=True)
            
            return formatted_ranges
            
        except Exception as e:
            logger.error(f"Error finding hotspots: {str(e)}")
            return []
