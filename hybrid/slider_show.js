document.addEventListener('DOMContentLoaded', () => {
    const sliderIcon = document.getElementById('slider-icon');
    const forceControl = document.querySelector('.force-control');
    const closeSlider = document.getElementById('close-slider');
    
    const chargeSlider = document.getElementById('charge');
    const linkSlider = document.getElementById('link');
    const attractSlider = document.getElementById('attract');
    
    const chargeValue = document.getElementById('charge-value');
    const linkValue = document.getElementById('link-value');
    const attractValue = document.getElementById('attract-value');

    sliderIcon.addEventListener('click', () => {
        if (forceControl.style.display === 'none' || forceControl.style.display === '') {
            forceControl.style.display = 'flex';
        } else {
            forceControl.style.display = 'none';
        }
    });

    closeSlider.addEventListener('click', () => {
        forceControl.style.display = 'none';
    });

    chargeSlider.addEventListener('input', () => {
        chargeValue.textContent = chargeSlider.value;
    });

    linkSlider.addEventListener('input', () => {
        linkValue.textContent = linkSlider.value;
    });

    attractSlider.addEventListener('input', () => {
        attractValue.textContent = attractSlider.value;
    });
});
