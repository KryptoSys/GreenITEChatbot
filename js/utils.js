// Utility functions for security and data handling
class SecurityUtils {
    // Sanitize HTML to prevent XSS
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Validate and sanitize input
    static sanitizeInput(input, maxLength = 1000) {
        if (typeof input !== 'string') return '';
        return input.trim().substring(0, maxLength);
    }

    // Rate limiting for actions
    static rateLimit(key, maxAttempts = 5, timeWindow = 60000) {
        const now = Date.now();
        const rateLimitKey = `rateLimit_${key}`;
        const data = localStorage.getItem(rateLimitKey);
        
        let attempts = [];
        if (data) {
            attempts = JSON.parse(data).filter(timestamp => (now - timestamp) < timeWindow);
        }
        
        if (attempts.length >= maxAttempts) {
            return false;
        }
        
        attempts.push(now);
        localStorage.setItem(rateLimitKey, JSON.stringify(attempts));
        return true;
    }

    // Secure data storage
    static secureStore(key, data) {
        try {
            const encrypted = btoa(JSON.stringify(data));
            localStorage.setItem(key, encrypted);
            return true;
        } catch {
            return false;
        }
    }

    // Secure data retrieval
    static secureRetrieve(key) {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            return JSON.parse(atob(encrypted));
        } catch {
            return null;
        }
    }
}

class DataValidator {
    // Validate sustainability action
    static validateAction(action) {
        if (!action || typeof action !== 'string') return false;
        if (action.length < 3 || action.length > 500) return false;
        
        // Check for suspicious patterns
        const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
        return !suspiciousPatterns.some(pattern => pattern.test(action));
    }

    // Validate file upload
    static validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.includes(file.type)) return { valid: false, error: 'Invalid file type' };
        if (file.size > maxSize) return { valid: false, error: 'File too large' };
        
        return { valid: true };
    }

    // Validate bill input
    static validateBillAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num >= 0 && num <= 10000;
    }
}

// Error handling and logging
class ErrorHandler {
    static log(error, context = '') {
        console.error(`[${new Date().toISOString()}] ${context}:`, error);
        
        // In production, send to logging service
        // this.sendToLoggingService(error, context);
    }

    static showUserError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4757, #ff3838);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
            box-shadow: 0 4px 20px rgba(255, 71, 87, 0.3);
        `;
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    static showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        `;
        
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
}