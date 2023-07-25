var WIDTH = 0;
var HEIGHT = 0;
var CANVAS: HTMLCanvasElement = null;
var CTX: CanvasRenderingContext2D = null;

const MARKER_SPRITE = new Image(32, 32);
MARKER_SPRITE.src = "img/marker.svg";

const POINTS: Point[] = [];

const emotesUrls = ["https://static-cdn.jtvnw.net/emoticons/v2/307208203/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208182/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208194/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208198/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208253/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208202/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208206/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_f791816261484a1d851fd1aeaf1ae0a6/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208452/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208453/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208211/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208213/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208216/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208240/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208217/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208417/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_9703dd06af254ca8b15391c6d3b55c08/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_bc1d287504b74c1185fca70b9de2eef8/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208234/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_9468c8aed3aa4b6da69fcdfbec559209/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_936022f49de94e8c9064ae51b5e5d2e8/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_dbce4185fbe0404fbbec368c81ba2ae3/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208258/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208259/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208260/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208290/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208299/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208302/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307227742/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208325/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208315/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_fc5d33d332994cf493234523e57032c7/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208418/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208327/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208328/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_0b2b6df7585f4d4aa13197ae8a69f16c/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a797d6c446c342758748af7410fd3a48/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208340/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_586bb132dae744d38139a2c885856aa3/animated/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_af7ca5e8a6ba4ffbb7f3efae7bf9c76f/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208347/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/308011000/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_627f63d0ce894ecc9a1815acdd341a4a/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208353/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208354/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d284d231d9624b878fab250837a0d460/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_5c10b31045d74181bc29ec0b7add8639/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208376/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208373/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d474267c23244d87ab2d361579401bdb/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208379/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_789aff2fb1324fe080a8a7e740e76bd4/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208382/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d8a1a70486e244f2adf364c70a9399c6/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208398/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_3972e232ad0140be99ca08ced8509d1f/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d25d89b798fe4ab9bcc0770f71e72c88/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208403/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208405/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208412/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208540/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208422/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208425/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208432/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208443/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_57a65238a2514b74aad2101d07ff5233/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208532/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208459/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_c04d79dd0bb04b7998e290887601410c/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208460/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208463/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208466/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208467/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208470/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v2/307208472/static/light/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_ef9299ca9f604207a5cf556b6ddd02b8/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_d8566a5e10204c73a510040da2a72098/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_f9ae4da6063c4951b09691ab59bf72dd/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_408a52b031a64651aeff454f98de8787/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_cf9c07c30a2146e7868b83029c505e68/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_9b9104d71159427fb09f5de3faac9e08/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_bf360018c4a34c1481f50128c6163f8e/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_3399b5f89cff417e96dd44cc7c771083/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/307208343/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_375d065ac5ea4d4cb453de40737f8972/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_5ecada6d47d64e2497679f6a8f3916f5/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_e0f0728e046a49a98470f39b871e88cf/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_73ea8d76245c4dec8eb33bddb542b306/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_eb30bd686093486c95bcb701a1b178a8/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_c5bb92388beb40a7b4a3323c25c66570/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_fd8e00e87a514c94a3f2ccae01766f5b/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_15cb1971f17c480db8190f5d67f7f06c/2.0", "https://static-cdn.jtvnw.net/emoticons/v1/emotesv2_08f9ae157b284dad8922c2589cb679f0/2.0"];
for (let i = emotesUrls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emotesUrls[i], emotesUrls[j]] = [emotesUrls[j], emotesUrls[i]];
}
const emotes = emotesUrls.slice(0, 5).map(x => { const img = new Image(64, 64); img.src = x; return img; });

const kanaClicks: { x: number, y: number }[] = [];
let borders = { x: 0.26979166666666665, y: 0.2638888888888889 };

const savedBorders = localStorage.getItem("borders");
if (savedBorders) {
    try {
        borders = JSON.parse(savedBorders);
        if (!borders.x)
            borders.x = 0.26979166666666665;
        if (!borders.y)
            borders.y = 0.26979166666666665;
    }
    catch { }
}

document.addEventListener("DOMContentLoaded", async function () {
    CANVAS = document.getElementById("cnvs") as HTMLCanvasElement;
    WIDTH = CANVAS.width = document.body.offsetWidth * 2;
    HEIGHT = CANVAS.height = document.body.offsetHeight * 2;
    CTX = CANVAS.getContext("2d");

    CTX.imageSmoothingQuality = "high";
    CTX.textBaseline = "top";
    CTX.font = "bold 34px Arial";

    const urlParams = new URLSearchParams(window.location.search);
    const channelId = urlParams.get('channelId');

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

        for (const cluster of clusters) {
            cluster.draw();
        }

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

    const index = POINTS.findIndex(x => x.id == id);
    if (index >= 0)
        removePoint(POINTS[index]);
    createPoint(id, x, y);
}

function createPoint(id: string, x: number, y: number) {
    const point = new Point(id, x, y, POINTS);
    if (x < borders.x && y > borders.y)
        point.renderAsEmote(emotes[Math.floor(Math.random() * emotes.length)]);
    POINTS.push(point);
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
