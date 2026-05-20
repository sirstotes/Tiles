class Maker {//TODO split into maker and canvas
    static TOOLS = {
        CROP: new CropTool(),
        RECT: new RectTool(),
        ELLIPSE: new ShapeTool("ELLIPSE", EllipseTile),
        QUADRANT: new ShapeTool("QUADRANT", QuadrantTile),
        INVERSE_QUADRANT: new ShapeTool("INVERSE_QUADRANT", InverseQuadrantTile),
        WEDGE: new WedgeTool(),
        BEZIER_WEDGE: new ShapeTool("BEZIER_WEDGE", BezierWedgeTile),
        ERASE: new EraseTool(),
        PAINT: new PaintTool(),
        SELECT: new SelectTool(),
        EYEDROP: new ColorSelectTool(),
        BEZIER: new BezierTool(),
        LINE: new LineTool(),
        CURVE: new CurveTool()
    }
    constructor(width, height, resolution, layers, backgroundColor) {
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.layers = [];
        for(let i = 0; i < layers; i ++) {
            this.layers.push(new Layer(ID.getNext(), this));
        }
        this.shouldDrawGrid = true;
        this.currentTool = Maker.TOOLS.RECT;
        this.currentTool.onEnable(this);
        this.currentColor = '#000000';
        this.currentStartMouseX = 0;
        this.currentStartMouseY = 0;
        this.currentEndMouseX = 0;
        this.currentEndMouseY = 0;
        this.currentRotation = 0;
        this.currentLayer = 0;
        this.movingSelection = false;
        this.selection = null;
        this.dragging = false;
        this.pMousePressed = false;
        this.pMouseX = 0;
        this.pMouseY = 0;
        this.backgroundColor = backgroundColor;
        this.actions = [];
        this.currentAction = -1;
        this.newActions = [];
        this.historySize = 20;
        this.saving = false;
    }
    addAction(action) {
        this.newActions.push(action);
    }
    addActionInternal(action) {
        this.actions.push(action);
        if(this.currentAction < this.historySize) {
            this.currentAction ++;
        } else {
            this.actions.shift();
        }
    }
    submitActions() {
        if(this.newActions.length > 0) {
            if(this.currentAction < this.actions.length - 1) {
                this.actions.splice(this.currentAction + 1, this.actions.length - this.currentAction + 1);
            }
            let action;
            if(this.newActions.length > 1) {
                action = new MultiAction(this.newActions);
            } else {
                action = this.newActions[0];
            }
            console.log("Submitting: "+action.toString());
            this.addActionInternal(action);
            this.newActions = [];
            return action.run();
        }
    }
    draw() {
        if(this.backgroundColor) {
            background(this.backgroundColor);
        } else {
            clear();
        }
        this.currentTool.drawBefore(this, getMouseX(), getMouseY());
        this.render(this.displayCanvas);
        if(this.shouldDrawGrid) {
            this.getActiveLayer().drawGrid();
        }
        if(this.hasSelection()) {
            this.selection.drawOutlines();
        }
        this.currentTool.draw(this, getMouseX(), getMouseY());
    }
    update(mouseX, mouseY, mousePressed) {
        if(this.dragging) {
            if(!mousePressed) {
                if(insideCanvas(mouseX, mouseY) && focused) {
                    this.currentTool.onDragEnd(this);
                }
                this.dragging = false;
            } else {
                this.currentTool.onDrag(this);
            }
        } else {
            if(insideCanvas(mouseX, mouseY) && focused) {
                this.currentStartMouseX = round(mouseX);
                this.currentStartMouseY = round(mouseY);
                if(mousePressed && mouseButton == "left") {
                    this.currentTool.onDragStart(this);
                    this.dragging = true;
                }
            }
        }
        if(insideCanvas(mouseX, mouseY) && focused) {
            if(mousePressed && !this.pMousePressed) {
                this.currentTool.onMousePressed(this, mouseX, mouseY);
            }
            if(!mousePressed && this.pMousePressed) {
                this.currentTool.onMouseReleased(this, mouseX, mouseY);
            }
            this.currentEndMouseX = round(mouseX);
            this.currentEndMouseY = round(mouseY);
            if(this.getActiveLayer().toLCF(mouseX) != this.getActiveLayer().toLCF(this.pMouseX) || this.getActiveLayer().toLCFY(mouseY) != this.getActiveLayer().toLCFY(this.pMouseY)) {
                this.currentTool.onTileChange(this);
            }
        }
        this.currentTool.update(this, mouseX, mouseY, mousePressed);
        this.pMouseX = mouseX;
        this.pMouseY = mouseY;
        this.pMousePressed = mousePressed;
    }
    getStartX() {
        return this.getActiveLayer().toLCF(min(this.currentStartMouseX, this.currentEndMouseX));
    }
    getStartY() {
        return this.getActiveLayer().toLCFY(min(this.currentStartMouseY, this.currentEndMouseY));
    }
    getEndX() {
        return this.getActiveLayer().toLCF(max(this.currentStartMouseX, this.currentEndMouseX));
    }
    getEndY() {
        return this.getActiveLayer().toLCFY(max(this.currentStartMouseY, this.currentEndMouseY));
    }
    getCurrentX() {
        return this.getActiveLayer().toLCF(this.currentEndMouseX);
    }
    getCurrentY() {
        return this.getActiveLayer().toLCFY(this.currentEndMouseY);
    }
    getXOffset() {
        return this.getActiveLayer().toLCF(this.currentEndMouseX - this.currentStartMouseX);
    }
    getYOffset() {
        return this.getActiveLayer().toLCFY(this.currentEndMouseY - this.currentStartMouseY);
    }
    startEndEqual() {
        return this.getStartX() == this.getEndX() && this.getStartY() == this.getEndY();
    }
    getRotation() {
        return this.currentRotation;
    }
    getSelection() {
        return this.selection;
    }
    getOrCreateSelection() {
        if(!this.hasSelection()) {
            this.selection = new Selection([])
        }
        return this.selection;
    }
    hasSelection() {
        return this.selection instanceof Selection;
    }
    undo() {
        if(this.currentAction > -1) {
            console.log("Undo: "+this.actions[this.currentAction].toString());
            this.actions[this.currentAction].undo();
            this.currentAction --;
        }
    }
    redo() {
        if(this.currentAction < this.actions.length - 1) {
            this.currentAction ++;
            console.log("Redo: "+this.actions[this.currentAction].toString());
            this.actions[this.currentAction].run();
        }
    }
    downloadCanvas(fileName) {
        if(this.backgroundColor != undefined) {
            clear();
            background(this.backgroundColor);
        } else {
            clear();
        }
        this.saving = true;
        this.render(this.displayCanvas);
        this.saving = false;
        saveCanvas(fileName+".png");
    }
    setCurrentLayer(index) {
        this.currentLayer = index;
        refreshLayerSettings(this.layers[this.currentLayer]);
        refreshLayerDisplay();
    }
    setRotation(rotation) {
        this.currentRotation = rotation;
    }
    setTool(tool) {
        this.currentTool.onDisable(this);
        tool.onEnable(this);
        this.currentTool = tool;
    }
    getActiveLayer() {
        return this.layers[this.currentLayer];
    }
    render() {
        for (let i = 0; i < this.layers.length; i ++) {
            if(!this.saving && i == this.currentLayer && this.hasSelection()) {
                this.selection.drawOutlinesBefore();
            }
            this.layers[i].render();
        }
    }
    clear() {
        console.log("RESET");
        ID.reset();
        this.actions = [];
        this.newActions = [];
        this.currentAction = -1;
        this.layers = [new Layer(ID.getNext(), this)];
        this.selection = undefined;
    }
    setColor(color) {
        this.currentColor = color;
    }
    getColor() {
        return this.currentColor;
    }
    toggleGrid() {
        this.shouldDrawGrid = !this.shouldDrawGrid;
    }

    firstColliding(x, y, callback) {
        // for (let i = this.layers.length - 1; i >= 0; i--) {
        //     let layer = this.layers[i];
        //     for(let j = layer.size() - 1; j >= 0; j--) {
        //         let shape = layer.getChild(j);
        //         if(shape.collidesWith(x, y)) {
        //             callback(shape);
        //             return;
        //         }
        //     }
        // }
        for(let j = this.getActiveLayer().size() - 1; j >= 0; j--) {
            let shape = this.getActiveLayer().getChild(j);
            if(shape.collidesWith(x, y)) {
                callback(shape);
                return;
            }
        }
    }

    allWithin(sX, sY, eX, eY, callback) {
        for(let i = this.getActiveLayer().size()-1; i >= 0; i --) {
            let shape = this.getActiveLayer().getChild(i);
            if(shape.fitsWithin(sX, sY, eX, eY)) {
                callback(shape);
            }
        }
    }

    allOverlapping(sX, sY, eX, eY, callback) {
        for(let i = this.getActiveLayer().size()-1; i >= 0; i --) {
            let shape = this.getActiveLayer().getChild(i);
            if(shape.overlapsWith(sX, sY, eX, eY)) {
                callback(shape);
            }
        }
    }

    firstCollidingInSelection(x, y, callback) {
        this.firstColliding(x, y, (tile) => {
            if(!this.hasSelection() || this.selection.includes(tile)) {//Only include selected tiles, or any tile if none are selected
                callback(tile);
            }
        });
    }

    allWithinSelection(sX, sY, eX, eY, callback) {
        this.allWithin(sX, sY, eX, eY, (tile) => {
            if(!this.hasSelection() || this.selection.includes(tile)) {//Only include selected tiles, or any tile if none are selected
                callback(tile);
            }
        });
    }

    allOverlappingSelection(sX, sY, eX, eY, callback) {
        this.allOverlapping(sX, sY, eX, eY, (tile) => {
            if(!this.hasSelection() || this.selection.includes(tile)) {//Only include selected tiles, or any tile if none are selected
                callback(tile);
            }
        });
    }
    
    eraseTile(tile) {
        tile.erase();
        if(this.hasSelection()) {
            this.removeFromSelection(tile);
        }
    }
    removeFromSelection(tile) {
        this.selection.remove(tile);
        if(this.selection.size() == 0) {
            this.cancelSelection();
        }
    }
    cancelSelection() {
        this.selection = null;
    }
    groupSelection() {
        if(this.selection.tiles.length > 1) {
            let newGroupID = ID.getNext();
            let tileIDs = this.selection.tiles.map((tile) => tile.ID);
            this.addAction(new CreateGroupAction(newGroupID, tileIDs, this.getActiveLayer().ID));
            this.submitActions();
        }
    }

    ungroupSelection() {
        let newSelection = [];
        for(let shape of this.selection.tiles) {
            if(shape instanceof Group) {
                newSelection.push(...shape.children);
                this.addAction(new RemoveGroupAction(shape));
            } else {
                newSelection.push(shape);
            }
        }
        this.submitActions();
        this.selection = new Selection(newSelection);
    }

    addClones(shape) {
        if(shape instanceof Tile) {
            this.addAction(new AddTileAction(ID.getNext(), shape.constructor, shape.startX+1, shape.startY+1, shape.endX+1, shape.endY+1, shape.rotation, shape.color, this.getActiveLayer().ID))
        } else if (shape instanceof Group) {
            for(let child of shape.children) {
                this.addClones(child);
            }
        }
    }

    duplicateSelection() {
        for(let shape of this.selection.tiles) {
            this.addClones(shape);
        }
        let returns = this.submitActions();
        if(returns != null) {
            let newSelection = returns.map((tileID) => ID.getOrNull(tileID)).filter((tile) => tile != null);
            this.selection = new Selection(newSelection);
        }
    }

    backSelection() {
        for(let shape of this.selection.tiles) {
            this.addAction(new ReorderObjectAction(shape, 0));
        }
        this.submitActions();
    }
    frontSelection() {
        for(let shape of this.selection.tiles) {
            this.addAction(new ReorderObjectAction(shape, shape.parent.children.length - 1));
        }
        this.submitActions();
    }
    rotateSelection(direction) {
        if(direction > 0) {
            
        } else {

        }
    }
    eraseSelection() {
        this.selection.erase(this);
        this.selection = null;
    }
    moveAll(x, y) {
        for(let layer of this.layers) {
            for(let object of layer) {
                this.addAction(new MoveTileAction(object.ID, x, y));
            }
        }
        maker.submitActions();
    }
    moveLayerUp(layer) {
        let cl = this.layers[this.currentLayer];
        let index = this.layers.indexOf(layer);
        if(index != -1) {
            this.layers.splice(index, 1);
            this.layers.splice(index-1, 0, layer);
            this.currentLayer = this.layers.indexOf(cl);
        }
    }
    moveLayerDown(layer) {
        let cl = this.layers[this.currentLayer];
        let index = this.layers.indexOf(layer);
        if(index != -1) {
            this.layers.splice(index, 1);
            this.layers.splice(index+1, 0, layer);
            this.currentLayer = this.layers.indexOf(cl);
        }
    }
    removeLayer(layer) {
        let index = this.layers.indexOf(layer);
        if(index != -1) {
            this.layers.splice(index, 1);
            this.currentLayer = min(this.currentLayer, this.layers.length - 1)
        }
    }
    saveToString() {
        let str = `${this.width} ${this.height} ${this.backgroundColor}`;
        for(let layer of this.layers) {
            str += '\n' + layer.saveToString(0);
        }
        return str;
    }
    static fromBlocks(blocks) {
        //console.log(blocks);
        let options = blocks[0].head.split(' ');
        let newMaker = new Maker(int(options[0]), int(options[1]), initialResolution, 0, options[2]);
        for(let i = 1; i < blocks.length; i ++) {
            if(blocks[i].head.startsWith("Layer")) {
                newMaker.layers.push(Layer.fromBlock(blocks[i], newMaker));
            }
        }
        return newMaker;
    }
}