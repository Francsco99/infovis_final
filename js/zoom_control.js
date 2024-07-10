// Select the SVG element
const svg = d3.select('#graph-canvas');

// Select the group ('g') inside which the graph elements will be positioned
const canvasGroup = svg.select('#canvas-group');

// Define zoom behavior
const zoom = d3.zoom()
    .scaleExtent([0.1, 10])  // Zoom scale limits
    .on('zoom', zoomed);     // Call zoomed function when a zoom event occurs

// Apply zoom behavior to the SVG element
svg.call(zoom);

// Handle click on the zoom-in icon
d3.select('#zoom-in').on('click', function() {
    // Increase the current zoom scale
    const newScale = zoom.scaleBy(svg.transition().duration(250), 1.2);
});

// Handle click on the zoom-out icon
d3.select('#zoom-out').on('click', function() {
    // Decrease the current zoom scale
    const newScale = zoom.scaleBy(svg.transition().duration(250), 0.8);
});

// Function called during the zoom event
function zoomed(event) {
    // Apply transformation to all elements within the visible group
    canvasGroup.attr('transform', event.transform);
}
