/* ==========================================================================
   MOBILE NAVIGATION LOGIC
   ========================================================================== */
window.toggleSidebar = function() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) {
        sidebar.classList.toggle("active");
        if (overlay) overlay.classList.toggle("active");
    }
};

/* ==========================================================================
   SESSION STATE & AUDIO
   ========================================================================== */
let sessionId = "";
let typingSound = null;
let lastSoundTime = 0;

try {
    typingSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
    typingSound.volume = 0.1;
} catch (e) {
    console.warn("Audio Context blocked or not supported:", e);
}

function playTypingSound() {
    if (!typingSound) return;
    if (localStorage.getItem("askpaper_audio") === "off") return; // respect audio toggle setting
    const now = Date.now();
    if (now - lastSoundTime > 110) {
        typingSound.currentTime = 0;
        typingSound.play().catch(() => {});
        lastSoundTime = now;
    }
}

/* ==========================================================================
   HELPERS
   ========================================================================== */
// Get formatted time like '10:30 AM'
function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

// Extract page citations from AI text
function extractCitations(text) {
    const regex = /(?:page|pages|p\.)\s*(\d+(?:\s*-\s*\d+)?)/gi;
    const pages = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        pages.push(match[1]);
    }
    // Filter duplicates
    return [...new Set(pages)].map(p => `Page ${p}`);
}

/* ==========================================================================
   ACTIVE SEND BUTTON ANIMATION
   ========================================================================== */
const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("sendBtn");

if (questionInput) {
    questionInput.addEventListener("input", () => {
        if (questionInput.value.trim().length > 0) {
            sendBtn.classList.add("active");
        } else {
            sendBtn.classList.remove("active");
        }
    });
}

/* ==========================================================================
   THEME SWITCHING (Keep toggle func)
   ========================================================================== */
window.toggleDark = function() {
    // Show settings overlay directly instead of basic alerts
    window.showSettingsModal();
};

/* ==========================================================================
   LOCALSTORAGE-BASED SESSION HISTORY MANAGER
   ========================================================================== */

// Retrieve list of sessions
function getSessions() {
    try {
        return JSON.parse(localStorage.getItem("askpaper_sessions")) || [];
    } catch (e) {
        return [];
    }
}

// Save list of sessions
function saveSessions(sessions) {
    try {
        localStorage.setItem("askpaper_sessions", JSON.stringify(sessions));
    } catch (e) {
        console.error(e);
    }
}

// Retrieve message logs for a session
function getChatHistory(sessId) {
    try {
        return JSON.parse(localStorage.getItem(`chat_history_${sessId}`)) || [];
    } catch (e) {
        return [];
    }
}

// Save message logs for a session
function saveChatHistory(sessId, history) {
    try {
        localStorage.setItem(`chat_history_${sessId}`, JSON.stringify(history));
    } catch (e) {
        console.error(e);
    }
}

// Add a single message to history logs
function saveMessageToHistory(sessId, text, type, timestamp = "") {
    if (!sessId) return;
    const history = getChatHistory(sessId);
    history.push({ text, type, timestamp });
    saveChatHistory(sessId, history);
}

// Render the sidebar history list
function loadHistoryList() {
    const historyContainer = document.getElementById("history");
    if (!historyContainer) return;
    
    const sessions = getSessions();
    
    if (sessions.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history" style="padding: 10px 18px; font-size: 0.8rem; color: var(--text-muted);">No papers analyzed</div>';
        return;
    }
    
    // Sort sessions by timestamp (recent first)
    sessions.sort((a, b) => b.timestamp - a.timestamp);
    
    historyContainer.innerHTML = "";
    sessions.forEach(sess => {
        const item = document.createElement("div");
        item.className = `history-item ${sess.id === sessionId ? "active" : ""}`;
        item.onclick = () => selectSession(sess.id);
        
        const fileIcon = document.createElement("i");
        fileIcon.className = "far fa-file-pdf";
        
        const nameSpan = document.createElement("span");
        nameSpan.className = "session-name";
        nameSpan.textContent = sess.name;
        nameSpan.title = sess.name;
        
        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn-mini";
        delBtn.innerHTML = '<i class="fas fa-trash-can"></i>';
        delBtn.title = "Delete this history";
        delBtn.onclick = (e) => {
            e.stopPropagation(); // prevent clicking session item
            deleteSession(sess.id);
        };
        
        item.appendChild(fileIcon);
        item.appendChild(nameSpan);
        item.appendChild(delBtn);
        
        historyContainer.appendChild(item);
    });
}

// Change active session
function selectSession(sessId) {
    if (sessionId === sessId) return;
    sessionId = sessId;
    
    // Clear chat contents and load history
    const chatContent = document.getElementById("chatContent");
    if (chatContent) {
        // Clear all except header wrapper and active-pdf card
        const header = document.getElementById("headerWrapper");
        const pdfCard = document.getElementById("activePdfCard");
        chatContent.innerHTML = "";
        if (header) chatContent.appendChild(header);
        if (pdfCard) chatContent.appendChild(pdfCard);
    }
    
    // Update active PDF Card details
    const sessions = getSessions();
    const activeSess = sessions.find(s => s.id === sessId);
    if (activeSess) {
        const pdfCard = document.getElementById("activePdfCard");
        const pdfName = document.getElementById("activePdfName");
        const pdfMeta = document.getElementById("activePdfMeta");
        
        if (pdfCard && pdfName && pdfMeta) {
            pdfName.textContent = activeSess.name;
            pdfMeta.textContent = `${activeSess.pages} pages • ${activeSess.size}`;
            pdfCard.style.display = "flex";
        }
        
        // Hide welcome dropzone
        const welcome = document.getElementById("welcomeContainer");
        if (welcome) welcome.style.display = "none";
    }
    
    // Load historical messages
    const history = getChatHistory(sessId);
    if (history.length > 0) {
        history.forEach(msg => {
            renderMessage(msg.text, msg.type, msg.timestamp);
        });
    }
    
    // Highlight selected item
    loadHistoryList();
    
    // Close sidebar on mobile
    const sidebar = document.getElementById("sidebar");
    if (sidebar && window.innerWidth <= 820) {
        sidebar.classList.remove("active");
    }
}

// Delete session details
async function deleteSession(sessId) {
    if (confirm("Are you sure you want to delete this session and its history?")) {
        try {
            await fetch(`/session/${sessId}`, { method: "DELETE" });
        } catch (err) {
            console.error("Failed to delete session on server:", err);
        }
        
        // Remove from local storage
        let sessions = getSessions();
        sessions = sessions.filter(s => s.id !== sessId);
        saveSessions(sessions);
        localStorage.removeItem(`chat_history_${sessId}`);
        localStorage.removeItem(`notes_${sessId}`); // cleanup notes
        
        // If current session was deleted, start a new chat
        if (sessionId === sessId) {
            window.startNewChat();
        } else {
            loadHistoryList();
        }
    }
}

// Start a clean session / reset UI
window.startNewChat = function() {
    sessionId = "";
    loadHistoryList();
    
    // Hide active PDF card
    const pdfCard = document.getElementById("activePdfCard");
    if (pdfCard) pdfCard.style.display = "none";
    
    // Reset Chat Box back to initial state
    const chatContent = document.getElementById("chatContent");
    if (chatContent) {
        // Keep header, restore welcomeContainer, delete message bubbles
        const header = document.getElementById("headerWrapper");
        const pdfCard = document.getElementById("activePdfCard");
        chatContent.innerHTML = "";
        if (header) chatContent.appendChild(header);
        if (pdfCard) chatContent.appendChild(pdfCard);
        
        // Append welcome Container
        const welcome = document.createElement("div");
        welcome.className = "welcome-container";
        welcome.id = "welcomeContainer";
        welcome.innerHTML = `
            <div class="drop-zone" id="dropZone" 
                 onclick="document.getElementById('pdfFile').click()"
                 ondrop="window.dropHandler(event)" 
                 ondragover="window.dragOverHandler(event)" 
                 ondragleave="window.dragLeaveHandler(event)">
                <div class="dz-art">
                    <i class="fas fa-cloud-arrow-up"></i>
                </div>
                <div class="dz-text">
                    <strong>Click to upload PDF</strong> or drag & drop here
                    <span>PDF document (Max 20MB)</span>
                </div>
            </div>

            <div class="cards-container" id="suggestionsContainer">
                <div class="suggest-card" onclick="window.clickPrompt('Summarize key findings')">
                    <h4>Summarize key findings</h4>
                    <p>Extract the main contributions, findings, and results from the PDF.</p>
                    <i class="far fa-paper-plane"></i>
                </div>
                <div class="suggest-card" onclick="window.clickPrompt('Explain methodology')">
                    <h4>Explain methodology</h4>
                    <p>Identify and explain the key algorithms, techniques, and procedures used.</p>
                    <i class="far fa-paper-plane"></i>
                </div>
                <div class="suggest-card" onclick="window.clickPrompt('List core conclusions')">
                    <h4>List core conclusions</h4>
                    <p>What did the authors conclude? Summarize the takeaway points.</p>
                    <i class="far fa-paper-plane"></i>
                </div>
            </div>
        `;
        chatContent.appendChild(welcome);
    }
    
    // Clear input
    const input = document.getElementById("question");
    if (input) {
        input.value = "";
        input.placeholder = "Ask a question about your PDF...";
    }
    
    if (sendBtn) {
        sendBtn.classList.remove("active");
    }
    
    // Close sidebar on mobile
    const sidebar = document.getElementById("sidebar");
    if (sidebar && window.innerWidth <= 820) {
        sidebar.classList.remove("active");
    }
};

/* ==========================================================================
   RENDER & VISUALIZE MESSAGES
   ========================================================================== */

// Directly renders a saved message in the DOM (static, no typewriter effect)
function renderMessage(text, type, timestamp = "") {
    const chat = document.getElementById("chatContent") || document.getElementById("chatBox");
    if (!chat) return;
    
    // Hide welcome/dropzone layout if present
    const welcome = document.getElementById("welcomeContainer");
    if (welcome) welcome.style.display = "none";

    const msg = document.createElement("div");
    msg.className = `message ${type}`;

    const wrapper = document.createElement("div");
    wrapper.className = "message-content-wrapper";

    const content = document.createElement("div");
    content.className = "message-content";
    
    const timeVal = timestamp || getFormattedTime();

    if (type === "bot") {
        // Avatar on the left for bot
        const avatar = document.createElement("div");
        avatar.className = "bot-avatar-box";
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        msg.appendChild(avatar);

        // Parse markdown text
        content.innerHTML = marked.parse(text);
        wrapper.appendChild(content);

        // Extract citations dynamically
        let pages = extractCitations(text);
        if (pages.length === 0) {
            // Default mock citations based on text hashing/random
            const seed = text.charCodeAt(0) || 15;
            const p1 = (seed % 120) + 1;
            const p2 = p1 + (seed % 8) + 1;
            pages = [`Page ${p1}`, `Page ${p2}`];
        }

        // Citations and actions footer inside bot message bubble
        const footer = document.createElement("div");
        footer.className = "bot-message-footer";

        const sources = document.createElement("div");
        sources.className = "source-badges-container";
        pages.forEach(p => {
            const badge = document.createElement("div");
            badge.className = "source-badge";
            badge.innerHTML = `<i class="far fa-file-lines"></i> ${p}`;
            sources.appendChild(badge);
        });

        const actions = document.createElement("div");
        actions.className = "bot-actions-box";
        
        const copy = document.createElement("button");
        copy.className = "bot-action-icon-btn";
        copy.innerHTML = '<i class="far fa-copy"></i>';
        copy.title = "Copy Response";
        copy.onclick = () => {
            navigator.clipboard.writeText(text);
            copy.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => copy.innerHTML = '<i class="far fa-copy"></i>', 2000);
        };

        const like = document.createElement("button");
        like.className = "bot-action-icon-btn";
        like.innerHTML = '<i class="far fa-thumbs-up"></i>';
        like.title = "Good Response";
        like.onclick = () => {
            like.innerHTML = '<i class="fas fa-thumbs-up"></i>';
            like.style.color = "#3b82f6";
        };

        const dislike = document.createElement("button");
        dislike.className = "bot-action-icon-btn";
        dislike.innerHTML = '<i class="far fa-thumbs-down"></i>';
        dislike.title = "Bad Response";
        dislike.onclick = () => {
            dislike.innerHTML = '<i class="fas fa-thumbs-down"></i>';
            dislike.style.color = "#ea4335";
        };

        actions.appendChild(copy);
        actions.appendChild(like);
        actions.appendChild(dislike);

        footer.appendChild(sources);
        footer.appendChild(actions);
        content.appendChild(footer);
        wrapper.appendChild(content);

        // Bot outer timestamp below bubble
        const timeOuter = document.createElement("div");
        timeOuter.className = "bot-timestamp-outer";
        timeOuter.textContent = timeVal;
        wrapper.appendChild(timeOuter);

        msg.appendChild(wrapper);
        chat.appendChild(msg);
        
        formatCodeBlocks(content);
    } else {
        // User bubble
        content.textContent = text;
        wrapper.appendChild(content);

        // User timestamp and checkmark ✓
        const footer = document.createElement("div");
        footer.className = "message-footer";
        footer.innerHTML = `${timeVal} <i class="fas fa-check"></i>`;
        content.appendChild(footer);

        msg.appendChild(wrapper);
        chat.appendChild(msg);
    }

    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Add code copy headers above pre code blocks
function formatCodeBlocks(container) {
    container.querySelectorAll("pre").forEach(pre => {
        if (pre.previousElementSibling && pre.previousElementSibling.classList.contains("code-header")) {
            return;
        }
        
        const code = pre.querySelector("code");
        if (!code) return;
        
        let lang = "code";
        code.classList.forEach(cls => {
            if (cls.startsWith("language-")) {
                lang = cls.replace("language-", "");
            }
        });
        
        const header = document.createElement("div");
        header.className = "code-header";
        header.innerHTML = `
            <span>${lang.toUpperCase()}</span>
            <button class="copy-code-btn" onclick="window.copyCodeBlock(this)">
                <i class="far fa-copy"></i> Copy code
            </button>
        `;
        
        pre.parentNode.insertBefore(header, pre);
    });
}

// Copy raw text from code block
window.copyCodeBlock = function(btn) {
    const pre = btn.parentElement.nextElementSibling;
    const code = pre ? pre.querySelector("code") : null;
    if (code) {
        navigator.clipboard.writeText(code.textContent);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = originalHTML, 2000);
    }
};

/* ==========================================================================
   FILE UPLOAD (Matches Mock active state)
   ========================================================================== */
const fileInput = document.getElementById("pdfFile");
if (fileInput) {
    // Clear value on click so change event ALWAYS fires even if same file is chosen twice
    fileInput.addEventListener("click", () => {
        fileInput.value = "";
    });
    fileInput.addEventListener("change", uploadPDF);
}

async function uploadPDF(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show temporary upload state
    const chat = document.getElementById("chatContent") || document.getElementById("chatBox");
    if (!chat) return;

    const welcome = document.getElementById("welcomeContainer");
    if (welcome) welcome.style.display = "none";

    const msg = document.createElement("div");
    msg.className = "message bot";
    const avatar = document.createElement("div");
    avatar.className = "bot-avatar-box";
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    msg.appendChild(avatar);

    const wrapper = document.createElement("div");
    wrapper.className = "message-content-wrapper";

    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Processing and indexing <strong>${file.name}</strong>...`;
    
    wrapper.appendChild(content);
    msg.appendChild(wrapper);
    chat.appendChild(msg);

    const chatBox = document.getElementById("chatBox");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/upload", { method: "POST", body: formData });
        const data = await res.json();
        sessionId = data.session_id;

        content.innerHTML = `✅ Successfully indexed <strong>${file.name}</strong>! You can now ask questions about this document.`;
        
        // Extract metadata: Size, Mock pages
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const filePages = Math.max(1, Math.floor(file.size / 9200)) + Math.floor(Math.random() * 12);
        const metaStr = `${filePages} pages • ${fileSizeMB} MB`;

        // Update Active PDF Card
        const pdfCard = document.getElementById("activePdfCard");
        const pdfName = document.getElementById("activePdfName");
        const pdfMeta = document.getElementById("activePdfMeta");
        
        if (pdfCard && pdfName && pdfMeta) {
            pdfName.textContent = file.name;
            pdfMeta.textContent = metaStr;
            pdfCard.style.display = "flex";
        }

        // Add to localStorage session history
        const sessions = getSessions();
        sessions.push({
            id: sessionId,
            name: file.name,
            size: `${fileSizeMB} MB`,
            pages: filePages,
            timestamp: Date.now()
        });
        saveSessions(sessions);
        
        // Log starting greeting message
        saveMessageToHistory(sessionId, `Indexed document: **${file.name}**. Ready for questions!`, "bot", getFormattedTime());
        
        // Refresh sidebar sessions
        loadHistoryList();
        
        // Update input field placeholder
        const input = document.getElementById("question");
        if (input) {
            input.placeholder = `Ask about ${file.name}...`;
        }

    } catch (err) {
        content.textContent = "❌ Upload failed. Please check the backend console or try a smaller PDF.";
    }
}

/* ==========================================================================
   DRAG & DROP LISTENERS
   ========================================================================== */
window.dragOverHandler = function(e) { 
    e.preventDefault(); 
    e.currentTarget.style.borderColor = "#4f46e5"; 
    e.currentTarget.style.background = "rgba(79, 70, 229, 0.05)"; 
};

window.dragLeaveHandler = function(e) { 
    e.preventDefault(); 
    e.currentTarget.style.borderColor = "var(--border)"; 
    e.currentTarget.style.background = "var(--card-bg)"; 
};

window.dropHandler = function(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById("pdfFile").files = files;
        uploadPDF({ target: { files: files } });
    }
};

/* ==========================================================================
   ASK QUESTION
   ========================================================================== */
window.askQuestion = async function() {
    if (!sessionId) {
        const dropZone = document.getElementById("dropZone");
        if (dropZone) {
            dropZone.style.borderColor = "#ea4335";
            dropZone.style.transform = "scale(1.02)";
            setTimeout(() => {
                dropZone.style.borderColor = "var(--border)";
                dropZone.style.transform = "none";
            }, 600);
        }
        alert("Please upload a PDF document first!");
        return;
    }

    const input = document.getElementById("question");
    const question = input.value.trim();
    if (!question) return;

    const timeVal = getFormattedTime();

    // Render User Prompt
    renderMessage(question, "user", timeVal);
    saveMessageToHistory(sessionId, question, "user", timeVal);
    
    input.value = "";
    if (sendBtn) {
        sendBtn.classList.remove("active");
    }
    if (input) input.placeholder = "Ask a question...";

    // Append Bot thinking state
    const chat = document.getElementById("chatContent") || document.getElementById("chatBox");
    if (!chat) return;

    const msg = document.createElement("div");
    msg.className = "message bot";
    
    const avatar = document.createElement("div");
    avatar.className = "bot-avatar-box";
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    msg.appendChild(avatar);

    const wrapper = document.createElement("div");
    wrapper.className = "message-content-wrapper";

    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = `
        <div class="shimmer-container">
            <div class="shimmer-line"></div>
            <div class="shimmer-line"></div>
            <div class="shimmer-line"></div>
        </div>
    `;
    
    wrapper.appendChild(content);
    msg.appendChild(wrapper);
    chat.appendChild(msg);

    const chatBox = document.getElementById("chatBox");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch("/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, question: question })
        });
        
        if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
        }
        
        const data = await res.json();
        const fullText = data.answer;

        // Clear Shimmer Skeleton
        content.innerHTML = "";

        // Text typewriter streaming
        let charIndex = 0;
        const streamInterval = setInterval(() => {
            content.innerHTML = marked.parse(fullText.slice(0, charIndex)) + '<span class="cursor"></span>';
            playTypingSound();
            if (chatBox) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
            charIndex += 2;

            if (charIndex > fullText.length) {
                clearInterval(streamInterval);
                
                // Parse finished answer text
                content.innerHTML = marked.parse(fullText);
                saveMessageToHistory(sessionId, fullText, "bot", timeVal);

                // Build citation list dynamically
                let pages = extractCitations(fullText);
                if (pages.length === 0) {
                    const seed = fullText.charCodeAt(0) || 15;
                    const p1 = (seed % 100) + 1;
                    const p2 = p1 + (seed % 6) + 1;
                    pages = [`Page ${p1}`, `Page ${p2}`];
                }

                // Citations and Bot Actions bottom row
                const footer = document.createElement("div");
                footer.className = "bot-message-footer";

                const sources = document.createElement("div");
                sources.className = "source-badges-container";
                pages.forEach(p => {
                    const badge = document.createElement("div");
                    badge.className = "source-badge";
                    badge.innerHTML = `<i class="far fa-file-lines"></i> ${p}`;
                    sources.appendChild(badge);
                });

                const actions = document.createElement("div");
                actions.className = "bot-actions-box";
                
                const copy = document.createElement("button");
                copy.className = "bot-action-icon-btn";
                copy.innerHTML = '<i class="far fa-copy"></i>';
                copy.title = "Copy Response";
                copy.onclick = () => {
                    navigator.clipboard.writeText(fullText);
                    copy.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => copy.innerHTML = '<i class="far fa-copy"></i>', 2000);
                };

                const like = document.createElement("button");
                like.className = "bot-action-icon-btn";
                like.innerHTML = '<i class="far fa-thumbs-up"></i>';
                like.title = "Good Response";
                like.onclick = () => {
                    like.innerHTML = '<i class="fas fa-thumbs-up"></i>';
                    like.style.color = "#3b82f6";
                };

                const dislike = document.createElement("button");
                dislike.className = "bot-action-icon-btn";
                dislike.innerHTML = '<i class="far fa-thumbs-down"></i>';
                dislike.title = "Bad Response";
                dislike.onclick = () => {
                    dislike.innerHTML = '<i class="fas fa-thumbs-down"></i>';
                    dislike.style.color = "#ea4335";
                };

                actions.appendChild(copy);
                actions.appendChild(like);
                actions.appendChild(dislike);

                footer.appendChild(sources);
                footer.appendChild(actions);
                content.appendChild(footer);

                // Timestamp below card
                const timeOuter = document.createElement("div");
                timeOuter.className = "bot-timestamp-outer";
                timeOuter.textContent = timeVal;
                wrapper.appendChild(timeOuter);

                formatCodeBlocks(content);
                if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
            }
        }, 15);

    } catch (err) {
        content.innerHTML = `<span style="color: #ea4335;"><i class="fas fa-triangle-exclamation"></i> Session expired or index missing. Deleting local state and restarting...</span>`;
        setTimeout(() => {
            let sessions = getSessions();
            sessions = sessions.filter(s => s.id !== sessionId);
            saveSessions(sessions);
            localStorage.removeItem(`chat_history_${sessionId}`);
            localStorage.removeItem(`notes_${sessionId}`);
            window.startNewChat();
        }, 3000);
    }
};

// Enter key support
if (questionInput) {
    questionInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            window.askQuestion();
        }
    });
}

// Suggestion card prompts clicks
window.clickPrompt = function(text) {
    if (!sessionId) {
        const dropZone = document.getElementById("dropZone");
        if (dropZone) {
            dropZone.style.borderColor = "#ea4335";
            dropZone.style.transform = "scale(1.02)";
            setTimeout(() => {
                dropZone.style.borderColor = "var(--border)";
                dropZone.style.transform = "none";
            }, 600);
        }
        alert("Please upload a PDF document first before asking questions!");
        return;
    }
    const input = document.getElementById("question");
    if (input) {
        input.value = text;
        if (sendBtn) {
            sendBtn.classList.add("active");
        }
        window.askQuestion();
    }
};

/* ==========================================================================
   CUSTOM MODALS (Library, Notes, Settings)
   ========================================================================== */
window.showCustomModal = function(title, bodyHTML) {
    const existing = document.querySelector(".modal-overlay");
    if (existing) existing.remove();
    
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.onclick = (e) => {
        if (e.target === modal) window.closeCustomModal();
    };
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-modal-btn" onclick="window.closeCustomModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                ${bodyHTML}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.closeCustomModal = function() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) modal.remove();
};

// Library Modal
window.showLibraryModal = function() {
    const sessions = getSessions();
    let html = "";
    if (sessions.length === 0) {
        html = `<p style="color: var(--text-muted); text-align: center; padding: 20px 0;">No documents loaded yet. Click "+ Upload PDF" to import documents.</p>`;
    } else {
        html = `<div style="display: flex; flex-direction: column; gap: 12px; max-height: 240px; overflow-y: auto; padding-right: 4px;">`;
        sessions.forEach(s => {
            html += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                        <i class="far fa-file-pdf" style="color: #ea4335; font-size: 1.2rem; flex-shrink: 0;"></i>
                        <div style="min-width: 0; flex: 1;">
                            <div style="font-weight: 500; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);">${s.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${s.pages} pages • ${s.size}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 12px;">
                        <button class="btn-primary" style="padding: 6px 12px; font-size: 0.775rem;" onclick="window.closeCustomModal(); selectSession('${s.id}')">Select</button>
                        <button class="btn-danger" style="padding: 6px 12px; font-size: 0.775rem;" onclick="window.deleteSessionFromLibrary('${s.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    window.showCustomModal("Document Library", html);
};

window.deleteSessionFromLibrary = async function(id) {
    window.closeCustomModal();
    await deleteSession(id);
    window.showLibraryModal();
};

// Notes Modal
window.showNotesModal = function() {
    if (!sessionId) {
        alert("Please select or upload a PDF first to take notes!");
        return;
    }
    
    const sessions = getSessions();
    const current = sessions.find(s => s.id === sessionId);
    const docName = current ? current.name : "Active Document";
    
    const savedNotes = localStorage.getItem(`notes_${sessionId}`) || "";
    
    const html = `
        <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 12px;">Notes for: <strong>${docName}</strong></p>
        <textarea id="notesArea" class="notes-textarea" placeholder="Write notes, summaries, or key insights here...">${savedNotes}</textarea>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn-primary" onclick="window.saveNotes()">Save Notes</button>
        </div>
    `;
    window.showCustomModal("Document Notes", html);
};

window.saveNotes = function() {
    const area = document.getElementById("notesArea");
    if (area) {
        localStorage.setItem(`notes_${sessionId}`, area.value);
        alert("Notes saved successfully!");
        window.closeCustomModal();
    }
};

// Settings Modal
window.showSettingsModal = function() {
    const audioOn = localStorage.getItem("askpaper_audio") !== "off";
    const html = `
        <div class="settings-row">
            <div class="settings-label">
                <strong>Typing Sound Effects</strong>
                <span>Play typewriter audio while answers stream</span>
            </div>
            <input type="checkbox" id="audioToggle" class="settings-checkbox" ${audioOn ? "checked" : ""} onchange="window.toggleAudioSetting(this.checked)"/>
        </div>
        <div class="settings-row" style="margin-top: 16px; border-bottom: none; padding-bottom: 0;">
            <div class="settings-label">
                <strong>Reset Application Data</strong>
                <span>Delete all sessions, history, and notes permanently</span>
            </div>
            <button class="btn-danger" onclick="window.resetApplicationData()">Wipe All</button>
        </div>
    `;
    window.showCustomModal("Settings", html);
};

window.toggleAudioSetting = function(enabled) {
    localStorage.setItem("askpaper_audio", enabled ? "on" : "off");
};

window.resetApplicationData = function() {
    if (confirm("This will permanently delete all session history, notes, and local databases. Proceed?")) {
        const sessions = getSessions();
        sessions.forEach(async (s) => {
            try {
                await fetch(`/session/${s.id}`, { method: "DELETE" });
            } catch (e) {}
        });
        
        localStorage.clear();
        window.closeCustomModal();
        window.startNewChat();
        alert("Application data wiped successfully.");
    }
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
window.addEventListener("DOMContentLoaded", () => {
    // Render sidebar sessions
    loadHistoryList();
    
    // Restore default selected session
    const sessions = getSessions();
    if (sessions.length > 0) {
        sessions.sort((a, b) => b.timestamp - a.timestamp);
        selectSession(sessions[0].id);
    }
});