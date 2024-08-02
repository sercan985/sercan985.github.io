let history = [];
let historyIndex = -1;
let pushingFirstTime = true;
let isProcessingBuffer;
let selectionStart;
let selectionEnd;
const encryptedApiKeys = ['U2FsdGVkX1+Te/5VyrZ8Lx/QpDNqreG1BuM4HVfbKqMM8ai1tvsY45t8dt8vQRmw2EaDKXC2POkqp4dpaKEo7nlvYjiuZyPAagHkV1ESzX8=',
    'U2FsdGVkX19e+AqxYPCw38L/opA04Fq44wUIMItpbl6z6xhGjy57qrVx6o6qRPeQhjKcngm9G7HcyR9XPOyh6Hnyhxil27c8ggPVi+NJ6YU=',
    'U2FsdGVkX1+IBmEg8JrGCfyA2VoznjzdiMdOETdNlXBVoXbJtmq1/zXDEsKbEOXNA944QlYzAV+4xJ7wKQjZD+95TUEdPvwfRJPL/r71ygk='
];
const passwordPrompt = document.getElementById('passwordPrompt');
const passwordInput = document.getElementById('passwordInput');
const submitPassword = document.getElementById('submitPassword');
const noPassword = document.getElementById('noPassword');
const loadingTip = document.getElementById('loadingTip');
const warningLabel = document.getElementById('warningLabel');
const errorDisplay = document.getElementById('errorDisplay');
const tempSlider = document.getElementById("temp");
const tempLabel = document.getElementById("tempLabel");
const defaultLanguage = "English";
let isProcessing = false;
const buttons = document.querySelectorAll('button');
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
document.body.appendChild(loadingIndicator);

function disableButtons() {
    buttons.forEach(button => button.disabled = true);
    isProcessing = true;
    loadingIndicator.style.display = 'block';
}

function enableButtons() {
    buttons.forEach(button => button.disabled = false);
    isProcessing = false;
    loadingIndicator.style.display = 'none';
}

// Initializes saved settings
window.onload = () => {
    const savedApiKey = localStorage.getItem('apiKey');
    const savedModel = localStorage.getItem('model');
    const savedLanguage = localStorage.getItem('language');
    const savedText = localStorage.getItem('textInput');
    const savedConcept = localStorage.getItem('concept');
    const savedStyle = localStorage.getItem('style');
    const savedHistory = localStorage.getItem('history');
    const savedSummaryPercent = localStorage.getItem('summaryPercent');
    const savedSelectionMode = localStorage.getItem('selectionMode');
    const savedTemp = localStorage.getItem('temperature');
    const fontSelect = document.getElementById('fontSelect');
    const textInput = document.getElementById('textInput');
    const savedCustomIns = localStorage.getItem('customIns');

    if (savedLanguage) {
        document.getElementById('language').value = savedLanguage;
    }
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
    }
    if (savedModel) {
        document.getElementById('model').value = savedModel;
    }
    if (!savedApiKey || isEmpty(savedApiKey)) {
        passwordPrompt.style.display = 'block';
        passwordInput.focus();
    }
    if (isEmpty(savedModel)) {
        document.getElementById('model').value = "llama3-70b-8192";
    }
    if (!savedLanguage || isEmpty(savedLanguage)) {
        document.getElementById('language').value = defaultLanguage;
    }
    if (savedText) {
        document.getElementById('textInput').value = savedText;
    } else {
        document.getElementById('textInput').value = "";
    }
    if (savedConcept) {
        document.getElementById('concept').value = savedConcept;
    } else {
        document.getElementById('concept').value = "";
    }
    if (savedStyle) {
        document.getElementById('style').value = savedStyle;
    } else {
        document.getElementById('style').value = "";
    }
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        historyIndex = history.length - 1;
    }
    if (savedCustomIns) {
        document.getElementById('customIns').value = savedCustomIns;
    }

    if (savedSelectionMode) {
        document.getElementById('selectionMode').checked = savedSelectionMode;
    }

    if (savedTemp) {
        tempSlider.value = savedTemp;
        let t = savedTemp;
        if (t > 1.3) {
            tempLabel.textContent = "Creative";
        } else if (t >= 0.7 && t <= 1.3) {
            tempLabel.textContent = "Balanced";
        } else if (t < 0.7) {
            tempLabel.textContent = "Consistent";
        }

        if (savedSummaryPercent) {
            document.getElementById('summaryPercent').value = savedSummaryPercent;

        }

    }

    document.addEventListener('keydown', handleKeyboardShortcuts);
    document.getElementById('selectionMode').addEventListener('change', toggleSelectionMode);

    const savedFont = localStorage.getItem('selectedFont');
    if (savedFont) {
        textInput.style.fontFamily = savedFont;
        fontSelect.value = savedFont;
    }

    // Event listener for font change
    fontSelect.addEventListener('change', (event) => {
        const selectedFont = event.target.value;
        textInput.style.fontFamily = selectedFont;
        localStorage.setItem('selectedFont', selectedFont);
    });


};

document.getElementById('customIns').addEventListener('input', (event) => {
    localStorage.setItem('customIns', event.target.value);
});

document.getElementById('apiKey').addEventListener('input', (event) => {
    localStorage.setItem('apiKey', event.target.value);
});

document.getElementById('language').addEventListener('input', (event) => {
    localStorage.setItem('language', event.target.value);
});

document.getElementById('model').addEventListener('input', (event) => {
    localStorage.setItem('model', event.target.value);
});

document.getElementById('textInput').addEventListener('input', (event) => {
    localStorage.setItem('textInput', event.target.value);
    saveToHistory(event.target.value);
});

document.getElementById('concept').addEventListener('input', (event) => {
    localStorage.setItem('concept', event.target.value);
});

document.getElementById('style').addEventListener('input', (event) => {
    localStorage.setItem('style', event.target.value);
});

document.getElementById('summaryPercent').addEventListener('input', (event) => {
    localStorage.setItem('summaryPercent', parseInt(event.target.value));
});

function toggleSelectionMode() {
    const selectionMode = document.getElementById('selectionMode').checked;
    localStorage.setItem('selectionMode', selectionMode);
}

function getTextToProcess() {
    const textInput = document.getElementById('textInput');
    const selectionMode = document.getElementById('selectionMode').checked;

    if (selectionMode && textInput.selectionStart !== textInput.selectionEnd) {
        selectionStart = textInput.selectionStart;
        selectionEnd = textInput.selectionEnd;
        return textInput.value.substring(selectionStart, selectionEnd);
    } else {
        return textInput.value;
    }
}

function updateTextInput(result) {
    const textInput = document.getElementById('textInput');
    const selectionMode = document.getElementById('selectionMode').checked;

    if (selectionMode && selectionStart !== selectionEnd) {
        let newText = textInput.value.substring(0, selectionStart) + result + textInput.value.substring(selectionEnd);
        textInput.value = newText;

    } else {
        textInput.value = result;
    }

    saveToHistory(textInput.value);
}

function saveToHistory(text) {
    // remove future states if were not at the end
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    history.push(text);
    historyIndex = history.length - 1;
    localStorage.setItem('history', JSON.stringify(history.slice(Math.max(history.length - 10, 0))));
}
async function callGroqAPI(prompt, max_tokens = null) {
    if (isEmpty(prompt)) {
        return "";
    }

    if (isEmpty(localStorage.getItem('apiKey'))) {
        displayError("API key is missing. Please set your API key in the settings.");
        return "";
    }
    disableButtons();
    if (pushingFirstTime) {
        saveToHistory(document.getElementById('textInput').value);
        pushingFirstTime = false;
    }

    try {

        isProcessingBuffer = window.setInterval(function() {
            if (isProcessing)(
                loadingTip.style.display = 'block'
            );
        }, 1000);

        let modelName = "llama3-70b-8192"; // default model 
        if (!isEmpty(localStorage.getItem('model'))) {
            modelName = localStorage.getItem('model');
        }
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('apiKey')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{
                    role: 'system',
                    content: "You are an expert text editor. Keep the original text's length and tone unless tasked or specified otherwise. Do not make any disclaimers or notes. Do not ask any follow-up questions. Do not start with here is or introduce the answer in any way. If there is no meaningful way to perform your task, return the input as is without any changes. Respond strictly in " + document.getElementById('language').value + ". Your task is to " + prompt
                }],
                model: modelName,
                max_tokens: max_tokens,
                temperature: parseInt(tempSlider.value)
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            if (response.status == 503) {
                await callGroqAPI(prompt, max_tokens);
            }

            let errorMessage = errorBody.error.message;
            if (response.status == 429) {
                errorMessage = "Rate limit exceeded. Try switching to another model. If that doesn't work, try entering your password again in the settings";
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        clearError();
        window.clearInterval(isProcessingBuffer);
        loadingTip.style.display = 'none';
        enableButtons();
        return data.choices[0].message.content;
    } catch (error) {
        displayError(error.message);
        window.clearInterval(isProcessingBuffer);
        loadingTip.style.display = 'none';
        enableButtons();
        return ``;
    }
}

function displayError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
}

function clearError() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
}

async function adjustConcept() {
    const text = getTextToProcess();
    const concept = document.getElementById('concept').value;
    const level = document.getElementById('conceptSlider').value;
    const prompt = `Make the following text contain the concept "${concept}" at ${level}%. 0 is not containing it at all and 100 is fully expressing it: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function changeStyle() {
    const text = getTextToProcess();
    const style = document.getElementById('style').value;
    const prompt = `Rewrite the following text in the style of "${style}": ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function summarizeText() {
    const text = getTextToProcess();
    const percent = document.getElementById('summaryPercent').value;
    const n = Math.ceil(Math.max(text.split(' ').length * ((100 - percent) / 100), 1));
    const prompt = `Summarize the following text in ${n} words.: ${text}`;
    const result = await callGroqAPI(prompt, n * 2); // convert n words to n tokens approxiamtely
    updateTextInput(result);
}

async function expandText() {
    const max_tokens = document.getElementById('expandWords').value * 2;
    if (max_tokens < 1) {
        max_tokens = null;
    }

    const text = getTextToProcess();
    const style = document.getElementById('style').value;
    let prompt;
    if (!isEmpty(style)) {
        prompt = `Continue writing the following text for ${document.getElementById('expandWords').value} words in the style of ${style}. IMPORTANT: Do not include the original text. Do not start with a newline or space unless required. Keep the same tone and topic: ${text}`;
    } else {
        prompt = `Continue writing the following text for ${document.getElementById('expandWords').value} words. IMPORTANT: Do not include the original text. Do not start with a newline or space unless required. Keep the same tone, style, topic: ${text}`;
    }
    const result = await callGroqAPI(prompt, max_tokens);
    updateTextInput(text + result.trim());
}

async function verboseText() {
    const text = getTextToProcess();
    const prompt = `Rewrite the following text more verbose. Do not change the overall meaning or add content: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function shortenText() {
    const text = getTextToProcess();
    const prompt = `Shorten the following text while retaining key information: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function rephraseText() {
    const text = getTextToProcess();
    const prompt = `Rephrase the following text using different words and sentence structures while keeping the meaning unchanged: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function checkGrammar() {
    const text = getTextToProcess();
    const prompt = `Fix the following text's grammar and style errors. Keep it unchanged otherwise: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function custom() {
    if (isEmpty(document.getElementById('customIns').value)) {
        return;
    }
    const text = getTextToProcess();
    const prompt = "Rewrite the following text to " + document.getElementById('customIns').value + `: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function humanize() {
    const text = getTextToProcess();
    const prompt = `Rewrite the following text to make it less robotic and more human: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

async function translateText() {
    const text = getTextToProcess();
    const prompt = `Translate the following text to ${document.getElementById('language').value}: ${text}`;
    const result = await callGroqAPI(prompt);
    updateTextInput(result);
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        document.getElementById('textInput').value = history[historyIndex];
        localStorage.setItem('textInput', history[historyIndex]);
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        document.getElementById('textInput').value = history[historyIndex];
        localStorage.setItem('textInput', history[historyIndex]);
    }
}

function handleKeyboardShortcuts(event) {
    // Check if Ctrl key is pressed
    if (event.ctrlKey) {
        switch (event.key.toLowerCase()) {
            case 'z':
                event.preventDefault();
                undo();
                break;
            case 'y':
                event.preventDefault();
                redo();
                break;
        }
    }
}

function decryptApiKey(password) {
    try {
        let key = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        const decrypted = CryptoJS.AES.decrypt(encryptedApiKeys[getRandomIntInclusive(0, 2)], key).toString(CryptoJS.enc.Utf8);
        if (decrypted) {
            document.getElementById('apiKey').value = decrypted;
            localStorage.setItem('apiKey', decrypted);
            return true;
        }
    } catch (error) {
        console.error('Decryption failed:', error);
    }
    return false;
}

function encryptApiKey(apiKey, password) {
    try {
        let key = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        const encrypted = CryptoJS.AES.encrypt(apiKey, key).toString();
        return encrypted;
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
}



submitPassword.addEventListener('click', function() {
    const password = passwordInput.value;
    if (decryptApiKey(password)) {
        passwordPrompt.style.display = 'none';
        passwordInput.value = '';
    } else {
        alert('Incorrect password. Please try again.');
    }
});

noPassword.addEventListener('click', function() {
    passwordPrompt.style.display = 'none';
    passwordInput.value = '';
});

passwordInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        submitPassword.click();
    }
});

function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

document.querySelector('.settings-container').addEventListener('click', function() {
    document.getElementById('settingsModal').style.display = 'block';
});


window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('settingsModal')) {
        document.getElementById('settingsModal').style.display = 'none';
    }
});

function isEmpty(str) {
    if (str == null) {
        return true;
    }
    return !str.trim().length;
}

window.setInterval(function() {
    if (isEmpty(localStorage.getItem('apiKey'))) {
        warningLabel.style.display = 'block';
    } else {
        warningLabel.style.display = 'none';
    }
}, 500);

tempSlider.oninput = function() {
    var t = this.value;
    if (t > 1.3) {
        tempLabel.textContent = "Creative";
    } else if (t >= 0.7 && t <= 1.3) {
        tempLabel.textContent = "Balanced";
    } else if (t < 0.7) {
        tempLabel.textContent = "Consistent";
    }
    localStorage.setItem('temperature', t);
};
