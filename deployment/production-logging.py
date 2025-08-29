"""
Production logging and monitoring configuration for JW Attendant Scheduler
"""
import logging
import logging.handlers
import os
from pathlib import Path


def setup_production_logging():
    """Configure comprehensive logging for production environment"""
    
    # Create log directory
    log_dir = Path('/var/log/jw-attendant')
    log_dir.mkdir(exist_ok=True, parents=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Application log file with rotation
    app_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'application.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    app_handler.setLevel(logging.INFO)
    app_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    app_handler.setFormatter(app_formatter)
    
    # Error log file with rotation
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'errors.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    error_handler.setLevel(logging.ERROR)
    error_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s\n'
        'Exception: %(exc_info)s'
    )
    error_handler.setFormatter(error_formatter)
    
    # Console handler for systemd journal
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    console_formatter = logging.Formatter(
        '[%(levelname)s] %(name)s: %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    
    # Add handlers to root logger
    root_logger.addHandler(app_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)
    
    # Django-specific loggers
    django_logger = logging.getLogger('django')
    django_logger.setLevel(logging.INFO)
    
    # Database query logger (for performance monitoring)
    db_logger = logging.getLogger('django.db.backends')
    db_logger.setLevel(logging.WARNING)  # Only log slow queries and errors
    
    # Security logger
    security_logger = logging.getLogger('django.security')
    security_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'security.log',
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=10
    )
    security_handler.setLevel(logging.WARNING)
    security_handler.setFormatter(app_formatter)
    security_logger.addHandler(security_handler)
    
    # Application-specific logger
    app_logger = logging.getLogger('scheduler')
    app_logger.setLevel(logging.INFO)
    
    return {
        'log_dir': str(log_dir),
        'handlers_configured': len(root_logger.handlers),
        'loggers': ['root', 'django', 'django.db.backends', 'django.security', 'scheduler']
    }


def setup_performance_monitoring():
    """Configure performance monitoring and metrics collection"""
    
    metrics_dir = Path('/var/log/jw-attendant/metrics')
    metrics_dir.mkdir(exist_ok=True, parents=True)
    
    # Performance metrics logger
    perf_logger = logging.getLogger('performance')
    perf_handler = logging.handlers.TimedRotatingFileHandler(
        metrics_dir / 'performance.log',
        when='midnight',
        interval=1,
        backupCount=30
    )
    perf_formatter = logging.Formatter(
        '%(asctime)s,%(message)s'
    )
    perf_handler.setFormatter(perf_formatter)
    perf_logger.addHandler(perf_handler)
    perf_logger.setLevel(logging.INFO)
    
    return {
        'metrics_dir': str(metrics_dir),
        'performance_logger': 'configured'
    }


def log_system_info():
    """Log system information for monitoring"""
    import platform
    import psutil
    
    logger = logging.getLogger('scheduler.system')
    
    # System information
    logger.info(f"System: {platform.system()} {platform.release()}")
    logger.info(f"Python: {platform.python_version()}")
    
    # Memory information
    memory = psutil.virtual_memory()
    logger.info(f"Memory: {memory.total // (1024**3)}GB total, "
               f"{memory.available // (1024**3)}GB available")
    
    # Disk information
    disk = psutil.disk_usage('/')
    logger.info(f"Disk: {disk.total // (1024**3)}GB total, "
               f"{disk.free // (1024**3)}GB free")


if __name__ == '__main__':
    # Setup logging when run directly
    setup_result = setup_production_logging()
    perf_result = setup_performance_monitoring()
    
    print("Production logging configured:")
    print(f"  Log directory: {setup_result['log_dir']}")
    print(f"  Handlers configured: {setup_result['handlers_configured']}")
    print(f"  Loggers: {', '.join(setup_result['loggers'])}")
    print(f"  Metrics directory: {perf_result['metrics_dir']}")
    
    # Log initial system information
    log_system_info()
    
    # Test logging
    logger = logging.getLogger('scheduler')
    logger.info("Production logging system initialized successfully")
    logger.warning("This is a test warning message")
    
    try:
        raise ValueError("Test exception for error logging")
    except Exception as e:
        logger.error("Test error logging", exc_info=True)
