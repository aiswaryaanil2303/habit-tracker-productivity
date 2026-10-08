/* ==========================================================================
   HabitGrow Javascript System (Clock, Sidebar Toggle, and AJAX Habit Tracker)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function() {
    // 1. Live Clock Display in Header
    initClock();

    // 2. Mobile Navigation Sidebar Toggle
    initMobileNav();

    // 3. AJAX Toggle for Habit Completion Checklist
    initHabitToggles();
});

/**
 * Periodically updates the header clock display
 */
function initClock() {
    const clockDisplay = document.getElementById("clock-display");
    if (!clockDisplay) return;

    function updateTime() {
        const now = new Date();
        // Format time nicely: e.g. 10:14:35 PM
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        clockDisplay.innerText = `${hours}:${minutes} ${ampm}`;
    }

    updateTime();
    setInterval(updateTime, 1000);
}

/**
 * Mobile Sidebar Navigation Toggle Handler
 */
function initMobileNav() {
    const mobileToggle = document.getElementById("mobile-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener("click", function() {
            sidebar.classList.toggle("open");
            // Toggle hamburger icon between bars and times
            const icon = mobileToggle.querySelector("i");
            if (icon) {
                if (sidebar.classList.contains("open")) {
                    icon.className = "fa-solid fa-xmark";
                } else {
                    icon.className = "fa-solid fa-bars";
                }
            }
        });
    }
}

/**
 * AJAX Habit Toggle Checklist Functions
 */
function initHabitToggles() {
    const checkboxes = document.querySelectorAll(".habit-toggle-checkbox");
    if (checkboxes.length === 0) return;

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function() {
            const habitId = this.getAttribute("data-habit-id");
            const completed = this.checked;
            const habitRow = document.querySelector(`.habit-item[data-habit-id="${habitId}"]`);
            
            // Get CSRF Token
            const csrftoken = getCookie('csrftoken');

            // Send request to toggle view
            fetch("/habits/toggle/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken
                },
                body: JSON.stringify({
                    habit_id: habitId,
                    completed: completed
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("HTTP status " + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Update Row styling
                    if (data.completed) {
                        habitRow.classList.add("completed");
                        playCheckSound();
                    } else {
                        habitRow.classList.remove("completed");
                    }

                    // Update Streak count for this row
                    const streakCountEl = document.getElementById(`streak-count-${habitId}`);
                    if (streakCountEl) {
                        streakCountEl.innerText = data.streak;
                    }

                    // Update Dashboard Stats Counters dynamically
                    updateStatsUI(data.today_completed_count, data.today_percentage);
                } else {
                    // Revert checkbox state on error
                    this.checked = !completed;
                    showTemporaryAlert("Error toggling habit status.", "danger");
                }
            })
            .catch(error => {
                console.error("AJAX Error:", error);
                this.checked = !completed;
                showTemporaryAlert("Network error, please try again.", "danger");
            });
        });
    });
}

/**
 * Updates Stats widgets on the Dashboard dynamically
 */
function updateStatsUI(completedCount, percentage) {
    // 1. Percentage counter text
    const percentageEl = document.getElementById("stats-percentage");
    if (percentageEl) {
        percentageEl.innerText = percentage + "%";
    }

    // 2. Ratio descriptor text: "X of Y habits completed"
    const ratioEl = document.getElementById("stats-ratio");
    if (ratioEl) {
        // Parse current total from text: "X of Y habits completed"
        const text = ratioEl.innerText;
        const parts = text.split(" of ");
        if (parts.length > 1) {
            const totalStr = parts[1].split(" ")[0]; // Extract Y
            ratioEl.innerText = `${completedCount} of ${totalStr} habits completed`;
        }
    }

    // 3. Progress bar fill width
    const progressBar = document.getElementById("stats-progress-bar");
    if (progressBar) {
        progressBar.style.width = percentage + "%";
    }

    // 4. Checklist header counter pill
    const checklistCounter = document.getElementById("checklist-counter");
    if (checklistCounter) {
        const text = checklistCounter.innerText;
        const parts = text.split("/");
        if (parts.length > 1) {
            const totalStr = parts[1].split(" ")[0]; // Extract Y
            checklistCounter.innerText = `${completedCount}/${totalStr} Done`;
        }
    }
}

/**
 * Play a modern subtle click completion audio feedback
 */
function playCheckSound() {
    // We can generate a quick audio synthesizer note using the Web Audio API
    // so we don't need external assets!
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Fast high-pitch bell beep
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5 note
        
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch(e) {
        // Fallback silently if Web Audio API is blocked or unsupported
        console.log("Audio not played: ", e);
    }
}

/**
 * Helper to display alerts temporarily
 */
function showTemporaryAlert(message, type) {
    const container = document.querySelector(".messages-container");
    if (!container) return;

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible animate-slide-in`;
    alertDiv.innerHTML = `
        <div class="alert-content">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close-btn" onclick="this.parentElement.remove();">&times;</button>
    `;

    container.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

/**
 * Helper function to retrieve Django CSRF cookie
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
