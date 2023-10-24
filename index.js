class Cluster {
    points = [];
    shape = [];
    _gradient = null;
    avgX = 0;
    avgY = 0;
    addPointsFromPoint(point) {
        if (!point.isCore()) {
            this.addPoint(point);
            return;
        }
        const openSet = [point];
        const closedSet = [];
        while (openSet.length > 0) {
            const processingPoint = openSet.shift();
            closedSet.push(processingPoint);
            for (let i = 0; i < processingPoint.distancesSq.size() && processingPoint.distancesSq.get(i).distSq <= MAX_DISTANCE ** 2; i++) {
                const subPoint = processingPoint.distancesSq.get(i).point;
                if (!subPoint.isCore()) {
                    if (!closedSet.some(x => x.equals(subPoint)))
                        closedSet.push(subPoint);
                }
                else if (!openSet.some(x => x.equals(subPoint)) && !closedSet.some(x => x.equals(subPoint)))
                    openSet.push(subPoint);
            }
        }
        for (const p of closedSet) {
            this.addPoint(p);
            p.cluster = this;
        }
    }
    addPoint(point) {
        if (this.points.some(x => x.equals(point)))
            return;
        point.cluster = this;
        this.points.push(point);
        if (this.points.length == 1) {
            this.avgX = point.screenX;
            this.avgY = point.screenY;
        }
        else {
            this.avgX -= this.avgX / this.points.length;
            this.avgX += point.screenX / this.points.length;
            this.avgY -= this.avgY / this.points.length;
            this.avgY += point.screenY / this.points.length;
        }
        this.recalculateShape();
    }
    removePoint(point) {
        const index = this.points.findIndex(x => x.equals(point));
        if (index < 0)
            return;
        this.points.splice(index, 1);
        for (const point of this.points)
            point.cluster = null;
        for (const point of this.points) {
            if (point.cluster)
                continue;
            point.tryFormCluster();
        }
        this.avgX = this.points.reduce((a, b) => a + b.screenX, 0) / this.points.length;
        this.avgY = this.points.reduce((a, b) => a + b.screenY, 0) / this.points.length;
        this.recalculateShape();
    }
    recalculateShape() {
        const points = [];
        for (const point of this.points) {
            const x = point.screenX - this.avgX;
            const y = point.screenY - this.avgY;
            const angle = Math.atan2(y, x);
            points.push({ point, x, y, angle, crossProd: -123321 });
        }
        points.sort((a, b) => a.angle - b.angle);
        let minY = HEIGHT;
        let maxY = 0;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const p3 = points[(i + 2) % points.length];
            const vec12X = p2.x - p1.x;
            const vec12Y = p2.y - p1.y;
            const vec23X = p3.x - p2.x;
            const vec23Y = p3.y - p2.y;
            const crossProd = vec12X * vec23Y - vec12Y * vec23X;
            if (crossProd <= 0) {
                points.splice((i + 1) % points.length, 1);
                i = -1;
            }
            else {
                points[i].crossProd = crossProd;
                if (p2.point.screenY > maxY)
                    maxY = p2.point.screenY;
                if (p2.point.screenY < minY)
                    minY = p2.point.screenY;
            }
        }
        this._gradient = CTX.createLinearGradient(0, minY, 0, maxY);
        this._gradient.addColorStop(0, "#F15A24");
        this._gradient.addColorStop(1, "#FBB03B");
        this.shape = points.map(x => {
            const vecLen = Math.sqrt(x.x ** 2 + x.y ** 2);
            const xNorm = x.x / vecLen;
            const yNorm = x.y / vecLen;
            return {
                x: this.avgX + x.x,
                y: this.avgY + x.y,
                xOuter: this.avgX + xNorm * (vecLen + 10),
                yOuter: this.avgY + yNorm * (vecLen + 10),
                xInner: this.avgX + xNorm * (vecLen - 10),
                yInner: this.avgY + yNorm * (vecLen - 10)
            };
        });
    }
    draw() {
        CTX.fillStyle = this._gradient;
        CTX.strokeStyle = "white";
        CTX.lineWidth = 1.5;
        CTX.beginPath();
        this.roundedPoly(this.shape.map(x => ({ x: x.xOuter, y: x.yOuter })), 20);
        CTX.closePath();
        CTX.fill();
        CTX.globalCompositeOperation = "destination-out";
        CTX.beginPath();
        this.roundedPoly(this.shape.map(x => ({ x: x.xInner, y: x.yInner })), 16);
        CTX.closePath();
        CTX.fill();
        CTX.globalCompositeOperation = "source-over";
        CTX.beginPath();
        this.roundedPoly(this.shape.map(x => ({ x: x.xOuter, y: x.yOuter })), 20);
        CTX.closePath();
        CTX.stroke();
        CTX.beginPath();
        this.roundedPoly(this.shape.map(x => ({ x: x.xInner, y: x.yInner })), 16);
        CTX.closePath();
        CTX.stroke();
        CTX.beginPath();
        CTX.moveTo(this.avgX, this.avgY + 4);
        CTX.lineTo(this.avgX + 8, this.avgY + 12);
        CTX.lineTo(this.avgX + 12, this.avgY + 8);
        CTX.lineTo(this.avgX + 4, this.avgY);
        CTX.lineTo(this.avgX + 12, this.avgY - 8);
        CTX.lineTo(this.avgX + 8, this.avgY - 12);
        CTX.lineTo(this.avgX, this.avgY - 4);
        CTX.lineTo(this.avgX - 8, this.avgY - 12);
        CTX.lineTo(this.avgX - 12, this.avgY - 8);
        CTX.lineTo(this.avgX - 4, this.avgY);
        CTX.lineTo(this.avgX - 12, this.avgY + 8);
        CTX.lineTo(this.avgX - 8, this.avgY + 12);
        CTX.lineTo(this.avgX, this.avgY + 4);
        CTX.closePath();
        CTX.fill();
        CTX.stroke();
        const num = this.points.length.toString();
        const numMeasurement = CTX.measureText(num);
        CTX.fillStyle = "white";
        CTX.fillRect(this.avgX - numMeasurement.width / 2 - 8, this.avgY + 16, numMeasurement.width + 16, 38);
        CTX.fillStyle = this._gradient;
        CTX.fillText(num, this.avgX - numMeasurement.width / 2, this.avgY + 20);
    }
    roundedPoly(points, radius) {
        var i, x, y, len, p1, p2, p3, v1, v2, sinA, sinA90, radDirection, drawDirection, angle, halfAngle, cRadius, lenOut;
        var asVec = function (p, pp, v) {
            v.x = pp.x - p.x;
            v.y = pp.y - p.y;
            v.len = Math.sqrt(v.x * v.x + v.y * v.y);
            v.nx = v.x / v.len;
            v.ny = v.y / v.len;
            v.ang = Math.atan2(v.ny, v.nx);
        };
        v1 = {};
        v2 = {};
        len = points.length;
        p1 = points[len - 1];
        for (i = 0; i < len; i++) {
            p2 = points[(i) % len];
            p3 = points[(i + 1) % len];
            asVec(p2, p1, v1);
            asVec(p2, p3, v2);
            sinA = v1.nx * v2.ny - v1.ny * v2.nx;
            sinA90 = v1.nx * v2.nx - v1.ny * -v2.ny;
            angle = Math.asin(sinA);
            radDirection = 1;
            drawDirection = false;
            if (sinA90 < 0) {
                if (angle < 0) {
                    angle = Math.PI + angle;
                }
                else {
                    angle = Math.PI - angle;
                    radDirection = -1;
                    drawDirection = true;
                }
            }
            else {
                if (angle > 0) {
                    radDirection = -1;
                    drawDirection = true;
                }
            }
            halfAngle = angle / 2;
            lenOut = Math.abs(Math.cos(halfAngle) * radius / Math.sin(halfAngle));
            if (lenOut > Math.min(v1.len / 2, v2.len / 2)) {
                lenOut = Math.min(v1.len / 2, v2.len / 2);
                cRadius = Math.abs(lenOut * Math.sin(halfAngle) / Math.cos(halfAngle));
            }
            else {
                cRadius = radius;
            }
            x = p2.x + v2.nx * lenOut;
            y = p2.y + v2.ny * lenOut;
            x += -v2.ny * cRadius * radDirection;
            y += v2.nx * cRadius * radDirection;
            CTX.arc(x, y, cRadius, v1.ang + Math.PI / 2 * radDirection, v2.ang - Math.PI / 2 * radDirection, drawDirection);
            p1 = p2;
            p2 = p3;
        }
        CTX.closePath();
    }
}
class Point {
    static RADIUS = 64;
    id;
    x;
    y;
    screenX;
    screenY;
    distancesSq = new SortableCollection((a, b) => a.distSq - b.distSq);
    cluster = null;
    img = null;
    constructor(id, x, y, points) {
        this.id = id;
        this.setPos(x, y, points);
    }
    renderAsEmote(img) {
        this.img = img;
    }
    setPos(x, y, points) {
        this.x = x;
        this.y = y;
        this.screenX = x * WIDTH;
        this.screenY = y * HEIGHT;
        this.recalculateDistances(points);
        this.tryFormCluster();
    }
    recalculateDistances(points) {
        this.distancesSq.clear();
        for (const point of points) {
            if (point.equals(this))
                continue;
            const distSq = (this.screenX - point.screenX) ** 2 + (this.screenY - point.screenY) ** 2;
            this.distancesSq.set(point.id, { point, distSq });
            point.addDistance(this, distSq);
        }
    }
    tryFormCluster() {
        if (this.distancesSq.size() < MIN_NUMBER_OF_POINTS)
            return;
        if (this.isCore()) {
            this.cluster = new Cluster();
            this.cluster.addPointsFromPoint(this);
        }
        else {
            for (let i = 0; i < this.distancesSq.size() && this.distancesSq.get(i).distSq < MAX_DISTANCE ** 2; i++) {
                const point = this.distancesSq.get(i).point;
                if (point.cluster && point.isCore())
                    point.cluster.addPoint(this);
            }
        }
    }
    addDistance(point, distSq) {
        this.distancesSq.set(point.id, { point, distSq });
    }
    removeDistance(point) {
        this.distancesSq.remove(point.id);
    }
    draw() {
        if (this.img)
            CTX.drawImage(this.img, this.screenX - 32, this.screenY - 32, 64, 64);
        else
            CTX.drawImage(MARKER_SPRITE, this.screenX - 32, this.screenY - 60, 64, 64);
    }
    equals(p) {
        return this.id == p.id;
    }
    isInside(screenX, screenY) {
        return (this.screenX - screenX) ** 2 + (this.screenY - screenY) ** 2 <= Point.RADIUS ** 2;
    }
    isCore() {
        return MIN_NUMBER_OF_POINTS <= this.distancesSq.size()
            && this.distancesSq.get(MIN_NUMBER_OF_POINTS - 1).distSq <= MAX_DISTANCE ** 2;
    }
}
class SortableCollection {
    _map = new Map();
    _items = [];
    _comparator;
    constructor(comparator) {
        this._comparator = comparator;
    }
    set(key, item) {
        const index = this._map.get(key);
        if (index !== undefined)
            this.remove(key);
        let left = 0;
        let right = this._items.length;
        while (left != right) {
            let center = Math.floor((right + left) / 2);
            if (this._comparator(item, this._items[center]) < 0)
                right = center;
            else
                left = center + 1;
        }
        for (const key2 of this._map.keys())
            if (left <= this._map.get(key2))
                this._map.set(key2, this._map.get(key2) + 1);
        this._items.splice(left, 0, item);
        this._map.set(key, left);
    }
    remove(key) {
        const index = this._map.get(key);
        if (index === undefined)
            return undefined;
        this._map.delete(key);
        for (const key2 of this._map.keys())
            if (index < this._map.get(key2))
                this._map.set(key2, this._map.get(key2) - 1);
        return this._items.splice(index, 1)[0];
    }
    get(key) {
        if (typeof key === "number")
            return this._items[key];
        const index = this._map.get(key);
        if (index === undefined)
            return undefined;
        return this._items[index];
    }
    size() {
        return this._items.length;
    }
    clear() {
        this._map.clear();
        this._items = [];
    }
}
var WIDTH = 0;
var HEIGHT = 0;
var CANVAS = null;
var CTX = null;
var BODY = null;
var SCALE = 0.5;
var MAX_DISTANCE = 76;
var MIN_NUMBER_OF_POINTS = 9;
var emotesUrls = ["https://static-cdn.jtvnw.net/emoticons/v2/307208203/static/light/2.0"];
const MARKER_SPRITE = new Image(32, 32);
MARKER_SPRITE.src = "img/marker.svg";
const POINTS = [];
const EMOTE_POINTS = [];
const kanaClicks = [];
let borders = { x: 0.26979166666666665, y: 0.2638888888888889 };
const savedBorders = localStorage.getItem("borders");
if (savedBorders) {
    try {
        borders = JSON.parse(savedBorders);
        if (!borders.x)
            borders.x = 0.26979166666666665;
        if (!borders.y)
            borders.y = 0.2638888888888889;
    }
    catch { }
}
(async () => {
    const response = await fetch("emotes.json");
    emotesUrls = await response.json();
})();
document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channelId');
    SCALE = 1 / parseFloat(urlParams.get('scale') ?? "0.5");
    MAX_DISTANCE = parseInt(urlParams.get('clusterDistance') ?? "76");
    MIN_NUMBER_OF_POINTS = parseInt(urlParams.get('clusterPointsAmount') ?? "10") - 1;
    BODY = document.getElementsByTagName("body")[0];
    CANVAS = document.getElementById("cnvs");
    WIDTH = CANVAS.width = document.body.offsetWidth * SCALE;
    HEIGHT = CANVAS.height = document.body.offsetHeight * SCALE;
    CTX = CANVAS.getContext("2d");
    CTX.imageSmoothingQuality = "high";
    CTX.textBaseline = "top";
    CTX.font = "bold 34px Arial";
    var ws = new WebSocket("wss://heat-api.j38.net/channel/" + channelId);
    function wsOnMessage(ev) {
        const data = JSON.parse(ev.data);
        if (data.type == "click")
            createOrMovePoint(data.id, parseFloat(data.x), parseFloat(data.y));
    }
    function wsOnError() {
        ws.close();
        console.log("wsOnError");
    }
    function wsOnClose() {
        ws.close();
        setTimeout(() => {
            ws = new WebSocket("wss://heat-api.j38.net/channel/" + channelId);
            ws.onmessage = wsOnMessage;
            ws.onerror = wsOnError;
            ws.onclose = wsOnClose;
        }, 5000);
        console.log("wsOnClose");
    }
    ws.onmessage = wsOnMessage;
    ws.onerror = wsOnError;
    ws.onclose = wsOnClose;
    function draw() {
        CTX.clearRect(0, 0, WIDTH, HEIGHT);
        const clusters = new Set();
        for (const point of POINTS) {
            if (!point.cluster)
                point.draw();
            else
                clusters.add(point.cluster);
        }
        for (const cluster of clusters) {
            cluster.draw();
        }
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
});
function createOrMovePoint(id, x, y) {
    if (id == "128142135") {
        kanaClicks.push({ x, y });
        while (kanaClicks.length > 5)
            kanaClicks.shift();
        if (kanaClicks.length == 5 && kanaClicks.every(z => z.x == x && z.y == y)) {
            borders = { x, y };
            localStorage.setItem("borders", JSON.stringify(borders));
        }
    }
    let index = POINTS.findIndex(x => x.id == id);
    if (0 <= index)
        removePoint(POINTS[index]);
    index = EMOTE_POINTS.findIndex(x => x.id == id);
    if (0 <= index)
        removeEmotePoint(EMOTE_POINTS[index]);
    createPoint(id, x, y);
}
function createPoint(id, x, y) {
    const point = new Point(id, x, y, POINTS);
    if (x < borders.x && y > borders.y) {
        const emoteUrl = emotesUrls[Math.floor(Math.random() * emotesUrls.length)];
        const imgEl = document.createElement("img");
        imgEl.src = emoteUrl;
        imgEl.classList.add("emote-pin");
        imgEl.style.width = `${64 / SCALE}px`;
        imgEl.style.height = `${64 / SCALE}px`;
        imgEl.style.left = `${point.screenX / SCALE - 64 / SCALE / 2}px`;
        imgEl.style.top = `${point.screenY / SCALE - 64 / SCALE / 2}px`;
        point.renderAsEmote(imgEl);
        BODY.appendChild(imgEl);
        EMOTE_POINTS.push(point);
    }
    else
        POINTS.push(point);
    return point;
}
function removePoint(point) {
    const index = POINTS.findIndex(x => x.equals(point));
    POINTS.splice(index, 1);
    for (const point2 of POINTS)
        point2.removeDistance(point);
    if (point.cluster)
        point.cluster.removePoint(point);
}
function removeEmotePoint(point) {
    const index = EMOTE_POINTS.findIndex(x => x.equals(point));
    EMOTE_POINTS.splice(index, 1);
    point.img.remove();
}
//# sourceMappingURL=index.js.map