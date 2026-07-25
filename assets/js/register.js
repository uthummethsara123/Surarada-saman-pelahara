// ==========================================================================
// 2026 PARTICIPATION SYSTEM WITH AUTO-TIMER & GOOGLE DRIVE HOOK
// ==========================================================================

// --- INNER SCHOOL ADDRESS MAP ---
const INNER_SCHOOL_ADDRESSES = {
    "Sivali Central College": "Hidellana, Rathnapura",
    "Gankanda Central College": "School lane, Pelmadulla",
    "Prince College": "Hidellana, Rathnapura",
    "Sumana Balika Vidyalaya": "Pothgul vihara mawatha, Rathnapura"
};

const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxGNZPK9jYGNTyXYwDmONDu03wXPIg-LnWVIx2PA0n5XQDYWieJ01cVrVry5ML6VFLS/exec";
const OPENING_DATE = new Date(2026, 6, 12, 0, 0, 0).getTime();      // July 13th, 2026
const CLOSING_DEADLINE = new Date(2026, 6, 26, 11, 0, 0).getTime();   // July 24th, 2026 (End of Day)

// --- REGISTRATION COUNTDOWN ENGINE ---
const countdownInterval = setInterval(function() {
    const now = new Date().getTime();
    let distance;
    const timerLabel = document.querySelector(".timer-label");
    const formContainer = document.getElementById("formContainer");
    const closedMessage = document.getElementById("closedMessage");
    
    if (now < OPENING_DATE) {
        distance = OPENING_DATE - now;
        if (timerLabel) timerLabel.innerText = "Registration window opens in:";
        if (formContainer) formContainer.classList.add("d-none");
        if (closedMessage) closedMessage.classList.add("d-none");
    } else if (now >= OPENING_DATE && now <= CLOSING_DEADLINE) {
        distance = CLOSING_DEADLINE - now;
        if (timerLabel) timerLabel.innerText = "Registration Window Closes In:";
        if (formContainer) {
            if (!localStorage.getItem("registeredUserEmail")) {
                formContainer.classList.remove("d-none");
            }
        }
        if (closedMessage) closedMessage.classList.add("d-none");
    } else {
        distance = -1;
    }

    if (distance >= 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minsEl = document.getElementById("minutes");
        const secsEl = document.getElementById("seconds");

        if (daysEl && hoursEl && minsEl && secsEl) {
            daysEl.innerText = days.toString().padStart(2, '0');
            hoursEl.innerText = hours.toString().padStart(2, '0');
            minsEl.innerText = minutes.toString().padStart(2, '0');
            secsEl.innerText = seconds.toString().padStart(2, '0');
        }
    } else {
        clearInterval(countdownInterval);
        const timerWrapper = document.getElementById("countdown-timer");
        if (timerWrapper) timerWrapper.innerHTML = "CLOSED";
        if (timerLabel) timerLabel.innerText = "Registration is now:";
        if (formContainer) formContainer.classList.add("d-none");
        if (closedMessage) closedMessage.classList.remove("d-none");
    }
}, 1000);

// ==========================================================================
// GOOGLE IDENTITY AUTHENTICATION CONTROLLER (ANTI-SPAM CONTROLS)
// ==========================================================================

function decodeGoogleJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Cryptographic Identity token decoding failure:", error);
        return null;
    }
}

window.handleCredentialResponse = function(response) {
    const profileData = decodeGoogleJwt(response.credential);
    
    if (profileData && profileData.email_verified) {
        const emailField = document.getElementById('verifiedEmail');
        const nameField = document.getElementById('verifiedName');
        
        if (emailField) emailField.value = profileData.email;
        if (nameField) nameField.value = profileData.name;

        let alertBox = document.getElementById('googleAuthAlertBox');
        if (!alertBox) {
            alertBox = document.createElement('div');
            alertBox.id = 'googleAuthAlertBox';
            const buttonWrapper = document.querySelector('.g_id_signin');
            if (buttonWrapper) {
                buttonWrapper.parentNode.insertBefore(alertBox, buttonWrapper.nextSibling);
            }
        }
        
        alertBox.className = "alert alert-success mt-3 py-2.5 px-3 border-0 rounded d-flex align-items-center";
        alertBox.style.background = "rgba(16, 185, 129, 0.15)";
        alertBox.style.color = "#34d399";
        alertBox.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            <div>Identity Verified: <span class="fw-bold text-white">${profileData.email}</span></div>
        `;
        
        const googleButton = document.querySelector('.g_id_signin');
        if (googleButton) googleButton.style.display = 'none';
    } else {
        alert("Authentication failed. Please use a valid verified Google account.");
    }
};

// ==========================================================================
// FORM SUBMISSION & BACKEND COMMUNICATION FLOW
// ==========================================================================
const regForm = document.getElementById('regForm');
if(regForm) {
    regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const feedback = document.getElementById('formFeedback');
        const addDelegateBtn = document.getElementById('add-delegate-btn');
        const delegateContainer = document.getElementById('delegates-form-container');
        const submittedStateDashboard = document.getElementById("submittedStateDashboard");
        
        // 🔒 1. MANDATORY SECURITY GATE: BLOCK USERS WHO AREN'T AUTHENTICATED
        const verifiedEmailValue = document.getElementById('verifiedEmail') ? document.getElementById('verifiedEmail').value : '';
        if (!verifiedEmailValue || verifiedEmailValue.trim() === "") {
            feedback.classList.remove('d-none');
            feedback.className = "text-center mt-3 text-danger fw-bold p-2 rounded border border-danger animate-pulse";
            feedback.style.background = "rgba(239, 68, 68, 0.1)";
            feedback.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> Access Denied: You must Verify your Google Identity above before submitting!`;
            
            // Scroll user up to focus on the Google Sign-In interface
            const authArea = document.querySelector('.g_id_signin') || document.getElementById('g_id_onload');
            if (authArea) {
                authArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Terminate execution immediately
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Processing, please wait...";
        feedback.classList.remove('d-none');
        feedback.className = "text-center mt-3 text-warning";
        feedback.innerText = "Submitting registration details...";

        const formData = new FormData(regForm);
        const searchParams = new URLSearchParams();
        
        let finalizedSchoolName = formData.get('schoolName');
        let finalizedSchoolAddress = formData.get('schoolAddress');
        const scopeChoice = formData.get('schoolScope');

        searchParams.append('action', 'submit');

        if (scopeChoice === "Inner-School") {
            finalizedSchoolName = formData.get('innerSchoolName');
            finalizedSchoolAddress = INNER_SCHOOL_ADDRESSES[finalizedSchoolName] || "";
        }

        for (const pair of formData.entries()) {
            if (pair[0] === 'innerSchoolName') continue;
            
            if (pair[0] === 'schoolName') {
                searchParams.append('schoolName', finalizedSchoolName || "");
            } else if (pair[0] === 'schoolAddress') {
                searchParams.append('schoolAddress', finalizedSchoolAddress || "");
            } else {
                searchParams.append(pair[0], pair[1]);
            }
        }

        for (let i = 2; i <= 8; i++) {
            if (!formData.has(`delegate_name_${i}`)) {
                searchParams.append(`delegate_name_${i}`, "");
                searchParams.append(`delegate_dob_${i}`, "");
                searchParams.append(`delegate_phone_${i}`, "");
                searchParams.append(`delegate_cert_${i}`, "");
                searchParams.append(`delegate_diet_${i}`, "");
            }
        }

        if (!searchParams.has('schoolName')) searchParams.append('schoolName', finalizedSchoolName || "");
        if (!searchParams.has('schoolAddress')) searchParams.append('schoolAddress', finalizedSchoolAddress || "");

        fetch(`${GOOGLE_APP_URL}?${searchParams.toString()}`, {
            method: 'POST',
            mode: 'no-cors'
        })
        .then(() => {
            feedback.className = "text-center mt-3 text-success fw-bold";
            feedback.innerText = "Registration Successful! Verified details are saved.";
            
            if (verifiedEmailValue) {
                localStorage.setItem("registeredUserEmail", verifiedEmailValue);
            }

            regForm.reset();
            
            if (delegateContainer) {
                const customBlocks = delegateContainer.querySelectorAll('.delegate-form-block:not(:first-child)');
                customBlocks.forEach(b => b.remove());
            }
            window.globalDelegateCount = 1;
            if (addDelegateBtn) addDelegateBtn.style.display = 'inline-block';

            if(document.getElementById("innerSchoolWrapper")) {
                document.getElementById("innerSchoolWrapper").classList.add("d-none");
                document.getElementById("innerSchoolWrapper").style.setProperty('display', 'none', 'important');
            }
            if(document.getElementById("standardSchoolDetailsWrapper")) {
                document.getElementById("standardSchoolDetailsWrapper").classList.remove("d-none");
                document.getElementById("standardSchoolDetailsWrapper").style.setProperty('display', 'block', 'important');
            }

            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Delegation Entry";

            if (submittedStateDashboard) {
                const statusTitle = document.getElementById("dashboardStatusTitle");
                if (statusTitle) statusTitle.innerText = "Registration Successful!";
                regForm.classList.add("d-none");
                submittedStateDashboard.classList.remove("d-none");
            }
        })
        .catch(error => {
            console.error('Submission Error:', error);
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Delegation Entry";
            feedback.className = "text-center mt-3 text-danger fw-bold";
            feedback.innerText = "Submission failed. Verify your connection.";
        });
    });
}

// ==========================================================================
// CORE DOM RENDERING INTERFACES & UI EVENT CONFIGURATORS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Dynamic titles adjustment
    const sectionTitlePs = document.querySelectorAll(".section-title p");
    sectionTitlePs.forEach(p => {
        if (p.innerText.includes("Deadline:")) {
            p.innerText = "Deadline: July 24";
        }
    });

    const scopeSelect = document.getElementById("regCompetitionScope");
    const innerSchoolWrapper = document.getElementById("innerSchoolWrapper");
    const innerSchoolSelect = document.getElementById("innerSchoolSelect");
    const standardSchoolDetailsWrapper = document.getElementById("standardSchoolDetailsWrapper");
    
    const schoolNameInput = document.getElementById('schoolNameInput');
    const schoolAddressInput = document.getElementById('schoolAddressInput');
    const schoolNameLabel = document.getElementById("schoolNameLabel");
    const schoolAddressLabel = document.getElementById("schoolAddressLabel");
    
    const aispaDetailsWrapper = document.getElementById("aispaDetailsWrapper");
    const ticNameInput = document.getElementById("ticNameInput");
    const ticContactInput = document.getElementById("ticContactInput");
    const presidentNameInput = document.getElementById("presidentNameInput");
    const presidentContactInput = document.getElementById("presidentContactInput");
    
    const ticNameLabel = document.getElementById("ticNameLabel");
    const ticContactLabel = document.getElementById("ticContactLabel");
    const presidentNameLabel = document.getElementById("presidentNameLabel");
    const presidentContactLabel = document.getElementById("presidentContactLabel");

    window.globalDelegateCount = 1;
    const maxDelegates = 8;
    const addDelegateBtn = document.getElementById('add-delegate-btn');
    const delegateContainer = document.getElementById('delegates-form-container');

    const submittedStateDashboard = document.getElementById("submittedStateDashboard");
    const triggerDeleteBtn = document.getElementById("triggerDeleteBtn");
    const confirmDataDeletionBtn = document.getElementById("confirmDataDeletionBtn");
    const feedbackField = document.getElementById('formFeedback');

    let bsDeleteModal = null;
    const deleteModalEl = document.getElementById("deleteConfirmModal");
    if (deleteModalEl && typeof bootstrap !== 'undefined') {
        bsDeleteModal = new bootstrap.Modal(deleteModalEl);
    }

    const storedEmailSession = localStorage.getItem("registeredUserEmail");
    if (storedEmailSession && regForm && submittedStateDashboard) {
        const statusTitle = document.getElementById("dashboardStatusTitle");
        if (statusTitle) statusTitle.innerText = "Delegation Already Submitted!";
        regForm.classList.add("d-none");
        submittedStateDashboard.classList.remove("d-none");
    }

    if (triggerDeleteBtn && bsDeleteModal) {
        triggerDeleteBtn.addEventListener("click", () => {
            bsDeleteModal.show();
        });
    }

    if (confirmDataDeletionBtn) {
        confirmDataDeletionBtn.addEventListener("click", () => {
            const targetedEmailKey = localStorage.getItem("registeredUserEmail");
            if (!targetedEmailKey) {
                alert("No structural context session key found.");
                return;
            }

            confirmDataDeletionBtn.disabled = true;
            confirmDataDeletionBtn.innerText = "Deleting details...";

            const deleteParams = new URLSearchParams();
            deleteParams.append("action", "delete");
            deleteParams.append("email", targetedEmailKey);

            fetch(`${GOOGLE_APP_URL}?${deleteParams.toString()}`, {
                method: 'POST',
                mode: 'no-cors'
            })
            .then(() => {
                localStorage.removeItem("registeredUserEmail");
                if (regForm) regForm.reset();
                if (feedbackField) {
                    feedbackField.classList.add("d-none");
                    feedbackField.innerText = "";
                }
                if (bsDeleteModal) bsDeleteModal.hide();
                if (submittedStateDashboard) submittedStateDashboard.classList.add("d-none");
                if (regForm) regForm.classList.remove("d-none");

                confirmDataDeletionBtn.disabled = false;
                confirmDataDeletionBtn.innerText = "Yes, Delete Entry";
            })
            .catch(err => {
                console.error("Deletion communication error pipeline:", err);
                alert("Database dropping execution failure encountered.");
                confirmDataDeletionBtn.disabled = false;
                confirmDataDeletionBtn.innerText = "Yes, Delete Entry";
            });
        });
    }

    if (addDelegateBtn && delegateContainer) {
        addDelegateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.globalDelegateCount >= maxDelegates) return;
            window.globalDelegateCount++;

            const delegateWrapper = document.createElement('div');
            delegateWrapper.className = 'delegate-form-block mb-4 p-3 border border-secondary rounded glass-panel position-relative style-animation-reveal';
            delegateWrapper.id = `delegate-block-${window.globalDelegateCount}`;
            
            delegateWrapper.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="text-white mb-0">Nominated Delegate #${window.globalDelegateCount}</h5>
                    <button type="button" class="btn btn-danger btn-sm remove-delegate-btn" data-target-id="delegate-block-${window.globalDelegateCount}">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </div>
                <div class="mb-3">
                    <label class="form-label text-warning-light">Full Name <span class="text-danger">*</span></label>
                    <input type="text" name="delegate_name_${window.globalDelegateCount}" class="form-control glass-input" placeholder="Enter Full Name" required>
                </div>
                <div class="mb-3">
                    <label class="form-label text-warning-light">Date of Birth (YYYY.MM.DD) <span class="text-danger">*</span></label>
                    <input type="text" name="delegate_dob_${window.globalDelegateCount}" class="form-control glass-input" placeholder="e.g. 2008.05.12" required>
                </div>
                <div class="mb-3">
                    <label class="form-label text-warning-light">Contact Number <span class="text-danger">*</span></label>
                    <input type="tel" name="delegate_phone_${window.globalDelegateCount}" class="form-control glass-input" placeholder="Enter Contact Number" required>
                </div>
                <div class="mb-3">
                    <label class="form-label text-warning-light">Delegation Dietary Option <span class="text-danger">*</span></label>
                    <select name="delegate_diet_${window.globalDelegateCount}" class="form-select glass-input text-white" style="background-color: #1e293b;" required>
                        <option value="" disabled selected hidden>Select Option</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                    </select>
                </div>
            `;

            delegateContainer.appendChild(delegateWrapper);
            if (window.globalDelegateCount === maxDelegates) {
                addDelegateBtn.style.display = 'none';
            }

            delegateWrapper.querySelector('.remove-delegate-btn').addEventListener('click', function() {
                const targetBlock = document.getElementById(this.getAttribute('data-target-id'));
                if (targetBlock) {
                    targetBlock.remove();
                    window.globalDelegateCount--;
                    if (window.globalDelegateCount < maxDelegates) {
                        addDelegateBtn.style.display = 'inline-block';
                    }
                    renumberDelegates();
                }
            });
        });
    }

    function renumberDelegates() {
        const blocks = delegateContainer.querySelectorAll('.delegate-form-block:not(:first-child)');
        window.globalDelegateCount = 1;
        blocks.forEach((block) => {
            window.globalDelegateCount++;
            block.id = `delegate-block-${window.globalDelegateCount}`;
            block.querySelector('h5').textContent = `Nominated Delegate #${window.globalDelegateCount}`;
            block.querySelector('.remove-delegate-btn').setAttribute('data-target-id', `delegate-block-${window.globalDelegateCount}`);
            
            block.querySelector('input[name^="delegate_name_"]').name = `delegate_name_${window.globalDelegateCount}`;
            block.querySelector('input[name^="delegate_dob_"]').name = `delegate_dob_${window.globalDelegateCount}`;
            block.querySelector('input[name^="delegate_phone_"]').name = `delegate_phone_${window.globalDelegateCount}`;
            block.querySelector('select[name^="delegate_diet_"]').name = `delegate_diet_${window.globalDelegateCount}`;
        });
    }

    const updateFormLabelsAndRequirements = (statusMode) => {
        const optionalBadge = ' <span style="color: #94a3b8; font-size: 0.8rem; font-weight: normal;">(Optional)</span>';
        const requiredBadge = ' <span class="text-danger">*</span>';

        if (statusMode === "INTER_SCHOOL") {
            if(schoolNameInput) schoolNameInput.required = true;
            if(schoolAddressInput) schoolAddressInput.required = true;
            if(ticNameInput) ticNameInput.required = true;
            if(ticContactInput) ticContactInput.required = true;
            if(presidentNameInput) presidentNameInput.required = true;
            if(presidentContactInput) presidentContactInput.required = true;

            if (schoolNameLabel) schoolNameLabel.innerHTML = 'School Name' + requiredBadge;
            if (schoolAddressLabel) schoolAddressLabel.innerHTML = 'School Address' + requiredBadge;
            if (ticNameLabel) ticNameLabel.innerHTML = 'Teacher-in-Charge (TIC) Name' + requiredBadge;
            if (ticContactLabel) ticContactLabel.innerHTML = 'TIC Contact Number' + requiredBadge;
            if (presidentNameLabel) presidentNameLabel.innerHTML = 'Association President Name' + requiredBadge;
            if (presidentContactLabel) presidentContactLabel.innerHTML = 'President Contact Number' + requiredBadge;
        } 
        else if (statusMode === "INNER_SCHOOL") {
            if(schoolNameInput) schoolNameInput.required = false;
            if(schoolAddressInput) schoolAddressInput.required = false;
            if(ticNameInput) ticNameInput.required = true;
            if(ticContactInput) ticContactInput.required = true;
            if(presidentNameInput) presidentNameInput.required = true;
            if(presidentContactInput) presidentContactInput.required = true;

            if (ticNameLabel) ticNameLabel.innerHTML = 'Teacher-in-Charge (TIC) Name' + requiredBadge;
            if (ticContactLabel) ticContactLabel.innerHTML = 'TIC Contact Number' + requiredBadge;
            if (presidentNameLabel) presidentNameLabel.innerHTML = 'Association President Name' + requiredBadge;
            if (presidentContactLabel) presidentContactLabel.innerHTML = 'President Contact Number' + requiredBadge;
        } 
        else if (statusMode === "AISPA") {
            if(schoolNameInput) schoolNameInput.required = false;
            if(schoolAddressInput) schoolAddressInput.required = false;
            if(ticNameInput) ticNameInput.required = false;
            if(ticContactInput) ticContactInput.required = false;
            if(presidentNameInput) presidentNameInput.required = false;
            if(presidentContactInput) presidentContactInput.required = false;

            if (schoolNameLabel) schoolNameLabel.innerHTML = 'School Name' + optionalBadge;
            if (schoolAddressLabel) schoolAddressLabel.innerHTML = 'School Address' + optionalBadge;
            if (ticNameLabel) ticNameLabel.innerHTML = 'Teacher-in-Charge (TIC) Name' + optionalBadge;
            if (ticContactLabel) ticContactLabel.innerHTML = 'TIC Contact Number' + optionalBadge;
            if (presidentNameLabel) presidentNameLabel.innerHTML = 'Association President Name' + optionalBadge;
            if (presidentContactLabel) presidentContactLabel.innerHTML = 'President Contact Number' + optionalBadge;
        }
    };

    if (scopeSelect) {
        scopeSelect.addEventListener("change", function() {
            const selectedScope = this.value;

            if(innerSchoolWrapper) {
                innerSchoolWrapper.classList.add("d-none");
                innerSchoolWrapper.style.setProperty('display', 'none', 'important');
            }
            if(innerSchoolSelect) {
                innerSchoolSelect.required = false;
                innerSchoolSelect.value = "";
            }
            if(standardSchoolDetailsWrapper) {
                standardSchoolDetailsWrapper.classList.remove("d-none");
                standardSchoolDetailsWrapper.style.setProperty('display', 'block', 'important');
            }
            if(aispaDetailsWrapper) {
                aispaDetailsWrapper.classList.add("d-none");
                aispaDetailsWrapper.style.setProperty('display', 'none', 'important');
            }

            if (selectedScope === "Inter-School") {
                if(aispaDetailsWrapper) {
                    aispaDetailsWrapper.classList.remove("d-none");
                    aispaDetailsWrapper.style.setProperty('display', 'block', 'important');
                }
                updateFormLabelsAndRequirements("INTER_SCHOOL");
            } 
            else if (selectedScope === "Inner-School") {
                if(innerSchoolWrapper) {
                    innerSchoolWrapper.classList.remove("d-none");
                    innerSchoolWrapper.style.setProperty('display', 'block', 'important');
                }
                if(innerSchoolSelect) innerSchoolSelect.required = true;
                if(standardSchoolDetailsWrapper) {
                    standardSchoolDetailsWrapper.classList.add("d-none"); 
                    standardSchoolDetailsWrapper.style.setProperty('display', 'none', 'important');
                }
                if(aispaDetailsWrapper) {
                    aispaDetailsWrapper.classList.remove("d-none");
                    aispaDetailsWrapper.style.setProperty('display', 'block', 'important');
                }
                updateFormLabelsAndRequirements("INNER_SCHOOL");
            } 
            else if (selectedScope === "AISPA-Member") {
                if(aispaDetailsWrapper) {
                    aispaDetailsWrapper.classList.remove("d-none");
                    aispaDetailsWrapper.style.setProperty('display', 'block', 'important');
                }
                updateFormLabelsAndRequirements("AISPA");
            }
        });
    }

    // --- 📜 RULES MODAL IMAGE INTERACTIVE CONTROL ENGINE ---
    const langBtnEng = document.getElementById("langBtnEng");
    const langBtnSin = document.getElementById("langBtnSin");
    const zoomToggleBtn = document.getElementById("zoomToggleBtn");
    const guidelinesDisplaySheet = document.getElementById("guidelinesDisplaySheet");
    const scrollWrapper = document.getElementById("guidelinesScrollWrapper");

    const ENGLISH_IMAGE_SOURCE = "assets/img/26 guideline eng.png";
    const SINHALA_IMAGE_SOURCE = "assets/img/26 guideline sin.png";

    let isZoomed = false;
    let isDown = false;
    let startX, startY;
    let scrollLeft, scrollTop;
    let draggedDistance = 0;

    function setLanguageView(activeLang) {
        if (activeLang === 'en' && langBtnEng && langBtnSin && guidelinesDisplaySheet) {
            langBtnEng.className = "btn btn-warning btn-sm fw-bold px-4 py-2 shadow-sm";
            langBtnSin.className = "btn btn-outline-warning btn-sm fw-bold px-4 py-2";
            guidelinesDisplaySheet.src = ENGLISH_IMAGE_SOURCE;
        } else if (activeLang === 'si' && langBtnEng && langBtnSin && guidelinesDisplaySheet) {
            langBtnSin.className = "btn btn-warning btn-sm fw-bold px-4 py-2 shadow-sm";
            langBtnEng.className = "btn btn-outline-warning btn-sm fw-bold px-4 py-2";
            guidelinesDisplaySheet.src = SINHALA_IMAGE_SOURCE;
        }
    }

    function toggleImageZoom() {
        if (!guidelinesDisplaySheet || !scrollWrapper || !zoomToggleBtn) return;
        if (!isZoomed) {
            guidelinesDisplaySheet.style.width = "180%"; 
            guidelinesDisplaySheet.style.cursor = "zoom-out";
            scrollWrapper.style.cursor = "grab";
            zoomToggleBtn.innerHTML = '<i class="fas fa-search-minus me-1"></i> Zoom Out';
            zoomToggleBtn.className = "btn btn-info btn-sm fw-bold px-3 py-2 text-white";
            isZoomed = true;
        } else {
            guidelinesDisplaySheet.style.width = "100%";
            guidelinesDisplaySheet.style.cursor = "zoom-in";
            scrollWrapper.style.cursor = "default";
            zoomToggleBtn.innerHTML = '<i class="fas fa-search-plus me-1"></i> Click Image to Zoom';
            zoomToggleBtn.className = "btn btn-outline-info btn-sm fw-bold px-3 py-2";
            isZoomed = false;
        }
    }

    if (scrollWrapper && guidelinesDisplaySheet) {
        scrollWrapper.addEventListener('mousedown', (e) => {
            if (!isZoomed) return;
            isDown = true;
            scrollWrapper.style.cursor = 'grabbing';
            guidelinesDisplaySheet.style.cursor = 'grabbing';
            startX = e.pageX - scrollWrapper.offsetLeft;
            startY = e.pageY - scrollWrapper.offsetTop;
            scrollLeft = scrollWrapper.scrollLeft;
            scrollTop = scrollWrapper.scrollTop;
            draggedDistance = 0;
        });

        scrollWrapper.addEventListener('mouseleave', () => {
            if (!isDown) return;
            isDown = false;
            scrollWrapper.style.cursor = isZoomed ? 'grab' : 'default';
        });

        scrollWrapper.addEventListener('mouseup', () => {
            if (!isDown) return;
            isDown = false;
            scrollWrapper.style.cursor = isZoomed ? 'grab' : 'default';
            if (isZoomed) guidelinesDisplaySheet.style.cursor = 'zoom-out';
        });

        scrollWrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollWrapper.offsetLeft;
            const y = e.pageY - scrollWrapper.offsetTop;
            const walkX = (x - startX) * 1.5;
            const walkY = (y - startY) * 1.5;
            scrollWrapper.scrollLeft = scrollLeft - walkX;
            scrollWrapper.scrollTop = scrollTop - walkY;
            draggedDistance += Math.abs(walkX) + Math.abs(walkY);
        });

        guidelinesDisplaySheet.addEventListener('click', (e) => {
            if (draggedDistance > 8) {
                e.preventDefault();
                return;
            }
            toggleImageZoom();
        });
    }

    if (langBtnEng) langBtnEng.addEventListener("click", () => setLanguageView('en'));
    if (langBtnSin) langBtnSin.addEventListener("click", () => setLanguageView('si'));
    if (zoomToggleBtn) zoomToggleBtn.addEventListener("click", toggleImageZoom);

    const modalElement = document.getElementById('guidelinesModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            if (isZoomed) toggleImageZoom();
        });
    }
});

// ==========================================================================
// APPLIFECYCLE SECURITY IMPLEMENTATIONS (LOADER MANAGERS)
// ==========================================================================
document.documentElement.classList.add('lock-scrolling');
document.body.classList.add('lock-scrolling');
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";

const forceUnlockTimeout = setTimeout(() => {
    cleanUpAndDestroyLoader("Safety Timeout Triggered");
}, 3500);

function cleanUpAndDestroyLoader(reason) {
    console.log("Loader Dismissed via:", reason);
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
    
    document.documentElement.classList.remove('lock-scrolling');
    document.body.classList.remove('lock-scrolling');
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
