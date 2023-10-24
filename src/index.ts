var WIDTH = 0;
var HEIGHT = 0;
var CANVAS: HTMLCanvasElement = null;
var CTX: CanvasRenderingContext2D = null;
var BODY: HTMLBodyElement = null;
var SCALE = 0.5;
var MAX_DISTANCE = 76;
var MIN_NUMBER_OF_POINTS = 9;

var emotesUrls = ["https://static-cdn.jtvnw.net/emoticons/v2/307208203/static/light/2.0"];

const MARKER_SPRITE = new Image(32, 32);
MARKER_SPRITE.src = "img/marker.svg";

const POINTS: Point[] = [];
const EMOTE_POINTS: Point[] = [];

const kanaClicks: { x: number, y: number }[] = [];
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
    CANVAS = document.getElementById("cnvs") as HTMLCanvasElement;
    WIDTH = CANVAS.width = document.body.offsetWidth * SCALE;
    HEIGHT = CANVAS.height = document.body.offsetHeight * SCALE;
    CTX = CANVAS.getContext("2d");

    CTX.imageSmoothingQuality = "high";
    CTX.textBaseline = "top";
    CTX.font = "bold 34px Arial";

    var ws = new WebSocket("wss://heat-api.j38.net/channel/" + channelId);  // 128142135, 57519051

    function wsOnMessage(ev: MessageEvent<any>) {
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

    // setTimeout(async () => {
    //     const messagesRes = await fetch("/messages1.json");
    //     const messages = await messagesRes.json();
    //     let counter = 0;
    //     const intervalId = setInterval(() => {
    //         const message = messages[counter % messages.length];
    //         if (message.type == "click") {
    //             createOrMovePoint(message.id, parseFloat(message.x), parseFloat(message.y));
    //         }
    //         counter++;

    //     }, 25);
    // }, 1500);

    function draw() {
        CTX.clearRect(0, 0, WIDTH, HEIGHT);

        const clusters = new Set<Cluster>();

        for (const point of POINTS) {
            if (!point.cluster)
                point.draw();
            else
                clusters.add(point.cluster);

        }

        for (const cluster of clusters)
            cluster.draw();

        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
});

function createOrMovePoint(id: string, x: number, y: number) {
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

function createPoint(id: string, x: number, y: number) {
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
    {
        point.recalculateDistances(POINTS);
        point.tryFormCluster();
        POINTS.push(point);
    }

    return point;
}

function removePoint(point: Point) {
    const index = POINTS.findIndex(x => x.equals(point));
    POINTS.splice(index, 1);

    for (const point2 of POINTS)
        point2.removeDistance(point);

    if (point.cluster)
        point.cluster.removePoint(point);
}

function removeEmotePoint(point: Point) {
    const index = EMOTE_POINTS.findIndex(x => x.equals(point));
    EMOTE_POINTS.splice(index, 1);
    point.img.remove();

    for (const point2 of POINTS)
        point2.removeDistance(point);

    if (point.cluster)
        point.cluster.removePoint(point);
}
