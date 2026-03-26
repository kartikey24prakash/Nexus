const API = "http://127.0.0.1:5000/api"
// ── DOM refs ──────────────────────────────────────────────────
const loginScreen  = document.getElementById("login-screen")
const saveScreen   = document.getElementById("save-screen")
const logoutBtn    = document.getElementById("logout-btn")
const emailInput   = document.getElementById("email")
const passwordInput= document.getElementById("password")
const loginBtn     = document.getElementById("login-btn")
const loginError   = document.getElementById("login-error")
const urlPreview   = document.getElementById("url-preview")
const pageTitle    = document.getElementById("page-title")
const tagsRow      = document.getElementById("tags-row")
const saveBtn      = document.getElementById("save-btn")
const saveError    = document.getElementById("save-error")
const successCard  = document.getElementById("success-card")

let currentUrl = ""
let currentToken = ""

// ── Init ──────────────────────────────────────────────────────
chrome.storage.local.get(["nexus_token"], async (result) => {
    if (result.nexus_token) {
        currentToken = result.nexus_token
        showSaveScreen()
    } else {
        showLoginScreen()
    }
})

// ── Show/hide screens ─────────────────────────────────────────
function showLoginScreen() {
    loginScreen.classList.remove("hidden")
    saveScreen.classList.add("hidden")
    logoutBtn.classList.add("hidden")
}

function showSaveScreen() {
    loginScreen.classList.add("hidden")
    saveScreen.classList.remove("hidden")
    logoutBtn.classList.remove("hidden")
    loadCurrentTab()
}

// ── Get current tab ───────────────────────────────────────────
async function loadCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentUrl = tab.url
    urlPreview.textContent = currentUrl
    pageTitle.textContent = tab.title || "Untitled"
}

// ── Login ─────────────────────────────────────────────────────
loginBtn.addEventListener("click", async () => {
    const email    = emailInput.value.trim()
    const password = passwordInput.value.trim()

    if (!email || !password) {
        showError(loginError, "Email and password are required")
        return
    }

    loginBtn.disabled = true
    loginBtn.textContent = "Signing in..."
    hideError(loginError)

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
            showError(loginError, data.message || "Login failed")
            return
        }

        // store token
        chrome.storage.local.set({ nexus_token: data.token })
        currentToken = data.token
        showSaveScreen()

    } catch (err) {
        showError(loginError, "Cannot connect to Nexus server")
    } finally {
        loginBtn.disabled = false
        loginBtn.textContent = "Sign in"
    }
})

// ── Save ──────────────────────────────────────────────────────
saveBtn.addEventListener("click", async () => {
    if (!currentUrl) return

    saveBtn.disabled = true
    saveBtn.textContent = "Saving..."
    hideError(saveError)

    try {
        const res = await fetch(`${API}/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentToken}`,
            },
            credentials: "include",
            body: JSON.stringify({ url: currentUrl }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
            showError(saveError, data.message || "Failed to save")
            return
        }

        // show tags
        if (data.item?.tags?.length) {
            tagsRow.innerHTML = data.item.tags
                .map(t => `<span class="tag">${t}</span>`)
                .join("")
        }

        // show success
        successCard.classList.remove("hidden")
        saveBtn.textContent = "Saved!"
        saveBtn.style.background = "#10B981"

    } catch (err) {
        showError(saveError, "Cannot connect to Nexus server")
        saveBtn.disabled = false
        saveBtn.textContent = "Save to Nexus"
    }
})

// ── Logout ────────────────────────────────────────────────────
logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove("nexus_token")
    currentToken = ""
    showLoginScreen()
})

// ── Helpers ───────────────────────────────────────────────────
function showError(el, msg) {
    el.textContent = msg
    el.classList.remove("hidden")
}

function hideError(el) {
    el.textContent = ""
    el.classList.add("hidden")
}
