const SUBMISSION_API_URL = "https://script.google.com/macros/s/AKfycbzTFVn_7u_oGEeijewaNR0t8a5vARJkiuBWpOuMJVcowQdkDdaWGofaar8BRuG88VGGtQ/exec";
const IMGBB_API_KEY = "19135fc89f58f414226e584b18e545a9";

// ==========================================================
// MARATHON TIMELINE CONFIGURATION & GRACE ENGINES
// ==========================================================
const START_DATE = new Date("2026-07-27T02:00:00:00+05:30").getTime();
const DEADLINE_DATE = new Date("2026-07-27T04:15:00:00+05:30").getTime();

let userIsActivelyWorking = false; 
let submissionFinishedTime = null; 

// Maximum file size cap set to 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; 

// Injecting layout, progress animation, custom alerts, and file-name hiding styles
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
        transition: stroke-dashoffset 0.1s linear;
    }
    .upload-success-tick {
        color: #10b981 !important;
        font-size: 1.35rem !important;
        display: none;
        margin-left: 8px;
        vertical-align: middle;
    }

    /* HIDES FILE NAME ONLY AFTER A FILE IS SELECTED */
    input[type="file"].file-selected {
        color: transparent !important;
    }
    input[type="file"].file-selected::-webkit-file-upload-button {
        color: #000000 !important;
    }
    input[type="file"].file-selected::file-selector-button {
        color: #000000 !important;
    }

    /* ========================================================= */
    /* CUSTOM TOAST ALERT SYSTEM (NO NATIVE ALERTS)              */
    /* ========================================================= */
    #customAlertContainer {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 380px;
        pointer-events: none;
    }
    .custom-alert-toast {
        pointer-events: auto;
        background: #1e293b;
        color: #f8fafc;
        border-left: 5px solid #ef4444;
        border-radius: 8px;
        padding: 14px 18px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: inherit;
        font-size: 0.92rem;
        line-height: 1.4;
        transform: translateX(120%);
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        opacity: 0;
    }
    .custom-alert-toast.show {
        transform: translateX(0);
        opacity: 1;
    }
    .custom-alert-toast.success {
        border-left-color: #10b981;
    }
    .custom-alert-toast.warning {
        border-left-color: #f59e0b;
    }
    .custom-alert-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
    }
    .custom-alert-toast.error .custom-alert-icon { color: #ef4444; }
    .custom-alert-toast.success .custom-alert-icon { color: #10b981; }
    .custom-alert-toast.warning .custom-alert-icon { color: #f59e0b; }
    /* UPCOMING ANNOUNCEMENT BOX STYLE */
    .upcoming-notice-box {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(245, 158, 11, 0.35);
        border-radius: 16px;
        padding: 2.5rem 1.5rem;
        text-align: center;
        max-width: 650px;
        margin: 2rem auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .upcoming-notice-box i {
        font-size: 2.8rem;
        color: #f59e0b;
        margin-bottom: 1rem;
    }
    .upcoming-notice-box h3 {
        font-size: 1.4rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }
    .upcoming-notice-box p {
        color: #cbd5e1;
        font-size: 1rem;
        margin: 0;
    }
`;
document.head.appendChild(styleSheet);

// CUSTOM TOAST NOTIFICATION ENGINE
function showCustomAlert(message, type = "error") {
    let container = document.getElementById("customAlertContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "customAlertContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `custom-alert-toast ${type}`;
    
    let iconClass = "fa-exclamation-circle";
    if (type === "success") iconClass = "fa-check-circle";
    if (type === "warning") iconClass = "fa-exclamation-triangle";

    toast.innerHTML = `
        <i class="fas ${iconClass} custom-alert-icon"></i>
        <div>${message}</div>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    setTimeout(() => toast.classList.add("show"), 10);

    // Remove notification automatically after 4 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Clean string for filename format
function sanitizeFileNamePart(str) {
    if (!str) return "";
    return str.replace(/[^a-zA-Z0-9\s-_]/g, "").trim().replace(/\s+/g, " ");
}

// ==========================================================
// UNIFIED HIGH-RELIABILITY FORM SUBMISSION ENGINE
// ==========================================================
// UPDATED HIGH-CONCURRENCY RETRY ENGINE
async function sendWithRetry(payload, maxRetries = 10) {
    // Increased initial random jitter (0 to 3 seconds) to spread out simultaneous clicks
    const jitter = Math.floor(Math.random() * 3000);
    await new Promise(r => setTimeout(r, jitter));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(SUBMISSION_API_URL, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const resData = await response.json();
                if (resData.success === true) return resData;
            }
        } catch (err) {
            console.warn(`Attempt ${attempt} hit concurrency queue, retrying...`);
        }
        
        // Exponential backoff: Waits longer between each attempt (2s, 4s, 6s... up to 20s)
        if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, attempt * 2000));
        }
    }
    throw new Error("Server is experiencing high traffic. Please tap Retry Submission.");
}

async function uploadImageToImgBB(file, customTitle, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("name", customTitle || "Photo");

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.url) {
                    return {
                        url: result.data.url,
                        deleteUrl: result.data.delete_url || ""
                    };
                }
            }
        } catch (err) {
            console.warn(`ImgBB upload attempt ${attempt} failed for "${customTitle}", retrying...`);
        }
        if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, attempt * 1500));
        }
    }

    throw new Error(`Failed to upload photo "${customTitle}". Please check your connection.`);
}

// Helper function to animate smooth progress bar updates
function setProgressCircle(circleBar, percent) {
    if (!circleBar) return;
    const clamped = Math.max(0, Math.min(100, percent));
    const offset = 88 * (1 - (clamped / 100));
    circleBar.style.strokeDashoffset = offset;
}

// Frame-by-frame smooth progress animation helper function
function animateCircleTo(circleBar, startPct, endPct, durationMs) {
    return new Promise(resolve => {
        const startTime = performance.now();
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const currentPct = startPct + (endPct - startPct) * progress;
            setProgressCircle(circleBar, currentPct);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}

// Helper function for smooth scrolling to an element
function scrollToElement(el) {
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Helper function to safely extract Photo Title from any input layout structure
function getPhotoTitle(slot) {
    const titleEl = document.querySelector(`input[name="${slot}_title"]`) ||
                    document.querySelector(`input[id="${slot}_title"]`) ||
                    document.querySelector(`input[name="title_${slot}"]`) ||
                    document.querySelector(`input[id="title_${slot}"]`);
    
    if (titleEl && titleEl.value.trim() !== "") {
        return titleEl.value.trim();
    }

    const wrapper = document.getElementById("wrapper_" + slot);
    if (wrapper) {
        const textInput = wrapper.querySelector('input[type="text"]');
        if (textInput && textInput.value.trim() !== "") {
            return textInput.value.trim();
        }
    }

    return "Untitled Photo";
}

// ==========================================================
// DOM CONTENT LOADED INITIALIZATION ENGINE
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadDashboard = document.getElementById('uploadSubmittedDashboard');
    const emailField = document.getElementById('participantEmail') || document.getElementById('email');
    const submitBtn = document.getElementById('uploadSubmitBtn') || document.getElementById('submitBtn');

    // TO THIS (Only show form if timeline is already active):
    if (uploadForm) {
        const now = new Date().getTime();
        if (now >= START_DATE && now < DEADLINE_DATE) {
            uploadForm.classList.remove("d-none");
        } else {
            uploadForm.classList.add("d-none");
        }

        const markAsActive = () => { 
            if (submissionFinishedTime === null) {
                userIsActivelyWorking = true; 
            }
        };
        uploadForm.addEventListener('input', markAsActive);
        uploadForm.addEventListener('change', markAsActive);
        uploadForm.addEventListener('click', markAsActive);
    }

    // Insert progress circle & checkmark wrappers next to remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        const targetAttr = btn.getAttribute('data-target') || btn.dataset.target;
        if (!targetAttr) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'remove-btn-wrapper';
        if (btn.parentNode) btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);
        
        const indicators = document.createElement('span');
        indicators.className = 'd-inline-flex align-items-center';
        indicators.innerHTML = `
            <div class="progress-circle-container d-none" id="circle_container_${targetAttr}">
                <svg class="progress-circle-svg">
                    <circle class="progress-circle-bg" cx="14" cy="14" r="12"></circle>
                    <circle class="progress-circle-bar" id="circle_bar_${targetAttr}" cx="14" cy="14" r="12"></circle>
                </svg>
            </div>
            <i class="fas fa-check-circle upload-success-tick" id="tick_${targetAttr}"></i>
        `;
        wrapper.appendChild(indicators);
    });

    // Check saved state
    const savedUploadEmail = localStorage.getItem("submittedUploadEmail");
    if (savedUploadEmail && uploadDashboard && uploadForm) {
        uploadForm.classList.add("d-none");
        uploadDashboard.classList.remove("d-none");
    }

    // 10MB limit check with CUSTOM ALERT, preview trigger, and filename hiding
    document.querySelectorAll('.preview-trigger, input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            const inputName = this.name || this.id;
            const wrapper = document.getElementById("wrapper_" + inputName);
            const previewImg = document.getElementById("prev_" + inputName);

            if (this.files && this.files[0]) {
                const file = this.files[0];

                // CUSTOM 10MB OVERSIZE ALERT
                if (file.size > MAX_FILE_SIZE) {
                    showCustomAlert("Photo exceeds the maximum 10MB limit. Please select a smaller file.", "error");
                    this.value = '';
                    this.classList.remove('file-selected');
                    if (previewImg) previewImg.style.display = 'none';
                    if (wrapper) wrapper.classList.add('d-none');
                    return;
                }

                this.classList.add('file-selected');

                const reader = new FileReader();
                reader.onload = function(e) {
                    if (previewImg) {
                        previewImg.src = e.target.result;
                        previewImg.style.display = 'block';
                    }
                    if (wrapper) wrapper.classList.remove('d-none');
                    
                    const container = document.getElementById(`circle_container_${inputName}`);
                    if (container) container.classList.add('d-none');
                    const tick = document.getElementById(`tick_${inputName}`);
                    if (tick) tick.style.display = 'none';
                };
                reader.readAsDataURL(file);
            } else {
                this.classList.remove('file-selected');
            }
        });
    });

    // Handle Form Submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const currentEmail = (emailField ? emailField.value : '').trim();
            const rawParticipantName = (document.getElementById('participantName') || document.getElementById('name'))?.value.trim() || 'Participant';
            const certName = (document.getElementById('certificateName'))?.value.trim() || '';
            const rawSchoolName = (document.getElementById('schoolName') || document.getElementById('school'))?.value.trim() || 'School';
            
            const scopeRadio = document.querySelector('input[name="scope"]:checked') || 
                               document.querySelector('input[name="competitionScope"]:checked') ||
                               document.querySelector('input[name="inter_inner"]:checked');
            const scope = scopeRadio ? scopeRadio.value.trim() : 'Inter-School';

            if (!currentEmail) {
                showCustomAlert("Please enter a valid email address.", "warning");
                return;
            }

            const fileInputs = uploadForm.querySelectorAll('input[type="file"]');
            const queue = [];

            fileInputs.forEach(input => {
                if (input.files && input.files[0]) {
                    const file = input.files[0];
                    if (file.size > MAX_FILE_SIZE) {
                        showCustomAlert(`Photo "${file.name}" exceeds 10MB limit.`, "error");
                        throw new Error(`Photo exceeds maximum 10MB limit.`);
                    }
                    const slot = input.name || input.id;
                    const photoTitle = getPhotoTitle(slot);
                    const cat = slot.includes('color') ? "Colour" : (slot.includes('mono') ? "Monochrome" : "Slowshutter");

                    queue.push({ file, slot, photoTitle, cat, element: input });
                }
            });

            const totalPhotos = queue.length;

            if (totalPhotos === 0) {
                showCustomAlert("Please select at least one photo to upload.", "warning");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Uploading Photos...`;
            }

            try {
                let uploadedCount = 0;

                for (let i = 0; i < totalPhotos; i++) {
                    const item = queue[i];
                    const photoNo = i + 1; 
                    const isLastPhoto = (i === totalPhotos - 1);
                    
                    const containerCircle = document.getElementById(`circle_container_${item.slot}`);
                    const circleBar = document.getElementById(`circle_bar_${item.slot}`);
                    const tickMark = document.getElementById(`tick_${item.slot}`);

                    const downloadFileName = `${sanitizeFileNamePart(item.photoTitle)}_${sanitizeFileNamePart(rawParticipantName)}_${sanitizeFileNamePart(rawSchoolName)}_${sanitizeFileNamePart(scope)}_${sanitizeFileNamePart(item.cat)}_${photoNo}`;
                    
                    const targetRow = document.getElementById(`wrapper_${item.slot}`) || item.element;
                    scrollToElement(targetRow);
                    await new Promise(r => setTimeout(r, 300));

                    if (containerCircle) {
                        containerCircle.classList.remove('d-none');
                        containerCircle.style.display = 'inline-block';
                    }
                    if (tickMark) tickMark.style.display = 'none';

                    const smoothAnimationPromise = animateCircleTo(circleBar, 0, 90, 3000);
                    const imgbbUploadPromise = uploadImageToImgBB(item.file, item.photoTitle);

                    const [_, imgbbResult] = await Promise.all([smoothAnimationPromise, imgbbUploadPromise]);

                    await sendWithRetry({
                        action: "recordMetadata",
                        participantEmail: currentEmail,
                        participantName: rawParticipantName,
                        certificateName: certName,
                        schoolName: rawSchoolName,
                        competitionScope: scope,
                        categoryDisplay: item.cat,
                        photoTitle: item.photoTitle,
                        downloadFileName: downloadFileName,
                        photoNo: photoNo,
                        totalPhotos: totalPhotos,
                        fileUrl: imgbbResult.url,
                        deleteUrl: imgbbResult.deleteUrl
                    });

                    await animateCircleTo(circleBar, 90, 100, 400);

                    if (containerCircle) containerCircle.style.display = 'none';
                    if (tickMark) tickMark.style.display = 'inline-block';

                    uploadedCount++;

                    if (isLastPhoto) {
                        await new Promise(r => setTimeout(r, 2000));
                    } else {
                        await new Promise(r => setTimeout(r, 600));
                    }
                }

                // RECORD FINISHED TIME ON SUCCESSFUL SUBMISSION
                submissionFinishedTime = new Date().getTime();
                userIsActivelyWorking = false; // Stop grace period active state

                localStorage.setItem("submittedUploadEmail", currentEmail);

                // Run timeline engine immediately to update UI without waiting for next second tick
                runTimelineEngine();

                showCustomAlert(`Successfully submitted ${uploadedCount} photo(s)!`, "success");

                if (uploadForm) uploadForm.classList.add('d-none');
                if (uploadDashboard) uploadDashboard.classList.remove('d-none');

            } catch (err) {
                showCustomAlert("Submission Failed: " + err.message, "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fas fa-redo-alt me-2"></i>Retry Submission`;
                }
            }
        });
    }

    // Handle File Input Removal Actions
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target') || this.dataset.target;
            const input = document.querySelector(`input[name="${target}"]`) || document.getElementById(target);
            const wrapper = document.getElementById("wrapper_" + target);
            const previewImg = document.getElementById("prev_" + target);
            const containerCircle = document.getElementById(`circle_container_${target}`);
            const tickMark = document.getElementById(`tick_${target}`);

            if (input) {
                input.value = '';
                input.classList.remove('file-selected');
            }
            if (previewImg) previewImg.style.display = 'none';
            if (wrapper) wrapper.classList.add('d-none');
            if (containerCircle) containerCircle.style.display = 'none';
            if (tickMark) tickMark.style.display = 'none';
        });
    });
});

// ==========================================================
// MARATHON TIMELINE CONFIGURATION & GRACE ENGINES
// ==========================================================
// Track user activity (typing or selecting files)
document.addEventListener("input", () => { userIsActivelyWorking = true; });
document.addEventListener("change", () => { userIsActivelyWorking = true; });

// MAIN LIVE TIMELINE ENGINE
const runTimelineEngine = () => {
    const now = new Date().getTime();

    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    const timerTitle = document.getElementById("timerTitle");

    const uploadForm = document.getElementById("uploadForm");
    const uploadDashboard = document.getElementById("uploadSubmittedDashboard");
    const timeIsUpBox = document.getElementById("timeIsUpDashboard");

    const isSubmitted = !!localStorage.getItem("submittedUploadEmail");

    // HELPER TO CONVERT ALL DAYS INTO TOTAL CUMULATIVE HOURS
    const updateClockDisplay = (diffMs) => {
        if (diffMs <= 0) {
            if (document.getElementById("hours")) document.getElementById("hours").innerText = "00";
            if (document.getElementById("minutes")) document.getElementById("minutes").innerText = "00";
            if (document.getElementById("seconds")) document.getElementById("seconds").innerText = "00";
            return;
        }

        // Calculate total hours across all remaining days
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");

        if (hoursEl) hoursEl.innerText = totalHours < 10 ? "0" + totalHours : totalHours;
        if (minutesEl) minutesEl.innerText = minutes < 10 ? "0" + minutes : minutes;
        if (secondsEl) secondsEl.innerText = seconds < 10 ? "0" + seconds : seconds;
    };

    // ------------------------------------------------------
    // STATE 1: BEFORE START TIME (Portal locked)
    // ------------------------------------------------------
    if (now < START_DATE) {
        if (timerTitle) timerTitle.innerText = "Portal Open In";
        updateClockDisplay(START_DATE - now);

        const upcomingBox = document.getElementById("upcomingDashboard");

        // Hide active upload form & registration closed box, show upcoming box
        if (uploadForm) uploadForm.classList.add("d-none");
        if (timeIsUpBox) timeIsUpBox.classList.add("d-none");
        if (uploadDashboard) uploadDashboard.classList.add("d-none");
        if (upcomingBox) upcomingBox.classList.remove("d-none");
        return;
    }

    // ------------------------------------------------------
    // STATE 2: ACTIVE SUBMISSION WINDOW
    // ------------------------------------------------------
    if (now >= START_DATE && now < DEADLINE_DATE) {
        if (timerTitle) timerTitle.innerText = "Submission Portal Opened";
        updateClockDisplay(DEADLINE_DATE - now);

        if (isSubmitted) {
            // User submitted earlier than deadline -> show portfolio
            if (uploadForm) uploadForm.classList.add("d-none");
            if (timeIsUpBox) timeIsUpBox.classList.add("d-none");
            if (uploadDashboard) uploadDashboard.classList.remove("d-none");
        } else {
            // Unsubmitted user -> show active form
            if (uploadForm) {
                uploadForm.classList.remove("d-none");
                const inputs = uploadForm.querySelectorAll("input, select, button");
                inputs.forEach(el => el.disabled = false);
            }
            if (timeIsUpBox) timeIsUpBox.classList.add("d-none");
            if (uploadDashboard) uploadDashboard.classList.add("d-none");
            const upcomingBox = document.getElementById("upcomingDashboard");
            if (upcomingBox) upcomingBox.classList.add("d-none");
        }
        return;
    }

    // ------------------------------------------------------
    // STATE 3 & 4: AFTER DEADLINE
    // ------------------------------------------------------
    if (now >= DEADLINE_DATE) {
        // CASE A: User submitted AFTER deadline (during Grace Period)
        if (isSubmitted && submissionFinishedTime && submissionFinishedTime >= DEADLINE_DATE) {
            const timeSinceSubmit = now - submissionFinishedTime;
            
            if (timeSinceSubmit < 4000) {
                // Show portfolio secured view for exactly 4 seconds
                if (timerTitle) timerTitle.innerText = "Submission Portal Closed";
                updateClockDisplay(0);
                if (uploadForm) uploadForm.classList.add("d-none");
                if (timeIsUpBox) timeIsUpBox.classList.add("d-none");
                if (uploadDashboard) uploadDashboard.classList.remove("d-none");
            } else {
                // After 4 seconds -> Switch live to Registration Closed
                if (timerTitle) timerTitle.innerText = "Submission Portal Closed";
                updateClockDisplay(0);
                if (uploadForm) uploadForm.classList.add("d-none");
                if (uploadDashboard) uploadDashboard.classList.add("d-none");
                if (timeIsUpBox) timeIsUpBox.classList.remove("d-none");
            }
            return;
        }

        // CASE B: User submitted EARLIER than deadline -> Switch to Registration Closed immediately when deadline hits
        if (isSubmitted) {
            if (timerTitle) timerTitle.innerText = "Submission Portal Closed";
            updateClockDisplay(0);
            if (uploadForm) uploadForm.classList.add("d-none");
            if (uploadDashboard) uploadDashboard.classList.add("d-none");
            if (timeIsUpBox) timeIsUpBox.classList.remove("d-none");
            return;
        }

        // CASE C: Unsubmitted user actively typing/uploading -> GRACE PERIOD
        if (userIsActivelyWorking) {
            if (timerTitle) timerTitle.innerText = "GRACE PERIOD: Complete submission now!";
            updateClockDisplay(0);
            
            if (uploadForm) {
                uploadForm.classList.remove("d-none");
                if (!uploadForm.classList.contains("late-flashing-container")) {
                    uploadForm.classList.add("late-flashing-container");
                }
            }
            if (timeIsUpBox) timeIsUpBox.classList.add("d-none");
            if (uploadDashboard) uploadDashboard.classList.add("d-none");
            return;
        }

        // CASE D: Inactive unsubmitted user -> Registration Closed
        if (timerTitle) timerTitle.innerText = "Submission Portal Closed";
        updateClockDisplay(0);
        if (uploadForm) uploadForm.classList.add("d-none");
        if (uploadDashboard) uploadDashboard.classList.add("d-none");
        if (timeIsUpBox) timeIsUpBox.classList.remove("d-none");
    }
};

// INITIALIZE REAL-TIME INTERVAL
document.addEventListener("DOMContentLoaded", () => {
    runTimelineEngine();
    window.timelineInterval = setInterval(runTimelineEngine, 1000);
});



// ==========================================================
// LOADER CLEANUP ENGINE
// ==========================================================
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
        origin: 'bottom'
    });
}


// ==========================================================
// REAL-TIME PARTICIPANT SYNC & REMOTE PURGE LISTENER
// ==========================================================
let participantSyncTimer = null;

/**
 * Background polling listener that checks whether the participant's 
 * submission record still exists in Google Sheets.
 * When Admin clicks "Delete & Allow Resubmit", the endpoint returns { found: false }.
 * The device then automatically purges local storage and reloads the browser.
 */
function startRemotePurgeListener(email) {
    if (participantSyncTimer) clearInterval(participantSyncTimer);

    // Polls the backend every 4 seconds
    participantSyncTimer = setInterval(async () => {
        try {
            const response = await fetch(SUBMISSION_API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "checkExisting",
                    participantEmail: email
                })
            });

            const result = await response.json();

            // SENSING ADMIN DELETION:
            // Record no longer exists in Google Sheets -> Purge local storage and force page reload
            if (result.success && result.found === false) {
                clearInterval(participantSyncTimer);
                console.log("Admin deletion detected! Purging local credentials & refreshing...");
                
                // EXECUTE AUTOMATIC PURGE AND RELOAD
                localStorage.removeItem("submittedUploadEmail");
                location.reload();
            } else if (result.success && result.found && result.data.resubmitRequested) {
                // Update UI state if request was already flagged
                const reqBtn = document.getElementById("requestResubmitBtn");
                if (reqBtn && !reqBtn.disabled) {
                    reqBtn.disabled = true;
                    reqBtn.className = "btn btn-outline-warning disabled w-100 mt-3";
                    reqBtn.innerHTML = `<i class="fas fa-clock me-2"></i>Resubmit Request Pending Admin Review...`;
                }
            }
        } catch (err) {
            console.warn("Background state sync check failed:", err);
        }
    }, 4000); // 4-second interval
}

/**
 * Handles participant request to unlock submission form.
 */
async function triggerResubmitRequest() {
    const savedEmail = localStorage.getItem("submittedUploadEmail");
    const reqBtn = document.getElementById("requestResubmitBtn");

    if (!savedEmail) return;

    if (reqBtn) {
        reqBtn.disabled = true;
        reqBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Sending Request to Admin...`;
    }

    try {
        const response = await fetch(SUBMISSION_API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "requestResubmit",
                participantEmail: savedEmail
            })
        });

        const result = await response.json();

        if (result.success) {
            showCustomAlert("Resubmit request sent to Admin panel! Page will automatically reload once approved.", "warning");
            if (reqBtn) {
                reqBtn.className = "btn btn-outline-warning disabled w-100 mt-3";
                reqBtn.innerHTML = `<i class="fas fa-clock me-2"></i>Resubmit Request Pending Admin Review...`;
            }
        } else {
            showCustomAlert("Failed to transmit request. Please try again.", "error");
            if (reqBtn) {
                reqBtn.disabled = false;
                reqBtn.innerHTML = `<i class="fas fa-undo-alt me-2"></i>Request to Resubmit Form`;
            }
        }
    } catch (err) {
        showCustomAlert("Network error: " + err.message, "error");
        if (reqBtn) {
            reqBtn.disabled = false;
            reqBtn.innerHTML = `<i class="fas fa-undo-alt me-2"></i>Request to Resubmit Form`;
        }
    }
}

// INITIALIZATION HOOK
document.addEventListener("DOMContentLoaded", () => {
    const savedEmail = localStorage.getItem("submittedUploadEmail");
    const uploadDashboard = document.getElementById('uploadSubmittedDashboard');
    const uploadForm = document.getElementById('uploadForm');

    if (savedEmail) {
        if (uploadForm) uploadForm.classList.add("d-none");
        if (uploadDashboard) uploadDashboard.classList.remove("d-none");

        // START LIVE POLLING ENGINE FOR INSTANT AUTO-RELOAD ON ADMIN DELETION
        startRemotePurgeListener(savedEmail);
    }

    const reqBtn = document.getElementById("requestResubmitBtn");
    if (reqBtn) {
        reqBtn.addEventListener("click", triggerResubmitRequest);
    }
});
