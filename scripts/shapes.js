function ellipseDist(centerX, centerY, radiusX, radiusY, otherX, otherY) {
    return pow(otherX - centerX, 2) / pow(radiusX, 2) + pow(otherY - centerY, 2) / pow(radiusY, 2);
}
function inEllipse(centerX, centerY, radiusX, radiusY, otherX, otherY) {
    return ellipseDist(centerX, centerY, radiusX, radiusY, otherX, otherY) <= 1;
}
function inTriangle(x1, y1, x2, y2, x3, y3, otherX, otherY) {
    let areaOrig = abs((x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2))/2.0);
    let area1 = abs((otherX*(y2-y3) + x2*(y3-otherY) + x3*(otherY-y2))/2.0);
    let area2 = abs((x1*(otherY-y3) + otherX*(y3-y1) + x3*(y1-otherY))/2.0);
    let area3 = abs((x1*(y2-otherY) + x2*(otherY-y1) + otherX*(y1-y2))/2.0);
    return areaOrig == area1 + area2 + area3;
}
function rectsOverlap(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
    return ax1 <= bx2 && ax2 >= bx1 && ay1 <= by2 && ay2 >= by1;
}
function pDistance(x, y, x1, y1, x2, y2) {

  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

  var xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  }
  else if (param > 1) {
    xx = x2;
    yy = y2;
  }
  else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

class IDObject {
    constructor(id) {
        this.ID = id;
        ID.set(id, this);
    }
}

let TileTypeReference = {};

function getOptions(str, numoptions) {
    let options = [];
    let option = '';
    let inQuotes = false;
    let quotes = '';
    for(let char of str) {
        if(inQuotes) {
            if(char == quotes) {
                inQuotes = false;
            } else {
                option += char;
            }
        } else {
            if(char == ' ') {
                if(option.length > 0) {
                    options.push(option);
                    option = '';
                }
            } else if (char == '"' || char == "'") {
                inQuotes = true;
                quotes = char;
            } else {
                option += char;
            }
        }
    }
    if(option.length > 0) {
        options.push(option);
    }
    while(options.length < numoptions) {
        options.push('');
    }
    return options;
}

class Layer extends IDObject {
    constructor(id, tileCanvas) {
        super(id);
        this.name = "Layer "+tileCanvas.layers.length;
        this.children = [];
        this.gridScale = 0;
        this.canvas = tileCanvas;
        this.hidden = false;
    }
    static fromBlock(block, parent) {
        let options = getOptions(block.head, 6);
        let newLayer = new Layer(ID.getNext(), parent);
        newLayer.name = options[1];
        newLayer.gridScale = int(options[2]);
        newLayer.hidden = (options[3].toLowerCase() === "true");
        for(let childBlock of block.children) {
            newLayer.addChild(TileTypeReference[childBlock.head.split(" ")[0]].fromBlock(childBlock, newLayer));
        }
        return newLayer;
    }
    saveToString(indent) {
        let str = ('\t'.repeat(indent)) + `Layer '${this.name}' ${this.gridScale} ${this.hidden}`;
        for(let child of this.children) {
            str += "\n" + child.saveToString(indent + 1);
        }
        return str;
    }
    render() {
        if(!this.hidden) {
            for(let child of this.children) {
                noStroke();
                child.draw();
            }
        }
    }
    toLC(x) {//To Layer Coordinate (From Screen)
        return round(x / this.getResolution());
    }
    toLCF(x) {//To Layer Coordinate (From Screen)
        return floor(x / this.getResolution());
    }
    toStart(x) {//Moves the value to the start of the nearest grid line
        return floor(x / (2**this.gridScale)) * (2**this.gridScale)
    }
    toNearest(x) {
        return floor(x / (2**this.gridScale)) * (2**this.gridScale);
    }
    toMiddle(x) {//Moves the value to the center of the grid lines
        return floor(x / (2**this.gridScale)) * (2**this.gridScale) + (2**this.gridScale) * 0.5
    }
    toEnd(x) {//Moves the value to the end of the nearest grid line
        return floor(x / (2**this.gridScale)) * (2**this.gridScale) + (2**this.gridScale) - 1
    }
    toLCC(x) {//To Layer Coordinate (From Screen)
        return ceil(x / this.getGridSize()) * (2**this.gridScale);
    }
    toLCY(y) {//To Layer Coordinate (From Screen)
        return round(y / this.getGridSize()) * (2**this.gridScale);
    }
    toLCFY(y) {//To Layer Coordinate (From Screen)
        return floor(y / this.getGridSize()) * (2**this.gridScale);
    }
    toSCX(x) {//To Screen Coordinate
        return x * this.getResolution();
    }
    toSCFX(x) {//To Screen Coordinate Floored
        return floor(x + 0.5) * this.getResolution();
    }
    toSCCX(x) {//To Screen Coordinate Ceiling'd
        return ceil(x + 0.5) * this.getResolution();
    }
    toSCY(y) {//To Screen Coordinate
        return y * this.getResolution();
    }
    toSCFY(y) {//To Screen Coordinate Floored
        return floor(y + 0.5) * this.getResolution();
    }
    toSCCY(y) {//To Screen Coordinate Ceiling'd
        return ceil(y + 0.5) * this.getResolution();
    }
    getResolution() {
        return this.canvas.resolution;
    }
    getGridSize() {
        return (2**this.gridScale) * this.canvas.resolution;
    }
    size() {
        return this.children.length;
    }
    indexOf(child) {
        for(let i = 0; i < this.children.length; i ++) {
            if(this.children[i] == child) {
                return i;
            }
        }
    }
    getChild(index) {
        return this.children[index];
    }
    forEach(callback) {
        for(let i = this.children.length - 1; i >= 0; i --) {
            let end = callback(this.children[i]);
            if(end) {
                return;
            }
        }
    }
    remove(index) {
        if (index >= 0 && index < this.children.length) {
            this.children[index].parent = null;
            return this.children.splice(index, 1)[0];
        }
        return null;
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children[index].parent = null;
            return this.children.splice(index, 1)[0];
        }
        return null;
    }
    addChild(child, index) {
        if(index == undefined) {
            this.children.push(child);
        } else {
            this.children.splice(index, 0, child);
        }
        child.parent = this;
    }
    [Symbol.iterator]() {
        return this.children[Symbol.iterator]();
    }
    drawGrid() {
        strokeWeight(1);
        let midX = width/2;
        let midY = height/2;
        for (let x = 0; x < width; x += this.getGridSize()) {
            if(x == midX) {
                stroke(100);
            } else {
                stroke(200);
            }
            line(x, 0, x, height);
        }
        for (let y = 0; y < height; y += this.getGridSize()) {
            if(y == midY) {
                stroke(100);
            } else {
                stroke(200);
            }
            line(0, y, width, y);
        }
    }
}

class TileLike extends IDObject {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(id, parent) {
        super(id);
        this.parent = parent;
    }
    erase() {
        this.parent.removeChild(this);
    }
    getLayer() {
        if(this.parent instanceof Layer) {
            return this.parent;
        } else {
            return this.parent.getLayer();
        }
    }
    getIndexInParent() {
        return this.parent.children.indexOf(this);
    }
    sameAs(otherTile) {
        return false;
    }
    clone(parent) {
        throw new Error("Not implemented");
    }
    setColor(color) {
        throw new Error("Not implemented");
    }
    move(offsetX, offsetY) {
        throw new Error("Not implemented");
    }
    recolor(color) {
        throw new Error("Not implemented");
    }
    draw() {
        throw new Error("Not implemented");
    }
    drawOutline(offsetX, offsetY) {
        throw new Error("Not implemented");
    }
    collidesWith(mouseX, mouseY) {
        throw new Error("Not implemented");
    }
    overlapsWith(sX, sY, eX, eY) {
        throw new Error("Not implemented");
        return rectsOverlap(sX, sY, eX, eY, this.startX, this.startY, this.endX, this.endY);
    }
    fitsWithin(sX, sY, eX, eY) {
        throw new Error("Not implemented");
    }
    flip(bounds, h, v) {
        throw new Error("Not implemented");
    }
    rotate(bounds, c) {
        throw new Error("Not implemented");
    }
    getBounds() {
        throw new Error("Not implemented");
    }
}

class Group extends TileLike {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, parent) {
        super(ID, parent);
        this.children = [];
    }
    static fromBlock(block, parent) {
        let newGroup = new Group(ID.getNext(), parent);
        for(let childBlock of block.children) {
            newGroup.addChild(TileTypeReference[childBlock.head.split(" ")[0]].fromBlock(childBlock, newGroup));
        }
        return newGroup;
    }
    saveToString(indent) {
        let str = ('\t'.repeat(indent)) + 'Group';
        for(let child of this.children) {
            str += "\n" + child.saveToString(indent + 1);
        }
        return str;
    }
    clone(parent) {
        let clone = new Group(null, parent);
        this.children.forEach(child => clone.children.push(child.clone(clone)));
        return clone;
    }
    remove(index) {
        if (index >= 0 && index < this.children.length) {
            this.children[index].parent = null;
            return this.children.splice(index, 1)[0];
        }
        return null;
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children[index].parent = null;
            return this.children.splice(index, 1)[0];
        }
        return null;
    }
    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }
    [Symbol.iterator]() {
        return this.children[Symbol.iterator]();
    }
    dissolve() {
        let removedChildren = [];
        while(this.children.length > 0) {
            let removedChild = this.remove(0);
            removedChildren.push(removedChild);
            this.parent.addChild(removedChild);
        }
        this.erase();
        return removedChildren;
    }
    setColor(color) {
        for(let child of this.children) {
            child.setColor(color);
        }
    }
    move(offsetX, offsetY) {
        for(let child of this.children) {
            child.move(offsetX, offsetY);
        }
    }
    recolor(color) {
        for(let child of this.children) {
            child.recolor(color);
        }
    }
    draw() {
        for(let child of this.children) {
            noStroke();
            child.draw();
        }
    }
    getBounds() {
        return this.children.reduce((a, t) => {
            let bounds = t.getBounds();
            if(a == undefined) {
                return bounds;
            }
            return {startX: min(a.startX, bounds.startX), startY: min(a.startY, bounds.startY), endX: max(a.endX, bounds.endX), endY: max(a.endY, bounds.endY)};
        }, undefined);
    }
    drawOutline(offsetX, offsetY) {
        let bounds = this.getBounds();
        noFill();
        rect(this.getLayer().toSCFX(bounds.startX+offsetX), this.getLayer().toSCFY(bounds.startY+offsetY), this.getLayer().toSCCX(bounds.endX+offsetX), this.getLayer().toSCCY(bounds.endY+offsetY));
    }
    collidesWith(mouseX, mouseY) {
        for(let child of this.children) {
            if(child.collidesWith(mouseX, mouseY)) {
                return true;
            }
        }
        return false;
    }
    overlapsWith(sX, sY, eX, eY) {
        for(let child of this.children) {
            if(child.overlapsWith(sX, sY, eX, eY)) {
                return true;
            }
        }
        return false;
    }
    fitsWithin(sX, sY, eX, eY) {
        for(let child of this.children) {
            if(!child.fitsWithin(sX, sY, eX, eY)) {
                return false;
            }
        }
        return true;
    }
    flip(bounds, h, v) {
        for(let child of this.children) {
            child.flip(bounds, h, v);
        }
    }
    rotate(bounds, c) {
        for(let child of this.children) {
            child.rotate(bounds, c);
        }
    }
}

class Tile extends TileLike {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, parent);
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.rotation = rotation;
        this.color = color;
        this.ignoreRotation = false;
        this.drawOutlineBefore = false;
    }
    static fromBlock(block, parent) {
        let options = getOptions(block.head, 7);
        return new TileTypeReference[options[0]](ID.getNext(), int(options[1]), int(options[2]), int(options[3]), int(options[4]), int(options[5]), options[6], parent);
    }
    saveToString(indent) {
        return ('\t'.repeat(indent)) + `${this.constructor.name} ${this.startX} ${this.startY} ${this.endX} ${this.endY} ${this.ignoreRotation ? 0 : this.rotation} ${this.color}`;
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        throw new Error("Not implemented");
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        throw new Error("Not implemented");
    }
    clone(parent) {
        return new this.constructor(null, this.startX, this.startY, this.endX, this.endY, this.rotation, this.color, parent);
    }
    move(offsetX, offsetY) {
        this.startX += offsetX;
        this.startY += offsetY;
        this.endX += offsetX;
        this.endY += offsetY;
    }
    setColor(color) {
        this.color = color;
    }
    sameAs(otherTile) {
        return this.constructor == otherTile.constructor && this.startX == otherTile.startX && this.startY == otherTile.startY && this.endX == otherTile.endX && this.endY == otherTile.endY && (this.rotation == otherTile.rotation || this.ignoreRotation);
    }
    draw() {
        fill(this.color);
        this.constructor.drawRaw(this.startX, this.startY, this.endX, this.endY, this.rotation, this.getLayer());
    }
    drawOutline(offsetX, offsetY) {
        noFill();
        this.constructor.drawRaw(this.startX+offsetX, this.startY+offsetY, this.endX+offsetX, this.endY+offsetY, this.rotation, this.getLayer());
    }
    collidesWith(mouseX, mouseY) {
        return this.constructor.checkCollision(this.startX, this.startY, this.endX, this.endY, this.rotation, this.getLayer(), mouseX, mouseY);
    }
    overlapsWith(sX, sY, eX, eY) {
        return rectsOverlap(sX, sY, eX, eY, this.startX, this.startY, this.endX, this.endY);
    }
    fitsWithin(sX, sY, eX, eY) {
        return this.startX >= sX && this.startY >= sY && this.endX <= eX && this.endY <= eY;
    }
    flip(bounds, h, v) {
        if(!this.ignoreRotation) {
            if(v) {
                switch(this.rotation) {
                    case 0: this.rotation = 3; break;
                    case 1: this.rotation = 2; break;
                    case 2: this.rotation = 1; break;
                    case 3: this.rotation = 0; break;
                }
            }
            if(h) {
                switch(this.rotation) {
                    case 0: this.rotation = 1; break;
                    case 1: this.rotation = 0; break;
                    case 2: this.rotation = 3; break;
                    case 3: this.rotation = 2; break;
                }
            }
        }
        if(h) {
            let sX = this.startX;
            this.startX = bounds.endX - (this.endX - bounds.startX);
            this.endX = bounds.endX - (sX - bounds.startX);
        }
        if(v) {
            let sY = this.startY;
            this.startY = bounds.endY - (this.endY - bounds.startY);
            this.endY = bounds.endY - (sY - bounds.startY);
        }
    }
    rotate(bounds, c) {
        if(!this.ignoreRotation) {
            this.rotation += c ? 3 : 1;
            this.rotation = this.rotation % 4;
        }
        let sY = this.startY;
        let oX = this.endX - this.startX;
        let oY = this.endY - this.startY;
        if(c) {
            this.startY = bounds.startY + bounds.endX - this.startX - oX;
            this.startX = bounds.startX + sY - bounds.startY;
        } else {
            this.startY = bounds.startY + this.startX - bounds.startX;
            this.startX = bounds.startX + bounds.endY - sY - oY;
        }
        this.endY = this.startY + oX;
        this.endX = this.startX + oY;
    }
    getBounds() {
        return {startX: this.startX, startY: this.startY, endX: this.endX, endY: this.endY};
    }
}

class RectTile extends Tile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
        this.name = "RectTile";
        this.ignoreRotation = true;
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        rect(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY));
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        return mouseX > layer.toSCFX(sX) && mouseX < layer.toSCCY(eX) && mouseY > layer.toSCFX(sY) && mouseY < layer.toSCCY(eY);
    }
}

class CharTile extends RectTile {
    static {
        TileTypeReference[this.name] = this;
    }
    static ROTATION = [0, 90, 180, 270];
    constructor(ID, startX, startY, endX, endY, rotation, color, parent, char) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
        this.name = "CharTile";
        this.ignoreRotation = false;
        this.char = char;
    }
    static fromBlock(block, parent) {
        let options = getOptions(block.head, 8);
        return new TileTypeReference[options[0]](ID.getNext(), int(options[1]), int(options[2]), int(options[3]), int(options[4]), int(options[5]), options[6], parent, options[7]);
    }
    saveToString(indent) {
        return ('\t'.repeat(indent)) + `${this.constructor.name} ${this.startX} ${this.startY} ${this.endX} ${this.endY} ${this.ignoreRotation ? 0 : this.rotation} ${this.color} ${this.char}`;
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        this.drawRawC(sX, sY, eX, eY, r, layer, 'A');
    }
    static drawRawC(sX, sY, eX, eY, r, layer, char) {
        push();
        translate(layer.toSCX(sX + (eX - sX + 1)/2), layer.toSCY(sY + (eY - sY + 1)/2));
        rotate(CharTile.ROTATION[r]);
        textSize(abs(layer.getGridSize() * max(eX - sX + 1, eY - sY + 1)));
        text(char, 0, 0);
        pop();
    }
    draw() {
        fill(this.color);
        CharTile.drawRawC(this.startX, this.startY, this.endX, this.endY, this.rotation, this.getLayer(), this.char);
    }
    drawOutline(offsetX, offsetY) {
        noFill();
        CharTile.drawRawC(this.startX+offsetX, this.startY+offsetY, this.endX+offsetX, this.endY+offsetY, this.rotation, this.getLayer(), this.char);
    }
}

class EllipseTile extends Tile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
        this.ignoreRotation = true;
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        ellipse(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY));
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        let sSX = layer.toSCFX(sX);
        let sSY = layer.toSCFY(sY);
        let sEX = layer.toSCCX(eX);
        let sEY = layer.toSCCX(eY);
        let centerX = sSX + (sEX - sSX)/2;
        let centerY = sSY + (sEY - sSY)/2;
        let radiusX = (sSX - sEX) / 2;
        let radiusY = (sSY - sEY) / 2;
        return inEllipse(centerX, centerY, radiusX, radiusY, mouseX, mouseY);
    }
}

class QuadrantTile extends Tile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        let w = eX - sX + 1;
        let h = eY - sY + 1;
        switch(int(r)) {
            case 0:
                arc(layer.toSCFX(sX - w), layer.toSCFY(sY - h), layer.toSCCX(eX), layer.toSCCY(eY), 0, 90);
                break;
            case 1:
                arc(layer.toSCFX(sX), layer.toSCFY(sY - h), layer.toSCCX(eX + w), layer.toSCCY(eY), 90, 180);
                break;
            case 2:
                arc(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX + w), layer.toSCCY(eY + h), 180, 270);
                break;
            case 3:
                arc(layer.toSCFX(sX - w), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY + h), 270, 360);
                break;
        }
    }
    drawOutline(offsetX, offsetY) {
        QuadrantTile.drawRaw(this.startX+offsetX, this.startY+offsetY, this.endX+offsetX, this.endY+offsetY, this.rotation, this.getLayer());
        let sX = this.getLayer().toSCFX(this.startX+offsetX);
        let sY = this.getLayer().toSCFY(this.startY+offsetY);
        let eX = this.getLayer().toSCCX(this.endX+offsetX);
        let eY = this.getLayer().toSCCY(this.endY+offsetY);
        switch(int(this.rotation)) {
            case 0:
                line(sX, sY, eX, sY);
                line(sX, sY, sX, eY);
                break;
            case 1:
                line(sX, sY, eX, sY);
                line(eX, sY, eX, eY);
                break;
            case 2:
                line(eX, sY, eX, eY);
                line(sX, eY, eX, eY);
                break;
            case 3:
                line(sX, sY, sX, eY);
                line(sX, eY, eX, eY);
                break;
        }
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        let w = eX - sX + 1;
        let h = eY - sY + 1;
        let eSX = sX;
        let eSY = sY;
        let eEX = eX;
        let eEY = eY;
        switch(int(r)) {
            case 0:
                eSX -= w;
                eSY -= h;
                break;
            case 1:
                eEX += w;
                eSY -= h;
                break;
            case 2:
                eEX += w;
                eEY += h;
                break;
            case 3:
                eSX -= w;
                eEY += h;
                break;
        }
        return RectTile.checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) && EllipseTile.checkCollision(eSX, eSY, eEX, eEY, r, layer, mouseX, mouseY);
    }
}

class InverseQuadrantTile extends Tile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        push();
        beginClip({invert: true});
            //QuadrantTile.drawRaw(sX, sY, eX, eY, (r+2)%4, layer);
            let w = eX - sX + 1;
            let h = eY - sY + 1;
            switch(int(r)) {
                case 0:
                    ellipse(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX + w), layer.toSCCY(eY + h));
                    break;
                case 1:
                    ellipse(layer.toSCFX(sX - w), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY + h));
                    break;
                case 2:
                    ellipse(layer.toSCFX(sX - w), layer.toSCFY(sY - h), layer.toSCCX(eX), layer.toSCCY(eY));
                    break;
                case 3:
                    ellipse(layer.toSCFX(sX), layer.toSCFY(sY - h), layer.toSCCX(eX + w), layer.toSCCY(eY));
                    break;
            }
            
        endClip();
        RectTile.drawRaw(sX, sY, eX, eY, 0, layer);
        pop();
    }
    drawOutline(offsetX, offsetY) {
        noFill();
        QuadrantTile.drawRaw(this.startX+offsetX, this.startY+offsetY, this.endX+offsetX, this.endY+offsetY, (this.rotation+2)%4, this.getLayer());
        let sX = this.getLayer().toSCFX(this.startX+offsetX);
        let sY = this.getLayer().toSCFY(this.startY+offsetY);
        let eX = this.getLayer().toSCCX(this.endX+offsetX);
        let eY = this.getLayer().toSCCY(this.endY+offsetY);
        switch(int(this.rotation)) {
            case 0:
                line(sX, sY, eX, sY);
                line(sX, sY, sX, eY);
                break;
            case 1:
                line(sX, sY, eX, sY);
                line(eX, sY, eX, eY);
                break;
            case 2:
                line(eX, sY, eX, eY);
                line(sX, eY, eX, eY);
                break;
            case 3:
                line(sX, sY, sX, eY);
                line(sX, eY, eX, eY);
                break;
        }
        
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        let w = eX - sX + 1;
        let h = eY - sY + 1;
        let eSX = sX;
        let eSY = sY;
        let eEX = eX;
        let eEY = eY;
        switch(int(r)) {
            case 0:
                eEX += w;
                eEY += h;
                break;
            case 1:
                eSX -= w;
                eEY += h;
                break;
            case 2:
                eSX -= w;
                eSY -= h;
                break;
            case 3:
                eEX += w;
                eSY -= h;
                break;
        }
        return RectTile.checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) && !EllipseTile.checkCollision(eSX, eSY, eEX, eEY, (r+2)%4, layer, mouseX, mouseY);
    }
}

class WedgeTile extends Tile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        switch(int(r)) {
            case 0:
                triangle(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCFY(sY), layer.toSCFX(sX), layer.toSCCY(eY));
                break;
            case 1:
                triangle(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY));
                break;
            case 2:
                triangle(layer.toSCCX(eX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY), layer.toSCFX(sX), layer.toSCCY(eY));
                break;
            case 3:
                triangle(layer.toSCCX(eX), layer.toSCCY(eY), layer.toSCFX(sX), layer.toSCCY(eY), layer.toSCFX(sX), layer.toSCFY(sY));
                break;
        }
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        switch(int(r)) {
            case 0:
                return inTriangle(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCFY(sY), layer.toSCFX(sX), layer.toSCCY(eY), mouseX, mouseY);
            case 1:
                return inTriangle(layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY), mouseX, mouseY);
            case 2:
                return inTriangle(layer.toSCCX(eX), layer.toSCFY(sY), layer.toSCCX(eX), layer.toSCCY(eY), layer.toSCFX(sX), layer.toSCCY(eY), mouseX, mouseY);
            case 3:
                return inTriangle(layer.toSCCX(eX), layer.toSCCY(eY), layer.toSCFX(sX), layer.toSCCY(eY), layer.toSCFX(sX), layer.toSCFY(sY), mouseX, mouseY);
        }
    }
}

class BezierWedgeTile extends WedgeTile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
        let c = BezierWedgeTile.getStartControls(startX, startY, endX, endY, rotation);
        this.startControlX = c.x1;
        this.startControlY = c.y1;
        this.endControlX = c.x2;
        this.endControlY = c.y2;
        this.startControlOffsetX = 0;
        this.startControlOffsetY = 0;
        this.endControlOffsetX = 0;
        this.endControlOffsetY = 0;
    }
    static fromBlock(block, parent) {
        let newBez = super.fromBlock(block, parent);
        let options = getOptions(block.head, 11);
        newBez.startControlX = float(options[7]);
        newBez.startControlY = float(options[8]);
        newBez.endControlX = float(options[9]);
        newBez.endControlY = float(options[10]);
        return newBez;
    }
    clone(parent) {
        let clone = super.clone(parent);
        clone.startControlX = this.startControlX;
        clone.startControlY = this.startControlY;
        clone.endControlX = this.endControlX;
        clone.endControlY = this.endControlY;
        return clone;
    }
    saveToString(indent) {
        return super.saveToString(indent) + ` ${this.startControlX} ${this.startControlY} ${this.endControlX} ${this.endControlY}`;
    }
    getStartControlX() {
        return this.startControlX + this.startControlOffsetX;
    }
    getStartControlY() {
        return this.startControlY + this.startControlOffsetY;
    }
    getEndControlX() {
        return this.endControlX + this.endControlOffsetX;
    }
    getEndControlY() {
        return this.endControlY + this.endControlOffsetY;
    }
    setBezier(index, x, y) {
        if(index == 1) {
            this.startControlX = x;
            this.startControlY = y;
        } else {
            this.endControlX = x;
            this.endControlY = y;
        }
    }
    getBezier(index) {
        if(index == 1) {
            return {x:this.startControlX, y:this.startControlY};
        } else {
            return {x:this.endControlX, y:this.endControlY};
        }
    }
    setStartOffset(x, y) {
        this.startControlOffsetX = x;
        this.startControlOffsetY = y;
    }
    setEndOffset(x, y) {
        this.endControlOffsetX = x;
        this.endControlOffsetY = y;
    }
    getOffset(index) {
        if(index == 1) {
            return {x:this.startControlOffsetX, y:this.startControlOffsetY};
        } else {
            return {x:this.endControlOffsetX,y: this.endControlOffsetY};
        }
    }
    resetOffsets() {
        this.startControlOffsetX = 0;
        this.startControlOffsetY = 0;
        this.endControlOffsetX = 0;
        this.endControlOffsetY = 0;
    }
    applyOffset() {
        this.startControlX += this.startControlOffsetX;
        this.startControlY += this.startControlOffsetY;
        this.endControlX += this.endControlOffsetX;
        this.endControlY += this.endControlOffsetY;
        this.resetOffsets();
    }
    move(offsetX, offsetY) {
        super.move(offsetX, offsetY);
        this.startControlX += offsetX;
        this.startControlY += offsetY;
        this.endControlX += offsetX;
        this.endControlY += offsetY;
    }
    static getStartControls(sX, sY, eX, eY, r) {
        let corners = [
            {x: sX, y: eY + 1},
            {x: sX, y: sY},
            {x: eX + 1, y: sY},
            {x: eX + 1, y: eY + 1},
        ]
        return {x1: corners[(r+2)%4].x, y1: corners[(r+2)%4].y, x2: corners[r%4].x, y2: corners[r%4].y};
    }
    static drawRaw2(sX, sY, eX, eY, x1, y1, x2, y2, r, layer) {
        let corners = [
            {x: layer.toSCFX(sX), y: layer.toSCCY(eY)},
            {x: layer.toSCFX(sX), y: layer.toSCFY(sY)},
            {x: layer.toSCCX(eX), y: layer.toSCFY(sY)},
            {x: layer.toSCCX(eX), y: layer.toSCCY(eY)},
        ]
        beginShape();
        vertex(corners[r].x, corners[r].y);
        vertex(corners[(r+1)%4].x, corners[(r+1)%4].y);
        vertex(corners[(r+2)%4].x, corners[(r+2)%4].y);
        bezierVertex(layer.toSCX(x1), layer.toSCY(y1), 
                    layer.toSCX(x2), layer.toSCY(y2),
                    corners[r].x, corners[r].y);
        endShape();
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        let c = BezierWedgeTile.getStartControls(sX, sY, eX, eY, r);
        BezierWedgeTile.drawRaw2(sX, sY, eX, eY, c.x1, c.y1, c.x2, c.y2, r, layer);
    }
    draw() {
        fill(this.color);
        BezierWedgeTile.drawRaw2(this.startX, this.startY, this.endX, this.endY, this.getStartControlX(), this.getStartControlY(), this.getEndControlX(), this.getEndControlY(), this.rotation, this.getLayer());
        //this.drawControls();
    }
    drawOutline(offsetX, offsetY) {
        BezierWedgeTile.drawRaw2(this.startX+offsetX, this.startY+offsetY, this.endX+offsetX, this.endY+offsetY, this.getStartControlX()+offsetX, this.getStartControlY()+offsetY, this.getEndControlX()+offsetX, this.getEndControlY()+offsetY, this.rotation, this.getLayer());
        push();
        this.drawControls(offsetX, offsetY);
        pop();
    }
    drawControls(offsetX, offsetY) {
        let corners = [
            {x: this.getLayer().toSCFX(this.startX+offsetX), y: this.getLayer().toSCCY(this.endY+offsetY)},
            {x: this.getLayer().toSCFX(this.startX+offsetX), y: this.getLayer().toSCFY(this.startY+offsetY)},
            {x: this.getLayer().toSCCX(this.endX+offsetX), y: this.getLayer().toSCFY(this.startY+offsetY)},
            {x: this.getLayer().toSCCX(this.endX+offsetX), y: this.getLayer().toSCCY(this.endY+offsetY)},
        ]
        stroke(255, 0, 0);
        strokeWeight(3);
        line(corners[(this.rotation+2)%4].x, corners[(this.rotation+2)%4].y, this.getLayer().toSCX(this.getStartControlX()+offsetX), this.getLayer().toSCY(this.getStartControlY()+offsetY));
        line(corners[this.rotation].x, corners[this.rotation].y, this.getLayer().toSCX(this.getEndControlX()+offsetX), this.getLayer().toSCY(this.getEndControlY()+offsetY));
        strokeWeight(10);
        point(this.getLayer().toSCX(this.getStartControlX()+offsetX), this.getLayer().toSCY(this.getStartControlY()+offsetY));
        point(this.getLayer().toSCX(this.getEndControlX()+offsetX), this.getLayer().toSCY(this.getEndControlY()+offsetY));
    }
    flip(bounds, h, v) {
        super.flip(bounds, h, v);
        //TODO: Fix controls
    }
    rotate(bounds, c) {
        super.rotate(bounds, c);
        //TODO: Fix controls
    }
}

class LineTile extends Tile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
        this.strokeWeight = -2;
        this.ignoreRotation = true;
        this.drawOutlineBefore = true;
    }
    static drawRaw(sX, sY, eX, eY, r, layer) {
        line(layer.toSCX(sX), layer.toSCY(sY), layer.toSCX(eX), layer.toSCY(eY));
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        let d = pDistance(mouseX, mouseY, layer.toSCFX(sX), layer.toSCFY(sY), layer.toSCFX(eX), layer.toSCFY(eY));
        return d < 10;
    }
    static fromBlock(block, parent) {
        let options = getOptions(block.head, 8);
        let lt = super.fromBlock(block, parent);
        lt.strokeWeight = int(options[7]);
        return lt;
    }
    saveToString(indent) {
        return super.saveToString(indent) + ` ${this.strokeWeight}`;
    }
    clone(parent) {
        let clone = super.clone(parent);
        clone.strokeWeight = this.strokeWeight;
        return clone;
    }
    getStrokeWeight() {
        return this.getLayer().getResolution()*(2**this.strokeWeight);
    } 
    draw() {
        stroke(this.color);
        strokeWeight(this.getStrokeWeight());
        LineTile.drawRaw(this.startX, this.startY, this.endX, this.endY, this.rotation, this.getLayer());
    }
    drawOutline(offsetX, offsetY) {
        strokeWeight(this.getStrokeWeight()+10);
        LineTile.drawRaw(this.startX+offsetX, this.startY+offsetY, this.endX+offsetX, this.endY+offsetY, this.rotation, this.getLayer());
    }
    getBounds() {
        let bounds = {startX: min(this.startX, this.endX), startY: min(this.startY, this.endY), endX: max(this.startX, this.endX), endY: max(this.startY, this.endY)};
        bounds.endX = max(bounds.endX - 1, bounds.startX);
        bounds.endY = max(bounds.endY - 1, bounds.startY);
        return bounds;
    }
    flip(bounds, h, v) {
        if(h) {
            this.startX = bounds.endX - (this.startX - bounds.startX) + 1;
            this.endX = bounds.endX - (this.endX - bounds.startX) + 1;
        }
        if(v) {
            this.startY = bounds.endY - (this.startY - bounds.startY) + 1;
            this.endY = bounds.endY - (this.endY - bounds.startY) + 1;
        }
    }
    rotate(bounds, c) {
        //TODO
    }
}

class CurveTile extends QuadrantTile {
    static {
        TileTypeReference[this.name] = this;
    }
    constructor(ID, startX, startY, endX, endY, rotation, color, parent) {
        super(ID, startX, startY, endX, endY, rotation, color, parent);
        this.strokeWeight = -2;
        this.drawOutlineBefore = true;
    }
    static fromBlock(block, parent) {
        let options = getOptions(block.head, 8);
        let lt = super.fromBlock(block, parent);
        lt.strokeWeight = int(options[7]);
        return lt;
    }
    saveToString(indent) {
        return super.saveToString(indent) + ` ${this.strokeWeight}`;
    }
    getStrokeWeight() {
        return this.getLayer().getResolution()*(2**this.strokeWeight);
    } 
    draw() {
        noFill();
        stroke(this.color);
        strokeWeight(this.getStrokeWeight());
        QuadrantTile.drawRaw(this.startX, this.startY, this.endX, this.endY, this.rotation, this.getLayer());
    }
    drawOutline(offsetX, offsetY) {
        strokeWeight(this.getStrokeWeight()+10);
        QuadrantTile.drawRaw(this.startX+offsetX, this.startY+offsetY, this.endX+offsetX, this.endY+offsetY, this.rotation, this.getLayer());
    }
    static checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) {
        let w = eX - sX + 1;
        let h = eY - sY + 1;
        let eSX = sX;
        let eSY = sY;
        let eEX = eX;
        let eEY = eY;
        switch(int(r)) {
            case 0:
                eSX -= w;
                eSY -= h;
                break;
            case 1:
                eEX += w;
                eSY -= h;
                break;
            case 2:
                eEX += w;
                eEY += h;
                break;
            case 3:
                eSX -= w;
                eEY += h;
                break;
        }
        let centerX = layer.toSCX(eSX + (eEX - eSX) / 2);
        let centerY = layer.toSCY(eSY + (eEY - eSY) / 2);
        let radiusX = (layer.toSCFX(eSX) - layer.toSCCX(eEX)) / 2;
        let radiusY = (layer.toSCFY(eSY) - layer.toSCCY(eEY)) / 2;
        let eD = ellipseDist(centerX, centerY, radiusX, radiusY, mouseX, mouseY);
        return RectTile.checkCollision(sX, sY, eX, eY, r, layer, mouseX, mouseY) && eD > 0.9 && eD < 1.2;
    }
}