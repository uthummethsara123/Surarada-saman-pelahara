const SUBMISSION_API_URL = "https://script.google.com/macros/s/AKfycbzTFVn_7u_oGEeijewaNR0t8a5vARJkiuBWpOuMJVcowQdkDdaWGofaar8BRuG88VGGtQ/exec";

// ==========================================================
// MARATHON TIMELINE CONFIGURATION & GRACE ENGINES
// ==========================================================
// Use standard hyphens instead of dots so browsers can read it cleanly
const START_DATE = new Date("2026-07-26T00:00:00").getTime();
// Admin: Extend this date forward whenever you want to grant extra submission time
const DEADLINE_DATE = new Date("2026-07-27T02:00:00").getTime();

let userIsActivelyWorking = false; // Tracks if they are typing, changing inputs, or selecting photos
let submissionFinishedTime = null; // Tracks when a successful submit occurs
let completedAfterDeadline = false; // Flags whether the user finished late to apply the 5-sec rule

// Injecting flashing container background and inline layout alignment styles dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes lateWarningFlash {
        0% { background-color: rgba(255, 255, 255, 0.02); border-color: rgba(239, 68, 68, 0.3); }
        50% { background-color: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.8); box-shadow: 0 0 12px rgba(255, 255, 255, 0.3); }
        100% { background-color: rgba(255, 255, 255, 0.02); border-color: rgba(239, 68, 68, 0.3); }
    }
    #uploadForm.late-flashing-container {
        animation: lateWarningFlash 1.2s infinite ease-in-out !important;
    }
    .remove-btn-wrapper {
        display: inline-flex !important;
        align-items: center !important;
        vertical-align: middle !important;
    }
    .progress-circle-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        position: relative;
        margin-left: 8px;
    }
    .progress-circle-svg {
        transform: rotate(-90deg);
        width: 28px;
        height: 28px;
    }
    .progress-circle-bg {
        fill: none;
        stroke: #334155;
        stroke-width: 3.5;
    }
    .progress-circle-bar {
        fill: none;
        stroke: #f59e0b;
        stroke-width: 3.5;
        stroke-dasharray: 88;
        stroke-dashoffset: 88;
        transition: stroke-dashoffset 0.2s ease;
    }
    .upload-success-tick {
        color: #10b981 !important;
        font-size: 1.35rem !important;
        display: none;
        margin-left: 8px;
        vertical-align: middle;
    }
`;
document.head.appendChild(styleSheet);

document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadDashboard = document.getElementById('uploadSubmittedDashboard');
    const emailField = document.getElementById('participantEmail');
    const submitBtn = document.getElementById('uploadSubmitBtn');
    const feedback = document.getElementById('uploadFeedback');
    
    const triggerDeleteBtn = document.getElementById('triggerUploadDeleteBtn');
    const confirmDeletionBtn = document.getElementById('confirmUploadDeletionBtn');

    let uploadModalObj = null;
    const modalEl = document.getElementById('uploadDeleteModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        uploadModalObj = new bootstrap.Modal(modalEl);
    }

    // --- ACTIVELY MONITOR USER ENGAGEMENT ---
    if (uploadForm) {
        const markAsActive = () => { 
            if (submissionFinishedTime === null) {
                userIsActivelyWorking = true; 
            }
        };
        uploadForm.addEventListener('input', markAsActive);
        uploadForm.addEventListener('change', markAsActive);
        uploadForm.addEventListener('click', markAsActive);
    }

    // Wrap the remove button and tracking indicators together dynamically to guarantee inline placement on the right side
    document.querySelectorAll('.remove-btn').forEach(btn => {
        const wrapper = document.createElement('div');
        wrapper.className = 'remove-btn-wrapper';
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);
        
        const indicators = document.createElement('span');
        indicators.className = 'd-inline-flex align-items-center';
        indicators.innerHTML = `
            <div class="progress-circle-container d-none" id="circle_container_${btn.getAttribute('data-target')}">
                <svg class="progress-circle-svg">
                    <circle class="progress-circle-bg" cx="14" cy="14" r="12"></circle>
                    <circle class="progress-circle-bar" id="circle_bar_${btn.getAttribute('data-target')}" cx="14" cy="14" r="12"></circle>
                </svg>
            </div>
            <i class="fas fa-check-circle upload-success-tick" id="tick_${btn.getAttribute('data-target')}"></i>
        `;
        wrapper.appendChild(indicators);
    });

    // Initial check on load
    const savedUploadEmail = localStorage.getItem("submittedUploadEmail");
    if (savedUploadEmail && uploadDashboard) {
        if (uploadForm) uploadForm.classList.add("d-none");
        uploadDashboard.classList.remove("d-none");
    }

    document.querySelectorAll('.preview-trigger').forEach(input => {
        input.addEventListener('change', function() {
            const inputName = this.name;
            const wrapper = document.getElementById("wrapper_" + inputName);
            const previewImg = document.getElementById("prev_" + inputName);
            const titleField = document.getElementById("title_" + inputName);
            
            if (this.files.length > 0) {
                const file = this.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    wrapper.classList.remove('d-none');
                    
                    const cleanNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    titleField.value = cleanNameWithoutExtension; 
                    input.classList.add('d-none');

                    const container = document.getElementById(`circle_container_${inputName}`);
                    if(container) container.classList.add('d-none');
                    const tick = document.getElementById(`tick_${inputName}`);
                    if(tick) tick.style.display = 'none';
                }
                reader.readAsDataURL(file);
            }
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetInputName = this.getAttribute('data-target');
            const fileInput = document.querySelector(`input[name="${targetInputName}"]`);
            const wrapper = document.getElementById("wrapper_" + targetInputName);
            const previewImg = document.getElementById("prev_" + targetInputName);
            const titleField = document.getElementById("title_" + targetInputName);
            
            fileInput.value = ""; 
            fileInput.classList.remove('d-none');
            previewImg.src = "";
            titleField.value = "";
            wrapper.classList.add('d-none');

            const container = document.getElementById(`circle_container_${targetInputName}`);
            if(container) container.classList.add('d-none');
            const tick = document.getElementById(`tick_${targetInputName}`);
            if(tick) tick.style.display = 'none';
        });
    });

    // Inject/Update the official announcement message box directly at the top of the main form wrapper card
    if (formWrapper) {
        let infoBox = formWrapper.querySelector('.official-portal-announcement');
        const currentTime = Date.now();
        const targetTime = new Date(START_DATE).getTime();

        // 1. Before portal open time: Show the box with the dynamic variable date
        if (currentTime < targetTime) {
            if (!infoBox) {
                infoBox = document.createElement('div');
                infoBox.className = 'official-portal-announcement text-center mb-4 p-3 rounded fw-bold w-100';
                infoBox.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'; 
                infoBox.style.border = '1px solid rgba(56, 189, 248, 0.2)';
                infoBox.style.color = '#38bdf8';
                infoBox.style.fontSize = '0.95rem';
                formWrapper.insertBefore(infoBox, formWrapper.firstChild);
            }
            
            const openingDateTime = new Date(targetTime);
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthName = months[openingDateTime.getUTCMonth()];
            const dayNum = openingDateTime.getUTCDate();
            
            let daySuffix = "th";
            if (dayNum % 10 === 1 && dayNum !== 11) daySuffix = "st";
            else if (dayNum % 10 === 2 && dayNum !== 12) daySuffix = "nd";
            else if (dayNum % 10 === 3 && dayNum !== 13) daySuffix = "rd";

            let hours = openingDateTime.getUTCHours();
            const minutes = String(openingDateTime.getUTCMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; 
            const formattedTime = `${hours}.${minutes}${ampm}`;

            infoBox.innerHTML = `<i class="fas fa-calendar-alt me-2"></i>Submission portal opens on ${monthName} ${dayNum}${daySuffix} at ${formattedTime}`;
        } else {
            // 2. Once portal open time is reached or past: Disappear completely
            if (infoBox) {
                infoBox.remove();
            }
        }
    }

    if (triggerDeleteBtn && uploadModalObj) {
        triggerDeleteBtn.addEventListener("click", () => {
            uploadModalObj.show();
        });
    }

    if (confirmDeletionBtn) {
        confirmDeletionBtn.addEventListener("click", async () => {
            const currentActiveKey = localStorage.getItem("submittedUploadEmail");
            const currentActiveName = localStorage.getItem("submittedUploadName");
            if (!currentActiveKey) return;

            confirmDeletionBtn.disabled = true;
            confirmDeletionBtn.innerText = "Deleting previous Submission...";

            const delPayload = {
                action: "deleteUpload",
                email: currentActiveKey,
                participantName: currentActiveName
            };

            try {
                await fetch(SUBMISSION_API_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(delPayload)
                });

                localStorage.removeItem("submittedUploadEmail");
                localStorage.removeItem("submittedUploadName");

                submissionFinishedTime = null;
                userIsActivelyWorking = false;
                completedAfterDeadline = false;

                if (uploadForm) uploadForm.reset();
                if (uploadModalObj) uploadModalObj.hide();
                if (uploadDashboard) uploadDashboard.classList.add("d-none");
                
                if (uploadForm && (new Date().getTime() < DEADLINE_DATE)) {
                    uploadForm.classList.remove("d-none");
                }

                confirmDeletionBtn.disabled = false;
                confirmDeletionBtn.innerText = "Yes, Clear and Reset";

            } catch (err) {
                console.error("Deletion Error:", err);
                alert("Could not process data reset.");
                confirmDeletionBtn.disabled = false;
                confirmDeletionBtn.innerText = "Yes, Clear and Reset";
            }
        });
    }
});

const runTimelineEngine = () => {
    const now = new Date().getTime();
    
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    const uploadForm = document.getElementById("uploadForm");
    const uploadDashboard = document.getElementById("uploadSubmittedDashboard");
    const feedback = document.getElementById("uploadFeedback");
    const countdownContainer = document.querySelector(".countdown-container");
    const timerTitle = document.querySelector(".timer-title");
    const submitBtn = document.getElementById('uploadSubmitBtn');
    const formWrapper = document.querySelector(".form-wrapper"); // Target the main form container box

    const isCurrentlyUploading = submitBtn && submitBtn.disabled === true;
    const initialSubmissionDetected = localStorage.getItem("submittedUploadEmail") !== null;

    // RULE 1: Handle users who have already submitted previously
    if (initialSubmissionDetected) {
        if (uploadForm) uploadForm.classList.remove("late-flashing-container");
        if (countdownContainer) countdownContainer.classList.remove("late-flashing-container");

        // If they refresh AFTER the deadline has completely passed, force the Closed State!
        if (now >= DEADLINE_DATE && !isCurrentlyUploading) {
            clearInterval(window.timelineInterval);
            if (hoursEl) hoursEl.innerText = "00";
            if (minutesEl) minutesEl.innerText = "00";
            if (secondsEl) secondsEl.innerText = "00";
            
            if (uploadForm) {
                uploadForm.innerHTML = ""; 
                uploadForm.classList.add('d-none');
            }
            if (uploadDashboard) uploadDashboard.classList.add('d-none');
            
            if (feedback) {
                feedback.className = "text-center mt-4 p-4 text-danger fw-bold border border-danger rounded bg-dark";
                feedback.innerHTML = `
                    <i class="fas fa-lock fa-2x mb-3 text-danger"></i>
                    <h3>Marathon Closed</h3>
                    <p class="mb-0 mt-2 text-white-50">The official submission window has closed! The portal is now securely locked.</p>
                `;
                feedback.classList.remove('d-none');
            }
            return;
        }

        // If deadline hasn't passed, lock form to dashboard, but let countdown flow below
        if (!completedAfterDeadline) {
            if (uploadForm) uploadForm.classList.add('d-none');
            if (uploadDashboard) uploadDashboard.classList.remove('d-none');
            if (feedback) feedback.classList.add('d-none');
        }
    }

    if (now >= DEADLINE_DATE) {
        // CONDITION A: If they are actively filling data or uploading late, let them finish
        if (userIsActivelyWorking || isCurrentlyUploading) {
            if (hoursEl) hoursEl.innerText = "00";
            if (minutesEl) minutesEl.innerText = "00";
            if (secondsEl) secondsEl.innerText = "00";
            if (timerTitle) {
                timerTitle.innerText = isCurrentlyUploading ? "Finishing Upload..." : "Complete Your Submission...";
                timerTitle.style.color = "#ef4444";
            }

            if (userIsActivelyWorking && !isCurrentlyUploading) {
                if (uploadForm) uploadForm.classList.add("late-flashing-container");
                if (countdownContainer) countdownContainer.classList.add("late-flashing-container");
            } else {
                if (uploadForm) uploadForm.classList.remove("late-flashing-container");
                if (countdownContainer) countdownContainer.classList.remove("late-flashing-container");
            }
            return; 
        }

        // CONDITION B: Late submission finished! Run 5-second window
        const isWithinFiveSecondGrace = completedAfterDeadline && submissionFinishedTime !== null && (now - submissionFinishedTime < 5000);
        if (isWithinFiveSecondGrace) {
            if (uploadForm) uploadForm.classList.remove("late-flashing-container");
            if (countdownContainer) countdownContainer.classList.remove("late-flashing-container");
            if (hoursEl) hoursEl.innerText = "00";
            if (minutesEl) minutesEl.innerText = "00";
            if (secondsEl) secondsEl.innerText = "00";
            if (timerTitle) {
                timerTitle.innerText = "Closing Portal...";
                timerTitle.style.color = "#ef4444";
            }
            return; 
        }

        // CONDITION C: Otherwise, clean up and close portal
        if (uploadForm) uploadForm.classList.remove("late-flashing-container");
        if (countdownContainer) countdownContainer.classList.remove("late-flashing-container");
        clearInterval(window.timelineInterval);
        
        if (hoursEl) hoursEl.innerText = "00";
        if (minutesEl) minutesEl.innerText = "00";
        if (secondsEl) secondsEl.innerText = "00";
        
        if (uploadForm) {
            uploadForm.innerHTML = ""; 
            uploadForm.classList.add('d-none');
        }
        if (uploadDashboard) {
            uploadDashboard.classList.add('d-none');
        }
        
        if (feedback) {
            feedback.className = "text-center mt-4 p-4 text-danger fw-bold border border-danger rounded bg-dark";
            feedback.innerHTML = `
                <i class="fas fa-lock fa-2x mb-3 text-danger"></i>
                <h3>Marathon Closed</h3>
                <p class="mb-0 mt-2 text-white-50">The official submission window has closed! The portal is now securely locked.</p>
            `;
            feedback.classList.remove('d-none');
        }
        return; 
    }

    // Default running countdown configuration
    if (uploadForm) uploadForm.classList.remove("late-flashing-container");
    if (countdownContainer) countdownContainer.classList.remove("late-flashing-container");
    if (!hoursEl || !minutesEl || !secondsEl) return;

    if (now < START_DATE) {
        if (uploadForm) uploadForm.classList.add('d-none');
        if (countdownContainer) countdownContainer.classList.remove('d-none');
        
        const timeToOpen = START_DATE - now;
        const hours = Math.floor(timeToOpen / (1000 * 60 * 60));
        const minutes = Math.floor((timeToOpen % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeToOpen % (1000 * 60)) / 1000);

        hoursEl.innerText = hours < 10 ? "0" + hours : hours;
        minutesEl.innerText = minutes < 10 ? "0" + minutes : minutes;
        secondsEl.innerText = seconds < 10 ? "0" + seconds : seconds;

        if (timerTitle) {
            timerTitle.innerText = "Portal Opens In...";
            timerTitle.style.color = "#38bdf8"; 
        }
    } else {
        if (uploadForm && !initialSubmissionDetected) {
            uploadForm.classList.remove('d-none');
        }
        if (countdownContainer) countdownContainer.classList.remove('d-none');
        if (feedback) feedback.classList.add('d-none'); 

        if (timerTitle) {
            if (initialSubmissionDetected) {
                timerTitle.innerText = "Portfolio Secured! (Time Left)";
                timerTitle.style.color = "#10b981"; 
            } else {
                timerTitle.innerText = "Portal Closes in...";
                timerTitle.style.color = "#f59e0b"; 
            }
        }

        const distance = DEADLINE_DATE - now;
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        hoursEl.innerText = hours < 10 ? "0" + hours : hours;
        minutesEl.innerText = minutes < 10 ? "0" + minutes : minutes;
        secondsEl.innerText = seconds < 10 ? "0" + seconds : seconds;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    runTimelineEngine();
    window.timelineInterval = setInterval(runTimelineEngine, 1000);
});

const forceUnlockTimeout = setTimeout(() => {
    cleanUpAndDestroyLoader("Safety Timeout Triggered");
}, 3500);

function cleanUpAndDestroyLoader(reason) {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
}

window.addEventListener("load", () => {
    clearTimeout(forceUnlockTimeout);
    setTimeout(() => {
        cleanUpAndDestroyLoader("Standard Window Load Event");
    }, 1200);
});

if (typeof ScrollReveal !== 'undefined') {
    ScrollReveal().reveal('.section-title, .about-section, .gallery-section, .schools-bar', {
        distance: '60px',
        duration: 1200,
        origin: 'bottom',
        interval: 200
    });
}
