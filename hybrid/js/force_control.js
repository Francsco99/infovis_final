document.addEventListener('DOMContentLoaded', () => {
    const sliderIcon = document.getElementById('slider-icon');
    const forceControl = document.querySelector('.force-control');
    const closeSlider = document.getElementById('close-slider');
    const canvas = document.getElementById('graph-canvas');
    
    const chargeSlider = document.getElementById('charge');
    //const linkSlider = document.getElementById('link');
    const attractSlider = document.getElementById('attract');
    
    const chargeValue = document.getElementById('charge-value');
    //const linkValue = document.getElementById('link-value');
    const attractValue = document.getElementById('attract-value');

    const simulationOffIcon = document.getElementById("force-off");
    const simulationOnIcon = document.getElementById("force-on");

    simulationOffIcon.addEventListener("click", () => {
        simulationOffIcon.style.display = "none";
        simulationOnIcon.style.display = "inline";
        sliderIcon.style.display = "inline";
    });

    simulationOnIcon.addEventListener("click", () => {
        simulationOnIcon.style.display = "none";
        simulationOffIcon.style.display = "inline";
        sliderIcon.style.display = "none";
    });

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

    attractSlider.addEventListener('input', () => {
        attractValue.textContent = attractSlider.value;
    });

    canvas.addEventListener('click', (event) => {
        // Check if the click is outside the forceControl element
        if (!forceControl.contains(event.target) && event.target !== sliderIcon) {
            forceControl.style.display = 'none';
        }
    });

    // Aggiungi il gestore per il popup delle opzioni di download JSON
    const jsonDownloadIcon = document.getElementById('json-download');
    const downloadOptionsPopup = document.getElementById('download-options-popup');
    const closeDownloadOptions = document.getElementById('close-download-options');

    jsonDownloadIcon.addEventListener('click', () => {
        const offset = jsonDownloadIcon.getBoundingClientRect();
        downloadOptionsPopup.style.top = `${offset.top + jsonDownloadIcon.offsetHeight + 10}px`;
        downloadOptionsPopup.style.left = `${offset.left}px`;
        downloadOptionsPopup.style.display = 'flex';
    });

    closeDownloadOptions.addEventListener('click', () => {
        downloadOptionsPopup.style.display = 'none';
    });

    document.addEventListener('click', (event) => {
        if (!downloadOptionsPopup.contains(event.target) && event.target !== jsonDownloadIcon) {
            downloadOptionsPopup.style.display = 'none';
        }
    });
});
