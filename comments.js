const API_URL = "https://one137.dev/comments-api"

let newCommentForm, submitBtn, errorDiv, commentsListDiv // Elements created by injectCommentSection()
let isSubmitting = false

/**
 * Formats a date string into a localized date-time string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    return new Date(dateString).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        // hour: "2-digit",
        // minute: "2-digit"
    })
}

/**
 * Returns the current page's name
 * E.g. https://one137.dev/knowledge/Homelab/XYZ/Debian-Systems => Debian-Systems
 *      https://one137.dev/knowledge/ => knowledge 
 * @returns {string}
 */
function getPageName() {
    const pageSegments = window.location.pathname.split('/')
    if (pageSegments.length > 1 && pageSegments[pageSegments.length - 1] === '') {
        pageSegments.pop() // pathname ends with "/", use what's before the last slash
    }
    return pageSegments[pageSegments.length - 1]
}

/**
 * Fetches and displays comments
 * @returns {Promise<void>}
 */
async function fetchComments() {
    try {
        const response = await fetch(`${API_URL}/comments?pageName=${encodeURIComponent(getPageName())}`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const comments = await response.json()

        if (comments.length === 0) {
            commentsListDiv.innerHTML = "No comments yet."
            return
        }

        const commentsHtml = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span> –
                    <span class="comment-timestamp">${formatDate(comment.timestamp)}</span>
                </div>
                <div class="comment-message">${comment.message}</div>
            </div>
        `).join("\n")
        commentsListDiv.innerHTML = commentsHtml
    } catch (error) {
        console.error("Error fetching comments:", error) // TMP
        commentsListDiv.innerHTML = "Error loading comments. Please try again later."
    }
}

function resetSubmitState() {
    isSubmitting = false
    submitBtn.disabled = false
}

/**
 * Displays an error message to the user when submitting a new comment
 * @param {string} message - Error message to display
 */
function showSubmitError(message) {
    errorDiv.textContent = message
    errorDiv.style.display = "block"
    resetSubmitState()
}

/**
 * Handles data validation and form submission
 * @param {Event} event - Form submission event
 * @returns {Promise<void>}
 */
async function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) return
    isSubmitting = true
    submitBtn.disabled = true
    errorDiv.style.display = "none"

    const formData = {
        author: document.getElementsByName("cmt-author")[0].value.trim(),
        message: document.getElementsByName("cmt-message")[0].value.trim(),
        email: document.getElementsByName("cmt-email")[0].value.trim(),
        timestamp: document.getElementsByName("cmt-timestamp")[0].value,
    }

    // Client-side timing check
    const timeElapsed = Date.now() - parseInt(formData.timestamp)
    if (timeElapsed < 2000) {
        showSubmitError("Please review your message before submitting.")
        return
    }
    // Validation is already done HTML-side + server-side

    try {
        const response = await fetch(`${API_URL}/comments?pageName=${encodeURIComponent(getPageName())}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Failed to submit comment")
        }

        newCommentForm.reset()
        document.getElementsByName("cmt-timestamp").value = Date.now()
        await fetchComments()

        setTimeout(resetSubmitState, 1000) // Prevent resubmission for 1 second
    } catch (error) {
        showSubmitError(error.message || "Error submitting comment. Please try again.")
    }
}

/**
 * Injection the comments section into the DOM, i.e. the new comment form and the comments list container
 */
function injectCommentsSection() {
    document.getElementById("one137-comments").innerHTML = `
    <form id="new-comment">
        <div class="cmt-grouped-controls">
            <input type="text" name="cmt-author" placeholder="Your name" required maxlength="50" tabindex="1" />
            <input type="text" name="cmt-email" tabindex="4" />
            <button type="submit" id="cmt-submit" tabindex="3">Submit</button>
            <span class="markdown-tips">Supported markdowns: italic, code, quote and lists.</span>
        </div>
        <textarea name="cmt-message" required maxlength="5000" placeholder="Write a comment..." tabindex="2"></textarea>
        <input type="hidden" name="cmt-timestamp" value="${Date.now()}" />
        <div id="submit-error" style="display: none;"></div>
    </form>
    <div id="comments-list"></div>
`
    newCommentForm = document.getElementById("new-comment")
    submitBtn = document.getElementById("cmt-submit")
    errorDiv = document.getElementById("submit-error")
    commentsListDiv = document.getElementById("comments-list")

    // Events
    newCommentForm.addEventListener("submit", handleSubmit)
    document.getElementsByName("cmt-message")[0].addEventListener("input", function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    })
}

// Initial load
injectCommentsSection()
fetchComments()

// re-fetch on SPA page changes
window.onload = () => {
  let oldHref = document.location.href
  const body = document.querySelector('body')
  const observer = new MutationObserver(mutations => {
    if (oldHref !== document.location.href) {
        oldHref = document.location.href
        injectCommentsSection()
        fetchComments()
    }
  })
  observer.observe(body, { childList: true, subtree: true })
}

