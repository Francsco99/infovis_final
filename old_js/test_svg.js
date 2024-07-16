document.addEventListener('DOMContentLoaded', function() {
    // Ottieni l'elemento SVG
    var svg = document.getElementById('graph-canvas');

    // Dimensioni del contenitore SVG
    var width = svg.clientWidth;
    var height = svg.clientHeight;

    // Array dei colori per i cerchi
    var colors = ['red', 'blue', 'green', 'yellow'];

    // Calcola le posizioni dei cerchi
    var centerX = width / 2;
    var centerY = height / 2;
    var radius = 80; // Raggio maggiore per distanziare i cerchi di più
    var circlePositions = [
        { x: centerX - radius, y: centerY - radius, color: colors[0] },
        { x: centerX + radius, y: centerY - radius, color: colors[1] },
        { x: centerX + radius, y: centerY + radius, color: colors[2] },
        { x: centerX - radius, y: centerY + radius, color: colors[3] }
    ];

    // Crea le linee che collegano i cerchi formando un quadrato
    for (var i = 0; i < circlePositions.length; i++) {
        var nextIndex = (i + 1) % circlePositions.length; // Indice del cerchio successivo nel ciclo
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', circlePositions[i].x);
        line.setAttribute('y1', circlePositions[i].y);
        line.setAttribute('x2', circlePositions[nextIndex].x);
        line.setAttribute('y2', circlePositions[nextIndex].y);
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', '5');
        line.setAttribute('stroke-linecap', 'round'); // Estremità della linea arrotondata
        svg.appendChild(line);
    }

    // Crea i cerchi
    circlePositions.forEach(position => {
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', position.x);
        circle.setAttribute('cy', position.y);
        circle.setAttribute('r', 30); // Raggio dei cerchi più piccolo
        circle.setAttribute('fill', position.color);
        svg.appendChild(circle);
    });
});
