"""
Views package initialization
"""

from .count_views import *
from .event_views import *
from .mobile_views import *
from .main_views import *
from .attendant_views import *
from .assignment_views import *

# Import dashboard functions from isolated modules to avoid circular imports
from .dashboard_fix import dashboard
from .attendant_dashboard_fix import attendant_dashboard
