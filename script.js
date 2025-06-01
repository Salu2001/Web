document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const translateBtn = document.getElementById('translateBtn');
    const swapBtn = document.getElementById('swapBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearInput = document.getElementById('clearInput');
    const speakInput = document.getElementById('speakInput');
    const speakOutput = document.getElementById('speakOutput');
    const loading = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const charCount = document.getElementById('charCount');

    // Event Listeners
    translateBtn.addEventListener('click', translateText);
    swapBtn.addEventListener('click', swapLanguages);
    copyBtn.addEventListener('click', copyTranslation);
    clearInput.addEventListener('click', clearInputText);
    speakInput.addEventListener('click', speakInputText);
    speakOutput.addEventListener('click', speakOutputText);
    inputText.addEventListener('input', updateCharCount);

    // Initialize character count
    updateCharCount();

    // API Configuration
    const API_ENDPOINT = 'https://global-translator-api.bjcoderx.workers.dev';
    const MAX_TEXT_LENGTH = 5000;
    const RATE_LIMIT_DELAY = 1000; // 1 second between requests
    let lastRequestTime = 0;

    // Supported languages with display names
    const languages = {
        'auto': 'Detect Language',
        'en': 'English',
        'am': 'Amharic',
        'tr': 'Tigrinya',
        'ar': 'Arabic',
        'es': 'Spanish',
        'fr': 'French'
    };

    // Translation function
    async function translateText() {
        const text = inputText.value.trim();
        
        // Validation
        if (!text) {
            showError('Please enter some text to translate');
            return;
        }
        
        if (text.length > MAX_TEXT_LENGTH) {
            showError(`Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`);
            return;
        }
        
        const source = sourceLang.value;
        const target = targetLang.value;
        
        if (source === target && source !== 'auto') {
            showError('Source and target languages cannot be the same');
            return;
        }
        
        // Rate limiting
        const now = Date.now();
        if (now - lastRequestTime < RATE_LIMIT_DELAY) {
            showError('Please wait a moment before making another request');
            return;
        }
        lastRequestTime = now;
        
        // Prepare UI
        loading.style.display = 'flex';
        errorElement.style.display = 'none';
        outputText.value = '';
        
        try {
            // Build API URL
            const params = new URLSearchParams();
            params.append('text', text);
            params.append('targetLang', target);
            if (source !== 'auto') params.append('sourceLang', source);
            
            const apiUrl = `${API_ENDPOINT}/?${params.toString()}`;
            
            // Make API request
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle response
            if (data.translatedText) {
                outputText.value = data.translatedText;
            } else {
                throw new Error('No translation found in response');
            }
        } catch (error) {
            console.error('Translation error:', error);
            showError(error.message || 'Could not translate text. Please try again.');
        } finally {
            loading.style.display = 'none';
        }
    }
    
    // Helper functions
    function swapLanguages() {
        const currentSource = sourceLang.value;
        const currentTarget = targetLang.value;
        
        // Don't swap if source is "auto"
        if (currentSource !== 'auto') {
            sourceLang.value = currentTarget;
        }
        
        // Find the option in target that matches current source (if not auto)
        if (currentSource !== 'auto') {
            targetLang.value = currentSource;
        }
        
        // Also swap the text if there's any
        if (inputText.value && outputText.value) {
            const temp = inputText.value;
            inputText.value = outputText.value;
            outputText.value = temp;
            updateCharCount();
        }
    }
    
    function copyTranslation() {
        if (!outputText.value) return;
        
        outputText.select();
        document.execCommand('copy');
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyBtn.title = 'Copied!';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.title = 'Copy translation';
        }, 2000);
    }
    
    function clearInputText() {
        inputText.value = '';
        updateCharCount();
        inputText.focus();
    }
    
    function speakInputText() {
        if (!inputText.value) return;
        speakText(inputText.value, sourceLang.value === 'auto' ? 'en' : sourceLang.value);
    }
    
    function speakOutputText() {
        if (!outputText.value) return;
        speakText(outputText.value, targetLang.value);
    }
    
    function speakText(text, lang) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            window.speechSynthesis.speak(utterance);
        } else {
            showError('Text-to-speech not supported in your browser');
        }
    }
    
    function updateCharCount() {
        charCount.textContent = inputText.value.length;
        
        // Update color if approaching limit
        if (inputText.value.length > MAX_TEXT_LENGTH * 0.9) {
            charCount.style.color = 'var(--accent-color)';
        } else {
            charCount.style.color = 'var(--gray-color)';
        }
    }
    
    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    
    // Initialize with example text if empty
    if (!inputText.value && location.search.includes('demo=true')) {
        inputText.value = 'Hello, welcome to the Global Translator!';
        updateCharCount();
    }
});