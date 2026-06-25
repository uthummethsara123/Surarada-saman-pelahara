const SUBMISSION_API_URL = "https://script.google.com/macros/s/AKfycbzTFVn_7u_oGEeijewaNR0t8a5vARJkiuBWpOuMJVcowQdkDdaWGofaar8BRuG88VGGtQ/exec";

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
            submitBtn.innerText = "Uploading images... Please wait...";
            feedback.className = "text-center mt-3 text-warning";
            feedback.innerText = "Processing submission...";
            feedback.classList.remove('d-none');

const payload = {
    action: "submitUpload",
    participantEmail: participantEmail,
    participantName: participantName,
    certificateName: document.getElementById('certificateName').value.trim(), // ADD THIS LINE
    schoolName: schoolName,
    competitionScope: competitionScope,
    files: []
};

            const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const fileInputs = document.querySelectorAll('.preview-trigger');
            
            try {
                const safeName = participantName.replace(/[^a-zA-Z0-9]/g, "_");

                for (let input of fileInputs) {
                    if (input.files.length > 0) {
                        const file = input.files[0];
                        const base64Str = await toBase64(file);
                        
                        const customTitleInput = document.getElementById("title_" + input.name);
                        let finalizedTitle = customTitleInput && customTitleInput.value.trim() ? customTitleInput.value.trim() : "untitled";
                        
                        finalizedTitle = finalizedTitle.replace(/[^a-zA-Z0-9_\-\s]/g, "");
                        const cleanRawTitleForSheet = finalizedTitle;
                        const extension = file.name.substring(file.name.lastIndexOf('.')) || ".jpg";
                        finalizedTitle += extension;

                        payload.files.push({
                            category: input.name.split('_')[0],
                            rawTitle: cleanRawTitleForSheet.replace(/\s+/g, "_"), 
                            filename: `${safeName}_${input.name}_${finalizedTitle.replace(/\s+/g, "_")}`,
                            mimeType: file.type,
                            bytes: base64Str
                        });
                    }
                }

                feedback.innerText = "submitting portfolio to Google Drive storage...";

                // Restored to working 'no-cors' setup
                await fetch(SUBMISSION_API_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });
                
                // ... inside your uploadForm submit logic, right after fetch completes successfully:
                localStorage.setItem("submittedUploadEmail", participantEmail);
                localStorage.setItem("submittedUploadName", participantName);

                uploadForm.reset();
                document.querySelectorAll('.preview-control-box').forEach(box => box.classList.add('d-none'));
                document.querySelectorAll('.preview-trigger').forEach(inp => inp.classList.remove('d-none'));

                submitBtn.disabled = false;
                submitBtn.innerText = "Upload & Submit Portfolio";
                feedback.classList.add('d-none');

                uploadForm.classList.add("d-none");
                uploadDashboard.classList.remove("d-none");

                // START THE 5-SECOND COUNTDOWN GRACE PERIOD FOR THE TIMELINE NOW:
                submissionFinishedTime = new Date().getTime();

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

// ==========================================================================
// MARATHON TIMELINE ENGINE (WITH DELAYED LOCKOUT FOR ACTIVE SUBMISSIONS)
// ==========================================================================
const START_DATE = new Date("2026-06-24T18:00:00").getTime();
const DEADLINE_DATE = new Date("2026-06-25T09:23:00").getTime();

// Keep a timestamp flag for when a late submission finishes successfully
let submissionFinishedTime = null;

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

    // 1. Check if the participant is currently in the middle of uploading files
    const isCurrentlyUploading = submitBtn && submitBtn.disabled === true;

    // 2. Check if an active form upload recently finished right at/after the deadline
    const isWithinFiveSecondGrace = submissionFinishedTime !== null && (now - submissionFinishedTime < 5000);

    if (now >= DEADLINE_DATE) {
        // Condition A: If they are actively streaming/uploading, do not cut them off!
        if (isCurrentlyUploading) {
            if (hoursEl) hoursEl.innerText = "00";
            if (minutesEl) minutesEl.innerText = "00";
            if (secondsEl) secondsEl.innerText = "00";
            if (timerTitle) {
                timerTitle.innerText = "Finishing Upload...";
                timerTitle.style.color = "#ef4444";
            }
            return; // Stay out of the closed display view to let the process complete
        }

        // Condition B: If they just finished successfully, let the Dashboard stay up for exactly 5 seconds
        if (isWithinFiveSecondGrace) {
            if (hoursEl) hoursEl.innerText = "00";
            if (minutesEl) minutesEl.innerText = "00";
            if (secondsEl) secondsEl.innerText = "00";
            if (timerTitle) {
                timerTitle.innerText = "Closing Portal...";
                timerTitle.style.color = "#ef4444";
            }
            return; // Wait out the remaining duration of the 5-second grace window
        }

        // Condition C: Otherwise, completely close out and secure the page layout
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

        if (feedback) {
            const openingAlertDate = new Date(START_DATE).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
            feedback.className = "text-center mt-4 p-3 text-info border border-info rounded bg-dark font-monospace small";
            feedback.innerHTML = `<i class="fas fa-calendar-alt me-2"></i>Official Start Time: ${openingAlertDate}`;
            feedback.classList.remove('d-none');
        }
    } else {
        if (uploadForm && !localStorage.getItem("submittedUploadEmail")) {
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
