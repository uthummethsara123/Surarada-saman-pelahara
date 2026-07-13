const SUBMISSION_API_URL = "https://script.google.com/macros/s/AKfycbzTFVn_7u_oGEeijewaNR0t8a5vARJkiuBWpOuMJVcowQdkDdaWGofaar8BRuG88VGGtQ/exec";

// ==========================================================
// MARATHON TIMELINE CONFIGURATION & GRACE ENGINES
// ==========================================================
// Use standard hyphens instead of dots so browsers can read it cleanly
const START_DATE = new Date("2026-07-13T00:00:00").getTime();
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
        transition: stroke-dashoffset 1.2s ease-in-out;   /* ← Updated */
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

            // =========================================================================
            // BOOTSTRAP 5 CUSTOM MODAL VALIDATION FOR 5MB IMAGE LIMITS
            // =========================================================================
            const maxSizeBytes = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSizeBytes) {
                this.value = ""; // Clear file selection instantly

                // 1. Check if our custom modal structural container exists. If not, generate it.
                let warningModalEl = document.getElementById('sizeWarningModal');
                if (!warningModalEl) {
                    const modalHtml = `
                    <div class="modal fade" id="sizeWarningModal" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content text-white" style="background-color: #1e1b4b; border: 2px solid #ef4444; border-radius: 12px;">
                                <div class="modal-header border-0 pb-0" style="padding: 20px 20px 10px 20px;">
                                    <h5 class="modal-title d-flex align-items-center text-danger fw-bold" style="font-size: 1.25rem;">
                                        <i class="bi bi-exclamation-triangle-fill me-2" style="font-size: 1.5rem;"></i> File Too Large
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body py-3" style="padding: 0 20px; font-size: 0.95rem; line-height: 1.6; color: #cbd5e1;">
                                    <p class="mb-2">The image you selected, <span class="text-warning fw-medium">"${file.name}"</span>, exceeds our allowed file size limit.</p>
                                    <p class="mb-0">Please reduce or compress your image to <span class="text-success fw-bold">under 5MB</span> before uploading. This ensures your data processes instantly and prevents server traffic jams.</p>
                                </div>
                                <div class="modal-footer border-0 pt-0" style="padding: 10px 20px 20px 20px;">
                                    <button type="button" class="btn btn-danger w-100 fw-semibold" data-bs-dismiss="modal" style="border-radius: 6px; padding: 8px 16px;">Got it</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                    warningModalEl = document.getElementById('sizeWarningModal');
                }

                // 2. Safely trigger the Bootstrap 5 Modal API instance directly via script
                const bsModal = new bootstrap.Modal(warningModalEl);
                bsModal.show();
                
                return; // Stop execution
            }
            // =========================================================================

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

    // =========================================================================
    // UNIFIED HIGH-RELIABILITY FORM SUBMISSION ENGINE WITH AUTOSCROLL
    // =========================================================================

            if (uploadForm) {
        uploadForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById("uploadSubmitBtn");
            const participantEmail = document.getElementById("participantEmail")?.value.trim();
            const participantName = document.getElementById("participantName")?.value.trim();
            const certificateName = document.getElementById("certificateName")?.value.trim();
            const schoolName = document.getElementById("schoolName")?.value.trim();
            const competitionScope = document.getElementById("competitionScope")?.value;

            if (!participantEmail || !participantName || !schoolName) {
                let missingInfoModal = document.getElementById('missingInfoModal');
                if (!missingInfoModal) {
                    const html = `<div class="modal fade" id="missingInfoModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content text-white" style="background-color: #1e1b4b; border: 2px solid #ef4444; border-radius: 12px;"><div class="modal-header border-0"><h5 class="modal-title text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Missing Information</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body">Please fill out all identity and school information fields.</div><div class="modal-footer border-0"><button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">OK</button></div></div></div></div>`;
                    document.body.insertAdjacentHTML('beforeend', html);
                    missingInfoModal = document.getElementById('missingInfoModal');
                }
                new bootstrap.Modal(missingInfoModal).show();
                return;
            }

            const fileInputs = document.querySelectorAll('.preview-trigger');
            const activeSlots = [];

            fileInputs.forEach(input => {
                if (input.files && input.files.length > 0) {
                    const slotId = input.name;
                    const titleField = document.getElementById("title_" + slotId);
                    activeSlots.push({
                        slot: slotId,
                        file: input.files[0],
                        title: titleField ? titleField.value.trim() : "Untitled"
                    });
                }
            });

            if (activeSlots.length === 0) {
                let emptyPortfolioModal = document.getElementById('emptyPortfolioModal');
                if (!emptyPortfolioModal) {
                    const html = `<div class="modal fade" id="emptyPortfolioModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content text-white" style="background-color: #1e1b4b; border: 2px solid #ef4444; border-radius: 12px;"><div class="modal-header border-0"><h5 class="modal-title text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Empty Portfolio</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body">Your portfolio is empty! Please select at least one photograph to submit.</div><div class="modal-footer border-0"><button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">OK</button></div></div></div></div>`;
                    document.body.insertAdjacentHTML('beforeend', html);
                    emptyPortfolioModal = document.getElementById('emptyPortfolioModal');
                }
                new bootstrap.Modal(emptyPortfolioModal).show();
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing Portfolio...`;
            }

            try {
                const unifiedPayload = {
                    email: participantEmail,
                    name: participantName,
                    certName: certificateName,
                    school: schoolName,
                    scope: competitionScope
                };

                // ONE PHOTO AT A TIME - Circle stays until upload is done
                for (let i = 0; i < activeSlots.length; i++) {
                    const item = activeSlots[i];
                    const slot = item.slot;

                    if (submitBtn) {
                        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing Photo ${i + 1}/${activeSlots.length}...`;
                    }

                    // FIXED: Removed the lines that were hiding previous green ticks!
                    // We only want to manipulate the specific circle for THIS slot.
                    const containerCircle = document.getElementById(`circle_container_${slot}`);
                    const circleBar = document.getElementById(`circle_bar_${slot}`);
                    const tickMark = document.getElementById(`tick_${slot}`);

                    // Show current circle
                    if (containerCircle) {
                        containerCircle.classList.remove('d-none');
                        containerCircle.style.display = 'inline-block';
                    }

                    // Slow fill to 90%
                    if (circleBar) {
                        circleBar.style.transition = 'stroke-dashoffset 5s linear';
                        circleBar.style.strokeDashoffset = '88';
                        setTimeout(() => {
                            circleBar.style.strokeDashoffset = '9';
                        }, 100);
                    }

                    containerCircle.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Base64
                    const base64Content = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(item.file);
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                    });

                    // Wait a bit so user sees 90%
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // FIXED DUPLICATION: We create a brand new payload for THIS photo ONLY.
                    // We do not inject it into the global unifiedPayload, which stops them from stacking up.
                    const singlePayload = { 
                        ...unifiedPayload, // Copies email, name, school, etc.
                        [slot]: base64Content,
                        [slot + "_name"]: item.file.name,
                        [slot + "_type"]: item.file.type,
                        [slot + "_title"]: item.title
                    };

                    // Now upload this single photo
                    const response = await fetch(SUBMISSION_API_URL, {
                        method: "POST",
                        mode: "cors",
                        body: JSON.stringify(singlePayload)
                    });

                    const result = await response.json();
                    if (result.success !== true) {
                        throw new Error(result.message || "Upload failed");
                    }

                    // Now show green tick
                    if (circleBar) {
                        circleBar.style.transition = 'stroke-dashoffset 0.6s ease';
                        circleBar.style.strokeDashoffset = '0';
                    }

                    if (containerCircle) {
                        setTimeout(() => {
                            containerCircle.classList.add('d-none');
                            containerCircle.style.display = 'none';
                        }, 200);
                    }

                    if (tickMark) {
                        tickMark.style.display = 'inline-block';
                        tickMark.style.color = '#22c55e'; // Keeps the tick perfectly green and visible
                    }

                    await new Promise(resolve => setTimeout(resolve, 900));
                }

                // Final Success
                submissionFinishedTime = new Date().getTime();
                userIsActivelyWorking = false;

                if (submitBtn) {
                    submitBtn.innerHTML = `<i class="fas fa-check-double me-2"></i>Portfolio Uploaded!`;
                    submitBtn.className = "btn btn-success w-100 py-2 fw-semibold";
                    submitBtn.disabled = true;
                }

                localStorage.setItem("submittedUploadEmail", participantEmail);
                localStorage.setItem("submittedUploadName", participantName);

                const uploadFormEl = document.getElementById('uploadForm');
                const uploadDashboardEl = document.getElementById('uploadSubmittedDashboard');
                if (uploadFormEl) uploadFormEl.classList.add('d-none');
                if (uploadDashboardEl) uploadDashboardEl.classList.remove('d-none');

            } catch (error) {
                console.error("Submission Error:", error);
                let uploadFailModal = document.getElementById('uploadFailModal');
                if (!uploadFailModal) {
                    const html = `<div class="modal fade" id="uploadFailModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content text-white" style="background-color: #1e1b4b; border: 2px solid #ef4444; border-radius: 12px;"><div class="modal-header border-0"><h5 class="modal-title text-danger fw-bold"><i class="bi bi-x-circle-fill me-2"></i>Upload Failed</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body">Upload failed: ${error.message}<br><br>Please try again.</div><div class="modal-footer border-0"><button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">OK</button></div></div></div></div>`;
                    document.body.insertAdjacentHTML('beforeend', html);
                    uploadFailModal = document.getElementById('uploadFailModal');
                }
                new bootstrap.Modal(uploadFailModal).show();
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fas fa-redo-alt me-2"></i>Retry Submission`;
                    submitBtn.className = "btn btn-danger w-100 py-2 fw-semibold";
                }
            }
        });
    }

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

                // Clear localStorage
                localStorage.removeItem("submittedUploadEmail");
                localStorage.removeItem("submittedUploadName");

                submissionFinishedTime = null;
                userIsActivelyWorking = false;
                completedAfterDeadline = false;

                //FULL RESET
                if (uploadForm) {
                    uploadForm.reset();
                    uploadForm.classList.remove('d-none');
                }

                // Reset all file inputs and previews
                document.querySelectorAll('.preview-trigger').forEach(input => {
                    input.value = "";
                    input.classList.remove('d-none');
                });

                document.querySelectorAll('.preview-control-box').forEach(wrapper => {
                    wrapper.classList.add('d-none');
                });

                document.querySelectorAll('input[id^="title_"]').forEach(title => {
                    title.value = "";
                });

                // Reset circles and ticks (this is the important part)
                document.querySelectorAll('.progress-circle-container').forEach(el => {
                    el.classList.add('d-none');
                });
                document.querySelectorAll('.upload-success-tick').forEach(tick => {
                    tick.style.display = 'none';
                });

                // Reset submit button
                const submitBtn = document.getElementById('uploadSubmitBtn');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `Upload & Submit Portfolio`;
                    submitBtn.className = "btn btn-light submit-btn w-100 mt-4";
                }

                // Hide dashboard
                const uploadDashboard = document.getElementById('uploadSubmittedDashboard');
                if (uploadDashboard) uploadDashboard.classList.add('d-none');

                if (uploadModalObj) uploadModalObj.hide();


            } catch (err) {
                console.error("Deletion Error:", err);
                // Custom Alert: Delete Failed
let deleteFailModal = document.getElementById('deleteFailModal');
if (!deleteFailModal) {
    const html = `
    <div class="modal fade" id="deleteFailModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content text-white" style="background-color: #1e1b4b; border: 2px solid #ef4444; border-radius: 12px;">
                <div class="modal-header border-0">
                    <h5 class="modal-title text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>Delete Failed</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">Could not process data reset. Please try again.</div>
                <div class="modal-footer border-0">
                    <button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    deleteFailModal = document.getElementById('deleteFailModal');
}
new bootstrap.Modal(deleteFailModal).show();
            } finally {
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

            // Remove announcement text box if closed early
            const infoBox = document.querySelector('.official-portal-announcement');
            if (infoBox) infoBox.remove();

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

            // Remove announcement text box if in grace upload configuration
            const infoBox = document.querySelector('.official-portal-announcement');
            if (infoBox) infoBox.remove();

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

            // Clean announcement layout box
            const infoBox = document.querySelector('.official-portal-announcement');
            if (infoBox) infoBox.remove();

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

        // Wipe text box on portal exit close tracking
        const infoBox = document.querySelector('.official-portal-announcement');
        if (infoBox) infoBox.remove();

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

        // =========================================================================
        // ADDED STATE: BEFORE TIMER HITS (TEXT BOX GENERATOR & INLINE DISPLAY)
        // =========================================================================
        let infoBox = document.querySelector('.official-portal-announcement');
        if (!infoBox) {
            infoBox = document.createElement('div');
            infoBox.className = 'official-portal-announcement text-center mb-4 p-3 rounded fw-bold w-100';
            infoBox.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'; 
            infoBox.style.border = '1px solid rgba(56, 189, 248, 0.2)';
            infoBox.style.color = '#38bdf8';
            infoBox.style.fontSize = '0.95rem';
            
            // Render at the absolute top layout header inside the main active template wrapper
            const insertionContext = formWrapper || countdownContainer || document.body;
            if (insertionContext) {
                insertionContext.insertBefore(infoBox, insertionContext.firstChild);
            }
        }

        // Dynamically compute exact date formatting patterns mapping from the START_DATE constant
        const openingDateTime = new Date(START_DATE);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = months[openingDateTime.getMonth()];
        const dayNum = openingDateTime.getDate();
        
        let daySuffix = "th";
        if (dayNum % 10 === 1 && dayNum !== 11) daySuffix = "st";
        else if (dayNum % 10 === 2 && dayNum !== 12) daySuffix = "nd";
        else if (dayNum % 10 === 3 && dayNum !== 13) daySuffix = "rd";

        let hoursValue = openingDateTime.getHours();
        const minutesValue = String(openingDateTime.getMinutes()).padStart(2, '0');
        const ampm = hoursValue >= 12 ? 'pm' : 'am';
        hoursValue = hoursValue % 12;
        hoursValue = hoursValue ? hoursValue : 12; 
        const formattedTime = `${hoursValue}.${minutesValue}${ampm}`;

        infoBox.innerHTML = `<i class="fas fa-calendar-alt me-2"></i>Submission portal opens on ${monthName} ${dayNum}${daySuffix} at ${formattedTime}`;
        // =========================================================================

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

        // =========================================================================
        // ADDED STATE: AFTER TIMER HITS (DESTRUCTIVE ANNOUNCEMENT HIDING RULE)
        // =========================================================================
        const infoBox = document.querySelector('.official-portal-announcement');
        if (infoBox) {
            infoBox.remove(); // Safely clears the textbox elements instantly from the DOM structure
        }
        // =========================================================================
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
