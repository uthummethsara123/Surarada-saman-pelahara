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
// 2. YEAR SWITCHING MANAGEMENT LAYER (Cross-Synchronized Selectors)
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

        // FORCE SYNCHRONIZATION: Instantly update ALL year buttons across both sections
        allYearButtons.forEach(yBtn => {
            if (yBtn.dataset.yearSelect === targetYear) {
                yBtn.classList.add('active');
            } else {
                yBtn.classList.remove('active');
            }
        });

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
            // Standard execution track for pristine 2025 compatibility 
            if (category === 'colour') {
                colourGallery.classList.add('active-gallery');
                monoGallery.classList.remove('active-gallery');
            } else {
                monoGallery.classList.add('active-gallery');
                colourGallery.classList.remove('active-gallery');
            }
        } 
        else if (currentActiveYear === '2026') {
            // Execution flow mapping for 2026 categories
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

// 2026 Inter-School / Inner-School Tab Modifier Track Engine
const compTierButtons = document.querySelectorAll('[data-comp-tier]');
compTierButtons.forEach(tBtn => {
    tBtn.addEventListener('click', () => {
        compTierButtons.forEach(b => b.classList.remove('active'));
        tBtn.classList.add('active');
        
        // This structural slot remains ready to filter 2026 images asynchronously 
        // once those assets are declared in future deployment stages.
    });
});

// ==========================================================================
// 4. GLOBAL LIFECYCLE APP EVENTS (Loader & ScrollReveal Hooks)
// ==========================================================================
window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("loader");
        if(loader) loader.style.display = "none";
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
