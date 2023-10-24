class Cluster {
    public points: Point[] = [];
    public shape: { x: number, y: number, xOuter: number, yOuter: number, xInner: number, yInner: number }[] = [];
    private _gradient: CanvasGradient = null;

    public avgX: number = 0;
    public avgY: number = 0;

    public addPointsFromPoint(point: Point) {

        if (!point.isCore()) {
            this.addPoint(point);
            return;
        }

        const openSet: Point[] = [point];
        const closedSet: Point[] = [];

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

    public addPoint(point: Point) {
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

    public removePoint(point: Point) {
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

    public recalculateShape() {
        const points: { point: Point, x: number, y: number, angle: number, crossProd:number }[] = [];

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

    public draw() {
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
        // CTX.strokeStyle = "black";
        // CTX.lineWidth = 1;
        // CTX.strokeText(num, this.avgX - numMeasurement.width / 2, this.avgY + 14);
    }

    private roundedPoly(points: { x: number, y: number }[], radius: number) {
        var i, x, y, len, p1, p2, p3, v1: any, v2: any, sinA, sinA90, radDirection, drawDirection, angle, halfAngle, cRadius, lenOut;
        var asVec = function (p: any, pp: any, v: any) {
            v.x = pp.x - p.x;
            v.y = pp.y - p.y;
            v.len = Math.sqrt(v.x * v.x + v.y * v.y);
            v.nx = v.x / v.len;
            v.ny = v.y / v.len;
            v.ang = Math.atan2(v.ny, v.nx);
        }
        v1 = {};
        v2 = {};
        len = points.length;
        p1 = points[len - 1];
        for (i = 0; i < len; i++) {
            p2 = points[(i) % len];
            p3 = points[(i + 1) % len];
            asVec(p2, p1, v1);
            asVec(p2,
                p3, v2);
            sinA = v1.nx * v2.ny - v1.ny * v2.nx;
            sinA90 = v1.nx * v2.nx - v1.ny * -v2.ny;
            angle = Math.asin(sinA); // warning you should guard by clampling
            // to -1 to 1. See function roundedPoly in answer or 
            // Math.asin(Math.max(-1, Math.min(1, sinA)))
            radDirection = 1;
            drawDirection = false;
            if (sinA90 < 0) {
                if (angle < 0) {
                    angle = Math.PI + angle;
                } else {
                    angle = Math.PI - angle;
                    radDirection = -1;
                    drawDirection = true;
                }
            } else {
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
            } else {
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
