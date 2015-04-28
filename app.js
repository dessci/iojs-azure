var http = require('http');
var fs = require('fs');
var jsdom = require('jsdom');
var opentype = require('opentype.js');
function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i)
        view[i] = buffer[i];
    return ab;
}
function loadToArrayBuffer(name) {
    return toArrayBuffer(fs.readFileSync(name));
}
function rnd(x) {
    return x; //Math.round(1000*x)/1000;
}
function toSVGPath(commands) {
    return commands.map(function (c) {
        switch (c.type) {
            case 'L':
            case 'M': return c.type + [c.x, c.y].map(rnd).join(' ');
            case 'C': return 'C' + [c.x1, c.y1, c.x2, c.y2, c.x, c.y].map(rnd).join(' ');
            case 'Q': return 'Q' + [c.x1, c.y1, c.x, c.y].map(rnd).join(' ');
            default: return c.type;
        }
    }).join(' ');
}
var svgNS = "http://www.w3.org/2000/svg", size3_font = opentype.parse(loadToArrayBuffer('./KaTeX_Size3-Regular.ttf')), math_font = opentype.parse(loadToArrayBuffer('./KaTeX_Math-Regular.ttf')), main_font = opentype.parse(loadToArrayBuffer('./KaTeX_Main-Regular.ttf')), viewBoxWidth = 480, viewBoxHeight = 280;
function setAttributes(el, attrs) {
    if (attrs)
        for (var key in attrs)
            if (attrs.hasOwnProperty(key))
                el.setAttribute(key, attrs[key]);
}
function addPath(parent, d, attrs) {
    var p = parent.ownerDocument.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    setAttributes(p, attrs);
    parent.appendChild(p);
}
function addCircle(parent, x, y, radius, attrs) {
    var circle = parent.ownerDocument.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '' + x);
    circle.setAttribute('cy', '' + y);
    circle.setAttribute('r', '' + radius);
    setAttributes(circle, attrs);
    parent.appendChild(circle);
}
function drawTextOutline(parent, font, x, y, fontSize, text) {
    var path = font.getPath(text, x, y, fontSize), d = toSVGPath(path.commands);
    addPath(parent, d);
}
function drawText(parent, fontFamily, x, y, fontSize, text) {
    var textEl = parent.ownerDocument.createElementNS(svgNS, 'text');
    textEl.setAttribute('x', '' + x);
    textEl.setAttribute('y', '' + y);
    textEl.setAttribute('font-family', fontFamily);
    textEl.setAttribute('font-size', '' + fontSize);
    //textEl.textContent = text;
    textEl.appendChild(parent.ownerDocument.createTextNode(text));
    parent.appendChild(textEl);
}
function drawRect(parent, x, y, width, height, attrs) {
    var rect = parent.ownerDocument.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', '' + x);
    rect.setAttribute('y', '' + y);
    rect.setAttribute('width', '' + width);
    rect.setAttribute('height', '' + height);
    setAttributes(rect, attrs);
    parent.appendChild(rect);
}
function getExtent(font, x, y, fontSize, text) {
    var metrics, scale = 1 / font.unitsPerEm * fontSize;
    font.forEachGlyph(text, x, y, fontSize, {}, function (glyph, x, y, gSize) {
        var met = glyph.getMetrics(), ymn = y - scale * met.yMax, ymx = y - scale * met.yMin;
        met.xMin = x + scale * met.xMin;
        met.xMax = x + scale * met.xMax;
        met.yMin = ymn;
        met.yMax = ymx;
        if (metrics) {
            metrics.xMin = Math.min(metrics.xMin, met.xMin);
            metrics.yMin = Math.min(metrics.yMin, met.yMin);
            metrics.xMax = Math.max(metrics.xMax, met.xMax);
            metrics.yMax = Math.max(metrics.yMax, met.yMax);
        }
        else {
            metrics = met;
            metrics.leftSideBearing *= scale;
        }
        metrics.rightSideBearing = scale * met.rightSideBearing;
    });
    return metrics;
}
function drawMetrics(parent, font, x, y, fontSize, text) {
    var extent = getExtent(font, x, y, fontSize, text), x1 = x + extent.leftSideBearing, x2 = x1 + (extent.xMax - extent.xMin) + extent.rightSideBearing;
    drawRect(parent, extent.xMin, extent.yMin, extent.xMax - extent.xMin, extent.yMax - extent.yMin, { 'stroke': '#88f' });
    addPath(parent, 'M' + x1 + ' ' + y + 'L' + x2 + ' ' + y, { 'stroke': '#8f8' });
    addCircle(parent, x1, y, 2, { 'stroke': 'none', 'fill': '#8f8' });
    addCircle(parent, x2, y, 2, { 'stroke': 'none', 'fill': '#8f8' });
}
function makeSVG(document, fontOutlines) {
    var svg = document.createElementNS(svgNS, 'svg'), g1 = document.createElementNS(svgNS, 'g'), g2 = document.createElementNS(svgNS, 'g'), date = new Date().toUTCString();
    svg.setAttribute('viewBox', '0 0 ' + viewBoxWidth + ' ' + viewBoxHeight);
    svg.setAttribute('xmlns', svgNS);
    drawRect(svg, 0, 0, viewBoxWidth, viewBoxHeight, { 'stroke': 'none', 'fill': '#f8f8f8' });
    setAttributes(g1, { 'stroke-width': '1', 'fill': 'none' });
    svg.appendChild(g1);
    setAttributes(g2, { 'fill': 'black', 'stroke': 'none' });
    svg.appendChild(g2);
    drawMetrics(g1, size3_font, 0, 165, 100, "\u221A");
    drawMetrics(g1, math_font, 110, 165, 100, "\u03C0");
    drawMetrics(g1, main_font, 180, 165, 20, date);
    if (fontOutlines) {
        drawTextOutline(g2, size3_font, 0, 165, 100, "\u221A");
        drawTextOutline(g2, math_font, 110, 165, 100, "\u03C0");
        drawTextOutline(g2, main_font, 180, 165, 20, date);
    }
    else {
        drawText(g2, 'KaTeX_Size3', 0, 165, 100, "\u221A");
        drawText(g2, 'KaTeX_Math', 110, 165, 100, "\u03C0");
        drawText(g2, 'KaTeX_Main', 180, 165, 20, date);
    }
    return svg;
}
function makeDocument() {
    var document = jsdom.jsdom('<!DOCTYPE html>' + '<style>html,body{padding: 0; margin: 0;} svg{width: ' + (2 * viewBoxWidth) + 'px;}</style>' + '<link rel="stylesheet" type="text/css" href="http://khan.github.io/KaTeX/lib/katex/katex.min.css">'), svg = makeSVG(document, false);
    document.body.appendChild(svg);
    return jsdom.serializeDocument(document);
}
function makeSVGImage() {
    var document = jsdom.jsdom(), svg = makeSVG(document, true);
    svg.setAttribute('width', (2 * viewBoxWidth) + 'px');
    svg.setAttribute('height', (2 * viewBoxHeight) + 'px');
    return '<?xml version="1.0" encoding="utf-8"?>' + svg.outerHTML;
}
function startWebServer() {
    var port = process.env.port || 1337;
    http.createServer(function (req, res) {
        if (req.url === '/math.html') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(makeDocument());
        }
        else if (req.url === '/math.svg') {
            res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
            res.end(makeSVGImage());
        }
        else {
            res.writeHead(404);
            res.end('Not found ' + req.url);
        }
    }).listen(port);
    console.log('Started web server on port ' + port);
}
startWebServer();
