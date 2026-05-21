class Tool {
    static DRAG_MODE_OPTIONS = {
        AREA: 0,
        DRAW: 1,
    };
    static DRAG_MODE = 0;
    static ROTATION_MODE_OPTIONS = {
        DRAG: 0,
        UI: 1,
    };
    static ROTATION_MODE = 0;
    static SELECTION_MODE_OPTIONS = {
        CONTAIN: 0,
        OVERLAP: 1
    };
    static REPLACEMENT_MODE = 0;
    static REPLACEMENT_MODE_OPTIONS = {
        IDENTICAL: 0,
        NONE: 1,
        ALL: 2
    };
    static SPLIT_TILES = true;
    constructor(name) {
        this.name = name;
    }
    drawBefore(maker, mouseX, mouseY) {}
    draw(maker, mouseX, mouseY) {}
    update(maker, mouseX, mouseY, mousePressed) {}
    setLayer(layer) {
        this.layer = layer;
    }
    onEnable(maker) {
        this.maker = maker;
        this.layer = maker.getActiveLayer();
    }
    onDisable(maker) {}
    onMousePressed(maker, mouseX, mouseY) {}
    onMouseReleased(maker, mouseX, mouseY) {}
    onDrag(maker, mouseX, mouseY) {}
    onDragStart(maker) {}
    onDragEnd(maker) {}
    onTileChange(maker) {}
}

class DraggableTool extends Tool {
    constructor(name) {
        super(name);
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.clickMouseX = 0;
        this.clickMouseY = 0;
        this.dragging = false;
    }
    setStart(mouseX, mouseY) {
        this.startX = this.layer.toLCF(mouseX);
        this.startY = this.layer.toLCF(mouseY);
    }
    setEnd(mouseX, mouseY) {
        this.endX = this.layer.toLCF(mouseX);
        this.endY = this.layer.toLCF(mouseY);
    }
    getStartX() {
        return this.layer.toStart(min(this.startX, this.endX));
    }
    getStartY() {
        return this.layer.toStart(min(this.startY, this.endY));
    }
    getEndX() {
        return this.layer.toEnd(max(this.startX, this.endX));
    }
    getEndY() {
        return this.layer.toEnd(max(this.startY, this.endY));
    }
    getXOffset(mouseX) {
        return this.layer.toLCF(mouseX) - this.startX;
    }
    getYOffset(mouseY) {
        return this.layer.toLCF(mouseY) - this.startY;
    }
    startEndEqual() {
        return this.startX == this.endX && this.startY == this.endY;
    }
    onMousePressed(maker, mouseX, mouseY) {
        this.clickMouseX = mouseX;
        this.clickMouseY = mouseY;
    }
    onMouseReleased(maker, mouseX, mouseY) {
        this.dragging = false;
    }
    update(maker, mouseX, mouseY, mousePressed) {
        if(this.dragging) {
            this.dragging = mousePressed;
        } else {
            if(mousePressed) {
                if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA && this.clickMouseX != mouseX && this.clickMouseY != mouseY) {
                    this.dragging = true;
                }
            } else {
                this.setStart(mouseX, mouseY);
            }
        }
        this.setEnd(mouseX, mouseY);
    }
}

class ShapeTool extends DraggableTool {
    constructor(name, shape) {
        super(name);
        this.shapeType = shape;
        this.rotation = 0;
    }
    place(maker, sX, sY, eX, eY, r, c, layer) {
        let cancelPlacement = false;
        if(Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.IDENTICAL) {
            layer.forEach((tile) => {
                if(tile.overlapsWith(sX, sY, eX, eY)) {
                    if(tile.sameAs({startX : sX, startY : sY, endX : eX, endY : eY, rotation : r, constructor: this.shapeType})) {
                        if(tile.color != c) {
                            maker.addAction(new ModifyTileAction(tile.ID, "color", tile.color, c));
                        }
                        cancelPlacement = true;
                    } else {
                        return true;
                    }
                }
            });
        } else if (Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.ALL) {
            layer.forEach((tile) => {
                if(tile.overlapsWith(sX, sY, eX, eY)) {
                    maker.addAction(new RemoveTileAction(tile));
                }
            });
        }
        if(!cancelPlacement) {
            maker.addAction(new AddTileAction(ID.getNext(), this.shapeType, sX, sY, eX, eY, r, c, layer.ID));
        }
    }
    draw(maker, mouseX, mouseY) {
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA && (!window.mobileAndTabletCheck() || clickingOnCanvas)) {
            noStroke();
            fill(maker.getColor());
            this.shapeType.drawRaw(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, this.layer);
        }
    }
    onMousePressed(maker, mouseX, mouseY) {
        super.onMousePressed(maker, mouseX, mouseY);
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.DRAW) {
            this.place(maker, this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, maker.getColor(), this.layer);
            maker.submitActions();
        }
    }
    onMouseReleased(maker, mouseX, mouseY) {
        super.onMouseReleased(maker, mouseX, mouseY);
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA) {
            this.place(maker, this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, maker.getColor(), this.layer);
            maker.submitActions();
        }
    }
    onTileChange(maker) {
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.DRAW && clickingOnCanvas) {
            this.place(maker, this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, this.rotation, maker.getColor(), this.layer);
            maker.submitActions();
        }
    }
    update(maker, mouseX, mouseY, mousePressed) {
        super.update(maker, mouseX, mouseY, mousePressed);
        if(Tool.ROTATION_MODE == Tool.ROTATION_MODE_OPTIONS.DRAG) {
            let cmx = this.layer.toSCX(this.layer.toMiddle(this.startX));
            let cmy = this.layer.toSCY(this.layer.toMiddle(this.startY));
            if (mouseX > cmx && mouseY > cmy) {
                this.rotation = 2;
            } else if (mouseX < cmx && mouseY > cmy) {
                this.rotation = 3;
            } else if (mouseX < cmx && mouseY < cmy) {
                this.rotation = 0;
            } else if (mouseX > cmx && mouseY < cmy) {
                this.rotation = 1;
            }
        }
    }
}
class RectTool extends ShapeTool {
    constructor() {
        super("RECT", RectTile);
    }
    place(maker, sX, sY, eX, eY, r, c, layer) {
        if(Tool.SPLIT_TILES) {
            for(let i = sX; i < eX + 1; i ++) {
                for(let j = sY; j < eY + 1; j ++) {
                    super.place(maker, i, j, i, j, r, c, layer);
                }
            }
        } else {
            super.place(maker, sX, sY, eX, eY, r, c, layer);
        }
    }
}
class WedgeTool extends ShapeTool {
    constructor() {
        super("WEDGE", WedgeTile);
    }
    //TODO split up place() method
}
class LineTool extends ShapeTool {
    constructor() {
        super("LINE", LineTile);
        this.strokeWeight = -2;
        this.minStrokeWeight = -3;
        this.maxStrokeWeight = 0;
    }
    getStrokeWeight(layer) {
        return layer.getResolution()*(2**this.strokeWeight);
    }
    increaseStrokeWeight() {
        this.strokeWeight = min(this.strokeWeight + 1, this.maxStrokeWeight);
    }
    decreaseStrokeWeight() {
        this.strokeWeight = max(this.strokeWeight - 1, this.minStrokeWeight);
    }
    setStart(mouseX, mouseY) {
        this.startX = this.layer.toLC(mouseX);
        this.startY = this.layer.toLC(mouseY);
    }
    setEnd(mouseX, mouseY) {
        this.endX = this.layer.toLC(mouseX);
        this.endY = this.layer.toLC(mouseY);
    }
    getStartX() {
        return this.layer.toNearest(this.startX);
    }
    getStartY() {
        return this.layer.toNearest(this.startY);
    }
    getEndX() {
        return this.layer.toNearest(this.endX);
    }
    getEndY() {
        return this.layer.toNearest(this.endY);
    }
    place(maker, sX, sY, eX, eY, r, c, layer) {
        //TODO: redo this maybe?
        let cancelPlacement = false;
        if(Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.IDENTICAL) {
            layer.forEach((tile) => {
                if(tile.overlapsWith(sX, sY, eX, eY) && tile instanceof Tile) {
                    if(tile.sameAs({startX : sX, startY : sY, endX : eX, endY : eY, rotation : r, constructor: this.shapeType})) {
                        if(tile.color != c) {
                            maker.addAction(new ModifyTileAction(tile.ID, "color", tile.color, c));
                        }
                        cancelPlacement = true;
                    } else {
                        return true;
                    }
                }
            });
        } else if (Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.ALL) {
            layer.forEach((tile) => {
                if(tile.overlapsWith(sX, sY, eX, eY)) {
                    maker.addAction(new RemoveTileAction(tile));
                }
            });
        }
        if(!cancelPlacement) {
            let tID = ID.getNext();
            maker.addAction(new AddTileAction(tID, this.shapeType, sX, sY, eX, eY, r, c, layer.ID));
            maker.addAction(new ModifyTileAction(tID, "strokeWeight", -2, this.strokeWeight));
        }
    }
    draw(maker, mouseX, mouseY) {
        if(!window.mobileAndTabletCheck() || clickingOnCanvas) {
            strokeWeight(this.getStrokeWeight(this.layer));
            stroke(maker.getColor());
            this.shapeType.drawRaw(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), 0, this.layer);
        }
    }
    onEnable(maker) {
        super.onEnable(maker);
        document.getElementById("lineTools").style.display = "";
    }
    onDisable(maker) {
        document.getElementById("lineTools").style.display = "none";
    }
    onMouseReleased(maker, mouseX, mouseY) {
        super.onMouseReleased(maker, mouseX, mouseY);
        this.place(maker, this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), 0, maker.getColor(), this.layer);
        maker.submitActions();
    }
}
class CurveTool extends ShapeTool {
    constructor() {
        super("CURVE", CurveTile);
        this.strokeWeight = -2;
        this.minStrokeWeight = -3;
        this.maxStrokeWeight = 0;
    }
    getStrokeWeight(layer) {
        return layer.getResolution()*(2**this.strokeWeight);
    }
    increaseStrokeWeight() {
        this.strokeWeight = min(this.strokeWeight + 1, this.maxStrokeWeight);
    }
    decreaseStrokeWeight() {
        this.strokeWeight = max(this.strokeWeight - 1, this.minStrokeWeight);
    }
    place(maker, sX, sY, eX, eY, r, c, layer) {
        //TODO: redo this maybe?
        let cancelPlacement = false;
        if(Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.IDENTICAL) {
            layer.forEach((tile) => {
                if(tile.overlapsWith(sX, sY, eX, eY) && tile instanceof Tile) {
                    if(tile.sameAs({startX : sX, startY : sY, endX : eX, endY : eY, rotation : r, constructor: this.shapeType})) {
                        if(tile.color != c) {
                            maker.addAction(new ModifyTileAction(tile.ID, "color", tile.color, c));
                        }
                        cancelPlacement = true;
                    } else {
                        return true;
                    }
                }
            });
        } else if (Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.ALL) {
            layer.forEach((tile) => {
                if(tile.overlapsWith(sX, sY, eX, eY)) {
                    maker.addAction(new RemoveTileAction(tile));
                }
            });
        }
        if(!cancelPlacement) {
            let tID = ID.getNext();
            maker.addAction(new AddTileAction(tID, this.shapeType, sX, sY, eX, eY, r, c, layer.ID));
            maker.addAction(new ModifyTileAction(tID, "strokeWeight", -2, this.strokeWeight));
        }
    }
    draw(maker, mouseX, mouseY) {
        if(!window.mobileAndTabletCheck() || clickingOnCanvas) {
            noFill();
            strokeWeight(this.getStrokeWeight(this.layer));
            stroke(maker.getColor());
            this.shapeType.drawRaw(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, this.layer);
        }
    }
    onEnable(maker) {
        super.onEnable(maker);
        document.getElementById("lineTools").style.display = "";
    }
    onDisable(maker) {
        document.getElementById("lineTools").style.display = "none";
    }
    onMouseReleased(maker, mouseX, mouseY) {
        super.onMouseReleased(maker, mouseX, mouseY);
        this.place(maker, this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, maker.getColor(), this.layer);
        maker.submitActions();
    }
}

class TextTool extends DraggableTool {//TODO: move cursor
    static MODES = {
        SETTING: 0,
        TYPING: 1
    }
    constructor() {
        super("TEXT");
        this.rotation = 0;
        this.mode = TextTool.MODES.SETTING;
        this.box = {};
        this.text = '';
        this.frame = 0;
    }
    onEnable(maker) {
        super.onEnable(maker);
        this.mode = TextTool.MODES.SETTING;
        this.box = {};
        this.text = '';
    }
    draw(maker, mouseX, mouseY) {
        if(this.mode == TextTool.MODES.SETTING) {
            if(!window.mobileAndTabletCheck() || clickingOnCanvas) {
                noStroke();
                fill(maker.getColor());
                CharTile.drawRaw(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, this.layer);
                strokeWeight(2);
                stroke(maker.getColor());
                noFill();
                rect(this.layer.toSCFX(this.getStartX()), this.layer.toSCFY(this.getStartY()), this.layer.toSCCX(this.getEndX()), this.layer.toSCCY(this.getEndY()));
            }
        } else {
            let x = this.box.x;
            let y = this.box.y;
            noStroke();
            fill(maker.getColor());
            for(let i = 0; i < this.text.length; i ++) {
                if(this.text[i] == '\n') {
                    x = this.box.x;
                    y += this.box.h;
                } else {
                    if(this.text[i] != ' ') {
                        CharTile.drawRawC(x, y, x + this.box.w - 1, y + this.box.h - 1, this.rotation, this.layer, this.text[i]);
                    }
                    x += this.box.w;
                }
            }
            if(this.frame > 32) {
                strokeWeight(2);
                stroke(maker.getColor());
                noFill();
                rect(this.layer.toSCFX(x), this.layer.toSCFY(y), this.layer.toSCCX(x + this.box.w - 1), this.layer.toSCCY(y + this.box.h - 1));
            }
        }
        this.frame = (this.frame + 1) % 64;
    }
    onMouseReleased(maker, mouseX, mouseY) {
        super.onMouseReleased(maker, mouseX, mouseY);
        if(this.mode == TextTool.MODES.SETTING) {
            this.mode = TextTool.MODES.TYPING;
            this.text = '';
            this.box = {x: this.getStartX(), y: this.getStartY(), w: this.getEndX() - this.getStartX() + 1, h: this.getEndY() - this.getStartY() + 1};
        }
        //this.place(maker, this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), this.rotation, maker.getColor(), this.layer);
        //maker.submitActions();
    }
    addChar(char) {
        this.text += char;
    }
    backspace() {
        this.text = this.text.slice(0, -1);
    }
    confirm() {
        let x = this.box.x;
        let y = this.box.y;
        for(let i = 0; i < this.text.length; i ++) {
            if(this.text[i] == '\n') {
                x = this.box.x;
                y += this.box.h;
            } else {
                if(this.text[i] != ' ') {
                    this.layer.forEach((tile) => {
                        if(tile.overlapsWith(x, y, x + this.box.w - 1, y + this.box.h - 1)) {
                            this.maker.addAction(new RemoveTileAction(tile));
                        }
                    });
                    this.maker.addAction(new AddCharTileAction(ID.getNext(), x, y, x + this.box.w - 1, y + this.box.h - 1, this.rotation, this.maker.getColor(), this.layer.ID, this.text[i]));
                }
                x += this.box.w;
            }
        }
        this.maker.submitActions();
        this.cancel();
    }
    cancel() {
        this.mode = TextTool.MODES.SETTING;
        this.text = '';
    }
}

class EraseTool extends DraggableTool {
    constructor() {
        super("ERASE");
    }
    drawBefore(maker, mouseX, mouseY) {
        if(Tool.DRAG_MODE != Tool.DRAG_MODE_OPTIONS.AREA || this.startEndEqual()) {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                if(tile.drawOutlineBefore) {
                    noFill();
                    stroke(255, 0, 0);
                    strokeWeight(3);
                    tile.drawOutline(0, 0);
                }
            });
        }
    }
    draw(maker, mouseX, mouseY) {
        noFill();
        stroke(255, 0, 0);
        strokeWeight(3);
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA && this.dragging) {
            let al = this.layer;
            line(al.toSCFX(this.getStartX()), al.toSCFY(this.getStartY()), al.toSCCX(this.getEndX()), al.toSCCY(this.getEndY()));
            line(al.toSCCX(this.getEndX()), al.toSCFY(this.getStartY()), al.toSCFX(this.getStartX()), al.toSCCY(this.getEndY()));
            rect(al.toSCFX(this.getStartX()), al.toSCFY(this.getStartY()), al.toSCCX(this.getEndX()), al.toSCCY(this.getEndY()));
        } else {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                if(!tile.drawOutlineBefore) {
                    tile.drawOutline(0, 0);
                }
            });
        }
    }
    onMousePressed(maker, mouseX, mouseY) {
        super.onMousePressed(maker, mouseX, mouseY);
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.DRAW) {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                maker.addAction(new RemoveTileAction(tile));
                maker.submitActions();
            });
        }
    }
    onDrag(maker, mouseX, mouseY) {
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.DRAW) {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                maker.addAction(new RemoveTileAction(tile));
                maker.submitActions();
            });
        }
    }
    onMouseReleased(maker, mouseX, mouseY) {
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA) {
            if(!this.dragging) {
                maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                    maker.addAction(new RemoveTileAction(tile));
                    maker.submitActions();
                });
            } else if(Tool.SELECTION_MODE == Tool.SELECTION_MODE_OPTIONS.CONTAIN) {
                maker.allWithinSelection(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), (tile) => {
                    maker.addAction(new RemoveTileAction(tile));
                });
                maker.submitActions();
            } else {
                maker.allOverlappingSelection(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), (tile) => {
                    maker.addAction(new RemoveTileAction(tile));
                });
            }
        }
        super.onMouseReleased(maker, mouseX, mouseY);
    }
}

class PaintTool extends DraggableTool {
    constructor() {
        super("PAINT");
    }
    drawBefore(maker, mouseX, mouseY) {
        if(Tool.DRAG_MODE != Tool.DRAG_MODE_OPTIONS.AREA || this.startEndEqual()) {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                if(tile.drawOutlineBefore) {
                    noFill();
                    stroke(maker.getColor());
                    strokeWeight(3);
                    tile.drawOutline(0, 0);
                }
            });
        }
    }
    draw(maker, mouseX, mouseY) {
        noFill();
        stroke(maker.getColor());
        strokeWeight(3);
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA && this.dragging) {
            let al = this.layer;
            rect(al.toSCFX(this.getStartX()), al.toSCFY(this.getStartY()), al.toSCCX(this.getEndX()), al.toSCCY(this.getEndY()));
        } else {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                if(!tile.drawOutlineBefore) {
                    tile.drawOutline(0, 0);
                }
            });
        }
    }
    onMousePressed(maker, mouseX, mouseY) {
        super.onMousePressed(maker, mouseX, mouseY);
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.DRAW) {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                maker.addAction(ModifyTileAction.create(tile, "color", maker.getColor()));
                maker.submitActions();
            });
        }
    }
    onDrag(maker, mouseX, mouseY) {
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.DRAW) {
            maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                maker.addAction(ModifyTileAction.create(tile, "color", maker.getColor()));
                maker.submitActions();
            });
        }
    }
    onMouseReleased(maker, mouseX, mouseY) {
        if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA) {
            if(this.startEndEqual()) {
                maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
                    maker.addAction(ModifyTileAction.create(tile, "color", maker.getColor()));
                    maker.submitActions();
                });
            } else if(Tool.SELECTION_MODE == Tool.SELECTION_MODE_OPTIONS.CONTAIN) {
                maker.allWithinSelection(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), (tile) => {
                    maker.addAction(ModifyTileAction.create(tile, "color", maker.getColor()));
                });
                maker.submitActions();
            } else {
                maker.allOverlappingSelection(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY(), (tile) => {
                    maker.addAction(ModifyTileAction.create(tile, "color", maker.getColor()));
                });
                maker.submitActions();
            }
        }
        super.onMouseReleased(maker, mouseX, mouseY);
    }
}

class SelectTool extends DraggableTool {
    constructor() {
        super("SELECT");
        this.hoveringSelection = false;
        this.moving = false;
        this.clicking = false;
    }
    draw(maker, mouseX, mouseY) {
        if(this.hoveringSelection) {
            cursor(MOVE);
        } else {
            cursor(ARROW);
        }
        if(!this.moving && this.dragging) {
            noFill();
            stroke(255, 0, 0);
            strokeWeight(3);
            drawingContext.setLineDash([10, 10]);
            let al = this.layer;
            rect(al.toSCFX(this.getStartX()), al.toSCFY(this.getStartY()), al.toSCCX(this.getEndX()), al.toSCCY(this.getEndY()));
            drawingContext.setLineDash([]);
        }
    }
    update(maker, mouseX, mouseY, mousePressed) {
        super.update(maker, mouseX, mouseY, mousePressed);
        this.clicking = mousePressed;
        if(maker.hasSelection()) {
            if(maker.getSelection().collidesWith(mouseX, mouseY)) {
                this.hoveringSelection = true;
            } else {
                this.hoveringSelection = false;
            }
        }
    }
    onDrag(maker, mouseX, mouseY) {
        if(this.moving && maker.hasSelection()) {
            maker.getSelection().setOffset(this.getXOffset(mouseX), this.getYOffset(mouseY));
        }
    }
    onDisable() {
        cursor(ARROW);
    }
    onMousePressed(maker, mouseX, mouseY) {
        super.onMousePressed(maker, mouseX, mouseY);
        if(this.hoveringSelection || (maker.hasSelection() && maker.getSelection().collidesWith(mouseX, mouseY))) {
            this.moving = true;
        }
    }
    onMouseReleased(maker, mouseX, mouseY) {
        if(this.moving && maker.hasSelection()) {
            this.moving = false;
            maker.getSelection().applyOffset(maker);
        } else {
            if(Tool.DRAG_MODE == Tool.DRAG_MODE_OPTIONS.AREA) {
                if(maker.hasSelection()) {
                    if(maker.getSelection().hasMoved) {
                        if(Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.ALL) {
                            maker.getSelection().removeOverlapping(maker);
                        } else if(Tool.REPLACEMENT_MODE == Tool.REPLACEMENT_MODE_OPTIONS.IDENTICAL) {
                            maker.getSelection().removeIdentical(maker);
                        }
                    }
                    if(!shiftPressed) {
                        maker.cancelSelection();
                    }
                }
                if(this.startEndEqual()) {
                    maker.firstColliding(mouseX, mouseY, (tile) => {
                        maker.getOrCreateSelection().add(tile);
                    });
                } else if(Tool.SELECTION_MODE == Tool.SELECTION_MODE_OPTIONS.CONTAIN) {
                    for(let tile of this.layer.children) {
                        if(tile.fitsWithin(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY())) {
                            maker.getOrCreateSelection().add(tile);
                        }
                    }
                } else {
                    for(let tile of this.layer.children) {
                        if(tile.overlapsWith(this.getStartX(), this.getStartY(), this.getEndX(), this.getEndY())) {
                            maker.getOrCreateSelection().add(tile);
                        }
                    }
                }
            }
        }
        super.onMouseReleased(maker, mouseX, mouseY);
    }
    increaseStrokeWeight() {
        for(let tile of this.maker.getSelection().tiles) {
            tile.strokeWeight = Maker.TOOLS.LINE.strokeWeight;
        }
    }
    decreaseStrokeWeight() {
        for(let tile of this.maker.getSelection().tiles) {
            tile.strokeWeight = Maker.TOOLS.LINE.strokeWeight;
        }
    }
}

class ColorSelectTool extends Tool {
    constructor() {
        super("EYEDROP");
        this.previousTool;
    }
    draw(maker, mouseX, mouseY) {
        noFill();
        stroke(255, 0, 0);
        strokeWeight(3);
        maker.firstCollidingInSelection(mouseX, mouseY, (tile) => {
            tile.drawOutline(0, 0);
        });
    }
    onEnable(maker) {
        this.previousTool = maker.currentTool; 
    }
    onMouseReleased(maker, mouseX, mouseY) {
        maker.firstColliding(mouseX, mouseY, (tile) => {
            setColor(tile.color);
            setTool(this.previousTool.name);
            console.log(this.previousTool.name);
        });
    }
}

class BezierTool extends DraggableTool {
    constructor () {
        super("BEZIER");
        this.hovering = 0;
        this.moving = 0;
        this.bezierTile;
    }
    onEnable(maker) {
        super.onEnable(maker);
        this.bezierTile = maker.getSelection().tiles[0];
    }
    draw(maker, mouseX, mouseY) {
        if(this.hovering) {
            cursor(MOVE);
        } else {
            cursor(ARROW);
        }
    }
    update(maker, mouseX, mouseY, mousePressed) {
        super.update(maker, mouseX, mouseY, mousePressed);
        if(!this.moving) {
            let al = this.layer;
            if(dist(mouseX, mouseY, al.toSCFX(this.bezierTile.getStartControlX()), al.toSCFY(this.bezierTile.getStartControlY())) < al.getGridSize()) {
                this.hovering = 1;
            } else if(dist(mouseX, mouseY, al.toSCFX(this.bezierTile.getEndControlX()), al.toSCFY(this.bezierTile.getEndControlY())) < al.getGridSize()) {
                this.hovering = 2;
            } else {
                this.hovering = 0;
            }
            if(mousePressed) {
                this.moving = this.hovering;
            }
        }
    }
    onMousePressed(maker, mouseX, mouseY) {
        super.onMousePressed(maker, mouseX, mouseY);
        if(this.hovering) {
            this.moving = this.hovering;
        }
    }
    onDrag(maker, mouseX, mouseY) {
        if(this.moving == 1) {
            this.bezierTile.setStartOffset(this.layer.toNearest(this.getXOffset(mouseX)), this.layer.toNearest(this.getYOffset(mouseY)));
        } else if(this.moving == 2) {
            this.bezierTile.setEndOffset(this.layer.toNearest(this.getXOffset(mouseX)), this.layer.toNearest(this.getYOffset(mouseY)));
        }
    }
    onMouseReleased(maker, mouseX, mouseY) {
        super.onMouseReleased(maker, mouseX, mouseY);
        if(this.moving) {
            let q = this.bezierTile.getBezier(this.moving);
            let t = this.bezierTile.getOffset(this.moving);
            maker.addAction(new SetBezierAction(this.bezierTile, this.moving, q.x+t.x, q.y+t.y));
            this.bezierTile.resetOffsets();
            this.moving = 0;
            maker.submitActions();
        }
    }
}

class CropTool extends DraggableTool {
    constructor() {
        super("CROP");
    }
    draw(maker, mouseX, mouseY) {
        noFill();
        stroke(0, 0, 0);
        strokeWeight(3);
        let al = this.layer;
        let sX = al.toSCFX(this.getStartX());
        let sY = al.toSCFY(this.getStartY());
        let eX = al.toSCCX(this.getEndX());
        let eY = al.toSCCY(this.getEndY());
        line(sX - 10, sY, eX, sY);
        line(eX, sY, eX, eY + 10);
        line(sX, eY, eX + 10, eY);
        line(sX, sY - 10, sX, eY);
    }
    onMouseReleased(maker, mouseX, mouseY) {
        super.onMouseReleased(maker, mouseX, mouseY);
        maker.addAction(new ResizeCanvasAction(maker.width, this.getEndX() - this.getStartX() + 1, maker.height, this.getEndY() - this.getStartY() + 1, ));
        maker.moveAll(-this.getStartX(), -this.getStartY());
    }
}