import React from 'react';
import { API_URL_BASE } from '@/lib/utils'
class ErrorLogger {
  constructor() {
    this.offlineBuffer = 'react_error_log_buffer';
    this.maxBufferSize = 50;
    this.setupGlobalHandlers();
    this.setupOfflineRecovery();
  }

  setupGlobalHandlers() {
    // Catch all unhandled errors
    window.addEventListener('error', (event) => {
      const { message, filename, lineno, colno, error } = event;
      this.logError({
        type: 'uncaught-error',
        message,
        source: filename,
        line: lineno,
        column: colno,
        stack: error?.stack
      });
      return false;
    });

    // Catch all unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled-rejection',
        message: event.reason?.message || 'Unhandled Promise rejection',
        stack: event.reason?.stack,
        reason: event.reason
      });
    });
  }

  setupOfflineRecovery() {
    window.addEventListener('online', () => {
      this.sendQueuedLogs();
    });

    if (navigator.onLine) {
      this.sendQueuedLogs();
    }
  }

  logError(errorData) {
    const logEntry = {
      ...errorData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      reactInfo: {
        version: React.version
      }
    };

    this.sendErrorToServer(logEntry);
  }

  sendErrorToServer(logEntry) {
    if (!navigator.onLine) {
      this.storeLogLocally(logEntry);
      return;
    }

    fetch(`${API_URL_BASE}/log/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(() => {
      this.storeLogLocally(logEntry);
    });
  }

  storeLogLocally(logEntry) {
    try {
      const storedLogs = JSON.parse(localStorage.getItem(this.offlineBuffer) || '[]');
      storedLogs.push(logEntry);

      if (storedLogs.length > this.maxBufferSize) {
        storedLogs.splice(0, storedLogs.length - this.maxBufferSize);
      }

      localStorage.setItem(this.offlineBuffer, JSON.stringify(storedLogs));
    } catch (e) {
      console.error('Failed to store log locally:', e);
    }
  }

  sendQueuedLogs() {
    try {
      const storedLogs = JSON.parse(localStorage.getItem(this.offlineBuffer) || '[]');
      if (storedLogs.length === 0) return;

      fetch(`${API_URL_BASE}/log/batch/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: storedLogs })
      })
        .then(response => {
          if (response.ok) {
            localStorage.removeItem(this.offlineBuffer);
          }
        })
        .catch(() => {
          // Keep logs for next attempt
        });
    } catch (e) {
      console.error('Failed to process stored logs:', e);
    }
  }

  // Public method for manual logging
  captureException(error, componentInfo = {}) {
    this.logError({
      type: 'react-component-error',
      message: error.message,
      stack: error.stack,
      componentInfo
    });
  }
}

const errorLogger = new ErrorLogger();
export default errorLogger;