class Cluster {
    static MIN_NUMBER_OF_POINTS = 9;
    static MAX_DISTANCE = 76;
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
            for (let i = 0; i < processingPoint.distancesSq.size() && processingPoint.distancesSq.get(i).distSq <= Cluster.MAX_DISTANCE ** 2; i++) {
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
    _img = null;
    constructor(id, x, y, points) {
        this.id = id;
        this.setPos(x, y, points);
    }
    renderAsEmote(img) {
        this._img = img;
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
        if (this.distancesSq.size() < Cluster.MIN_NUMBER_OF_POINTS)
            return;
        if (this.isCore()) {
            this.cluster = new Cluster();
            this.cluster.addPointsFromPoint(this);
        }
        else {
            for (let i = 0; i < this.distancesSq.size() && this.distancesSq.get(i).distSq < Cluster.MAX_DISTANCE ** 2; i++) {
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
        if (this._img)
            CTX.drawImage(this._img, this.screenX - 32, this.screenY - 32, 64, 64);
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
        return Cluster.MIN_NUMBER_OF_POINTS <= this.distancesSq.size()
            && this.distancesSq.get(Cluster.MIN_NUMBER_OF_POINTS - 1).distSq <= Cluster.MAX_DISTANCE ** 2;
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
const MARKER_SPRITE = new Image(32, 32);
MARKER_SPRITE.src = "img/marker.svg";
const POINTS = [];
const emotesUrls = ["https://static-cdn.jtvnw.net/emoticons/v2/307208203/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208182/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208194/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208198/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208253/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208202/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208206/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_f791816261484a1d851fd1aeaf1ae0a6/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208452/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208453/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208211/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208213/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208216/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208240/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208217/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208417/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_9703dd06af254ca8b15391c6d3b55c08/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_bc1d287504b74c1185fca70b9de2eef8/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208234/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_9468c8aed3aa4b6da69fcdfbec559209/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_936022f49de94e8c9064ae51b5e5d2e8/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_dbce4185fbe0404fbbec368c81ba2ae3/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208258/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208259/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208260/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208290/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208299/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208302/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307227742/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208325/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208315/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_fc5d33d332994cf493234523e57032c7/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208418/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208327/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208328/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_0b2b6df7585f4d4aa13197ae8a69f16c/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a797d6c446c342758748af7410fd3a48/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208340/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_586bb132dae744d38139a2c885856aa3/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_af7ca5e8a6ba4ffbb7f3efae7bf9c76f/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208347/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/308011000/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_627f63d0ce894ecc9a1815acdd341a4a/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208353/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208354/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d284d231d9624b878fab250837a0d460/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_5c10b31045d74181bc29ec0b7add8639/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208376/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208373/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d474267c23244d87ab2d361579401bdb/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208379/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_789aff2fb1324fe080a8a7e740e76bd4/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208382/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d8a1a70486e244f2adf364c70a9399c6/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208398/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_3972e232ad0140be99ca08ced8509d1f/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d25d89b798fe4ab9bcc0770f71e72c88/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208403/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208405/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208412/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208540/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208422/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208425/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208432/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208443/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_57a65238a2514b74aad2101d07ff5233/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208532/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208459/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_c04d79dd0bb04b7998e290887601410c/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208460/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208463/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208466/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208467/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208470/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208472/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_ef9299ca9f604207a5cf556b6ddd02b8/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_d8566a5e10204c73a510040da2a72098/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_f9ae4da6063c4951b09691ab59bf72dd/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_408a52b031a64651aeff454f98de8787/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_cf9c07c30a2146e7868b83029c505e68/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_9b9104d71159427fb09f5de3faac9e08/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_bf360018c4a34c1481f50128c6163f8e/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_3399b5f89cff417e96dd44cc7c771083/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/307208343/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_375d065ac5ea4d4cb453de40737f8972/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_5ecada6d47d64e2497679f6a8f3916f5/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_e0f0728e046a49a98470f39b871e88cf/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_73ea8d76245c4dec8eb33bddb542b306/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_eb30bd686093486c95bcb701a1b178a8/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_c5bb92388beb40a7b4a3323c25c66570/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_fd8e00e87a514c94a3f2ccae01766f5b/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_15cb1971f17c480db8190f5d67f7f06c/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_08f9ae157b284dad8922c2589cb679f0/2.0"];
for (let i = emotesUrls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emotesUrls[i], emotesUrls[j]] = [emotesUrls[j], emotesUrls[i]];
}
const emotes = emotesUrls.slice(0, 5).map(x => { const img = new Image(64, 64); img.src = x; return img; });
document.addEventListener("DOMContentLoaded", async function () {
    CANVAS = document.getElementById("cnvs");
    WIDTH = CANVAS.width = document.body.offsetWidth * 2;
    HEIGHT = CANVAS.height = document.body.offsetHeight * 2;
    CTX = CANVAS.getContext("2d");
    CTX.imageSmoothingQuality = "high";
    CTX.textBaseline = "top";
    CTX.font = "bold 34px Arial";
    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channelId');
    var ws = new WebSocket("wss://heat-api.j38.net/channel/" + channelId);
    function wsOnMessage(ev) {
        const data = JSON.parse(ev.data);
        if (data.type == "click")
            createOrMovePoint(data.id, parseFloat(data.x), parseFloat(data.y));
    }
    function wsOnError() {
        ws.close();
        setTimeout(() => {
            ws = new WebSocket("wss://heat-api.j38.net/channel/" + channelId);
            ws.onmessage = wsOnMessage;
            ws.onerror = wsOnError;
            ws.onclose = wsOnClose;
        }, 5000);
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
    const index = POINTS.findIndex(x => x.id == id);
    if (index >= 0)
        removePoint(POINTS[index]);
    createPoint(id, x, y);
}
function createPoint(id, x, y) {
    const point = new Point(id, x, y, POINTS);
    if (x < 0.26979166666666665 && y > 0.2638888888888889)
        point.renderAsEmote(emotes[Math.floor(Math.random() * emotes.length)]);
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
//# sourceMappingURL=index.js.map