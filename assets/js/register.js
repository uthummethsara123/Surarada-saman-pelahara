// ==========================================================================
// 2026 PARTICIPATION SYSTEM WITH AUTO-TIMER & GOOGLE DRIVE HOOK
// ==========================================================================


// 0 is januarty and vise versa
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxGNZPK9jYGNTyXYwDmONDu03wXPIg-LnWVIx2PA0n5XQDYWieJ01cVrVry5ML6VFLS/exec";
const CLOSING_DEADLINE = new Date(2026, 6, 19, 24, 0, 0).getTime();

// --- INNER SCHOOL ADDRESS MAP ---
const INNER_SCHOOL_ADDRESSES = {
    "Sivali Central College": "Hidellana, Rathnapura",
    "Gankanda Central College": "School lane, Pelmadulla",
    "St. Aloysius College": "Cathedral road, Rathnapura",
    "Prince College": "Hidellana, Rathnapura",
    "Sumana Balika Vidyalaya": "Pothgul vihara mawatha, Rathnapura"
};

const countdownInterval = setInterval(function() {
    const now = new Date().getTime();
    const distance = CLOSING_DEADLINE - now;

    // Fixed time calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000); // <-- FIXED LINE

    // Grab the elements safely
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

    if (distance < 0) {
        clearInterval(countdownInterval);
        const timerWrapper = document.getElementById("countdown-timer");
        if (timerWrapper) timerWrapper.innerHTML = "CLOSED";
        const formContainer = document.getElementById("formContainer");
        if (formContainer) formContainer.classList.add("d-none");
        const closedMessage = document.getElementById("closedMessage");
        if (closedMessage) closedMessage.classList.remove("d-none");
    }
}, 1000);

const regForm = document.getElementById('regForm');
if(regForm) {
    regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const feedback = document.getElementById('formFeedback');
        
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing, please wait...";
        feedback.classList.remove('d-none');
        feedback.className = "text-center mt-3 text-warning";
        feedback.innerText = "Submitting registration details...";

        const formData = new FormData(regForm);
        const searchParams = new URLSearchParams();
        
        // Setup initial school name and address data fallbacks
        let finalizedSchoolName = formData.get('schoolName');
        let finalizedSchoolAddress = formData.get('schoolAddress');
        const scopeChoice = formData.get('schoolScope');

        // IF INNER-SCHOOL: Overwrite name and fetch corresponding hardcoded address mapping
        if (scopeChoice === "Inner-School") {
            finalizedSchoolName = formData.get('innerSchoolName');
            finalizedSchoolAddress = INNER_SCHOOL_ADDRESSES[finalizedSchoolName] || "";
        }

        let foodPref = formData.get('dietaryPreference');
        const customMixNotes = formData.get('mixedDietaryNotes');
        if (foodPref === "Mixed" && customMixNotes) {
            foodPref = `Mixed (${customMixNotes})`;
        }

        // Loop over values and push clean mapping names safely
        for (const pair of formData.entries()) {
            if (pair[0] === 'mixedDietaryNotes' || pair[0] === 'innerSchoolName') continue;
            
            if (pair[0] === 'schoolName') {
                searchParams.append('schoolName', finalizedSchoolName || "");
            } else if (pair[0] === 'schoolAddress') {
                searchParams.append('schoolAddress', finalizedSchoolAddress || "");
            } else if (pair[0] === 'dietaryPreference') {
                searchParams.append('dietaryPreference', foodPref);
            } else {
                searchParams.append(pair[0], pair[1]);
            }
        }

        // Catch edge-case if Inter-School fields weren't naturally iterated over due to DOM switching
        if (!searchParams.has('schoolName')) {
            searchParams.append('schoolName', finalizedSchoolName || "");
        }
        if (!searchParams.has('schoolAddress')) {
            searchParams.append('schoolAddress', finalizedSchoolAddress || "");
        }

        fetch(`${GOOGLE_APP_URL}?${searchParams.toString()}`, {
            method: 'POST',
            mode: 'no-cors'
        })
        .then(() => {
            feedback.className = "text-center mt-3 text-success fw-bold";
            feedback.innerText = "Registration Successful! Verified details saved in Google Sheets.";
            regForm.reset();
            
            // Explicitly force hide structures back to baseline defaults
            if(document.getElementById("mixedDietaryWrapper")) {
                document.getElementById("mixedDietaryWrapper").classList.add("d-none");
                document.getElementById("mixedDietaryWrapper").style.setProperty('display', 'none', 'important');
            }
            if(document.getElementById("innerSchoolWrapper")) {
                document.getElementById("innerSchoolWrapper").classList.add("d-none");
                document.getElementById("innerSchoolWrapper").style.setProperty('display', 'none', 'important');
            }
            if(document.getElementById("standardSchoolDetailsWrapper")) {
                document.getElementById("standardSchoolDetailsWrapper").classList.remove("d-none");
                document.getElementById("standardSchoolDetailsWrapper").style.setProperty('display', 'block', 'important');
            }

            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Another Entry";
        })
        .catch(error => {
            console.error('Submission Error:', error);
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Delegation Entry";
            feedback.className = "text-center mt-3 text-danger fw-bold";
            feedback.innerText = "Submission failed. Verify Google Sheet deployment rules.";
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
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

    const dietarySelect = document.getElementById("dietaryPreference");
    const mixedDietaryWrapper = document.getElementById("mixedDietaryWrapper");
    const mixedDietaryNotes = document.getElementById("mixedDietaryNotes");

    if (dietarySelect && mixedDietaryWrapper && mixedDietaryNotes) {
        mixedDietaryWrapper.classList.add("d-none");
        mixedDietaryWrapper.style.setProperty('display', 'none', 'important');
        mixedDietaryNotes.required = false;

        dietarySelect.addEventListener("change", function() {
            if (this.value === "Mixed") {
                mixedDietaryWrapper.classList.remove("d-none");
                mixedDietaryWrapper.style.setProperty('display', 'block', 'important');
                mixedDietaryNotes.required = true;
            } else {
                mixedDietaryWrapper.classList.add("d-none");
                mixedDietaryWrapper.style.setProperty('display', 'none', 'important');
                mixedDietaryNotes.required = false;
                mixedDietaryNotes.value = "";
            }
        });
    }

    if (!scopeSelect) return;

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
});

window.addEventListener("load",()=>{

setTimeout(()=>{

document.getElementById("loader")
.style.display="none";

},1200);

});

ScrollReveal().reveal(
'.section-title,.about-section,.gallery-section,.schools-bar',
{
    distance:'60px',
    duration:1200,
    origin:'bottom',
    interval:200
});

// ==========================================================================
// SCROLL LOCK ON LIFECYCLE LOAD
// ==========================================================================
// Lock scrolling immediately when the page starts initializing
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";

window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("loader");
        if (loader) loader.style.display = "none";
        
        // Restore scrolling once the page is fully ready and loader is hidden
        document.documentElement.style.overflow = "auto";
        document.body.style.overflow = "auto";
    }, 1200);
});

// ==========================================================================
// 4. GLOBAL LIFECYCLE APP EVENTS (Loader & ScrollReveal Hooks)
// ==========================================================================
// Force hide scrollbars immediately when script initializes
document.documentElement.classList.add('lock-scrolling');
document.body.classList.add('lock-scrolling');
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";

// SAFARI SAFETY VALVE: Force page open after 3.5 seconds max if window.load hangs
const forceUnlockTimeout = setTimeout(() => {
    cleanUpAndDestroyLoader("Safety Timeout Triggered");
}, 3500);

function cleanUpAndDestroyLoader(reason) {
    console.log("Loader Dismissed via:", reason);
    
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "none";
    }
    
    // Completely strip away all strict scrolling locks cleanly
    document.documentElement.classList.remove('lock-scrolling');
    document.body.classList.remove('lock-scrolling');
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";
}

window.addEventListener("load", () => {
    // Clear the backup timer since the website loaded naturally
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
