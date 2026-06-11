const SUBMISSION_API_URL = "https://script.google.com/macros/s/AKfycbzTFVn_7u_oGEeijewaNR0t8a5vARJkiuBWpOuMJVcowQdkDdaWGofaar8BRuG88VGGtQ/exec";

// 1. FILE PICKER & AUTO-RENAME DISPLAY
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
                wrapper.classList.remove('d-none'); // Reveal preview platform
                
                // Strips out extension string (e.g., changes "sunset.jpg" to "sunset")
                const cleanNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                titleField.value = cleanNameWithoutExtension; 
                
                // Hide the main browser file picker input visually so it looks replaced
                input.classList.add('d-none');
            }
            reader.readAsDataURL(file);
        }
    });
});

// 2. FILE REMOVAL LOGIC
document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const targetInputName = this.getAttribute('data-target');
        const fileInput = document.querySelector(`input[name="${targetInputName}"]`);
        const wrapper = document.getElementById("wrapper_" + targetInputName);
        const previewImg = document.getElementById("prev_" + targetInputName);
        const titleField = document.getElementById("title_" + targetInputName);
        
        // Fully clear configuration states
        fileInput.value = ""; 
        fileInput.classList.remove('d-none'); // Reshow file picker input
        previewImg.src = "";
        titleField.value = "";
        wrapper.classList.add('d-none');
    });
});

// 3. FORM COMPILING PACKAGER
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('uploadSubmitBtn');
    const feedback = document.getElementById('uploadFeedback');
    const participantName = document.getElementById('participantName').value.trim();
    const schoolName = document.getElementById('schoolName').value.trim(); 
    const competitionScope = document.getElementById('competitionScope').value; // Captured Scope

    submitBtn.disabled = true;
    submitBtn.innerText = "Encoding & Uploading images... Please wait...";
    feedback.className = "text-center mt-3 text-warning";
    feedback.innerText = "Processing submission data structures...";
    feedback.classList.remove('d-none');

    const payload = {
        participantName: participantName,
        schoolName: schoolName,
        competitionScope: competitionScope, // Injected into top level payload object
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
                
                // Pull name directly out of the editable text field
                const customTitleInput = document.getElementById("title_" + input.name);
                let finalizedTitle = customTitleInput && customTitleInput.value.trim() ? customTitleInput.value.trim() : "untitled";
                
                // Sanitize file path string symbols cleanly
                finalizedTitle = finalizedTitle.replace(/[^a-zA-Z0-9_\-\s]/g, "");
                
                // Keep raw string format ready for spreadsheet tracking rows
                const cleanRawTitleForSheet = finalizedTitle;
                
                // Safely re-attach original system extension back onto custom name string for Drive
                const extension = file.name.substring(file.name.lastIndexOf('.')) || ".jpg";
                finalizedTitle += extension;

                payload.files.push({
                    category: input.name.split('_')[0],
                    rawTitle: cleanRawTitleForSheet.replace(/\s+/g, "_"), 
                    filename: `${safeName}_${input.name}_${finalizedTitle.replace(/\s+/g, "_")}`, // Scope label omitted from Drive titles
                    mimeType: file.type,
                    bytes: base64Str
                });
            }
        }

        feedback.innerText = "Transmitting submission portfolio to Google Drive storage blocks...";

        await fetch(SUBMISSION_API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify(payload)
        });
        
        feedback.className = "text-center mt-3 text-success fw-bold";
        feedback.innerText = "Submission successfully registered! Your customized entries are saved.";
        
        // Reset full layout ecosystem
        document.getElementById('uploadForm').reset();
        document.querySelectorAll('.preview-control-box').forEach(box => box.classList.add('d-none'));
        document.querySelectorAll('.preview-trigger').forEach(input => input.classList.remove('d-none'));
        submitBtn.disabled = false;
        submitBtn.innerText = "Upload & Submit Portfolio";

    } catch (err) {
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.innerText = "Upload & Submit Portfolio";
        feedback.className = "text-center mt-3 text-danger fw-bold";
        feedback.innerText = "Network transmission failed. Please try again.";
    }
});


// ==========================================================
// MARATHON TIMELINE ENGINE (STRICT STATUS GATE FIX)
// ==========================================================
// Set your exact event opening time (Format: YYYY-MM-DDTHH:MM:SS)
const START_DATE = new Date("2026-07-26T24:00:00").getTime(); // Example: Next Month

// Set your exact event closing time (Format: YYYY-MM-DDTHH:MM:SS)
const DEADLINE_DATE = new Date("2026-07-27T02:00:00").getTime();

const runTimelineEngine = () => {
    const now = new Date().getTime();
    
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    const uploadForm = document.getElementById("uploadForm");
    const feedback = document.getElementById("uploadFeedback");
    const countdownContainer = document.querySelector(".countdown-container");
    const timerTitle = document.querySelector(".timer-title");

    // 1. CHOOSE EXPIRATION TIMELINE PARAMETER DIRECTLY FIRST
    if (now >= DEADLINE_DATE) {
        clearInterval(window.timelineInterval);
        
        if (hoursEl) hoursEl.innerText = "00";
        if (minutesEl) minutesEl.innerText = "00";
        if (secondsEl) secondsEl.innerText = "00";
        
        if (uploadForm) {
            uploadForm.innerHTML = ""; 
            uploadForm.classList.add('d-none');
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

    // 2. CHECK INTERFACE STATUS FOR LIVE/PENDING WINDOWS
    if (!hoursEl || !minutesEl || !secondsEl) return;

    // 3. GATE 1: PORTAL NOT OPEN YET (Check this explicitly before assuming it's live!)
    if (now < START_DATE) {
        if (uploadForm) uploadForm.classList.add('d-none'); // Keeps form completely hidden
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
    }
    // 4. GATE 2: MARATHON IS ACTIVE (Only runs if now >= START_DATE and now < DEADLINE_DATE)
    else {
        if (uploadForm) uploadForm.classList.remove('d-none'); // Shows form cleanly
        if (countdownContainer) countdownContainer.classList.remove('d-none');
        if (feedback) feedback.classList.add('d-none'); 

        if (timerTitle) {
            timerTitle.innerText = "Marathon Submission Deadline";
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
