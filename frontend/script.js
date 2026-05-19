// Get DOM elements
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const loadingIndicator = document.getElementById('loading');

// Check if we are running locally or in production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Replace 'YOUR_RENDER_URL' with the actual link Render gives you after deployment
const PRODUCTION_API_URL = 'https://chatbot-backend-mi53.onrender.com/api/chat';
const LOCAL_API_URL = 'http://localhost:3000/api/chat';

// Set the final API URL
const API_URL = isLocal ? LOCAL_API_URL : PRODUCTION_API_URL;

// Initialize chat history as empty (starts fresh on reload)
let chatHistory = [];

// Function to save chat history (Removed localStorage logic to keep chat ephemeral)
function saveHistory() {
    // Intentionally left empty
}

// Function to render a single message in the UI
function renderMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'w-full', 'max-w-xs');

    // Differentiate between user and AI messages for styling
    if (role === 'user') {
        // User message aligns to the right
        messageDiv.classList.add('justify-end', 'ml-auto');
        messageDiv.innerHTML = `
            <div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm">
                <p class="text-sm">${content}</p>
            </div>
        `;
    } else {
        // AI message aligns to the left
        messageDiv.classList.add('justify-start', 'mr-auto');
        messageDiv.innerHTML = `
            <div class="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm">
                <p class="text-sm">${content}</p>
            </div>
        `;
    }

    // Add the message to the chat container
    chatMessages.appendChild(messageDiv);
    
    // Auto-scroll to the bottom to show the newest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Render initial history when the page loads
function renderHistory() {
    chatMessages.innerHTML = ''; // Clear chat area
    
    if (chatHistory.length === 0) {
        // Display a welcome message if history is empty (this doesn't get saved to history)
        renderMessage('assistant', 'Hello! I am your AI assistant. How can I help you today?');
    } else {
        // Render all saved messages
        chatHistory.forEach(msg => {
            renderMessage(msg.role, msg.content);
        });
    }
}

// Function to show/hide the typing loading indicator
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to show loading indicator
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// Handle form submission (when user clicks send or presses Enter)
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page from reloading

    const message = chatInput.value.trim();
    if (!message) return; // Do nothing if input is empty

    // 1. Display user message and clear the input box
    renderMessage('user', message);
    chatInput.value = '';

    // 2. (Removed) We will save to history only after a successful response

    // 3. Show loading indicator while waiting for AI
    showLoading(true);

    try {
        // 4. Send POST request to backend API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: chatHistory // Send previous history
            })
        });

        const data = await response.json();

        // 5. Hide loading indicator once response is received
        showLoading(false);

        if (response.ok) {
            // Add user message to history array only on success to maintain sync
            chatHistory.push({ role: 'user', content: message });
            
            // Display AI response
            renderMessage('assistant', data.reply);
            
            // Add AI response to history and save it
            chatHistory.push({ role: 'assistant', content: data.reply });
            saveHistory();
        } else {
            // Handle error response from backend
            renderMessage('assistant', 'Sorry, I encountered an error. ' + (data.error || ''));
        }

    } catch (error) {
        // Handle network errors (e.g., backend is not running)
        showLoading(false);
        console.error('Fetch error:', error);
        renderMessage('assistant', 'Sorry, I could not connect to the server. Make sure the backend is running.');
    }
});

// Run the render function to display past messages on startup
renderHistory();
