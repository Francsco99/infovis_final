
// Area di disegno
const canvas = document.getElementById('graph-canvas');
const width = canvas.clientWidth;
const height = canvas.clientHeight;

// Tool della toolbar in alto
const toolbar = document.querySelector('.toolbar');
const selectTool = document.getElementById('select');
const addNodeTool = document.getElementById('add-node');
const addLinkTool = document.getElementById('add-link');
const editTool = document.getElementById('edit');
const deleteTool = document.getElementById('add-node');
const saveSVG = document.getElementById('svg-download');
const saveJSON = document.getElementById('json-download');
const uploadJSON = document.getElementById('json-upload');
const zoomIn = document.getElementById('zoom-in');
const zoomOut = document.getElementById('zoom-out');

const colors = ['red', 'blue', 'green', 'yellow', 'purple']

var global = {
  selection: null,
};

// Definizione del grafo
var graph = {
  nodes: [
    { id: '1', label:"a", type: 'blue' },
    { id: '2', label:"b", x: 793, y: 364, type: 'blue' },
    { id: '3', label:"c", x: 442, y: 365, type: 'orange' },
    { id: '4', label:"d", x: 467, y: 314, type: 'green' }
  ],
  edges: [
    { id:"1", source: '1', target: '2', label:"a->b" },
    { id:"2", source: '2', target: '3', label:"b->c" },
    { id:"3", source: '3', target: '1', label:"c->a" },
    { id:"4", source: '4', target: '1', label:"d->a" },
    { id:"5", source: '4', target: '2', label:"d->b" }
  ],

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

  add_node: function(type) {
    var newNode;
    newNode = {
      id: graph.last_index++,
      label: "node: " + graph.last_index,
      x: width / 2,
      y: height / 2,
      type: type
    };
    graph.nodes.push(newNode);
    return newNode;
  },

  add_link: function(source, target) {
    // avoid edges to self
    if (source === target) return null;

    var newEdge, i, edges, edge;
    edges = graph.edges;

    // avoid link duplicates
    for (i = 0; i < edges.length; i++) {
      edge = edges[i];
      if (edge.source === source && edge.target === target) {
        alert("errore: arco duplicato");
        return null;
      }
    }

    newEdge = {
      id: graph.links_index++,
      label: source.id + "->" + target.id,
      source: source,
      target: target
    };
    graph.edges.push(newEdge);
    return newEdge;
  },

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

graph.objectify();

function main() {
  console.log("INIZIATO IL MAIN");

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
    .force("center", d3.forceCenter(width / 2, height / 2))
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
      if (!event.active) global.simulation.alphaTarget(0.5).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d) => {
      if (!event.active) global.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
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

  function showEdit(selection_to_show) {
    if (isEditable(selection_to_show) === "node") {
      document.getElementById("node_id").value = selection_to_show.id;
      document.getElementById("node_label").value = selection_to_show.label;
      document.getElementById("node_type").value = selection_to_show.type;
    }
    else if (isEditable(selection_to_show) === "link") {
      document.getElementById("node_id").value = selection_to_show.id;
      document.getElementById("node_label").value = selection_to_show.label;
      document.getElementById("node_type").value = "";
    }
  }

  // funzione per colorare le icone e mostrare l'editor 
  d3.select(window).on('click', function () {
      if (global.selection !== null) {
        d3.selectAll("#trashIcon").attr("href", "img/red_trash.jpg");
      }
      else {
        d3.selectAll("#trashIcon").attr("href", "img/trash.jpg");
      }        
  });

  d3.select(".mainArea").on('click', function () {
    if (global.selection !== null)
        showEdit(global.selection);
    else {
        document.getElementById("node_id").value = "";
        document.getElementById("node_label").value = "";
        document.getElementById("node_type").value = "";
    }
  });

  update();

  d3.select("#select")
    .on("click", function () {
      alert("click su select");
    });

  global.tool = 'pointer';
  global.new_link_source = null;
  global.vis.on('mousemove.add_link', (function (d) {
    // check if there is a new link in creation
    var p;
    if (global.new_link_source != null) {
      // update the draggable link representation
      p = d3.mouse(global.vis.node());
      return global.drag_link.attr('x1', global.new_link_source.x).attr('y1', global.new_link_source.y).attr('x2', p[0]).attr('y2', p[1]);
    }
  })).on('mouseup.add_link', (function (d) {
    global.new_link_source = null;

    // remove the draggable link representation, if exists
    if (global.drag_link != null) return global.drag_link.remove();
  }));

  // la stringa s diventa un array di byte (rappresentati come interi a 8 bit)
  function encode(s) {
    var out = [];
    for (let i = 0; i < s.length; i++) {
      out[i] = s.charCodeAt(i);
    }
    return new Uint8Array(out);
  }

  // For the clockwise order
  function orderlink(centerNode, listOfLinktoSort) {

    //listOfLinktoSort = [ obj = {id: "", label: "" , x: "" , y: "", type: "" } ... {...}  ]

    const center = {x:centerNode.x, y:centerNode.y};

    var startAng;
    listOfLinktoSort.forEach(point => {
      var ang = Math.atan2(point.y - center.y, point.x - center.x);
      if(!startAng) startAng = ang 
      else {
        if (ang < startAng){  // ensure that all points are clockwise of the start point
          ang += Math.PI * 2;
        }
      }
      point.angle = ang; // add the angle to the point
    });
    // Sort clockwise;
    listOfLinktoSort.sort((a,b) => a.angle - b.angle);

    /*
      for ANTI CLOCKWISE use this sniplet
    // reverse the order
    const ccwPoints = listOfLinktoSort.reverse();
    // move the last point back to the start
    ccwPoints.unshift(ccwPoints.pop());
      */

    //print
    var result = [];
    for (let i = 0; i < listOfLinktoSort.length ; i++)
      result.push(listOfLinktoSort[i].id);
    return result;
  }

  /* SIAMO ARRIVATI QUI */

  function neighborsOfNode(node) {
    var result = [];
    for (let j = 0; j < graph.edges.length ; j++){
      if (node.id === graph.edges[j].source.id){
        result.push(graph.edges[j].target)
      }
      else if (node.id === graph.edges[j].target.id){
        result.push(graph.edges[j].source)
      }
    }
    return result;
  }

  function createResult() {
    var listaNodi = [];
    var listaLink = [];

    for (let i = 0; i < graph.nodes.length ; i++){
      let node = {
        id: graph.nodes[i].id,
        label: graph.nodes[i].label,
        order: orderlink( graph.nodes[i], neighborsOfNode(graph.nodes[i]) ),
        color: graph.nodes[i].type,
        x: graph.nodes[i].x,
        y: graph.nodes[i].y
      };
      listaNodi.push(node);
    }
    for (let j = 0; j < graph.edges.length ; j++){
      let link = {
        id: graph.edges[j].id,
        label: graph.edges[j].label,
        source: graph.edges[j].source.id,
        target: graph.edges[j].target.id
      };
      listaLink.push(link);
    }
    return {
      nodes: listaNodi,
      edges: listaLink
    };
  }

  // Json trascription of the graph
  var button = document.getElementById("json-download");
  button.addEventListener( 'click', function() {
    var result = createResult();
    var data = encode(JSON.stringify(result, null, "\t"));

    // for browser downloading
    var blob = new Blob([data], {type: 'application/octet-stream'});

    url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'graph.json');

    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    link.dispatchEvent( event );
  });

  // Inizio Load Json
  var json;

  document.getElementById("json-upload").addEventListener('change', handleFileSelect, false);

  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    // files is a FileList of File objects. List some properties.

    for (var i = 0, f; f = files[i]; i++) {
      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function (theFile) {
        return function (e) {
          console.log('e readAsText = ', e);
          console.log('e readAsText target = ', e.target);
          try {
            json = JSON.parse(e.target.result);

            let listaNodi = [];

            for (let i = 0; i < json.nodes.length ; i++) {

              let node = {
                id: json.nodes[i].id,
                label: json.nodes[i].label,
                x: json.nodes[i].x,
                y: json.nodes[i].y,
                type: json.nodes[i].color,
                fixed: true
              };

              listaNodi.push(node);
            }
            graph.last_index = json.nodes.length;
            graph.links_index = json.edges.length;
            
            graph.nodes = listaNodi;
            graph.edges = json.edges;
            graph.objectify();
            update();

          } catch (ex) {
            alert('ex when trying to parse json = ' + ex);
          }
        }
      })(f);
      reader.readAsText(f);
    }

  }

  return d3.selectAll('.toolbar-icon').on('click', function () {
    var new_tool, nodes;
    d3.selectAll('.toolbar-icon').classed('active', false);
    d3.select(this).classed('active', true);
    selectedTool = $(this).data('toolbar-icon'); // ricava il nome del tool
    nodes = global.vis.selectAll('.node');
    if (selectedTool === 'add_link' && global.tool !== 'add_link') {
      // remove drag handlers from nodes
      nodes.on('mousedown.drag', null).on('touchstart.drag', null);
      // add drag handlers for the add_link tool
      nodes.call(drag_add_link);
    } else if (new_tool !== 'add_link' && global.tool === 'add_link') {
      // remove drag handlers for the add_link tool
      nodes.on('mousedown.add_link', null).on('mouseup.add_link', null);
      // add drag behavior to nodes
      nodes.call(global.drag);
    }
    if (selectedTool === 'add_node') {
      //library.show();
    } else {
      //library.hide();
    }
    return global.tool = selectedTool;
  });
};

function drag_add_link(selection) {
  return selection.on('mousedown.add_link', (function(d) {
    var p;
    global.new_link_source = d;
    // create the draggable link representation
    p = d3.mouse(global.vis.node());
    global.drag_link = global.vis.insert('line', '.node').attr('class', 'drag_link').attr('x1', d.x).attr('y1', d.y).attr('x2', p[0]).attr('y2', p[1]);
    // prevent pan activation
    d3.event.stopPropagation();
    // prevent text selection
    return d3.event.preventDefault();
  })).on('mouseup.add_link', (function(d) {
    // add link and update, but only if a link is actually added
    if (graph.add_link(global.new_link_source, d) != null) return update();
  }));
};

document.getElementById('svg-download').addEventListener('click', function() {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg.node());

  // Add name spaces.
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = "graph.svg";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
});

document.getElementById('json-download').addEventListener('click', function() {
  const data = JSON.stringify(graph, (key, value) => {
    if (key === "source") return value.id;
    if (key === "target") return value.id;
    return value;
  }, 2);

  const jsonBlob = new Blob([data], { type: 'application/json;charset=utf-8' });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = jsonUrl;
  downloadLink.download = "graph.json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
});

// Importa JSON
uploadJSON.addEventListener("change", function(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const importedData = JSON.parse(event.target.result);
    graph.nodes = importedData.nodes;
    graph.edges = importedData.edges;
    graph.last_index = importedData.last_index;
    graph.links_index = importedData.links_index;
    graph.objectify();
    update();
  };

  reader.readAsText(file);
});

function update() {
  var links, nodes;

  // Modifica degli archi
  console.log(global.vis);
  links = global.vis.selectAll('.link').data(graph.edges, function(d) {
    return d.source.id + "->" + d.target.id;
  });

  console.log(links);

  links.enter().append('line')
    .attr('class', 'link')
    .on('click', function(event, d) {
      global.selection = d;
      d3.selectAll('.link').classed('selected', p => p === d);
      d3.selectAll('.node').classed('selected', false);
      document.getElementById("node_id").value = global.selection.id;
      document.getElementById("node_label").value = global.selection.label;
      document.getElementById("node_type").value = global.selection.type;
    });

  links.exit().remove();

  // Modifica dei nodi
  nodes = global.vis.selectAll('.node').data(graph.nodes, d => d.id);

  nodes_enter = nodes.enter().append('g')
    .attr('class', 'node')
    .call(global.drag)
    .on('click', function(event, d) {
      global.selection = d;
      d3.selectAll('.node').classed('selected', p => p === d);
      d3.selectAll('.link').classed('selected', false);
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
    .attr('dy', '.35em')
    .attr('cursor', 'pointer')
    .text(d => d.id);

  nodes.exit().remove();

  nodes = global.vis.selectAll('.node').attr('transform', d => `translate(${d.x},${d.y})`);

  // Restart the force simulation.
  global.simulation.nodes(graph.nodes);
  global.simulation.force("link").links(graph.edges);
  global.simulation.alpha(1).restart();
};

// Gestione strumenti della toolbar
addNodeTool.addEventListener('click', () => {
  const type = prompt("Enter node type (e.g. blue, orange, green):", "blue");
  if (type) {
    const newNode = graph.add_node(type);
    update();
  }
});

addLinkTool.addEventListener('click', () => {
  const sourceId = prompt("Enter source node ID:");
  const targetId = prompt("Enter target node ID:");
  const sourceNode = graph.nodes.find(node => node.id == sourceId);
  const targetNode = graph.nodes.find(node => node.id == targetId);
  if (sourceNode && targetNode) {
    graph.add_link(sourceNode, targetNode);
    update();
  } else {
    alert("Invalid source or target node ID.");
  }
});

deleteTool.addEventListener('click', () => {
  if (global.selection) {
    graph.remove(global.selection);
    global.selection = null;
    update();
  }
});

editTool.addEventListener('click', () => {
  if (global.selection) {
    const success = submit_changes(global.selection);
    if (success) {
      update();
    }
  }
});

