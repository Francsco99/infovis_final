// Set up the SVG canvas dimensions
const width = document.querySelector('.canvas-container').clientWidth;
const height = document.querySelector('.canvas-container').clientHeight;

// Initialize the SVG element for the graph
const svg = d3.select("#graph-canvas")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", function (event) {
        svg.attr("transform", event.transform);
    }).filter(function(event) {
        // Disable zoom on double click
        return !event.dblclick && (event.type === 'wheel' || event.type === 'mousedown');
    }))
    .append("g");

// Initialize data for nodes and links
let nodes = [];
let links = [];

// State variables
let addingLink = false;
let sourceNode = null;
let tempLine = null;
let selectedElement = null;
let currentMode = null;

// Initialize the force simulation
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-100));

// Draw links and nodes
let link = svg.append("g")
    .attr("class", "links")
    .selectAll("line");

let node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g");

// Update the graph when data changes
function update() {
    // Bind data to the links
    link = link.data(links, d => d.id);
    link.exit().remove();
    link = link.enter().append("line")
        .attr("stroke-width", d => d === selectedElement ? 8 : 4) // Thicker stroke for selected link
        .attr("stroke", d => d === selectedElement ? "grey" : "grey") // Highlight selected link
        .attr("id", d => d.id)
        .on("click", (event, d) => {
            if (currentMode === "select") {
                selectElement(d);
            }
        })
        .merge(link);

    // Bind data to the nodes
    node = node.data(nodes, d => d.id);
    node.exit().remove();
    
    const nodeEnter = node.enter().append("g")
        .attr("transform", d => `translate(${d.x || width / 2},${d.y || height / 2})`) // Centered in the canvas
        .on("mousedown", function(event, d) {
            if (addingLink && !sourceNode) {
                sourceNode = d;
                tempLine = svg.append("line")
                    .attr("x1", d.x)
                    .attr("y1", d.y)
                    .attr("x2", d.x)
                    .attr("y2", d.y)
                    .attr("stroke-width", 4)
                    .attr("stroke", "grey");
            } else if (addingLink && sourceNode) {
                if (sourceNode === d) {
                    alert("Non puoi creare un arco sullo stesso nodo.");
                } else if (links.some(l => (l.source === sourceNode && l.target === d) || (l.source === d && l.target === sourceNode))) {
                    alert("Un arco tra questi nodi esiste già.");
                } else {
                    const id = getNextLinkId();
                    links.push({ id: id, source: sourceNode, target: d, label: `${sourceNode.id}->${d.id}` });
                }
                sourceNode = null;
                tempLine.remove();
                tempLine = null;
                addingLink = false;
                update();
            } else if (currentMode === "select") {
                selectElement(d);
            }
        })
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    // Add circle for the node
    nodeEnter.append("circle")
        .attr("r", 30) // Larger node radius
        .attr("fill", d => d3.hcl(d.color).brighter(2)) // Use node's color attribute
        .attr("stroke", d => d.color) // Darker border
        .attr("stroke-width", 4); // Thicker border for selected node

    // Add text label for the node
    nodeEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "20px") // Font size adjustment
        .text(d => d.id); // Display the node's ID inside the node

    // Merge nodes
    node = nodeEnter.merge(node);

    // Update simulation with new nodes and links
    simulation.nodes(nodes).on("tick", ticked);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();

    // Update selection visualizations
    node.select("circle")
        .attr("stroke-width",d => d === selectedElement ? 8 : 4)
        .attr("fill", d => d3.hcl(d.color).brighter(2)) // Update color
        .attr("stroke", d => d.color); // Update border color

    node.select("text")
        .text(d => d.id); // Update text

    link.attr("stroke-width", d => d === selectedElement ? 8 : 4); // Thicker stroke for selected link
}

// Handle the tick event
function ticked() {
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);

    if (tempLine) {
        tempLine.attr("x2", d3.event.x).attr("y2", d3.event.y);
    }
}

// Handle drag events
function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// Select an element (node or link) and display its ID and label
function selectElement(element) {
    selectedElement = element;
    if (element.source && element.target) { // If it's a link
        const [sourceId, targetId] = [element.source.id, element.target.id];
        document.querySelector('.toolbar-left').innerHTML = `
            <span>ID: ${element.id}</span>
            <span>LABEL: ${sourceId}->${targetId}</span>
        `;
    } else { // If it's a node
        document.querySelector('.toolbar-left').innerHTML = `
            <span>ID: ${element.id}</span>
            <span>LABEL: ${element.label}</span>
            <span>COLOR: ${element.color}</span>
        `;
    }
    update();
}

// Tool actions
$(".icon").on("click", function() {
    $(".icon").removeClass("active");
    $(this).addClass("active");
});

$("#add-node").on("click", () => {
    // Mostra la toolbar aggiuntiva
    $(".toolbar-extra").html(`
        <div class="color-picker">
            <div class="color-option" data-color="gold" style="background-color: gold;"></div>
            <div class="color-option" data-color="orangered" style="background-color: orangered;"></div>
            <div class="color-option" data-color="deeppink" style="background-color: deeppink;"></div>
            <div class="color-option" data-color="blueviolet" style="background-color: blueviolet;"></div>
            <div class="color-option" data-color="dodgerblue" style="background-color: dodgerblue;"></div>
        </div>
    `);

    // Aggiungi nodi basati sul colore selezionato
    $(".color-option").on("click", function() {
        const color = $(this).data("color");
        const id = nodes.length ? nodes[nodes.length - 1].id + 1 : 1;
        nodes.push({ id, label: `nodo ${id}`, x: width / 2, y: height / 2, color });
        $(".toolbar-extra").empty(); // Nascondi la toolbar dopo aver selezionato il colore
        update();
    });
});

$("#add-link").on("click", () => {
    currentMode = "add-link";
    addingLink = true;
    sourceNode = null;
    tempLine = null;
});

let nextLinkId = 1;
function getNextLinkId() {
    return nextLinkId++;
}

$("#select").on("click", () => {
    currentMode = "select";
});

$("#delete").on("click", () => {
    if (selectedElement) {
        if (selectedElement.source && selectedElement.target) {
            links = links.filter(l => l !== selectedElement);
        } else {
            nodes = nodes.filter(n => n !== selectedElement);
            links = links.filter(l => l.source !== selectedElement && l.target !== selectedElement);
        }
        selectedElement = null;
        document.querySelector('.toolbar-left').innerHTML = `
            <span>ID: </span>
            <span>LABEL: </span>
        `;
        update();
    }
});

// New edit tool functionality
$("#edit").on("click", () => {
    if (selectedElement && !selectedElement.source && !selectedElement.target) {
        const node = selectedElement;
        $(".toolbar-left").html(`
            <div class="edit-form">
                <label for="edit-id">ID:</label>
                <input type="text" id="edit-id" size="4" value="${node.id}" />
                <label for="edit-label">LABEL:</label>
                <input type="text" id="edit-label" size="4" value="${node.label}" />
                <label for="edit-color">COLOR:</label>
                <select id="edit-color">
                    <option value="gold" ${node.color === "gold" ? "selected" : ""}>Gold</option>
                    <option value="orangered" ${node.color === "orangered" ? "selected" : ""}>Orange</option>
                    <option value="deeppink" ${node.color === "deeppink" ? "selected" : ""}>Pink</option>
                    <option value="blueviolet" ${node.color === "blueviolet" ? "selected" : ""}>Violet</option>
                    <option value="dodgerblue" ${node.color === "dodgerblue" ? "selected" : ""}>Blue</option>
                </select>
                <button id="edit-save">Save</button>
            </div>
        `);

        $("#edit-save").on("click", () => {
            const newId = parseInt($("#edit-id").val()); // Convert to number
            const newLabel = $("#edit-label").val();
            const newColor = $("#edit-color").val();

            // Check if newId is valid and not already used by another node
            if (Number.isInteger(newId) && newId >= 0 && (newId === node.id || !nodes.some(n => n.id === newId))) {
                node.id = newId;
                node.label = newLabel;
                node.color = newColor;
                selectedElement = node;
                $(".toolbar-left").empty();
                update();
            } else {
                alert("Invalid or duplicate ID. Please choose a different numeric ID.");
            }
        });
    }
});


$("#help-icon").on("click", () => {
    $("#popup").show();
});

$("#close-popup").on("click", () => {
    $("#popup").hide();
});

$("#svg-download").on("click", () => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(document.querySelector('svg'));
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    saveAs(blob, "graph.svg");
});

$("#json-download").on("click", () => {
    const json = JSON.stringify({ nodes, links });
    const blob = new Blob([json], { type: "application/json" });
    saveAs(blob, "graph.json");
});

$("#json-upload").on("change", function () {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        const json = JSON.parse(event.target.result);
        nodes = json.nodes;
        links = json.links;
        update();
    };
    reader.readAsText(file);
});

$("#zoom-in").on("click", () => {
    svg.transition().call(d3.zoom().scaleBy, 1.2);
});

$("#zoom-out").on("click", () => {
    svg.transition().call(d3.zoom().scaleBy, 0.8);
});

// Initial update to render the graph
update();

// Track mouse movement for temporary line
d3.select("body").on("mousemove", function(event) {
    if (tempLine) {
        const [x, y] = d3.pointer(event);
        tempLine.attr("x2", x).attr("y2", y);
    }
});

// Handle mouse up outside of node to cancel link creation
d3.select("body").on("mouseup", function() {
    if (addingLink && sourceNode) {
        sourceNode = null;
        tempLine.remove();
        tempLine = null;
        addingLink = false;
    }
});

// Help popup logic
document.addEventListener("DOMContentLoaded", function() {
    var popup = document.getElementById("popup");
    var closePopup = document.getElementById('close-popup');
    var helpIcon = document.getElementById("help-icon");

    // Show the popup on page load
    popup.style.display = "flex";

    // Close the popup when clicking the 'x'
    closePopup.onclick = function() {
        popup.style.display = "none";
    };

    // Close the popup when clicking outside of the popup
    window.onclick = function(event) {
        if (event.target == popup) {
            popup.style.display = "none";
        }
    };

    // Show the popup when clicking the help icon
    helpIcon.onclick = function() {
        popup.style.display = "flex";
    };

    // Close the popup when pressing the ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            popup.style.display = 'none';
        }
    });
});