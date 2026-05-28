class Selection {
    constructor(tiles) {
        this.tiles = tiles;
        this.hasMoved = false;
        this.displayOffsetX = 0;
        this.displayOffsetY = 0;
    }
    size() {
        return this.tiles.length;
    }
    removeOverlapping(maker) {
        for(let tile of this.tiles) {
            maker.allOverlapping(tile.startX, tile.startY, tile.endX, tile.endY, (t) => {
                if(!this.includes(t)) {
                    maker.addAction(new RemoveTileAction(t));
                }
            })
        }
        maker.submitActions();
    }
    removeIdentical(maker) {
        for(let tile of this.tiles) {
            maker.getActiveLayer().forEach((t) => {
                if(t != tile && t instanceof Tile && t.sameAs(tile)) {
                    maker.addAction(new RemoveTileAction(t));
                }
            })
        }
        maker.submitActions();
    }
    remove(tile) {
        if(this.includes(tile)) {
            this.tiles.splice(this.tiles.indexOf(tile), 1);
        }
    }
    includes(tile) {
        return this.tiles.includes(tile);
    }
    setOffset(x, y) {
        this.displayOffsetX = x;
        this.displayOffsetY = y;
    }
    resetOffset() {
        this.displayOffsetX = 0;
        this.displayOffsetY = 0;
    }
    applyOffset(maker) {
        if(this.displayOffsetX == 0 && this.displayOffsetY == 0) {
            return;
        }
        this.hasMoved = true;
        for(let tile of this.tiles) {
            maker.addAction(new MoveTileAction(tile.ID, this.displayOffsetX, this.displayOffsetY));
        }
        maker.submitActions();
        this.resetOffset();
    }
    drawOutlinesBefore() {
        noFill();
        stroke(0, 0, 255);
        strokeWeight(3);
        for(let tile of this.tiles) {
            if(tile.drawOutlineBefore) {
                tile.drawOutline(this.displayOffsetX, this.displayOffsetY);
            }
        }
    }
    drawOutlines() {
        noFill();
        stroke(0, 0, 255);
        strokeWeight(3);
        for(let tile of this.tiles) {
            if(!tile.drawOutlineBefore) {
                tile.drawOutline(this.displayOffsetX, this.displayOffsetY);
            }
        }
    }
    collidesWith(screenX, screenY)  {
        for(let tile of this.tiles) {
            if(tile.collidesWith(screenX, screenY)) {
                return true;
            }    
        }
        return false;
    }
    add(tile) {
        this.tiles.push(tile);
    }
    erase(maker) {
        for(let tile of this.tiles) {
            maker.addAction(new RemoveTileAction(tile));
        }
        maker.submitActions();
    }
    onlyBezier() {
        return this.tiles.length == 1 && this.tiles[0] instanceof BezierWedgeTile;
    }
    onlyLinesOrCurves() {
        if(this.tiles.length == 0) {
            return false;
        }
        for(let tile of this.tiles) {
            if (!(tile instanceof LineTile) && !(tile instanceof CurveTile)) {
                return false;
            }
        }
        return true;
    }
    getBounds() {
        return this.tiles.reduce((a, t) => {
            let bounds = t.getBounds();
            if(a == undefined) {
                return bounds;
            }
            return {startX: min(a.startX, bounds.startX), startY: min(a.startY, bounds.startY), endX: max(a.endX, bounds.endX), endY: max(a.endY, bounds.endY)};
        }, undefined);
    }
}