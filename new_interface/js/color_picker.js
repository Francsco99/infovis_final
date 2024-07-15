document.addEventListener('DOMContentLoaded', function () {
    const toolbar = document.querySelector('.toolbar');
    const addNodeIcon = document.getElementById('add-node');
    const colors = ['red', 'blue', 'green', 'yellow', 'purple'];

    // Creazione della toolbar dei colori
    const colorPickerToolbar = document.createElement('div');
    colorPickerToolbar.classList.add('color-picker-toolbar');
    toolbar.appendChild(colorPickerToolbar);
    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.classList.add('color-option');
        colorOption.style.backgroundColor = color;

        // Calcola la tonalità più scura per il bordo
        const darkerColor = d3.hcl(color).darker(1).toString();
        colorOption.style.border = `5px solid ${darkerColor}`;

        colorPickerToolbar.appendChild(colorOption);

        colorOption.addEventListener('click', function () {
            console.log('Selected color:', color);
            // Aggiungi qui la logica per creare un nodo con il colore selezionato
        });
    });
    colorPickerToolbar.style.display = 'none';

    addNodeIcon.addEventListener('click', function (event) {
        event.stopPropagation();
        colorPickerToolbar.style.display = 'flex';
        const toolbarRect = toolbar.getBoundingClientRect();
        const toolbarWidth = colorPickerToolbar.offsetWidth;
        const toolbarLeft = (window.innerWidth - toolbarWidth) / 2;
        const toolbarTop = toolbarRect.bottom + 10;
        colorPickerToolbar.style.left = `${toolbarLeft}px`;
        colorPickerToolbar.style.top = `${toolbarTop}px`;
    });

    // Gestisci la chiusura della toolbar dei colori quando si clicca su altre icone della toolbar principale
    const toolbarIcons = document.querySelectorAll('.toolbar-icon');
    toolbarIcons.forEach(icon => {
        if (icon !== addNodeIcon) {
            icon.addEventListener('click', function () {
                colorPickerToolbar.style.display = 'none';
            });
        }
    });
});
