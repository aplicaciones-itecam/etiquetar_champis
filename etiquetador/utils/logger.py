import logging
import os
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Create logs directory if it doesn't exist
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

# Configure the logger
def setup_logger(name="champitech"):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    # Log format
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    # File handler with rotation (10MB max size, keep 10 backup files)
    file_handler = RotatingFileHandler(
        logs_dir / "champitech.log", 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    
    # Error file handler for errors only
    error_handler = RotatingFileHandler(
        logs_dir / "errors.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=10
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)
    
    return logger

# Create the default logger instance
logger = setup_logger()