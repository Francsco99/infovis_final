document.getElementById('svg-download').addEventListener('click', function() {
    var svg = document.getElementById('graph-canvas');
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svg);

    // Add namespaces if they are not present
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Convert SVG source to URI data scheme.
    var svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    
    // Create filename
    var date = new Date();
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    var filename = day + '-' + month + '-' + year + '-graph.svg';

    // Create a link to trigger the download
    var a = document.createElement('a');
    a.download = filename;
    a.href = svgData;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
