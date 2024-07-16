(function() {

    var drag_add_link, global, graph, height, update, width,
      __indexOf = Array.prototype.indexOf || function(item) {
          for (var i = 0, l = this.length; i < l; i++)
              {
              if (i in this && this[i] === item)
                  return i;
              } return -1;
          };
  
    width = 960;
    height = 500;
  
    /* SELECTION - store the selected node */
  
    /* EDITING - store the drag mode (either 'drag' or 'add_link') */
  
    global = {
      selection: null,
    };
  
    /* create some fake data
    */
    graph = {
      nodes: [
        {
          id: '1',
          label:"a",
          type: 'blue'
        }, {
          id: '2',
          label:"b",
          x: 793,
          y: 364,
          type: 'blue'
        }, {
          id: '3',
          label:"c",
          x: 442,
          y: 365,
          type: 'orange'
        }, {
          id: '4',
          label:"d",
          x: 467,
          y: 314,
          type: 'green'
        }
       ],
      edges: [
        {
          id:"1",
          source: '1',
          target: '2',
          label:"a->b",
        }, {
          id:"2",
          source: '2',
          target: '3',
          label:"B->C",
        }, {
          id:"3",
          source: '3',
          target: '1',
          label:"c->a",
        }, {
          id:"4",
          source: '4',
          target: '1',
          label:"d->a",
        }, {
          id:"5",
          source: '4',
          target: '2',
          label:"d->b",
        }
      ],
  
      last_index: 5,
      links_index:6,
  
      objectify: (function() {
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
      }),
  
      remove: (function(condemned) {
        // remove the given node or link from the graph, also deleting dangling edges if a node is removed
        if (__indexOf.call(graph.nodes, condemned) >= 0) {
          graph.nodes = graph.nodes.filter(function(n) {
            return n !== condemned;
          });
          return graph.edges = graph.edges.filter(function(l) {
            return l.source.id !== condemned.id && l.target.id !== condemned.id;
          });
        }
        // this part is for deleting the single link
        else if (__indexOf.call(graph.edges, condemned) >= 0) {
          return graph.edges = graph.edges.filter(function(l) {
            return l !== condemned;
          });
        }
      }),
  
      add_node: (function(type) {
        var newNode;
        newNode = {
          id: graph.last_index++,
          label:"node: "+ graph.last_index,
          x: width / 2,
          y: height / 2,
          type: type
        };
        //mette il nodo nel grafo
        graph.nodes.push(newNode);
        return newNode;
      }),
  
      add_link: (function(source, target) {
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
          label:source.id + "->" + target.id,
          source: source,
          target: target
        };
        graph.edges.push(newEdge);
        return newEdge;
      }),
  
      add_modified_link:(function(source, target, mod_id, mod_lab) {
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
      })
    };
  
    graph.objectify();
  
    window.main = (function () {
      // create the SVG
      var container, library, svg, toolbar;
  
      svg = d3.select('.mainArea');

      // Initialize editor at first open
      document.getElementById("node_id").value = "";
      document.getElementById("node_label").value = "";
      document.getElementById("node_type").value = "";

      // ZOOM and PAN
      // create container elements
      container = svg.append('g');
  
      container.call(d3.behavior.zoom().scaleExtent([0.5, 8]).on('zoom', (function () {
        return global.vis.attr('transform', "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      })));
  
      global.vis = container.append('g');
      // create a rectangular overlay to catch events
  
      // WARNING rect size is huge but not infinite. this is a dirty hack
      global.vis.append('rect').attr('class', 'overlay')
          .attr('x', -500000).attr('y', -500000).attr('width', 1000000).attr('height', 1000000)
          .on('click', (function (d) {
        // SELECTION
        global.selection = null;
  
        d3.selectAll('.node').classed('selected', false);
        return d3.selectAll('.link').classed('selected', false);
      }));
  
      // END ZOOM and PAN
  
      global.colorify = d3.scale.category10();
  
      // initialize the force layout
      global.force = d3.layout.force().size([width, height]).charge(-2000).linkDistance(100).on('tick', (function () {
        // update nodes and edges
        global.vis.selectAll('.node').attr('transform', function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
        return global.vis.selectAll('.link').attr('x1', function (d) {
          return d.source.x;
        }).attr('y1', function (d) {
          return d.source.y;
        }).attr('x2', function (d) {
          return d.target.x;
        }).attr('y2', function (d) {
          return d.target.y;
        });
      }));
  
      // DRAG
      global.drag = global.force.drag().on('dragstart');
  
      function isEditable(selection){
        if (selection !== null) {
          if (__indexOf.call(graph.nodes, selection) >= 0) {
            return "node";
          } else {
            return "link";
          }
         }
        return null;
      }
  
      function isAvailableId(selection, new_id, mode) {
        // se la selezione è un nodo
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
  
        // se la selezione è un arco
        if (mode === "link") {
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
          if (isAvailableId(selection, document.getElementById("node_id").value, "node")) {
            let modified_node = {
              id: document.getElementById("node_id").value,
              label: document.getElementById("node_label").value,
              x: selection.x,
              y: selection.y,
              type: document.getElementById("node_type").value
            };
            let connectedNodes = neighborsOfNode(selection);
            graph.remove(selection);
            graph.nodes.push(modified_node);
            for (let i = 0; i < connectedNodes.length; i++) {
              graph.add_link(modified_node, connectedNodes[i]);
            }
          }
        }
        else if (mode === "link") {
          if (isAvailableId(selection, document.getElementById("node_id").value, "link")) {
            graph.remove(selection);
            graph.add_modified_link(selection.source, selection.target, document.getElementById("node_id").value, document.getElementById("node_label").value);
          }
        global.selection = null;
        update();
        }
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
  
      /* TOOLBAR */
      toolbar = $("<div class='toolbar'></div>");
      $('body').append(toolbar);
      toolbar.append($("<svg\n    class='active tool'\n    data-tool='pointer'\n    xmlns='http://www.w3.org/2000/svg'\n    version='1.1'\n    width='32'\n    height='32'\n    viewBox='0 0 128 128'>\n    <g transform='translate(881.10358,-356.22543)'>\n      <g transform='matrix(0.8660254,-0.5,0.5,0.8660254,-266.51112,-215.31898)'>\n        <path\n           d='m -797.14902,212.29589 a 5.6610848,8.6573169 0 0 0 -4.61823,4.3125 l -28.3428,75.0625 a 5.6610848,8.6573169 0 0 0 4.90431,13 l 56.68561,0 a 5.6610848,8.6573169 0 0 0 4.9043,-13 l -28.3428,-75.0625 a 5.6610848,8.6573169 0 0 0 -5.19039,-4.3125 z m 0.28608,25.96875 18.53419,49.09375 -37.06838,0 18.53419,-49.09375 z'\n        />\n        <path\n           d='m -801.84375,290.40625 c -2.09434,2.1e-4 -3.99979,1.90566 -4,4 l 0,35.25 c 2.1e-4,2.09434 1.90566,3.99979 4,4 l 10,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-35.25 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 z'\n        />\n      </g>\n    </g>\n</svg>"));
      toolbar.append($("<svg\n    class='tool'\n    data-tool='add_node'\n    xmlns='http://www.w3.org/2000/svg'\n    version='1.1'\n    width='32'\n    height='32'\n    viewBox='0 0 128 128'>\n    <g transform='translate(720.71649,-356.22543)'>\n      <g transform='translate(-3.8571429,146.42857)'>\n        <path\n           d='m -658.27638,248.37149 c -1.95543,0.19978 -3.60373,2.03442 -3.59375,4 l 0,12.40625 -12.40625,0 c -2.09434,2.1e-4 -3.99979,1.90566 -4,4 l 0,10 c -0.007,0.1353 -0.007,0.27095 0,0.40625 0.19978,1.95543 2.03442,3.60373 4,3.59375 l 12.40625,0 0,12.4375 c 2.1e-4,2.09434 1.90566,3.99979 4,4 l 10,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-12.4375 12.4375,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-10 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -12.4375,0 0,-12.40625 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -10,0 c -0.1353,-0.007 -0.27095,-0.007 -0.40625,0 z'\n        />\n        <path\n           d='m -652.84375,213.9375 c -32.97528,0 -59.875,26.86847 -59.875,59.84375 0,32.97528 26.89972,59.875 59.875,59.875 32.97528,0 59.84375,-26.89972 59.84375,-59.875 0,-32.97528 -26.86847,-59.84375 -59.84375,-59.84375 z m 0,14 c 25.40911,0 45.84375,20.43464 45.84375,45.84375 0,25.40911 -20.43464,45.875 -45.84375,45.875 -25.40911,0 -45.875,-20.46589 -45.875,-45.875 0,-25.40911 20.46589,-45.84375 45.875,-45.84375 z'\n        />\n      </g>\n    </g>\n</svg>"));
      toolbar.append($("<svg\n    class='tool'\n    data-tool='add_link'\n    xmlns='http://www.w3.org/2000/svg'\n    version='1.1'\n    width='32'\n    height='32'\n    viewBox='0 0 128 128'>\n<g transform='translate(557.53125,-356.22543)'>\n    <g transform='translate(20,0)'>\n      <path\n         d='m -480.84375,360 c -15.02602,0 -27.375,12.31773 -27.375,27.34375 0,4.24084 1.00221,8.28018 2.75,11.875 l -28.875,28.875 c -3.59505,-1.74807 -7.6338,-2.75 -11.875,-2.75 -15.02602,0 -27.34375,12.34898 -27.34375,27.375 0,15.02602 12.31773,27.34375 27.34375,27.34375 15.02602,0 27.375,-12.31773 27.375,-27.34375 0,-4.26067 -0.98685,-8.29868 -2.75,-11.90625 L -492.75,411.96875 c 3.60156,1.75589 7.65494,2.75 11.90625,2.75 15.02602,0 27.34375,-12.34898 27.34375,-27.375 C -453.5,372.31773 -465.81773,360 -480.84375,360 z m 0,14 c 7.45986,0 13.34375,5.88389 13.34375,13.34375 0,7.45986 -5.88389,13.375 -13.34375,13.375 -7.45986,0 -13.375,-5.91514 -13.375,-13.375 0,-7.45986 5.91514,-13.34375 13.375,-13.34375 z m -65.375,65.34375 c 7.45986,0 13.34375,5.91514 13.34375,13.375 0,7.45986 -5.88389,13.34375 -13.34375,13.34375 -7.45986,0 -13.34375,-5.88389 -13.34375,-13.34375 0,-7.45986 5.88389,-13.375 13.34375,-13.375 z'\n      />\n      <path\n         d='m -484.34375,429.25 c -1.95543,0.19978 -3.60373,2.03442 -3.59375,4 l 0,12.40625 -12.40625,0 c -2.09434,2.1e-4 -3.99979,1.90566 -4,4 l 0,10 c -0.007,0.1353 -0.007,0.27095 0,0.40625 0.19978,1.95543 2.03442,3.60373 4,3.59375 l 12.40625,0 0,12.4375 c 2.1e-4,2.09434 1.90566,3.99979 4,4 l 10,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-12.4375 12.4375,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-10 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -12.4375,0 0,-12.40625 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -10,0 c -0.1353,-0.007 -0.27095,-0.007 -0.40625,0 z'\n      />\n    </g>\n  </g>\n</svg>"));
  
      d3.select(".toolbar")
          .append('svg')
          .attr("class", "tool")
          .attr("data-tool", "split")
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .attr("version", "1.1")
          .attr("height", "32")
          .attr("width", "32")
          .attr("viewBox", "0 0 128 128")
          .append("image")
          .attr("id", "splitIcon")
          .attr("height", "125px")
          .attr("width", "125px")
          .attr("href", "img/scissor.png")
          .on("click", function () {
            return null;
          });
  
        d3.select(".toolbar")
            .append('svg')
            .attr("class", "tool")
            .attr("data-tool", "split")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("version", "1.1")
            .attr("height", "32")
            .attr("width", "32")
            .attr("viewBox", "0 0 128 128")
            .append("image")
            .attr("id", "glueIcon")
            .attr("height", "125px")
            .attr("width", "125px")
            .attr("href", "img/glue.png")
            .on("click", function () {
              return null;
            });
  
        d3.select(".toolbar")
            .append('svg')
            .attr("class", "tool")
            .attr("data-tool", "split")
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("version", "1.1")
            .attr("height", "32")
            .attr("width", "32")
            .attr("viewBox", "0 0 128 128")
            .append("image")
            .attr("id", "trashIcon")
            .attr("height", "105px")
            .attr("width", "105px")
            .attr("href", "img/trash.jpg")
            .on("click", function () {
                graph.remove(global.selection);
                global.selection = null;
                return update();
            });
  
        d3.select('#submit_node_changes').on("click", function () {
           submit_changes(global.selection);
        });
  
      library = $("<div class='library'></div></div>");
      toolbar.append(library);
      ['blue', 'orange', 'green', 'red', 'violet'].forEach(function (type) {
        var new_btn;
        new_btn = $("<svg width='42' height='42'>\n    <g class='node'>\n        <circle\n            cx='21'\n            cy='21'\n            r='18'\n            stroke='" + (global.colorify(type)) + "'\n            fill='" + (d3.hcl(global.colorify(type)).brighter(3)) + "'\n        />\n    </g>\n</svg>");
        new_btn.bind('click', function () {
          graph.add_node(type);
          return update();
        });
        library.append(new_btn);
        return library.hide();
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
  
      // BUTTONS
      divButtons = $(" <div\n   class='buttons' id='buttons'  </div>" );
      buttonSaveDrawing = $("<button class='saveButton' id='artificialJson' style='margin-right: 50px;' >Save Drawing</button>" );
      buttonLoadJson = $("<input class='saveButton' type=\"file\" id=\"files\" name=\"files[]\" multiple />\n" );
  
      $('body').append(divButtons);
      divButtons.append(buttonSaveDrawing);
      divButtons.append(buttonLoadJson);
  
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
      var button = document.getElementById(buttonSaveDrawing[0].id);
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
  
      document.getElementById(buttonLoadJson[0].id).addEventListener('change', handleFileSelect, false);
  
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
  
      // ripetizione ?
      document.getElementById(buttonLoadJson[0].id).addEventListener('change', handleFileSelect, false);
  
      return d3.selectAll('.tool').on('click', function () {
        var new_tool, nodes;
        d3.selectAll('.tool').classed('active', false);
        d3.select(this).classed('active', true);
        new_tool = $(this).data('tool'); // ricava il nome del tool
        nodes = global.vis.selectAll('.node');
        if (new_tool === 'add_link' && global.tool !== 'add_link') {
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
        if (new_tool === 'add_node') {
          library.show();
        } else {
          library.hide();
        }
        return global.tool = new_tool;
      });
    });
  
    update = function() {
      // update the layout
      
      var edges, new_nodes, nodes;
      global.force.nodes(graph.nodes).links(graph.edges).start();
      /* create nodes and edges
         (edges are drawn with insert to make them appear under the nodes)
         also define a drag behavior to drag nodes
         dragged nodes become fixed
      */
  
      nodes = global.vis.selectAll('.node').data(graph.nodes, function(d) {
        return d.id;
      });
      new_nodes = nodes.enter().append('g').attr('class', 'node').on('click', (function(d) {
            // SELECTION   
            global.selection = d;
            d3.selectAll('.node').classed('selected', function(d2) {
              return d2 === d;
            });
            return d3.selectAll('.link').classed('selected', false);
      }));
  
      edges = global.vis.selectAll('.link').data(graph.edges, function(d) {
        return "" + d.source.id + "->" + d.target.id;
      });
  
      edges.enter().insert('line', '.node').attr('class', 'link').on('click', (function(d) {
            // SELECTION
            global.selection = d;
            d3.selectAll('.link').classed('selected', function(d2) {
              return d2 === d;
            });
            return d3.selectAll('.node').classed('selected', false);
      }));
      edges.exit().remove();
  
      // TOOLBAR - add link tool initialization for new nodes
      if (global.tool === 'add_link') {
        new_nodes.call(drag_add_link);
      } else {
        new_nodes.call(global.drag);
      }
      new_nodes.append('circle')
          .attr('r', function(d) {return 18;})
          .attr('stroke', function(d) {return global.colorify(d.type);})
          .attr('fill', function(d) {return d3.hcl(global.colorify(d.type)).brighter(3);});
      
      // draw the labels
  
      new_nodes.append('text')
          .text(function(d) {return d.id;})
          .attr('dy', '0.35em')
          .attr('fill', function(d) {return global.colorify(d.type);});
      return nodes.exit().remove();
    };
  
    drag_add_link = function(selection) {
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
  
  }).call(this);