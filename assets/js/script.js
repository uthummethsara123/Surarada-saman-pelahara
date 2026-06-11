// ==========================================================================
// 1. LIGHTBOX PREVIEW MODAL LOGIC ENGINE
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
        modalImg.src = img.src;
        modalTitle.textContent = img.dataset.title || '';
        modalPhotographer.textContent = img.dataset.photographer || '';
        modalSchool.textContent = img.dataset.school || '';
        modalYear.textContent = "Surarada Saman Pelahara " + (img.dataset.year || '');
    });
});

if (document.querySelector('.close-modal')) {
    document.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if(e.target === modal){
            modal.classList.remove('active');
        }
    });
}

// ==========================================================================
// 2. YEAR SWITCHING MANAGEMENT LAYER (Fully Restructured for Global Sync)
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
        
        // Hand execution over to our centralized global syncing matrix
        syncGlobalYearFilter(targetYear);
    });
});

// ==========================================================================
// 3. CATEGORY & TAB SWITCHING HANDLERS
// ==========================================================================
const categoryButtons = document.querySelectorAll('.category-btn:not([data-comp-tier])');
const colourGallery = document.getElementById('colour-gallery');
const monoGallery = document.getElementById('mono-gallery');

// 2026 Sub-elements references
const colourGallery2026 = document.getElementById('colour-gallery-2026');
const monoGallery2026 = document.getElementById('mono-gallery-2026');
const storyGallery2026 = document.getElementById('storytelling-gallery-2026');

categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const category = button.dataset.category;
        const currentActiveYear = document.querySelector('[data-year-select].active').dataset.yearSelect;

        if (currentActiveYear === '2025') {
            if (category === 'colour') {
                colourGallery.classList.add('active-gallery');
                monoGallery.classList.remove('active-gallery');
            } else {
                monoGallery.classList.add('active-gallery');
                colourGallery.classList.remove('active-gallery');
            }
        } 
        else if (currentActiveYear === '2026') {
            [colourGallery2026, monoGallery2026, storyGallery2026].forEach(g => {
                if(g) g.classList.remove('active-gallery');
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
// 4. GLOBAL LIFECYCLE APP EVENTS (Loader & ScrollReveal Hooks)
// ==========================================================================
// FIXED: Strictly lock both html and body elements immediately
document.documentElement.classList.add('lock-scrolling');
document.body.classList.add('lock-scrolling');

window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("loader");
        if(loader) loader.style.display = "none";
        
        // FIXED: Drop the strict lock layouts cleanly to let the page scroll
        document.documentElement.classList.remove('lock-scrolling');
        document.body.classList.remove('lock-scrolling');
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

// Force an unlock fallback after 4 seconds no matter what
setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader && loader.style.display !== "none") {
        loader.style.display = "none";
        document.documentElement.classList.remove('lock-scrolling');
        document.body.classList.remove('lock-scrolling');
        // Restore standard fallback properties just in case
        document.documentElement.style.overflow = "auto";
        document.body.style.overflow = "auto";
    }
}, 4000);

// ==========================================================================
// 5. EVENT-DRIVEN VIDEO SLIDESHOW DESIGN (Play to Completion Engine)
// ==========================================================================
let currentVideoIndex = 0;
let isSectionVisible = false;
let isMutedGlobal = true; 

// Initializing user interaction flags
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

// ==========================================================================
// UPDATED SCROLL ENGINE (With Year-Check Validation Guard)
// ==========================================================================
if (slideshowSection && 'IntersectionObserver' in window) {
    const observerOptions = {
        root: null,
        threshold: 0.3
    };

    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const activeSlide = document.querySelectorAll('.video-slide')[currentVideoIndex];
            const activeVideo = activeSlide ? activeSlide.querySelector('video') : null;

            const activeYearBtn = document.querySelector('[data-video-year].active') || document.querySelector('[data-year-select].active');
            const currentYearState = activeYearBtn ? (activeYearBtn.getAttribute('data-video-year') || activeYearBtn.getAttribute('data-year-select')) : '2025';

            if (entry.isIntersecting) {
                isSectionVisible = true;
                
                if (currentYearState === "2026") {
                    if (activeVideo) {
                        activeVideo.pause();
                    }
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
                if (activeVideo) {
                    activeVideo.pause();
                }
            }
        });
    }, observerOptions);

    videoObserver.observe(slideshowSection);
}

// ==========================================================================
// 6. GLOBAL CENTRALIZED CROSS-SECTION SYNC ENGINE (With Auto-Play Resume)
// ==========================================================================
function syncGlobalYearFilter(targetYear) {
    console.log("Global Filter Synced. Current Target:", targetYear);

    // 1. Sync Video Highlight Elements UI
    document.querySelectorAll('[data-video-year]').forEach(btn => {
        if (btn.getAttribute('data-video-year') === targetYear) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Sync Gallery Layout Buttons UI
    document.querySelectorAll('[data-year-select]').forEach(btn => {
        if (btn.getAttribute('data-year-select') === targetYear) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 3. Sync Judge Panel Selection Components UI 
    document.querySelectorAll('[data-judge-year]').forEach(btn => {
        if (btn.getAttribute('data-judge-year') === targetYear) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 4. Process Gallery Visibility Wrapper Assignments
    if (targetYear === '2025') {
        if (wrapper2025) wrapper2025.classList.remove('d-none');
        if (wrapper2026) wrapper2026.classList.add('d-none');
        
        if (subCompTier) subCompTier.classList.add('d-none');
        if (storytellingTab) storytellingTab.classList.add('d-none');

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
    }

    // 5. Process Dynamic Video Playback Visibility States
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
        
        allSlides.forEach(slide => {
            slide.classList.remove('active-slide');
        });
        
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

// Attach Event Listeners to Video Section Row Buttons directly
document.querySelectorAll('[data-video-year]').forEach(btn => {
    btn.addEventListener('click', function() {
        const selectedYear = this.getAttribute('data-video-year');
        syncGlobalYearFilter(selectedYear);
    });
});
