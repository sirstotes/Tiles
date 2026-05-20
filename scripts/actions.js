class ID {
    static allObjects = [];
    static getNext(object) {
        ID.allObjects.push(object);
        return this.allObjects.length - 1;
    }
    static set(id, value) {
        ID.allObjects[id] = value;
    }
    static removeObject(id) {
        ID.allObjects[id] = null;
    }
    static withObject(id, callback) {
        if(ID.allObjects[id] == null) {
            throw new Error("Attempted to access null object "+id);
        } else {
            callback(ID.allObjects[id])
        }
    }
    static getOrNull(id) {
        return ID.allObjects[id];
    }
    static getOrThrow(id) {
        if(ID.allObjects[id]) {
            throw new Error("Attempted to access null object "+id);
        }
        return ID.allObjects[id];
    }
    static reset() {
        ID.allObjects = [];
    }
}
class Action {
    constructor(name) {
        this.name = name;
    }
    toString() {
        return this.name;
    }
    run() {

    }
    undo() {

    }
}
class MultiAction extends Action {
    constructor(actions) {
        super("MULTIPLE");
        this.actions = actions;
    }
    toString() {
        let string = this.name;
        for(let action of this.actions) {
            string += "\n     " + action;
        }
        return string;
    }
    run() {
        let returns = [];
        for(let i = 0; i < this.actions.length; i ++) {
            returns.push(this.actions[i].run());
        }
        return returns;
    }
    undo() {
        for(let i = this.actions.length - 1; i > -1; i --) {
            this.actions[i].undo();
        }
    }
}
class AddLayerAction extends Action {
    constructor(layerID) {
        super("ADD LAYER");
        this.layerID = layerID;
        this.index = maker.currentLayer + 1;
    }
    toString() {
        return `${this.name} ${this.layerID}`;
    }
    run() {
        maker.layers.splice(maker.currentLayer+1, 0, new Layer(this.layerID, maker));
        maker.setCurrentLayer(maker.currentLayer+1);
    }
    undo() {
        ID.withObject(this.layerID, (layer) => {
            maker.removeLayer(layer);
        });
        refreshLayerDisplay();
    }
}
class RemoveLayerAction extends Action {
    constructor(layer) {
        super("REMOVE LAYER");
        this.layerID = layer.ID;
        this.positionInParent = maker.layers.indexOf(layer);
    }
    toString() {
        return `${this.name} ${this.layerID}`;
    }
    run() {
        ID.withObject(this.layerID, (layer) => {
            maker.removeLayer(layer);
        });
        refreshLayerDisplay();
    }
    undo() {
        maker.layers.splice(this.positionInParent, 0, new Layer(this.layerID, maker));
        refreshLayerDisplay();
    }
}
class AddTileAction extends Action {
    constructor(tileID, type, startX, startY, endX, endY, rotation, color, layerID) {
        super("ADD");
        this.tileID = tileID;
        this.type = type;
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.rotation = rotation;
        this.color = color;
        this.layerID = layerID;
    }
    toString() {
        return `${this.name} ${this.tileID} ${this.type.name} ${this.startX} ${this.startY} ${this.endX} ${this.endY} ${this.rotation} ${this.color} ${this.layerID}`;
    }
    run() {
        ID.withObject(this.layerID, (layer) => {
            let t = new this.type(this.tileID, this.startX, this.startY, this.endX, this.endY, this.rotation, this.color);
            layer.addChild(t);
        });
        return this.tileID;
    }
    undo() {
        ID.withObject(this.tileID, (tile) => {
            maker.eraseTile(tile);
        });
        ID.removeObject(this.tileID);
    }
}
class RemoveTileAction extends Action {
    constructor(tile) {
        super("REMOVE");
        this.tileID = tile.ID;
        this.parentID = tile.parent.ID;
        this.positionInParent = tile.parent.indexOf(tile);
    }
    toString() {
        return `${this.name} ${this.tileID}`;
    }
    run() {
        ID.withObject(this.tileID, (tile) => {
            maker.eraseTile(tile);
        });
    }
    undo() {
        ID.withObject(this.parentID, (parent) => {
            ID.withObject(this.tileID, (tile) => {
                parent.addChild(tile, this.positionInParent);
            });
        });
    }
}
class ModifyTileAction extends Action {
    constructor(tileID, property, previousValue, newValue) {
        super("MODIFY");
        this.tileID = tileID;
        this.property = property;
        this.previousValue = previousValue;
        this.newValue = newValue;
    }
    toString() {
        return `${this.name} ${this.tileID} ${this.property} ${this.previousValue} ${this.newValue}`;
    }
    run() {
        ID.withObject(this.tileID, (tile) => {
            tile[this.property] = this.newValue;
        });
    }
    undo() {
        ID.withObject(this.tileID, (tile) => {
            tile[this.property] = this.previousValue;
        });
    }
}
class MoveTileAction extends Action {
    constructor(tileID, offsetX, offsetY) {
        super("MOVE");
        this.tileID = tileID;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
    toString() {
        return `${this.name} ${this.tileID} ${this.offsetX} ${this.offsetY}`;
    }
    run() {
        ID.withObject(this.tileID, (tile) => {
            tile.move(this.offsetX, this.offsetY);
        });
    }
    undo() {
        ID.withObject(this.tileID, (tile) => {
            tile.move(-this.offsetX, -this.offsetY);
        });
    }
}

class SetBezierAction extends Action {
    constructor(tile, bezierIndex, x, y) {
        super("SET BEZIER");
        this.tileID = tile.ID;
        this.bezierIndex = bezierIndex;
        this.x = x;
        this.y = y;
        let q = tile.getBezier(bezierIndex);
        this.pX = q.x;
        this.pY = q.y;
    }
    toString() {
        return `${this.name} ${this.tileID} ${this.bezierIndex} ${this.x} ${this.y}`;
    }
    run() {
        ID.withObject(this.tileID, (tile) => {
            tile.setBezier(this.bezierIndex, this.x, this.y);
        });
    }
    undo() {
        ID.withObject(this.tileID, (tile) => {
            tile.setBezier(this.bezierIndex, this.pX, this.pY);
        });
    }
}

class CreateGroupAction extends Action {
    constructor(groupID, tileIDs, parentID) {
        super("GROUP");
        this.groupID = groupID;
        this.tileIDs = tileIDs;
        this.parentID = parentID;
    }
    toString() {
        return `${this.name} ${this.groupID} ${this.tileIDs} ${this.parentID}`;
    }
    run() {
        ID.withObject(this.parentID, (parent) => {
            let g = new Group(this.groupID, parent);
            for(let tileID of this.tileIDs) {
                ID.withObject(tileID, (tile) => {
                    g.addChild(parent.removeChild(tile));
                })
            }
            parent.addChild(g);
            maker.getOrCreateSelection().tiles = [g];
        });
    }
    undo() {
        ID.withObject(this.groupID, (group) => {
            maker.getOrCreateSelection().tiles = group.dissolve();
        });
    }
}

class RemoveGroupAction extends Action {
    constructor(group) {
        super("UNGROUP");
        this.groupID = group.ID;
        this.tileIDs = group.children.map(child => child.ID);
        this.parentID = group.parent;
    }
    toString() {
        return `${this.name} ${this.groupID} ${this.tileIDs} ${this.parentID}`;
    }
    run() {
        ID.withObject(this.groupID, (group) => {
            maker.getOrCreateSelection().tiles = group.dissolve();
        });
    }
    undo() {
        ID.withObject(this.parentID, (parent) => {
            ID.withObject(this.groupID, (group) => {
                for(let tileID of this.tileIDs) {
                    ID.withObject(tileID, (tile) => {
                        group.addChild(parent.removeChild(tile));
                    })
                }
                parent.addChild(group);
                maker.getOrCreateSelection().tiles = [group];
            });
        });
    }
}

class ReorderObjectAction extends Action {
    constructor(object, indexAfter) {
        super("REORDER");
        this.objectID = object.ID;
        this.indexBefore = object.getIndexInParent();
        this.indexAfter = indexAfter
    }
    toString() {
        return `${this.name} ${this.objectID} ${this.indexBefore} ${this.indexAfter}`;
    }
    run() {
        ID.withObject(this.objectID, (object) => {
            object.parent.children.splice(object.parent.children.indexOf(object), 1);
            object.parent.children.splice(this.indexAfter, 0, object);
        });
    }
    undo() {
        ID.withObject(this.objectID, (object) => {
            object.parent.children.splice(object.parent.children.indexOf(object), 1);
            object.parent.children.splice(this.indexBefore, 0, object);
        });
    }
}
class ResizeCanvasAction extends Action {
    constructor(widthBefore, widthAfter, heightBefore, heightAfter) {
        super("REORDER");
        this.widthBefore = widthBefore;
        this.widthAfter = widthAfter;
        this.heightBefore = heightBefore;
        this.heightAfter = heightAfter;
    }
    toString() {
        return `${this.name} ${this.widthBefore} ${this.widthAfter} ${this.heightBefore} ${this.heightAfter}`;
    }
    run() {
        setCanvasSize(this.widthAfter, this.heightAfter);
    }
    undo() {
        setCanvasSize(this.widthBefore, this.heightBefore);
    }
}

class FlipSelectionAction extends Action {
    constructor(horizontal, vertical) {
        super("FLIP");
        this.horizontal = horizontal;
        this.vertical = vertical;
    }
    toString() {
        return `${this.name} ${this.horizontal} ${this.vertical}`;
    }
    run() {

    }
    undo() {
        
    }
}