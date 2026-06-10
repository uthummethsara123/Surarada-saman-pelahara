const modal = document.getElementById('photoModal');
const modalImg = document.getElementById('modalImage');

const modalTitle = document.getElementById('modalTitle');
const modalPhotographer = document.getElementById('modalPhotographer');
const modalSchool = document.getElementById('modalSchool');
const modalYear = document.getElementById('modalYear');

document.querySelectorAll('.photo-card img, .winner-card img')
.forEach(img => {

    img.addEventListener('click', () => {

        modal.classList.add('active');

        modalImg.src = img.src;

        modalTitle.textContent =
            img.dataset.title || '';

        modalPhotographer.textContent =
            img.dataset.photographer || '';

        modalSchool.textContent =
            img.dataset.school || '';

        modalYear.textContent =
            "Surarada Saman Pelahara " +
            (img.dataset.year || '');

    });

});

document.querySelector('.close-modal')
.addEventListener('click', () => {

    modal.classList.remove('active');

});

modal.addEventListener('click', (e) => {

    if(e.target === modal){

        modal.classList.remove('active');

    }

});


const categoryButtons =
document.querySelectorAll('.category-btn');

const colourGallery =
document.getElementById('colour-gallery');

const monoGallery =
document.getElementById('mono-gallery');

categoryButtons.forEach(button => {

    button.addEventListener('click', () => {

        categoryButtons.forEach(btn =>
            btn.classList.remove('active')
        );

        button.classList.add('active');

        const category =
        button.dataset.category;

        if(category === 'colour'){

            colourGallery.classList.add(
                'active-gallery'
            );

            monoGallery.classList.remove(
                'active-gallery'
            );

        }

        else{

            monoGallery.classList.add(
                'active-gallery'
            );

            colourGallery.classList.remove(
                'active-gallery'
            );

        }

    });

});



