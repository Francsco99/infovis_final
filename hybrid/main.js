
// Area di disegno
const canvas = document.getElementById('graph-canvas');
const width = canvas.clientWidth;
const height = canvas.clientHeight;

// Tool della toolbar in alto
const saveSVG = document.getElementById('svg-download');
const saveJSON = document.getElementById('json-download');
const uploadJSON = document.getElementById('json-upload');
const zoomIn = document.getElementById('zoom-in');
const zoomOut = document.getElementById('zoom-out');

const colors = ['red', 'blue', 'green', 'yellow', 'purple']

var global = {
  selection: null,
  tool: 'pointer'
};

// Definizione del grafo
var graph = {
  nodes: [],
  edges: [],

  last_index: 5,
  links_index: 6,

  objectify: function() {
    const idToNodeMap = new Map();
    var nodes = graph.nodes;
    var edges = graph.edges;
    for (let i = 0; i < nodes.length; i++) {
      idToNodeMap.set(nodes[i].id, nodes[i]);
    }
    for (let i = 0; i < edges.length; i++) {
      edges[i].source = idToNodeMap.get(edges[i].source);
      edges[i].target = idToNodeMap.get(edges[i].target);
    }
  },

  remove: function(condemned) {
    // remove the given node or link from the graph, also deleting dangling edges if a node is removed
    if (graph.nodes.indexOf(condemned) >= 0) {
      graph.nodes = graph.nodes.filter(function(n) {
        return n !== condemned;
      });
      graph.edges = graph.edges.filter(function(l) {
        return l.source.id !== condemned.id && l.target.id !== condemned.id;
      });
    }
    // this part is for deleting the single link
    else if (graph.edges.indexOf(condemned) >= 0) {
      graph.edges = graph.edges.filter(function(l) {
        return l !== condemned;
      });
    }
  },

  add_node: (function(type) {
    var newNode;
  
    // Gather all existing node IDs and filter out non-integer IDs
    var existingIds = graph.nodes
      .map(function(n) { return parseInt(n.id, 10); })
      .filter(function(id) { return !isNaN(id); });
      
    existingIds.sort(function(a, b) { return a - b; });
  
    // Find the first missing ID in the sequence
    var newId = existingIds.length ? existingIds[existingIds.length - 1] + 1 : 1; // start with 1
    for (var i = 0; i < existingIds.length; i++) {
      if (existingIds[i] !== i + 1) { // IDs should start from 1
        newId = i + 1;
        break;
      }
    }
  
    newNode = {
      id: newId,
      label: newId,
      x: width / 2,
      y: height / 2,
      type: type
    };
  
    // Add the new node to the graph
    graph.nodes.push(newNode);
    return newNode;
  }),

  add_link: (function(source, target) {
    console.log(source, target)
    // avoid edges to self
    if (source === target) return null;

    var newEdge, i, edges, edge;
    edges = graph.edges;

    // avoid link duplicates
    for (i = 0; i < edges.length; i++) {
      edge = edges[i];
      console.log(edge.source + " " + edge.target);
      if (edge.source === source && edge.target === target || edge.source === target && edge.target === source) {
        console.log("errore");
        swal({
          title: "Error!",
          text: "There is already a link",
          icon: "error",
          timer: 2000,
          buttons: false
        });
        return null;
      }
    }
    // Gather all existing edges IDs
    var existingIds = edges.map(function(n) { return parseInt(n.id, 10); });
    existingIds.sort(function(a, b) { return a - b; });
    
    // Find the first missing ID in the sequence
    var newId = existingIds.length ? existingIds[existingIds.length - 1] + 1 : 1; // start with 1
    for (var i = 0; i < existingIds.length; i++) {
      if (existingIds[i] !== i + 1) { // IDs should start from 1
        newId = i + 1;
        break;
      }
    }

    newEdge = {
      id: newId,
      label: source.label + "-" + target.label,
      source: source,
      target: target
    };
    graph.edges.push(newEdge);
    return newEdge;
  }),

  add_modified_link: function(source, target, mod_id, mod_lab) {
    // avoid edges to self
    if (source === target) return null;

    var newEdge, i, edges, edge;
    edges = graph.edges;

    // avoid link duplicates
    for (i = 0; i < edges.length; i++) {
      edge = edges[i];
      if (edge.source === source && edge.target === target) return null;
    }

    newEdge = {
      id: mod_id,
      label: mod_lab,
      source: source,
      target: target
    };
    graph.edges.push(newEdge);
    return newEdge;
  }
};

function main() {

  graph.nodes = [
    { id: '1', label:"A", type: 'blue' },
    { id: '2', label:"B", x: 793, y: 364, type: 'blue' },
    { id: '3', label:"C", x: 442, y: 365, type: 'orange' },
    { id: '4', label:"D", x: 467, y: 314, type: 'green' }
  ];

  graph.edges = [
    { id:"1", source: '1', target: '2', label:"A-B" },
    { id:"2", source: '2', target: '3', label:"B-C" },
    { id:"3", source: '3', target: '1', label:"C-A" },
    { id:"4", source: '4', target: '1', label:"D-A" },
    { id:"5", source: '4', target: '2', label:"D-B" }
  ];

  graph.objectify();

  var svg = d3.select('#graph-canvas');

  // Initialize editor at first open
  document.getElementById("node_id").value = "";
  document.getElementById("node_label").value = "";
  document.getElementById("node_type").value = "";

  // ZOOM and PAN
  container = svg.append('g');    

  global.vis = container.append('g');
  
  var zoom = d3.zoom().scaleExtent([0.5, 8]).on('zoom', (event) => {
    global.vis.attr('transform', event.transform);
  });

  zoomIn.addEventListener('click', () => {
    container.transition().call(zoom.scaleBy, 1.2);
  });
  
  zoomOut.addEventListener('click', () => {
    container.transition().call(zoom.scaleBy, 0.8);
  });
  // create a rectangular overlay to catch events

  // WARNING rect size is huge but not infinite. this is a dirty hack
  global.vis.append('rect')
    .attr('class', 'overlay')
    .attr('x', -500000)
    .attr('y', -500000)
    .attr('width', 1000000)
    .attr('height', 1000000)
    .on('click', function (d) {
      // Pulizia della selezione
      global.selection = null;
      d3.selectAll('.node').classed('selected', false);
      d3.selectAll('.link').classed('selected', false);
    });

  // END ZOOM and PAN

  global.colorify = d3.scaleOrdinal(d3.schemeCategory10);
  
  // Inizializzazione layout force directed
  global.simulation = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-300))
    .force("link", d3.forceLink(graph.edges).distance(100).id(d => d.id))
    .force("attract", d3.forceRadial(0, width / 2, height / 2).strength(0.1)) // Forza che tende a tenere i nodi al centro
    .on("tick", () => {
      // Aggiornamento posizione nodi e archi
      global.vis.selectAll('.node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

      global.vis.selectAll('.link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
    });

    global.drag = d3.drag()
    .on('start', (event, d) => {
      if (global.tool !== "add-link") {
        if (!event.active) global.simulation.alphaTarget(0.5).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
    })
    .on('drag', (event, d) => {
      if (global.tool !== "add-link") {
        d.fx = event.x;
        d.fy = event.y;
      } 
      else {
        // Disegna l'arco temporaneo
        if (!global.tempLine) {
          global.tempLine = global.vis.append('line')
            .attr('class', 'drag_link')
        }
        global.tempLine
          .attr('x1', d.x)
          .attr('y1', d.y)
          .attr('x2', event.x)
          .attr('y2', event.y);
      }
    })
    .on('end', (event, d) => {
      if (global.tool !== "add-link") {
        if (!event.active) global.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      } else {
        // Rimuovi l'arco temporaneo
        if (global.tempLine) {
          global.tempLine.remove();
          global.tempLine = null;
        }

        // Trova il nodo di destinazione
        const [target] = graph.nodes.filter(node => {
          const dx = node.x - event.x;
          const dy = node.y - event.y;
          return Math.sqrt(dx * dx + dy * dy) < 20; // Raggio di tolleranza per il nodo di destinazione
        });

        if (target && target !== d) {
          // Aggiungi il link solo se un nodo di destinazione è trovato
          graph.add_link(d, target);
          update();
        }
      }
    });

  update();
};

function update() {
  var links, nodes;

  // Selezione degli archi
  links = global.vis.selectAll('.link').data(graph.edges, function(d) {
    return d.source.id + "-" + d.target.id;
  });

  links.enter().insert('line', '.node') // Inserisci i link prima dei nodi
    .attr('class', 'link')
    .on('click', function(event, d) {
      // selezione dell'arco
      global.selection = d;
      d3.selectAll('.link').classed('selected', p => p === d);
      d3.selectAll('.node').classed('selected', false);

      // visualizzazione statistiche
      document.getElementById("node_id").value = global.selection.id;
      document.getElementById("node_label").value = global.selection.label;
      document.getElementById("node_type").value = "";
    });

  links.exit().remove();

  links = global.vis.selectAll('.link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

  // Selezione dei nodi
  nodes = global.vis.selectAll('.node').data(graph.nodes, d => d.id);

  var nodes_enter = nodes.enter().append('g')
    .attr('class', 'node')
    .call(global.drag)
    .on('click', function(event, d) {
      // selezione del nodo
      global.selection = d;
      d3.selectAll('.node').classed('selected', p => p === d);
      d3.selectAll('.link').classed('selected', false);

      // visualizzazione statistiche
      document.getElementById("node_id").value = global.selection.id;
      document.getElementById("node_label").value = global.selection.label;
      document.getElementById("node_type").value = global.selection.type;
    });

  nodes_enter.append('circle')
    .attr('r', 20)
    .attr('fill', d => global.colorify(d.type))
    .attr('cursor', 'pointer');

  nodes_enter.append('text')
    .attr('text-anchor', 'middle')
    .attr('user-select', 'none')
    .attr('dy', '.35em')
    .attr('cursor', 'pointer')
    .text(d => d.label);

  nodes.exit().remove();

  // Aggiorna i nodi esistenti
  nodes.select('circle')
    .attr('fill', d => global.colorify(d.type))
  nodes.select('text')
    .text(d => d.label);

  nodes = global.vis.selectAll('.node').attr('transform', d => `translate(${d.x},${d.y})`);

  // Restart the force simulation.
  global.simulation.force("link").links(graph.edges);
  global.simulation.nodes(graph.nodes);
  global.simulation.alpha(1).restart();
};


d3.select(window).on('click', function () {
  if (global.selection !== null) {
    d3.select("#delete").attr("class", "icon active toolbar-icon fa-solid fa-eraser fa-2xl");
    d3.select("#edit").attr("class", "icon active toolbar-icon fa-solid fa-pen-to-square fa-2xl");
  }
  else {
    d3.select("#delete").classed('active', false);
    d3.select("#delete").classed('unactive', true);
    d3.select("#edit").classed('active', false);
    d3.select("#edit").classed('unactive', true);

    // Svuota le statistiche
    document.getElementById("node_id").value = "";
    document.getElementById("node_label").value = "";
    document.getElementById("node_type").value = "";
  }
});

d3.select("#pointer")
    .on("click", function () {
      global.tool = "pointer";
      d3.select("#pointer").classed('active', true);
      d3.select("#add-link").classed('active', false);
    });

// Gestione strumenti della toolbar
d3.select("#add-node")
  .on("click", function () {
    const color = "blue";
    if (color) {
      const newNode = graph.add_node(color);
      update();
    }
  });

d3.select("#add-link")
  .on("click", function () {
    global.tool = "add-link";
    d3.select("#add-link").classed('active', true);
    d3.select("#pointer").classed('active', false);
  });

d3.select("#edit")
  .on("click", function () {
    if (global.selection) {
      const success = submit_changes(global.selection);
      if (success) {
        update();
      }
    }
  });

d3.select("#delete")
  .on("click", function () {
    if (global.selection) {
      graph.remove(global.selection);
      global.selection = null;
      update();
    }
  });

function isEditable(selection){
  if (selection !== null) {
    if (graph.nodes.indexOf(selection) >= 0) {
      return "node";
    } else {
      return "link";
    }
    }
  return null;
}

function isAvailableId(selection, new_id, mode) {
  if (mode === "node") {
      if (selection.id === new_id)
          return true;
      else {
          for (let i = 0; i < graph.nodes.length; i++) {
            if (graph.nodes[i].id === new_id)
              return false;
          }
          return true;
      }
  }
  else if (mode === "link") {
    if (selection.id === new_id)
      return true;
    else {
      for (let i = 0; i < graph.edges.length; i++) {
        if (graph.edges[i].id === new_id)
          return false;
      }
      return true;
    }
  }
}

function submit_changes(selection) {
  const mode = isEditable(selection);

  if (mode === "node") {
    if (isAvailableId(selection, document.getElementById("node_id").value, mode)) {
      selection.id = document.getElementById("node_id").value;
      selection.label = document.getElementById("node_label").value;
      selection.type = document.getElementById("node_type").value;
      update();
      return true;
    } else {
      alert("Errore, l'id selezionato è già in uso");
      return false;
    }
  } else if (mode === "link") {
    if (isAvailableId(selection, document.getElementById("node_id").value, mode)) {
      const sourceNode = selection.source;
      const targetNode = selection.target;

      // Rimuovi l'arco
      graph.remove(selection);

      // Aggiungi l'arco modificato
      graph.add_modified_link(sourceNode, targetNode, document.getElementById("node_id").value, document.getElementById("node_label").value);

      update();
      return true;
    } else {
      alert("Errore, l'id selezionato è già in uso");
      return false;
    }
  }
  return false;
}