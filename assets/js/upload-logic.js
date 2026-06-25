const SUBMISSION_API_URL = "https://script.google.com/macros/s/AKfycbzTFVn_7u_oGEeijewaNR0t8a5vARJkiuBWpOuMJVcowQdkDdaWGofaar8BRuG88VGGtQ/exec";

// ==========================================================
// MARATHON TIMELINE CONFIGURATION & GRACE ENGINES
// ==========================================================
const START_DATE = new Date("2026-06-24T18:00:00").getTime();
// Admin: Extend this date forward whenever you want to grant extra submission time
const DEADLINE_DATE = new Date("2026-06-25T09:27:00").getTime();

let userIsActivelyWorking = false; // Tracks if they are typing, changing inputs, or selecting photos
let submissionFinishedTime = null; // Tracks when a successful submit occurs
let completedAfterDeadline = false; // Flags whether the user finished late to apply the 5-sec rule

// Injecting flashing background and circular progress animation styles dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes lateWarningFlash {
        0% { background-color: #0f172a; }
        50% { background-color: #1e293b; }
        100% { background-color: #0f172a; }
    }
    .late-flashing-bg {
        animation: lateWarningFlash 1.5s infinite ease-in-out;
    }
    .progress-circle-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        position: relative;
        margin-left: 12px;
        vertical-align: middle;
    }
    .progress-circle-svg {
        transform: rotate(-90deg);
        width: 32px;
        height: 32px;
    }
    .progress-circle-bg {
        fill: none;
        stroke: #334155;
        stroke-width: 3;
    }
    .progress-circle-bar {
        fill: none;
        stroke: #f59e0b;
        stroke-width: 3;
        stroke-dasharray: 88;
        stroke-dashoffset: 88;
        transition: stroke-dashoffset 0.3s ease;
    }
    .upload-success-tick {
        color: #10b981;
        font-size: 1.25rem;
        display: none;
        margin-left: 12px;
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

    // Dynamically place the progress tracks into the HTML on load next to remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        const container = document.createElement('div');
        container.className = 'd-inline-flex align-items-center position-relative';
        btn.parentNode.insertBefore(container, btn.nextSibling);
        
        container.innerHTML = `
            <div class="progress-circle-container d-none" id="circle_container_${btn.getAttribute('data-target')}">
                <svg class="progress-circle-svg">
                    <circle class="progress-circle-bg" cx="16" cy="16" r="14"></circle>
                    <circle class="progress-circle-bar" id="circle_bar_${btn.getAttribute('data-target')}" cx="16" cy="16" r="14"></circle>
                </svg>
            </div>
            <i class="fas fa-check-circle upload-success-tick" id="tick_${btn.getAttribute('data-target')}"></i>
        `;
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

                    // Reset tracking visuals
                    document.getElementById(`circle_container_${inputName}`).classList.add('d-none');
                    document.getElementById(`tick_${inputName}`).style.display = 'none';
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

            document.getElementById(`circle_container_${targetInputName}`).classList.add('d-none');
            document.getElementById(`tick_${targetInputName}`).style.display = 'none';
        });
    });

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const participantEmail = emailField.value.trim();
            const participantName = document.getElementById('participantName').value.trim();
            const schoolName = document.getElementById('schoolName').value.trim(); 
            const competitionScope = document.getElementById('competitionScope').value;

            submitBtn.disabled = true;
            submitBtn.innerText = "Processing Files 1 by 1...";
            feedback.className = "text-center mt-3 text-warning";
            feedback.innerText = "Starting transmission...";
            feedback.classList.remove('d-none');

            // Explicitly remove flash background style class when upload process initiates
            document.body.classList.remove("late-flashing-bg");

            const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const fileInputs = document.querySelectorAll('.preview-trigger');
            
            try {
                const safeName = participantName.replace(/[^a-zA-Z0-9]/g, "_");

                // Process and upload photos sequentially 1 by 1
                for (let input of fileInputs) {
                    if (input.files.length > 0) {
                        const file = input.files[0];
                        const targetId = input.name;

                        feedback.innerText = `Uploading ${targetId.split('_')[0]} image item...`;
                        
                        // Show progress circle
                        const circleContainer = document.getElementById(`circle_container_${targetId}`);
                        const circleBar = document.getElementById(`circle_bar_${targetId}`);
                        circleContainer.classList.remove('d-none');

                        // Animate uploading progress loop sequence
                        circleBar.style.strokeDashoffset = "60"; // 30% filled
                        
                        const base64Str = await toBase64(file);
                        circleBar.style.strokeDashoffset = "30"; // 70% filled
                        
                        const customTitleInput = document.getElementById("title_" + targetId);
                        let finalizedTitle = customTitleInput && customTitleInput.value.trim() ? customTitleInput.value.trim() : "untitled";
                        
                        finalizedTitle = finalizedTitle.replace(/[^a-zA-Z0-9_\-\s]/g, "");
                        const cleanRawTitleForSheet = finalizedTitle;
                        const extension = file.name.substring(file.name.lastIndexOf('.')) || ".jpg";
                        finalizedTitle += extension;

                        const itemPayload = {
                            action: "submitUpload",
                            participantEmail: participantEmail,
                            participantName: participantName,
                            certificateName: document.getElementById('certificateName').value.trim(),
                            schoolName: schoolName,
                            competitionScope: competitionScope,
                            files: [{
                                category: targetId.split('_')[0],
                                rawTitle: cleanRawTitleForSheet.replace(/\s+/g, "_"), 
                                filename: `${safeName}_${targetId}_${finalizedTitle.replace(/\s+/g, "_")}`,
                                mimeType: file.type,
                                bytes: base64Str
                            }]
                        };

                        // Send singular payload instance over network link
                        await fetch(SUBMISSION_API_URL, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify(itemPayload)
                        });

                        // Switch circle out and toggle the green tick checkmark container on
                        circleBar.style.strokeDashoffset = "0"; // 100% full
                        circleContainer.classList.add('d-none');
                        
                        const successTick = document.getElementById(`tick_${targetId}`);
                        successTick.style.display = 'inline-block';
                    }
                }

                // Complete operations process profile triggers
                localStorage.setItem("submittedUploadEmail", participantEmail);
                localStorage.setItem("submittedUploadName", participantName);

                uploadForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerText = "Upload & Submit Portfolio";
                feedback.classList.add('d-none');

                uploadForm.classList.add("d-none");
                uploadDashboard.classList.remove("d-none");

                const completionTimestamp = new Date().getTime();
                if (completionTimestamp >= DEADLINE_DATE) {
                    completedAfterDeadline = true;
                } else {
                    completedAfterDeadline = false;
                }

                userIsActivelyWorking = false; 
                submissionFinishedTime = completionTimestamp;

            } catch (err) {
                console.error(err);
                submitBtn.disabled = false;
                submitBtn.innerText = "Upload & Submit Portfolio";
                feedback.className = "text-center mt-3 text-danger fw-bold";
                feedback.innerText = "Upload failed. Please check your connection.";
            }
        });
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

    const isCurrentlyUploading = submitBtn && submitBtn.disabled === true;
    const initialSubmissionDetected = localStorage.getItem("submittedUploadEmail") !== null;

    // RULE 1: If already submitted beforehand, stay locked on success dashboard
    if (initialSubmissionDetected && !completedAfterDeadline) {
        document.body.classList.remove("late-flashing-bg");
        if (hoursEl) hoursEl.innerText = "00";
        if (minutesEl) minutesEl.innerText = "00";
        if (secondsEl) secondsEl.innerText = "00";
        if (timerTitle) {
            timerTitle.innerText = "Portfolio Securely Uploaded!";
            timerTitle.style.color = "#10b981"; 
        }
        if (uploadForm) uploadForm.classList.add('d-none');
        if (uploadDashboard) uploadDashboard.classList.remove('d-none');
        if (feedback) feedback.classList.add('d-none');
        return;
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

            // Flash ONLY if they are filling the form, NOT while uploading
            if (userIsActivelyWorking && !isCurrentlyUploading) {
                document.body.classList.add("late-flashing-bg");
            } else {
                document.body.classList.remove("late-flashing-bg");
            }
            return; 
        }

        // CONDITION B: Late submission finished! Run 5-second window
        const isWithinFiveSecondGrace = completedAfterDeadline && submissionFinishedTime !== null && (now - submissionFinishedTime < 5000);
        if (isWithinFiveSecondGrace) {
            document.body.classList.remove("late-flashing-bg");
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
        document.body.classList.remove("late-flashing-bg");
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
    document.body.classList.remove("late-flashing-bg");
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
            timerTitle.innerText = "Portal Closes in...";
            timerTitle.style.color = "#f59e0b"; 
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
