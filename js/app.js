// Main application logic
let currentPage = 'chat';
let currentFilter = 'all';

// Badge configuration - ordered by rarity
const badgeConfig = [
    { id: 'starter', icon: '🌱', name: 'Green Starter', desc: 'Take your first sustainability action', target: 1, category: 'beginner', rarity: 'common' },
    { id: 'energy', icon: '💡', name: 'Energy Saver', desc: 'Reduce electricity usage 5 times', target: 5, category: 'energy', rarity: 'common' },
    { id: 'water', icon: '💧', name: 'Water Guardian', desc: 'Conserve water resources 5 times', target: 5, category: 'water', rarity: 'common' },
    { id: 'ecoCommuter', icon: '🚴', name: 'Eco Commuter', desc: 'Use sustainable transport 10 times', target: 10, category: 'transport', rarity: 'uncommon' },
    { id: 'recycling', icon: '♻️', name: 'Recycling Hero', desc: 'Recycle materials 8 times', target: 8, category: 'waste', rarity: 'rare' },
    { id: 'champion', icon: '🏆', name: 'Eco Champion', desc: 'Complete 25 sustainability actions', target: 25, category: 'achievement', rarity: 'epic' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    if (auth.isAuthenticated()) {
        showApp();
    } else {
        showLogin();
    }
    
    initEventListeners();
});

function initEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Chat input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    // Logo interaction
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', animateLogo);
        logo.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                animateLogo();
            }
        });
    }
    
    // Input validation
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
    }
}

// Authentication functions
function showLogin() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('appPages').style.display = 'none';
    document.title = 'GreenITE - Login';
}

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPages').style.display = 'block';
    const user = auth.getCurrentUser();
    document.getElementById('username').textContent = user || 'User';
    
    // Initialize first page with transition
    const chatPage = document.getElementById('chatPage');
    chatPage.style.display = 'block';
    setTimeout(() => chatPage.classList.add('active'), 10);
    document.getElementById('navChat').classList.add('active');
    document.title = 'GreenITE - Chat With Greenie';
    currentPage = 'chat';
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = SecurityUtils.sanitizeInput(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    
    // Clear previous errors
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    
    // Validate inputs
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        return;
    }
    
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        return;
    }
    
    // Rate limiting
    if (!SecurityUtils.rateLimit('login', 5, 300000)) {
        ErrorHandler.showUserError('Too many login attempts. Please try again later.');
        return;
    }
    
    // Disable button during processing
    btn.disabled = true;
    btn.textContent = 'Authenticating...';
    
    try {
        const result = auth.login(email, password);
        
        if (result.success) {
            btn.textContent = 'Success! ✓';
            ErrorHandler.showSuccess('Login successful!');
            setTimeout(() => {
                showApp();
                btn.disabled = false;
                btn.innerHTML = '<span>🔐</span> Secure Login';
                document.getElementById('loginForm').reset();
            }, 800);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        ErrorHandler.log(error, 'Login attempt');
        btn.style.background = 'linear-gradient(135deg, #ff4757, #ff3838)';
        btn.textContent = error.message || 'Login failed';
        
        setTimeout(() => {
            btn.style.background = '';
            btn.innerHTML = '<span>🔐</span> Secure Login';
            btn.disabled = false;
        }, 2000);
    }
}

function logout() {
    auth.logout();
    showLogin();
}

// Page navigation with transition lock
let isTransitioning = false;

function showPage(page) {
    // Prevent rapid page changes during transition
    if (isTransitioning || currentPage === page) return;
    
    isTransitioning = true;
    const currentActivePage = document.querySelector('.content-page.active');
    const newPage = document.getElementById(page + 'Page');
    
    // Clear any existing timeouts
    clearTimeout(window.pageTransitionTimeout);
    
    // Reset all pages to initial state
    document.querySelectorAll('.content-page').forEach(p => {
        p.classList.remove('active', 'fade-out');
        if (p !== currentActivePage && p !== newPage) {
            p.style.display = 'none';
        }
    });
    
    // Fade out current page
    if (currentActivePage) {
        currentActivePage.classList.add('fade-out');
        window.pageTransitionTimeout = setTimeout(() => {
            currentActivePage.style.display = 'none';
            currentActivePage.classList.remove('active', 'fade-out');
        }, 300);
    }
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-links a:not(.logout-btn)').forEach(a => a.classList.remove('active'));
    
    // Show and fade in new page
    window.pageTransitionTimeout = setTimeout(() => {
        currentPage = page;
        newPage.style.display = 'block';
        
        // Force reflow before adding active class
        newPage.offsetHeight;
        
        setTimeout(() => {
            newPage.classList.add('active');
            document.getElementById('nav' + page.charAt(0).toUpperCase() + page.slice(1)).classList.add('active');
            
            // Update title
            const titles = {
                chat: 'GreenITE - Chat With Greenie',
                notice: 'GreenITE - User Notice',
                play: 'GreenITE - Play With Greenie',
                badges: 'GreenITE - Badges'
            };
            document.title = titles[page];
            
            // Initialize page-specific content
            if (page === 'play') initPlayPage();
            if (page === 'badges') initBadgesPage();
            
            // Release transition lock
            setTimeout(() => {
                isTransitioning = false;
            }, 100);
        }, 50);
    }, currentActivePage ? 300 : 0);
}

// Chat functionality
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;

    sendQuickMessage(message);
    input.value = '';
}

function sendQuickMessage(message) {
    // Add message to queue
    messageQueue.push(message);
    
    // Disable input and button while processing
    const input = document.getElementById('messageInput');
    const button = document.querySelector('.chat-input button');
    const quickBtns = document.querySelectorAll('.quick-btn');
    
    input.disabled = true;
    button.disabled = true;
    quickBtns.forEach(btn => btn.disabled = true);
    
    // Process queue if not already processing
    if (!isProcessing) {
        processMessageQueue();
    }
}

function processMessageQueue() {
    if (messageQueue.length === 0) {
        // Re-enable input when queue is empty
        const input = document.getElementById('messageInput');
        const button = document.querySelector('.chat-input button');
        const quickBtns = document.querySelectorAll('.quick-btn');
        
        input.disabled = false;
        button.disabled = false;
        quickBtns.forEach(btn => btn.disabled = false);
        
        isProcessing = false;
        return;
    }
    
    isProcessing = true;
    const message = messageQueue.shift();
    
    addMessage(message, 'user');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.innerHTML = '🦗 Greenie is thinking... <span class="dots"><span>.</span><span>.</span><span>.</span></span>';
    typingDiv.id = 'typing';
    document.getElementById('chatMessages').appendChild(typingDiv);

    setTimeout(() => {
        const typing = document.getElementById('typing');
        if (typing) typing.remove();
        const response = getBotResponse(message);
        addMessage(response, 'bot');
        
        // Hide quick actions after first interaction
        const quickActions = document.querySelector('.quick-actions');
        if (quickActions && conversationHistory.length > 1) {
            quickActions.style.display = 'none';
        }
        
        // Process next message in queue
        setTimeout(() => processMessageQueue(), 500);
    }, Math.random() * 1000 + 1500); // Random delay 1.5-2.5 seconds
}

function addMessage(text, sender) {
    const messages = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${sender}-message`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// Enhanced chatbot with message queue system
const conversationHistory = [];
const messageQueue = [];
let isProcessing = false;
const sustainabilityTopics = {
    energy: {
        keywords: ['energy', 'electricity', 'solar', 'wind', 'renewable', 'power', 'battery'],
        responses: [
            "⚡ Great question about energy! Singapore is investing heavily in solar energy and aims to deploy 2GW of solar by 2030. You can reduce energy consumption by using LED lights and energy-efficient appliances!",
            "🔋 Renewable energy is the future! Did you know Singapore has one of the world's largest floating solar farms? Consider switching to green energy plans from your utility provider.",
            "💡 Energy efficiency tip: Unplug devices when not in use - they can consume up to 10% of your electricity even when off!"
        ]
    },
    waste: {
        keywords: ['waste', 'recycle', 'trash', 'garbage', 'plastic', 'reduce', 'reuse'],
        responses: [
            "♻️ Waste reduction is crucial! Singapore aims to become a zero-waste nation. Start with the 3Rs: Reduce, Reuse, Recycle. Did you know we can recycle e-waste at community centers?",
            "🗂️ Plastic waste is a major concern. Try using reusable bags, bottles, and containers. Singapore has over 600 recycling bins island-wide!",
            "🌍 Food waste makes up about 10% of total waste in Singapore. Plan your meals and compost organic waste to make a difference!"
        ]
    },
    transport: {
        keywords: ['transport', 'car', 'bike', 'bus', 'mrt', 'walk', 'commute', 'vehicle'],
        responses: [
            "🚲 Sustainable transport is key to reducing carbon emissions! Singapore's public transport system is one of the world's best. Try cycling or walking for short distances.",
            "🚌 Using public transport can reduce your carbon footprint by up to 45%! Singapore is also introducing more electric buses and expanding the rail network.",
            "🚗 If you must drive, consider carpooling or electric vehicles. Singapore offers incentives for EV adoption and has expanding charging infrastructure!"
        ]
    },
    water: {
        keywords: ['water', 'conservation', 'save', 'shower', 'tap', 'rain'],
        responses: [
            "💧 Water is precious in Singapore! We have the Four National Taps strategy. Simple actions like shorter showers and fixing leaks can save significant water.",
            "🌧️ Rainwater harvesting and NEWater are part of Singapore's water sustainability. You can install water-efficient fixtures to reduce consumption by 30%!",
            "🚿 Water-saving tip: A 5-minute shower uses about 50 liters of water. Try timing your showers and using water-efficient showerheads!"
        ]
    },
    climate: {
        keywords: ['climate', 'global warming', 'carbon', 'emission', 'greenhouse', 'temperature'],
        responses: [
            "🌡️ Climate change is real and urgent! Singapore aims to achieve net-zero emissions by 2050. Every action counts - from energy conservation to sustainable choices.",
            "🌍 Carbon footprint reduction starts with you! Track your emissions, choose sustainable products, and support green businesses. Small changes make big impacts!",
            "🌿 Singapore's Green Plan 2030 outlines our sustainability roadmap. You can contribute by adopting eco-friendly habits and supporting green initiatives!"
        ]
    }
};

function getBotResponse(message) {
    const msgLower = message.toLowerCase();
    conversationHistory.push({ user: message, timestamp: Date.now() });
    
    // Check for greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(msgLower)) {
        return "Hello there! 👋 I'm Greenie, your sustainability assistant! I'm here to help you learn about eco-friendly practices, energy conservation, waste reduction, and more. What would you like to know about sustainability today?";
    }
    
    // Check for thanks
    if (/thank|thanks|appreciate/.test(msgLower)) {
        return "You're very welcome! 😊 I'm glad I could help. Remember, every small action towards sustainability makes a difference. Keep up the great work! 🌱";
    }
    
    // Find matching topic
    for (const [topic, data] of Object.entries(sustainabilityTopics)) {
        if (data.keywords.some(keyword => msgLower.includes(keyword))) {
            const randomResponse = data.responses[Math.floor(Math.random() * data.responses.length)];
            
            // Add contextual follow-up
            const followUps = [
                "\n\n💡 Want to learn more? Ask me about other sustainability topics!",
                "\n\n🎯 Ready to take action? Check out the Play section to log your eco-friendly activities!",
                "\n\n🏆 Don't forget to track your progress in the Badges section!"
            ];
            
            return randomResponse + followUps[Math.floor(Math.random() * followUps.length)];
        }
    }
    
    // Check for general sustainability keywords
    const generalKeywords = ['sustainability', 'environment', 'green', 'eco'];
    if (generalKeywords.some(keyword => msgLower.includes(keyword))) {
        return "🌱 Sustainability is about meeting our needs without compromising future generations! It covers energy, waste, water, transport, and climate action. What specific area interests you most? I can provide detailed tips and information!";
    }
    
    // Suggest topics if no match found
    return "🤔 I specialize in sustainability topics! Try asking me about:\n\n⚡ Energy conservation\n♻️ Waste reduction\n🚲 Sustainable transport\n💧 Water conservation\n🌍 Climate action\n\nWhat would you like to explore?";
}

function spinMascot() {
    const mascot = document.getElementById('mascot');
    mascot.classList.add('spinning');
    setTimeout(() => mascot.classList.remove('spinning'), 2000);
}

// Play page functionality
function initPlayPage() {
    displayActions();
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (dropZone && fileInput) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }
}

function handleFiles(files) {
    for (let file of files) {
        if (DataValidator.validateFile(file).valid) {
            addAction(`Uploaded file: ${file.name}`);
        } else {
            ErrorHandler.showUserError('Invalid file type or size');
        }
    }
}

function addActionFromInput() {
    const input = document.getElementById('actionInput');
    const action = input.value.trim();
    if (action && DataValidator.validateAction(action)) {
        addAction(action);
        input.value = '';
    } else {
        ErrorHandler.showUserError('Please enter a valid action');
    }
}

function addAction(text) {
    const actions = JSON.parse(localStorage.getItem('sustainableActions') || '[]');
    const actionEntry = {
        text: SecurityUtils.sanitizeHTML(text),
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
    };
    actions.push(actionEntry);
    localStorage.setItem('sustainableActions', JSON.stringify(actions));
    
    displayActions();
    trackBadgeProgress(text);
}

function displayActions() {
    const actions = JSON.parse(localStorage.getItem('sustainableActions') || '[]');
    const actionsList = document.getElementById('actionsList');
    if (actionsList) {
        actionsList.innerHTML = '';
        
        actions.forEach(action => {
            const div = document.createElement('div');
            div.className = 'action-item';
            div.textContent = `${action.date}: ${action.text}`;
            actionsList.appendChild(div);
        });
    }
}

function trackBadgeProgress(action) {
    const badges = JSON.parse(localStorage.getItem('badges') || '{}');
    const actionLower = action.toLowerCase();
    
    // Transport category
    if (actionLower.includes('bike') || actionLower.includes('cycle') || actionLower.includes('walk') || actionLower.includes('bus') || actionLower.includes('train')) {
        badges.ecoCommuter = (badges.ecoCommuter || 0) + 1;
    } 
    // Recycling category
    else if (actionLower.includes('recycle') || actionLower.includes('reuse') || actionLower.includes('compost')) {
        badges.recycling = (badges.recycling || 0) + 1;
    } 
    // Energy category
    else if (actionLower.includes('energy') || actionLower.includes('electricity') || actionLower.includes('light')) {
        badges.energy = (badges.energy || 0) + 1;
    } 
    // Water category
    else if (actionLower.includes('water') || actionLower.includes('shower') || actionLower.includes('tap')) {
        badges.water = (badges.water || 0) + 1;
    }
    
    badges.starter = (badges.starter || 0) + 1;
    badges.champion = (badges.champion || 0) + 1;
    localStorage.setItem('badges', JSON.stringify(badges));
}

function compareBills() {
    const prevE = parseFloat(document.getElementById('prevElectric').value) || 0;
    const currE = parseFloat(document.getElementById('currElectric').value) || 0;
    const prevW = parseFloat(document.getElementById('prevWater').value) || 0;
    const currW = parseFloat(document.getElementById('currWater').value) || 0;

    // Validate inputs
    if (!DataValidator.validateBillAmount(prevE) || !DataValidator.validateBillAmount(currE) ||
        !DataValidator.validateBillAmount(prevW) || !DataValidator.validateBillAmount(currW)) {
        ErrorHandler.showUserError('Please enter valid bill amounts');
        return;
    }

    const electricSaving = prevE - currE;
    const waterSaving = prevW - currW;
    const totalSaving = electricSaving + waterSaving;

    const result = document.getElementById('billResult');
    result.innerHTML = `
        <h4>Bill Comparison Results:</h4>
        <p>Electric: ${electricSaving >= 0 ? 'Saved' : 'Increased'} $${Math.abs(electricSaving).toFixed(2)}</p>
        <p>Water: ${waterSaving >= 0 ? 'Saved' : 'Increased'} $${Math.abs(waterSaving).toFixed(2)}</p>
        <p><strong>Total: ${totalSaving >= 0 ? 'Saved' : 'Increased'} $${Math.abs(totalSaving).toFixed(2)}</strong></p>
        ${totalSaving > 0 ? '<p>🌱 Great job on reducing your consumption!</p>' : '<p>💡 Try to reduce your usage next month!</p>'}
    `;
    
    if (electricSaving > 0) trackBadgeProgress('saved electricity');
    if (waterSaving > 0) trackBadgeProgress('saved water');
}

// Badges functionality
function initBadgesPage() {
    displayBadges();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            displayBadges();
        });
    });
}

function displayBadges() {
    const badges = JSON.parse(localStorage.getItem('badges') || '{}');
    const grid = document.getElementById('badgesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    let totalEarned = 0;
    let totalProgress = 0;
    
    const filteredBadges = badgeConfig.filter(config => {
        const progress = badges[config.id] || 0;
        const unlocked = progress >= config.target;
        
        if (unlocked) totalEarned++;
        totalProgress += Math.min(progress / config.target, 1);
        
        if (currentFilter === 'unlocked') return unlocked;
        if (currentFilter === 'locked') return !unlocked;
        return true;
    });
    
    filteredBadges.forEach((config, index) => {
        const progress = badges[config.id] || 0;
        const unlocked = progress >= config.target;
        const progressPercent = Math.min((progress / config.target) * 100, 100);
        
        const badgeDiv = document.createElement('div');
        badgeDiv.className = `badge ${unlocked ? 'unlocked' : 'locked'} rarity-${config.rarity}`;
        badgeDiv.setAttribute('data-badge-id', config.id);
        badgeDiv.style.animationDelay = `${index * 0.1}s`;
        
        badgeDiv.innerHTML = `
            ${!unlocked ? '<div class="badge-lock">🔒</div>' : ''}
            <div class="badge-rarity ${config.rarity}">${config.rarity.toUpperCase()}</div>
            <div class="badge-icon">${config.icon}</div>
            <div class="badge-name">${config.name}</div>
            <div class="badge-desc">${config.desc}</div>
            <div class="badge-progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                <span class="progress-text">${unlocked ? 'Completed!' : `${progress}/${config.target}`}</span>
            </div>
        `;
        
        if (unlocked) {
            badgeDiv.addEventListener('click', () => {
                badgeDiv.style.animation = 'unlock 0.8s';
                setTimeout(() => badgeDiv.style.animation = '', 800);
            });
        }
        
        grid.appendChild(badgeDiv);
    });
    
    // Update summary stats
    const totalBadgesEl = document.getElementById('totalBadges');
    const totalProgressEl = document.getElementById('totalProgress');
    if (totalBadgesEl) totalBadgesEl.textContent = `${totalEarned}/${badgeConfig.length}`;
    if (totalProgressEl) totalProgressEl.textContent = `${Math.round((totalProgress / badgeConfig.length) * 100)}%`;
}

// Utility functions
function animateLogo() {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.animation = 'bounce 0.6s';
        setTimeout(() => logo.style.animation = '', 600);
    }
}

function validateEmail() {
    const email = document.getElementById('email').value;
    const errorSpan = document.getElementById('emailError');
    
    if (email && !auth.isValidEmail(email)) {
        errorSpan.textContent = 'Please enter a valid email address';
    } else {
        errorSpan.textContent = '';
    }
}

function validatePassword() {
    const password = document.getElementById('password').value;
    const errorSpan = document.getElementById('passwordError');
    
    if (password && password.length < 6) {
        errorSpan.textContent = 'Password must be at least 6 characters';
    } else {
        errorSpan.textContent = '';
    }
}
