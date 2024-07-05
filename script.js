const chatBox = document.getElementById('chat-box');
const startListeningBtn = document.getElementById('start-listening');
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const apiKey = 'gAAAAABmXXwAGZSHDEBTNWcVQWauMjOF86In8aqp8kxmvxNR4Ma3jFzBJ7c_dCF_5oncKUd-QIl_3Py-rSoVyTrrm8XMW61vvk7Fv_wJ149WjkXtNA4puKv27VBXxbpR8uadxTvwr8xx';

function addMessage(message, sender, isCode = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender.toLowerCase());

    if (isCode) {
        const codeElement = document.createElement('code');
        codeElement.textContent = message;
        messageDiv.appendChild(codeElement);
    } else {
        messageDiv.textContent = message;
    }

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(message)
            .then(() => {
                alert('Message copied to clipboard');
            })
            .catch(err => {
                console.error('Error copying message: ', err);
            });
    });

    messageDiv.appendChild(copyButton);
    chatBox.appendChild(messageDiv);
}

async function handleVoiceInput(conversation) {
    try {
        const response = await fetch('https://api.textcortex.com/v1/texts/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ text: conversation })
        });

        if (!response.ok) throw new Error('Failed to fetch suggestions');

        const { data } = await response.json();
        const botMessage = data.outputs[0].text;
        addMessage(botMessage, 'Bot');

        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(botMessage);

        const voices = synthesis.getVoices();
        const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female'));
        utterance.voice = femaleVoice || voices[0];

        synthesis.speak(utterance);

        if (botMessage.startsWith('```') && botMessage.endsWith('```')) {
            addMessage(botMessage.slice(3, -3), 'Bot', true);
        } else {
            addMessage(botMessage, 'Bot');
        }
    } catch (error) {
        console.error('Error:', error.message);
        addMessage('An error occurred. Please try again later.', 'Bot');
    }
}

let conversationHistory = '';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    let isListening = false;

    recognition.onresult = function(event) {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.trim();
        addMessage(command, 'User');
        handleVoiceInput(command);
        startListeningBtn.textContent = "Speak";
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        addMessage('Error occurred in speech recognition. Please try again.', 'Bot');
    };

    startListeningBtn.addEventListener('click', () => {
        if (!isListening) {
            recognition.start();
            startListeningBtn.textContent = 'Speak';
            isListening = true;
        } else {
            recognition.stop();
            startListeningBtn.textContent = "Speak";
            isListening = false;
        }
    });
} else {
    startListeningBtn.textContent = 'Speech recognition is not supported in this browser.';
    startListeningBtn.disabled = true;
}

function handleUserInput() {
    const userInputValue = userInput.value.trim();
    if (userInputValue !== '') {
        addMessage(userInputValue, 'User');
        handleVoiceInput(userInputValue);
        userInput.value = ''; // Clear the input field
    }
}

sendBtn.addEventListener('click', handleUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', () => {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    chatBox.innerHTML = '';
    conversationHistory = '';
});

document.getElementById('send-btn').addEventListener('click', function() {
    document.querySelector('.loader').style.display = 'block';

    setTimeout(function() {
        document.querySelector('.loader').style.display = 'none';
    }, 5000);
});





