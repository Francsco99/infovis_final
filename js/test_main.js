document.addEventListener('DOMContentLoaded', function () {
    const toolbar = document.querySelector('.toolbar');
    const selectTool = document.getElementById('select');
    const addNodeIcon = document.getElementById('add-node');
    const colors = ['red', 'blue', 'green', 'yellow', 'purple'];

    // Creazione della toolbar dei colori
    const colorPickerToolbar = document.createElement('div');
    colorPickerToolbar.classList.add('color-picker-toolbar');
    colorPickerToolbar.style.position = 'absolute';
    colorPickerToolbar.style.top = `${toolbar.offsetTop + toolbar.offsetHeight + 10}px`; // Posiziona sotto la toolbar
    colorPickerToolbar.style.left = '50%'; // Posiziona al centro
    colorPickerToolbar.style.transform = 'translateX(-50%)'; // Centra rispetto al container
    colorPickerToolbar.style.display = 'none'; // Inizialmente non visibile
    toolbar.parentNode.insertBefore(colorPickerToolbar, toolbar.nextSibling); // Inserisce dopo la toolbar

    // Array per tenere traccia dei nodi
    let nodes = [];

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
            // Aggiungi un nodo dello stesso colore al centro del canvas SVG
            addNodeToCanvas(color);
            // Rimani visibile finché non si seleziona un altro tool
            // colorPickerToolbar.style.display = 'none';
        });
    });

    // Funzione per aggiungere un nodo dello stesso colore al centro del canvas SVG
    function addNodeToCanvas(color) {
        // Ottieni l'elemento SVG
        var svg = document.getElementById('graph-canvas');

        // Dimensioni del contenitore SVG
        var width = svg.clientWidth;
        var height = svg.clientHeight;

        // Crea un nodo
        var nodeId = 'node-' + (nodes.length + 1); // Genera un ID univoco per il nodo
        var node = {
            id: nodeId,
            type: color,
            x: width / 2,
            y: height / 2
        };
        nodes.push(node);

        // Crea un cerchio per il nodo
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('id', nodeId); // Imposta l'ID dell'elemento SVG come ID del nodo
        circle.setAttribute('cx', node.x); // Posizione x al centro
        circle.setAttribute('cy', node.y); // Posizione y al centro
        circle.setAttribute('r', 50); // Raggio del cerchio
        circle.setAttribute('fill', color); // Colore selezionato
        circle.classList.add('node'); // Aggiungi la classe 'node' al cerchio

        // Aggiungi il cerchio all'SVG
        svg.appendChild(circle);

        // Aggiungi il comportamento di drag solo se il tool "select" è attivo
        if (selectTool.classList.contains('active')) {
            makeDraggable(circle);
        }
    }

    // Funzione per rendere un elemento SVG trascinabile con D3.js
    function makeDraggable(element) {
        d3.select(element)
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded)
            );
    }

    // Funzioni per gestire l'evento drag
    function dragStarted(event) {
        d3.select(this).raise().classed('active', true);
    }

    function dragged(event) {
        d3.select(this)
            .attr('cx', event.x)
            .attr('cy', event.y);
    }

    function dragEnded(event) {
        d3.select(this).classed('active', false);
    }

    // Listener per il tool "select"
    selectTool.addEventListener('click', function () {
        // Attiva o disattiva il comportamento di drag per tutti i nodi
        const isActive = this.classList.toggle('active');
        if (isActive) {
            nodes.forEach(node => {
                makeDraggable(document.getElementById(node.id));
            });
        } else {
            nodes.forEach(node => {
                d3.select('#' + node.id).on('.drag', null);
            });
        }
    });

    // Listener per il tool "add-node"
    addNodeIcon.addEventListener('click', function (event) {
        event.stopPropagation();
        colorPickerToolbar.style.display = 'flex'; // Mostra il selettore dei colori
    });

    // Gestisci la chiusura della toolbar dei colori quando si clicca su altre icone della toolbar principale
    const toolbarIcons = document.querySelectorAll('.toolbar-icon');
    toolbarIcons.forEach(icon => {
        if (icon !== addNodeIcon) {
            icon.addEventListener('click', function () {
                colorPickerToolbar.style.display = 'none'; // Nascondi il selettore dei colori
            });
        }
    });

});
