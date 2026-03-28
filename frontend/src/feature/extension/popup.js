const API = "http://127.0.0.1:5000/api"
const APP_URL = "http://localhost:5173"

const loginScreen = document.getElementById("login-screen")
const saveScreen = document.getElementById("save-screen")
const logoutBtn = document.getElementById("logout-btn")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const loginBtn = document.getElementById("login-btn")
const loginError = document.getElementById("login-error")

const urlPreview = document.getElementById("url-preview")
const pageTitle = document.getElementById("page-title")
const tagsRow = document.getElementById("tags-row")
const collectionSelect = document.getElementById("collection-select")
const saveBtn = document.getElementById("save-btn")
const saveError = document.getElementById("save-error")
const successCard = document.getElementById("success-card")
const openAppBtn = document.getElementById("open-app-btn")

let currentUrl = ""
let currentToken = ""

chrome.storage.local.get(["nexus_token"], async (result) => {
    if (result.nexus_token) {
        currentToken = result.nexus_token
        await showSaveScreen()
    } else {
        showLoginScreen()
    }
})

function showLoginScreen() {
    loginScreen.classList.remove("hidden")
    saveScreen.classList.add("hidden")
    logoutBtn.classList.add("hidden")
}

async function showSaveScreen() {
    loginScreen.classList.add("hidden")
    saveScreen.classList.remove("hidden")
    logoutBtn.classList.remove("hidden")
    await Promise.all([loadCurrentTab(), loadCollections()])
}

async function loadCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentUrl = tab?.url || ""
    urlPreview.textContent = currentUrl || "No active tab"
    pageTitle.textContent = tab?.title || "Untitled"
}

async function loadCollections() {
    collectionSelect.innerHTML = '<option value="">No collection</option>'

    try {
        const res = await fetch(`${API}/collections`, {
            headers: {
                Authorization: `Bearer ${currentToken}`,
            },
            credentials: "include",
        })

        const data = await res.json()

        if (!res.ok || !data.success || !Array.isArray(data.collections)) {
            return
        }

        data.collections.forEach((collection) => {
            const option = document.createElement("option")
            option.value = collection._id
            option.textContent = collection.name
            collectionSelect.appendChild(option)
        })
    } catch (error) {
        console.error("Failed to load collections", error)
    }
}

loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim()
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

        chrome.storage.local.set({ nexus_token: data.token })
        currentToken = data.token
        await showSaveScreen()
    } catch (error) {
        showError(loginError, "Cannot connect to Nexus server")
    } finally {
        loginBtn.disabled = false
        loginBtn.textContent = "Sign in"
    }
})

saveBtn.addEventListener("click", async () => {
    if (!currentUrl) return

    saveBtn.disabled = true
    saveBtn.textContent = "Saving..."
    successCard.classList.add("hidden")
    tagsRow.innerHTML = ""
    hideError(saveError)

    try {
        const payload = { url: currentUrl }
        if (collectionSelect.value) {
            payload.collectionId = collectionSelect.value
        }

        const res = await fetch(`${API}/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentToken}`,
            },
            credentials: "include",
            body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
            showError(saveError, data.message || "Failed to save")
            return
        }

        if (data.item?.tags?.length) {
            tagsRow.innerHTML = data.item.tags
                .slice(0, 5)
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")
        }

        successCard.textContent = collectionSelect.value
            ? "Saved to Nexus and added to collection"
            : "Saved to Nexus"
        successCard.classList.remove("hidden")
        saveBtn.textContent = "Saved"
    } catch (error) {
        showError(saveError, "Cannot connect to Nexus server")
    } finally {
        saveBtn.disabled = false
    }
})

openAppBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: APP_URL })
})

logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove("nexus_token")
    currentToken = ""
    emailInput.value = ""
    passwordInput.value = ""
    collectionSelect.innerHTML = '<option value="">No collection</option>'
    tagsRow.innerHTML = ""
    successCard.classList.add("hidden")
    saveBtn.textContent = "Save"
    showLoginScreen()
})

function showError(el, msg) {
    el.textContent = msg
    el.classList.remove("hidden")
}

function hideError(el) {
    el.textContent = ""
    el.classList.add("hidden")
}
