document.addEventListener('DOMContentLoaded', function () {
    const svg = d3.select('#graph-canvas');

    // Seleziona l'elemento 'g' dentro cui saranno posizionati gli elementi del grafico
    const canvasGroup = svg.append('g')
        .attr('id', 'canvas-group');

    // Definizione del comportamento di zoom
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])  // Limiti di zoom
        .on('zoom', zoomed);     // Chiamata la funzione zoomed() quando avviene l'evento di zoom

    // Applica il comportamento di zoom all'elemento SVG
    svg.call(zoom);

    // Gestione del comportamento di zoom con la rotella del mouse
    svg.on('wheel', function(event) {
        event.preventDefault();  // Impedisce il comportamento di default dello scroll
        const deltaY = event.deltaY;
        const zoomScale = deltaY > 0 ? 1.2 : 0.8;  // Zoom in o out in base alla direzione dello scroll
        svg.transition().duration(250).call(zoom.scaleBy, zoomScale);
    });

    // Gestione del comportamento di zoom con i pulsanti di zoom
    d3.select('#zoom-in').on('click', function() {
        const newScale = zoom.scaleBy(svg.transition().duration(250), 1.2);
        console.log("Zoom in");
    });

    d3.select('#zoom-out').on('click', function() {
        const newScale = zoom.scaleBy(svg.transition().duration(250), 0.8);
        console.log("Zoom out");
    });

    // Funzione chiamata durante l'evento di zoom
    function zoomed(event) {
        canvasGroup.attr('transform', event.transform);
    }
});
