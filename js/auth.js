// Secure authentication module
class AuthManager {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.maxLoginAttempts = 3;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        this.initSecurity();
    }

    initSecurity() {
        // Clear any existing session on page load
        this.clearExpiredSessions();
        // Set up session timeout only after page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupSessionTimeout());
        } else {
            this.setupSessionTimeout();
        }
    }

    // Hash password (simple client-side hashing - in production use server-side)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Check if user is locked out
    isLockedOut() {
        const lockoutData = localStorage.getItem('lockout');
        if (!lockoutData) return false;
        
        const { timestamp, attempts } = JSON.parse(lockoutData);
        const now = Date.now();
        
        if (attempts >= this.maxLoginAttempts && (now - timestamp) < this.lockoutTime) {
            return true;
        }
        
        // Clear expired lockout
        if ((now - timestamp) >= this.lockoutTime) {
            localStorage.removeItem('lockout');
        }
        
        return false;
    }

    // Record failed login attempt
    recordFailedAttempt() {
        const lockoutData = localStorage.getItem('lockout');
        let attempts = 1;
        
        if (lockoutData) {
            const data = JSON.parse(lockoutData);
            attempts = data.attempts + 1;
        }
        
        localStorage.setItem('lockout', JSON.stringify({
            timestamp: Date.now(),
            attempts: attempts
        }));
    }

    // Clear failed attempts on successful login
    clearFailedAttempts() {
        localStorage.removeItem('lockout');
    }

    // Validate credentials securely
    validateCredentials(email, password) {
        // Input validation
        if (!email || !password) return false;
        if (!this.isValidEmail(email)) return false;
        if (password.length < 6) return false;

        // Check lockout
        if (this.isLockedOut()) {
            throw new Error('Account temporarily locked due to multiple failed attempts');
        }

        // Secure credential check (in production, this should be server-side)
        const validEmail = 'adminITE@user.com.sg';
        const validPasswordHash = this.hashPassword('admin1234');
        const inputPasswordHash = this.hashPassword(password);

        return email === validEmail && inputPasswordHash === validPasswordHash;
    }

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Secure login
    login(email, password) {
        try {
            if (this.validateCredentials(email, password)) {
                this.clearFailedAttempts();
                const sessionData = {
                    user: email,
                    timestamp: Date.now(),
                    sessionId: this.generateSessionId()
                };
                localStorage.setItem('session', JSON.stringify(sessionData));
                return { success: true };
            } else {
                this.recordFailedAttempt();
                return { success: false, message: 'Invalid credentials' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Generate secure session ID
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Check if user is authenticated
    isAuthenticated() {
        const sessionData = localStorage.getItem('session');
        if (!sessionData) return false;

        try {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // Check session timeout
            if ((now - session.timestamp) > this.sessionTimeout) {
                this.logout();
                return false;
            }
            
            return true;
        } catch {
            this.logout();
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        const sessionData = localStorage.getItem('session');
        if (!sessionData) return null;
        
        try {
            const session = JSON.parse(sessionData);
            return session.user;
        } catch {
            return null;
        }
    }

    // Logout
    logout() {
        localStorage.removeItem('session');
        localStorage.removeItem('user'); // Remove old user storage
    }

    // Clear expired sessions
    clearExpiredSessions() {
        const sessionData = localStorage.getItem('session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                if ((now - session.timestamp) > this.sessionTimeout) {
                    this.logout();
                }
            } catch {
                this.logout();
            }
        }
    }

    // Setup session timeout warning
    setupSessionTimeout() {
        // Only redirect if we're on a protected page and session expires
        const protectedPages = ['chatbot.html', 'badges.html', 'notice.html', 'play.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            setInterval(() => {
                if (!this.isAuthenticated()) {
                    this.logout();
                    window.location.href = 'index.html';
                }
            }, 60000); // Check every minute
        }
    }
}

// Initialize auth manager
const auth = new AuthManager();