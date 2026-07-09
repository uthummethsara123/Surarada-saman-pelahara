// ==========================================================================
// 1. LIGHTBOX PREVIEW MODAL LOGIC ENGINE (Modal 1)
// ==========================================================================
const modal = document.getElementById('photoModal');
const modalImg = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalPhotographer = document.getElementById('modalPhotographer');
const modalSchool = document.getElementById('modalSchool');
const modalYear = document.getElementById('modalYear');

document.querySelectorAll('.photo-card img, .winner-card img').forEach(img => {
    img.addEventListener('click', () => {
        if (!modal) return;
        modal.classList.add('active');
        
        // Lock background scroll on activation
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');

        modalImg.src = img.src;
        if (modalTitle) modalTitle.textContent = img.dataset.title || '';
        if (modalPhotographer) modalPhotographer.textContent = img.dataset.photographer || '';
        if (modalSchool) modalSchool.textContent = img.dataset.school || '';
        if (modalYear) modalYear.textContent = "Surarada Saman Pelahara " + (img.dataset.year || '');
    });
});

function closeModal1() {
    if (modal) {
        modal.classList.remove('active');
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
    }
}

// Find the precise exit button tied inside Modal 1
const closeBtn1 = modal ? modal.querySelector('.close-modal') : null;
if (closeBtn1) {
    closeBtn1.addEventListener('click', closeModal1);
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-content-wrapper')) {
            closeModal1();
        }
    });
}

// ==========================================================================
// 2. YEAR SWITCHING MANAGEMENT LAYER (Global Sync Matrix Layout)
// ==========================================================================
const allYearButtons = document.querySelectorAll('[data-year-select]');
const wrapper2025 = document.getElementById('wrapper-year-2025');
const wrapper2026 = document.getElementById('wrapper-year-2026');
const subCompTier = document.getElementById('sub-competition-tier');
const storytellingTab = document.getElementById('storytelling-tab-btn');

const judgesPanel2025 = document.getElementById('judges-panel-2025');
const judgesPanel2026 = document.getElementById('judges-panel-2026');

allYearButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const targetYear = this.dataset.yearSelect;
        syncGlobalYearFilter(targetYear);
    });
});

// ==========================================================================
// 3. CATEGORY & TAB SWITCHING HANDLERS
// ==========================================================================
const categoryButtons = document.querySelectorAll('.category-btn:not([data-comp-tier])');
const colourGallery = document.getElementById('colour-gallery');
const monoGallery = document.getElementById('mono-gallery');

const colourGallery2026 = document.getElementById('colour-gallery-2026');
const monoGallery2026 = document.getElementById('mono-gallery-2026');
const storyGallery2026 = document.getElementById('storytelling-gallery-2026');

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const category = button.dataset.category;
        const currentActiveYearBtn = document.querySelector('[data-year-select].active');
        const currentActiveYear = currentActiveYearBtn ? currentActiveYearBtn.dataset.yearSelect : '2025';

        if (currentActiveYear === '2025') {
            if (category === 'colour') {
                if (colourGallery) colourGallery.classList.add('active-gallery');
                if (monoGallery) monoGallery.classList.remove('active-gallery');
            } else {
                if (monoGallery) monoGallery.classList.add('active-gallery');
                if (colourGallery) colourGallery.classList.remove('active-gallery');
            }
        } 
        else if (currentActiveYear === '2026') {
            [colourGallery2026, monoGallery2026, storyGallery2026].forEach(g => {
                if (g) g.classList.remove('active-gallery');
            });

            if (category === 'colour' && colourGallery2026) {
                colourGallery2026.classList.add('active-gallery');
            } else if (category === 'mono' && monoGallery2026) {
                monoGallery2026.classList.add('active-gallery');
            } else if (category === 'storytelling' && storyGallery2026) {
                storyGallery2026.classList.add('active-gallery');
            }
        }
    });
});

const compTierButtons = document.querySelectorAll('[data-comp-tier]');
compTierButtons.forEach(tBtn => {
    tBtn.addEventListener('click', () => {
        compTierButtons.forEach(b => b.classList.remove('active'));
        tBtn.classList.add('active');
    });
});

// ==========================================================================
// 4. GLOBAL LIFECYCLE APP EVENTS (Loader Window Locks)
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
    if (loader) {
        loader.style.display = "none";
    }
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

// ==========================================================================
// 5. EVENT-DRIVEN VIDEO SLIDESHOW DESIGN (Play Hooks)
// ==========================================================================
let currentVideoIndex = 0;
let isSectionVisible = false;
let isMutedGlobal = true; 
let userHasInteracted = false;

document.addEventListener('click', () => {
    userHasInteracted = true;
}, { once: true });

const slideshowSection = document.getElementById('video-exhibition-section');
const allVideos = document.querySelectorAll('.video-slide video');
const audioToggleBtn = document.getElementById('video-audio-toggle');
const prevBtn = document.getElementById('slider-prev-btn');
const nextBtn = document.getElementById('slider-next-btn');

allVideos.forEach((vid) => {
    vid.muted = true;
    vid.addEventListener('ended', () => {
        if (isSectionVisible) {
            changeVideoSlide(1);
        }
    });
});

function changeVideoSlide(direction) {
    const slides = document.querySelectorAll('.video-slide');
    if (slides.length === 0) return;

    const currentVideo = slides[currentVideoIndex].querySelector('video');
    if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
    }

    slides[currentVideoIndex].classList.remove('active-slide');
    currentVideoIndex += direction;

    if (currentVideoIndex >= slides.length) {
        currentVideoIndex = 0;
    } else if (currentVideoIndex < 0) {
        currentVideoIndex = slides.length - 1;
    }

    const nextSlide = slides[currentVideoIndex];
    nextSlide.classList.add('active-slide');

    const nextVideo = nextSlide.querySelector('video');
    if (nextVideo) {
        nextVideo.muted = isMutedGlobal;
        if (isSectionVisible) {
            nextVideo.play().catch(err => console.log("Playback state sync:", err));
        }
    }
}

if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        isMutedGlobal = !isMutedGlobal;

        allVideos.forEach(vid => {
            vid.muted = isMutedGlobal;
        });

        if (isMutedGlobal) {
            this.innerHTML = '<span class="audio-icon">🔊</span> Unmute';
        } else {
            this.innerHTML = '<span class="audio-icon">🔇</span> Mute';
            const activeSlide = document.querySelectorAll('.video-slide')[currentVideoIndex];
            const activeVideo = activeSlide ? activeSlide.querySelector('video') : null;
            if (activeVideo && isSectionVisible) {
                activeVideo.play().catch(() => {});
            }
        }
    });
}

if (prevBtn) prevBtn.addEventListener('click', () => changeVideoSlide(-1));
if (nextBtn) nextBtn.addEventListener('click', () => changeVideoSlide(1));

if (slideshowSection && 'IntersectionObserver' in window) {
    const observerOptions = { root: null, threshold: 0.3 };
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const activeSlide = document.querySelectorAll('.video-slide')[currentVideoIndex];
            const activeVideo = activeSlide ? activeSlide.querySelector('video') : null;
            const activeYearBtn = document.querySelector('[data-video-year].active') || document.querySelector('[data-year-select].active');
            const currentYearState = activeYearBtn ? (activeYearBtn.getAttribute('data-video-year') || activeYearBtn.getAttribute('data-year-select')) : '2025';

            if (entry.isIntersecting) {
                isSectionVisible = true;
                if (currentYearState === "2026") {
                    if (activeVideo) activeVideo.pause();
                    return; 
                }
                if (activeVideo) {
                    activeVideo.muted = isMutedGlobal;
                    activeVideo.play().catch(err => {
                        console.log("Autoplay context managed:", err);
                        activeVideo.muted = true;
                        activeVideo.play().catch(() => {});
                    });
                }
            } else {
                isSectionVisible = false;
                if (activeVideo) activeVideo.pause();
            }
        });
    }, observerOptions);

    videoObserver.observe(slideshowSection);
}

// ==========================================================================
// 6. GLOBAL CENTRALIZED CROSS-SECTION SYNC ENGINE 
// ==========================================================================
function syncGlobalYearFilter(targetYear) {
    console.log("Global Filter Synced. Current Target:", targetYear);

    document.querySelectorAll('[data-video-year]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-video-year') === targetYear);
    });
    document.querySelectorAll('[data-year-select]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-year-select') === targetYear);
    });
    document.querySelectorAll('[data-judge-year]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-judge-year') === targetYear);
    });

    const albumMainContent = document.getElementById('album-main-content');
    const albumEmptyView = document.getElementById('album-empty-view');

    if (targetYear === '2025') {
        if (wrapper2025) wrapper2025.classList.remove('d-none');
        if (wrapper2026) wrapper2026.classList.add('d-none');
        if (subCompTier) subCompTier.classList.add('d-none');
        if (storytellingTab) storytellingTab.classList.add('d-none');

        if (albumMainContent) albumMainContent.classList.remove('d-none');
        if (albumEmptyView) albumEmptyView.classList.add('d-none');

        if (storytellingTab && storytellingTab.classList.contains('active')) {
            const colourTabBtn = document.querySelector('[data-category="colour"]');
            if (colourTabBtn) colourTabBtn.click();
        }
        if (judgesPanel2025) judgesPanel2025.classList.remove('d-none');
        if (judgesPanel2026) judgesPanel2026.classList.add('d-none');
    } 
    else if (targetYear === '2026') {
        if (wrapper2025) wrapper2025.classList.add('d-none');
        if (wrapper2026) wrapper2026.classList.remove('d-none');
        if (subCompTier) subCompTier.classList.remove('d-none');
        if (storytellingTab) storytellingTab.classList.remove('d-none');
        if (judgesPanel2025) judgesPanel2025.classList.add('d-none');
        if (judgesPanel2026) judgesPanel2026.classList.remove('d-none');

        if (albumMainContent) albumMainContent.classList.add('d-none');
        if (albumEmptyView) albumEmptyView.classList.remove('d-none');
    }

    const mainSliderWrapper = document.getElementById('main-video-slider-wrapper');
    const emptyStateView = document.getElementById('video-empty-view');
    const allSlides = document.querySelectorAll('.video-slide');
    const activeSlideVideo = allSlides[currentVideoIndex]?.querySelector('video');

    if (targetYear === "2026") {
        allVideos.forEach(vid => {
            vid.pause();
            vid.currentTime = 0;
            vid.muted = true;
        });
        allSlides.forEach(slide => slide.classList.remove('active-slide'));
        if (mainSliderWrapper) mainSliderWrapper.style.display = 'none';
        if (emptyStateView) emptyStateView.classList.remove('d-none');
    } else {
        if (emptyStateView) emptyStateView.classList.add('d-none');
        if (mainSliderWrapper) mainSliderWrapper.style.display = 'block';
        
        allSlides.forEach(slide => slide.classList.remove('active-slide'));
        if (allSlides[currentVideoIndex]) {
            allSlides[currentVideoIndex].classList.add('active-slide');
        }
        
        if (activeSlideVideo && slideshowSection) {
            const rect = slideshowSection.getBoundingClientRect();
            const isInView = (rect.top < window.innerHeight && rect.bottom >= 0);
            if (isInView) {
                isSectionVisible = true;
                activeSlideVideo.muted = isMutedGlobal;
                activeSlideVideo.play().catch(err => console.log("State switch play resume managed:", err));
            }
        }
    }
}

document.querySelectorAll('[data-video-year]').forEach(btn => {
    btn.addEventListener('click', function() {
        syncGlobalYearFilter(this.getAttribute('data-video-year'));
    });
});

// ==========================================================================
// 7. SAMAN DEWALAYA MARQUEE ALBUM LOADER ENGINE (Modal 2)
// ==========================================================================
document.addEventListener("DOMContentLoaded", function() {
    const track1 = document.getElementById('albumGrid');
    const track2 = document.getElementById('albumGrid2');
    const modal2 = document.getElementById('photoModal2');
    const modalImg2 = document.getElementById('modalImage2');
    const closeModalBtn2 = document.getElementById('closeModalBtn2');
    
    const totalImages = 67;

    function createImageNode(index) {
        const gridItem = document.createElement('div');
        gridItem.className = 'gallery-item';
        
        const imageEl = document.createElement('img');
        imageEl.src = `assets/img/2025/Album/${index}.jpg`;
        imageEl.alt = `Saman Dewalaya Perahera Snapshot ${index}`;
        imageEl.loading = 'lazy';

        gridItem.addEventListener('click', function(e) {
            e.preventDefault();
            if (modal2 && modalImg2) {
                modalImg2.src = imageEl.src;
                modal2.classList.add('active'); 
                
                document.documentElement.classList.add('modal-open2');
                document.body.classList.add('modal-open2');
            }
        });

        gridItem.appendChild(imageEl);
        return gridItem;
    }

    // Safely appends only if elements are found on the active page (index.html)
    if (track1) {
        for (let i = 1; i <= totalImages; i++) track1.appendChild(createImageNode(i));
        for (let i = 1; i <= totalImages; i++) track1.appendChild(createImageNode(i));
    }

    if (track2) {
        for (let i = totalImages; i >= 1; i--) track2.appendChild(createImageNode(i));
        for (let i = totalImages; i >= 1; i--) track2.appendChild(createImageNode(i));
    }

    function closeModal2() {
        if (modal2) {
            modal2.classList.remove('active');
            document.documentElement.classList.remove('modal-open2');
            document.body.classList.remove('modal-open2');
        }
    }

    if (modal2) {
        if (closeModalBtn2) closeModalBtn2.addEventListener('click', closeModal2);
        modal2.addEventListener('click', function(e) {
            if (e.target === modal2 || e.target.classList.contains('modal-content-wrapper')) {
                closeModal2();
            }
        });
    }
});

// ==========================================================================
// 7. REAL-TIME TIME-BASED SCHEDULER ENGINE (LIVE REFRESHLESS UPDATES)
// ==========================================================================
function updatePortalStatesLive() {
    const now = new Date().getTime();

    // Centralized Date Tracking Matrix (Months are 0-indexed: 6 = July)
    const REGISTRATION_DEADLINE = new Date(2026, 6, 24, 24, 0, 0).getTime(); // July 24th Midnight (24:00)
    const UPLOAD_START_TIME     = new Date(2026, 6, 26, 14, 0, 0).getTime();  // July 26th (14:00)
    const UPLOAD_GRAY_TIME      = new Date(2026, 6, 27, 2, 0, 0).getTime();  // July 27th 2:00 AM

    // --- Part A: Handle Live Registration Button States ---
    if (now > REGISTRATION_DEADLINE) {
        const regButtons = document.querySelectorAll('.nav-cta-btn, .hero-cta-btn');
        regButtons.forEach(btn => {
            if (btn.textContent !== "Registration Closed") {
                btn.textContent = "Registration Closed";
            }
            if (!btn.classList.contains('cta-btn-closed')) {
                btn.classList.add('cta-btn-closed');
                btn.classList.remove('btn-warning'); // Removes conflicting Bootstrap yellow background
            }
        });
    }

    // --- Part B: Handle Live Photo Upload Portal States ---
    const navUploadItem  = document.getElementById('nav-upload-item');
    const heroUploadItem = document.getElementById('hero-upload-item');
    const navUploadBtn   = document.getElementById('nav-upload-btn');
    const heroUploadBtn  = document.getElementById('hero-upload-btn');

    if (now >= UPLOAD_START_TIME) {
        // Dynamically shows elements instantly when time is reached
        if (navUploadItem && navUploadItem.style.display === 'none') {
            navUploadItem.style.setProperty('display', 'block', 'important');
        }
        if (heroUploadItem && heroUploadItem.style.display === 'none') {
            heroUploadItem.style.setProperty('display', 'block', 'important');
        }

        // Grays out buttons instantly when 2:00 AM hits
        if (now >= UPLOAD_GRAY_TIME) {
            if (navUploadBtn && !navUploadBtn.classList.contains('upload-btn-grayed')) {
                navUploadBtn.classList.add('upload-btn-grayed');
            }
            if (heroUploadBtn && !heroUploadBtn.classList.contains('upload-btn-grayed')) {
                heroUploadBtn.classList.add('upload-btn-grayed');
            }
        }
    } else {
        // Ensures items stay hidden if a user manually changes things ahead of schedule
        if (navUploadItem && navUploadItem.style.display !== 'none') {
            navUploadItem.style.setProperty('display', 'none', 'important');
        }
        if (heroUploadItem && heroUploadItem.style.display !== 'none') {
            heroUploadItem.style.setProperty('display', 'none', 'important');
        }
    }
}

// Initialize the real-time loop engine
document.addEventListener("DOMContentLoaded", () => {
    updatePortalStatesLive(); // Run immediately on page mount
    setInterval(updatePortalStatesLive, 1000); // Check and apply updates every 1 second continuously
});
