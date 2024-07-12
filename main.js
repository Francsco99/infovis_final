// Carica js appena l'html è caricato completamente 
document.addEventListener('DOMContentLoaded', function(){
  //Area di disegno
  const svg = document.getElementById('graph-canvas');
  const width = svg.clientWidth;
  const height = svg.clientHeight;
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
  // Colori per i nodi
  const colors = ['red','blue','green','yellow','purple'] //maybe use a map with a range

  /*Usato per conservare la selezione corrente, inizalmente nulla*/
  global = {
    selection: null,
  };

  /* Grafo: ha un array di nodi e di archi e mantiene il prossimo id disponibile
  per i nodi e per gli archi*/
  graph={
    nodes:[],
    edges:[],
    last_node_id:4,
    last_link_id:5,

    objectify(){
      var currentEdge, currentNode, i, edges, edgeResults;
        edges = graph.edges;
        edgeResults = [];
        for (i = 0; i < edges.length; i++) {
          currentEdge = edges[i];
          edgeResults.push((function() {
            var j, nodes, nodesResults;
            nodes = graph.nodes;
            nodesResults = [];
            for (j = 0; j < nodes.length; j++) {
              currentNode = nodes[j];
              if (currentEdge.source === currentNode.id) {
                currentEdge.source = currentNode;
              }
              else if (currentEdge.target === currentNode.id) {
                currentEdge.target = currentNode;
              } else {
                nodesResults.push(void 0);
              }
            }
            return nodesResults;
          })());
        }
        return edgeResults;
    },

    /*Funzione per rimuovere un nodo o arco dal grafo, accetta un oggetto nodo o arco*/
    delete(condemned){
      // Controlla se l'elemento condannato è un nodo
      if (this.nodes.includes(condemned)){
        // Rimuovi il nodo
        this.nodes = this.nodes.filter(n => n!== condemned);
        // Rimuovi archi entranti e uscenti associati
        this.edges = this.edges.filter(e => e.source.id !== condemned.id && e.target.id !== condemned.id);
      }
      // Altrimenti era un arco
      else if(this.edges.includes(condemned)){
        // Rimuovi l'arco
        this.edges = this.edges.filter(e => e != condemned);
      }
    },
    /*Funzione per aggiungere un nuovo nodo al grafo*/
    addNode(color){
      // Crea nuova struttura per il nodo da aggiungere
      const newNode={
        id: this.last_node_id++, // Prendi il prossimo id disponibile
        label: 'node'+ this.next_node_id,
        x: width/2, // Posizionato al centro del canvas
        y: height/2,
        color: color
      };
      this.last_node_id++; // Aggiorna id ultimo nodo
      this.nodes.push(newNode); // Aggiungi nodo all'array di nodi del grafo
      return newNode;
    },
    /*Funzione per aggiungere un nuovo arco tra due nodi*/
    addEdge(source,target){
      // Evita loop sullo stesso nodo
      if(source===target){
        return null;
      }
      // Evita collegamenti duplicati
      const existingEdge = this.edges.find(e => e.source === source && e.target === target );
      if (existingEdge){
        return null;
      }
      //Crea nuova struttura per l'arco da aggiungere
      const newEdge={
        id: this.next_link_id++,
        label: source.id +'->'+target.id,
        source: source,
        target: target
      };
      this.last_link_id++; // Aggiorna id ultimo arco
      this.edges.push(newEdge); // Aggiungi arco all'array degli archi del grafo
      return newEdge;

    },
    /*Funzione per aggiungere un arco modificato*/
    addModifiedLink(source,target,modifiedId,modifiedLabel){
      // Evita loop sullo stesso nodo
      if(source===target){
        return null;
      }
      // Evita collegamenti duplicati
      const existingEdge = this.edges.find(e => e.source === source && e.target === target );
      if (existingEdge){
        return null;
      }
      // Crea il nuovo arco modificato
      const newEdge = {
      id: modifiedId,
      label: modifiedLabel,
      source: source,
      target: target
      };
      this.edges.push(newEdge); // Aggiunge il nuovo arco modificato all'array degli archi
      return newEdge;
    }
  }
  grap.objectify();

  /*Funzione per disegnare il grafo*/
  function drawGraph(){
    global.force.nodes(graph.nodes).links(graph.edges).start();

    //Disegno dei nodi
    let nodes = global.vis.selectAll('.node')
      .data(graph.nodes, d=> d.id);

    let newNodes = nodes.enter().append('g')
      .attr('class','node')
      .on('click',handleNodeClick);

    newNodes.append('circle')
      .attr('r',18)
      .attr('stroke', d => global.colorify(d.color)) // Bordo
      .attr('fill',d => d3.hcl(global.colorify(d.color)).brighter(3)); // Riempimento più chiaro

    newNodes.append('text') // Etichetta con id nodo
      .text(d => d.id)
      .attr('dy','0.35em')
      .attr('fill',d => global.colorify(d.color));

    nodes.exit().remove();

    // Disegna gli archi
    let edges = global.vis.selectAll('.link')
      .data(graph.edges, d => `${d.source.id}->${d.target.id}`);

    let newEdges = edges.enter().insert('line','.node')
      .attr('class','link')
      .on('click',handleEdgeClick);

    edges.exit().remove();

    // Aggiorna la selezione globale
    d3.selectAll('.node').classed('selected',d => d===global.selection);
    d3.selectAll('.link').classed('selected',d => d===global.selection);
  }

  function handleNodeClick(d){
    global.selection=d;
    d3.selectAll('.node').classed('selected',d2 => d2===d);
    d3.selectAll('.link').classed('selected',false);
  }

  function handleEdgeClick(d){
    global.selection=d;
    d3.selectAll('.link').classed('selected', d2 => d2 === d);
    d3.selectAll('.node').classed('selected', false);
  }


  /*Funzione per disegnare un nuovo arco tra due nodi trascinando col mouse*/
  function addEdgeOnDrag(selection){
    let new_edge_source = null;
    let drag_edge = null;

    selection.on('mousedown.addEdge', function(source){
      new_edge_source = source;
      const p = d3.mouse(global.vis.node());

      drag_edge= global.vis.insert('line', '.node')
        .attr('class','drag_edge')
        .attr('x1',source.x)
        .attr('y1', source.y)
        .attr('x2', p[0])
        .attr('y2', p[1]);

        d3.event.stopPropagation();
        d3.event.preventDefault();
      }).on('mouseup.addEdge',function(target){
        if(new_edge_source && new_edge_source !== target){
          const newEdge = graph.addEdge(new_edge_source,target);
          if(newEdge){
            drawGraph();
          }
        }
        new_edge_source=null;
        drag_edge.remove();
      });
  }
});