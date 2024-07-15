document.addEventListener('DOMContentLoaded', function() {
    // Set up SVG canvas dimensions
    const width = document.getElementById('graph-canvas').clientWidth;
    const height = document.getElementById('graph-canvas').clientHeight;

    const svg = d3.select("#graph-canvas")
        .attr("width", width)
        .attr("height", height);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Graph data
    const graph = {
        nodes: [],
        links: []
    };

    // Force simulation setup
    const simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line");

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle");

    function update() {
        const links = link.data(graph.links);
        const nodes = node.data(graph.nodes);

        links.exit().remove();
        nodes.exit().remove();

        const linksEnter = links.enter().append("line")
            .attr("stroke-width", 5)
            .attr("stroke", "#999");

        const nodesEnter = nodes.enter().append("circle")
            .attr("r", 10)
            .attr("fill", d => color(d.group))
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        link.merge(linksEnter);
        node.merge(nodesEnter);

        simulation.nodes(graph.nodes);
        simulation.force("link").links(graph.links);
        simulation.alpha(1).restart();
    }

    function ticked() {
        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Toolbar interactions
    document.getElementById('add-node').addEventListener('click', () => {
        const id = graph.nodes.length + 1;
        graph.nodes.push({ id: id, group: 1 });
        update();
    });

    document.getElementById('add-link').addEventListener('click', () => {
        if (graph.nodes.length > 1) {
            const source = graph.nodes[graph.nodes.length - 2];
            const target = graph.nodes[graph.nodes.length - 1];
            graph.links.push({ source: source.id, target: target.id });
            update();
        }
    });

    document.getElementById('svg-download').addEventListener('click', () => {
        const svgData = new XMLSerializer().serializeToString(document.querySelector('svg'));
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'graph.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });

    document.getElementById('json-download').addEventListener('click', () => {
        const dataStr = JSON.stringify(graph);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'graph.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });

    document.getElementById('json-upload').addEventListener('click', () => {
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = 'application/json';
        uploadInput.onchange = (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const json = JSON.parse(e.target.result);
                graph.nodes = json.nodes;
                graph.links = json.links;
                update();
            };
            reader.readAsText(file);
        };
        uploadInput.click();
    });

    document.getElementById('help-icon').addEventListener('click', () => {
        document.getElementById('popup').style.display = 'flex';
    });

    document.getElementById('close-popup').addEventListener('click', () => {
        document.getElementById('popup').style.display = 'none';
    });

    // Zoom controls
    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
            svg.attr('transform', event.transform);
        });

    svg.call(zoom);

    document.getElementById('zoom-in').addEventListener('click', () => {
        svg.transition().call(zoom.scaleBy, 1.2);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        svg.transition().call(zoom.scaleBy, 0.8);
    });

    // Initialize the graph with a couple of nodes and a link
    graph.nodes.push({ id: 1, group: 1 });
    graph.nodes.push({ id: 2, group: 1 });
    graph.links.push({ source: 1, target: 2 });
    update();
});
