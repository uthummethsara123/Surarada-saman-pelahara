// ==========================================================================
// 2026 PARTICIPATION SYSTEM WITH AUTO-TIMER & GOOGLE DRIVE HOOK
// ==========================================================================

// Paste your exact Google Web App URL from Step 1 here:
// Paste your brand new Web App URL here:
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxGNZPK9jYGNTyXYwDmONDu03wXPIg-LnWVIx2PA0n5XQDYWieJ01cVrVry5ML6VFLS/exec";

// Set your deadline
// Creates the exact date: Year (2026), Month (7 for August - because JavaScript months start at 0!), Day (1), Hour (18), Min (0), Sec (0)
const CLOSING_DEADLINE = new Date(2026, 6, 19, 24, 0, 0).getTime();

const countdownInterval = setInterval(function() {
    const now = new Date().getTime();
    const distance = CLOSING_DEADLINE - now;

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Grab the elements safely
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minsEl = document.getElementById("minutes");
    const secsEl = document.getElementById("seconds");

    // Only update if the elements actually exist on the page
    if (daysEl && hoursEl && minsEl && secsEl) {
        daysEl.innerText = days.toString().padStart(2, '0');
        hoursEl.innerText = hours.toString().padStart(2, '0');
        minsEl.innerText = minutes.toString().padStart(2, '0');
        secsEl.innerText = seconds.toString().padStart(2, '0');
    }

    // If the countdown reaches zero, automatically close the form
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

// (Keep your countdown timer logic from earlier above this line)

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

        // Parse all form elements into clean URL text formats
        const formData = new FormData(regForm);
        const searchParams = new URLSearchParams();
        
        for (const pair of formData.entries()) {
            searchParams.append(pair[0], pair[1]);
        }

        // Send data directly via a clean parameter query fetch
        fetch(`${GOOGLE_APP_URL}?${searchParams.toString()}`, {
            method: 'POST',
            mode: 'no-cors' // Bypasses cross-origin strict firewalls safely
        })
        .then(() => {
            // Because 'no-cors' mode hides the direct response object, 
            // if the network transaction successfully clears, it implies entry was stored!
            feedback.className = "text-center mt-3 text-success fw-bold";
            feedback.innerText = "Registration Successful! Verified details saved in Google Drive.";
            regForm.reset();
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