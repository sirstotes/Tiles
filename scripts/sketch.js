//TODO: Eliminate global variable usage
//TODO: split into p5 stuff and dom interaction stuff
let maker;

let defaultPalette = ["#000000", "#1D2B53", "#7E2553", "#008751", "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8", "#FF004D", "#FFA300", "#FFEC27", "#00E436", "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA"];

let palette = [];

function addColorButtons(color) {
    let selectButton = document.createElement("button");
    selectButton.onclick = () => {setColor(color)};
    selectButton.style = "background-color:"+color+";";
    document.getElementById("colorPalette").appendChild(selectButton);

    let parent = document.createElement("span");
    let upButton = document.createElement("button");
    upButton.innerHTML = "<img src='assets/up.png'>";
    upButton.onclick = () => {moveColorUp(color)};
    upButton.style = "background-color:"+color+";";
    let downButton = document.createElement("button");
    downButton.innerHTML = "<img src='assets/down.png'>";
    downButton.onclick = () => {moveColorDown(color)};
    downButton.style = "background-color:"+color+";";
    let copyButton = document.createElement("button");
    copyButton.innerText = color;
    copyButton.onclick = () => {
        navigator.clipboard.writeText(color).then(() => {
            copyButton.innerText = "Copied!";
            setTimeout(() => {copyButton.innerText = color;}, 1000);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };
    copyButton.style = "background-color:"+color+";flex-grow:1;";
    let removeButton = document.createElement("button");
    removeButton.onclick = () => {removeColor(color)};
    removeButton.innerHTML = "<img src='assets/minus.png'>";
    removeButton.style = "background-color:"+color+";";

    parent.appendChild(upButton);
    parent.appendChild(downButton);
    parent.appendChild(copyButton);
    parent.appendChild(removeButton);
    document.getElementById("paletteButtons").appendChild(parent);

    return {
        selectButton: selectButton,
        control: parent,
        upButton: upButton,
        downButton: downButton
    }
}

function addColor(color) {
    for(let c of palette) {
        if(c == color) {
            return;
        }
    }

    palette.push(color);
    refreshDisplays();
}

function refreshDisplays() {
    document.getElementById("colorPalette").innerHTML = "";
    document.getElementById("paletteButtons").innerHTML = "";
    for(let color of palette) {
        addColorButtons(color);
    }
}

function removeColor(color) {
    for(let i = 0; i < palette.length; i ++) {
        if (palette[i] == color) {
            palette.splice(i, 1);
            break;
        }
    }
    refreshDisplays();
}

function moveColorDown(color) {
    let index;
    for(let i = 0; i < palette.length; i ++) {
        if (palette[i] == color) {
            index = i;
            break;
        }
    }
    if(index != undefined && index < palette.length - 1) {
        palette.splice(index + 1, 0, palette.splice(index, 1));
        refreshDisplays();
    }
}
function moveColorUp(color) {
    let index;
    for(let i = 0; i < palette.length; i ++) {
        if (palette[i] == color) {
            index = i;
            break;
        }
    }
    if(index != undefined && index > 0) {
        palette.splice(index - 1, 0, palette.splice(index, 1));
        refreshDisplays();
    }
}

function loadColorsFromString(string) {
    let readingColor = false;
    let color = "";
    let hex = /[a-zA-Z0-9]/;
    let colors = [];
    for(let char of string) {
        if(readingColor) {
            if(hex.test(char)) {
                color += char;
            } else {
                if(color.length == 7) {
                    colors.push(color);
                }
                readingColor = false;
            }
        } else if(char == "#") {
            readingColor = true;
            color = "#";
        }
    }
    if(colors.length > 0) {
        loadColors(colors);
    }
}

function loadColors(colors) {
    document.getElementById("colorPalette").childNodes = [];
    palette = [...colors];
    refreshDisplays();
}

function setColor(color) {
    maker.setColor(color);
    let current = document.getElementById("selectedColor");
    if(current) {
        current.id = "";
        current.classList = [];
    }
    for(let i = 0; i < palette.length; i ++) {
        if (palette[i] == color) {
            document.getElementById("colorPalette").childNodes[i].id = "selectedColor";
            document.getElementById("colorPalette").childNodes[i].classList = ["selected"];
            break;
        }
    }
}

function getMouseX() {
    return mouseX / canvasScale;
}

function getMouseY() {
    return mouseY / canvasScale;
}

function toggleMenu(id, button) {
    if(document.getElementById(id).style.display === "none") {
        document.getElementById(id).style.display = null;
        button.classList = ["highlighted"];
    } else {
        document.getElementById(id).style.display = "none";
        button.classList = [];
        if(document.getElementById(id).onhide) {
            document.getElementById(id).onhide();
        }
    }
}

function undo() {
    maker.undo();
}

function redo() {
    maker.redo();
}

function toggleGrid(button) {
    maker.toggleGrid();
    button.classList = maker.shouldDrawGrid ? ["highlighted"] : []
}

function setCanvasSize(w, h) {
    maker.width = w;
    maker.height = h;
    resizeCanvas(maker.width*maker.resolution, maker.height*maker.resolution);
}

function setResolution(r) {
    maker.resolution = r;
    resizeCanvas(maker.width*maker.resolution, maker.height*maker.resolution);
}

function setBackgroundColor(c) {
    maker.backgroundColor = c;
}

function setToolOption(optionName, value) {
    Tool[optionName] = Tool[optionName+"_OPTIONS"][value];
}

function setTool(toolName) {
    maker.setTool(Maker.TOOLS[toolName]);
    let currentButtons = document.getElementsByClassName("selectedButton");
    for(let b of currentButtons) {
        b.classList = [];
    }
    document.getElementById(toolName+"_Button").classList.add("selectedButton");
}

function cancelSelection() {
    maker.cancelSelection();
}

function groupSelection() {
    maker.groupSelection();
}

function ungroupSelection() {
    maker.ungroupSelection();
}

function copySelection() {
    maker.copySelection();
}

function flipSelection(h, v) {
    maker.flipSelection(h, v);
}

function rotateSelection(c) {
    maker.rotateSelection(c);
}

function clearClipboard() {
    maker.clearClipboard();
}

function paste() {
    maker.paste();
}

function onCopy(event) {
    maker.copySelection();
}

function onPaste(event) {
    let data = event.clipboardData.getData('text/plain');
    if(data.length > 0) {
        if(data.startsWith('TC CLIPBOARD:\n')) {
            maker.loadText(data);
        }
    }
}

function backSelection() {
    maker.backSelection();
}

function frontSelection() {
    maker.frontSelection();
}

function eraseSelection() {
    maker.eraseSelection();
}

function increaseLineWeight() {
    if(maker.currentTool == Maker.TOOLS.LINE) {
        Maker.TOOLS["LINE"].increaseStrokeWeight();
    } else if (maker.currentTool == Maker.TOOLS.CURVE) {
        Maker.TOOLS["CURVE"].increaseStrokeWeight();
    } else if (maker.currentTool == Maker.TOOLS.SELECT) {
        Maker.TOOLS["LINE"].increaseStrokeWeight();
        Maker.TOOLS["SELECT"].increaseStrokeWeight();
    }
}
function decreaseLineWeight() {
    if(maker.currentTool == Maker.TOOLS.LINE) {
        Maker.TOOLS["LINE"].decreaseStrokeWeight();
    } else if (maker.currentTool == Maker.TOOLS.CURVE) {
        Maker.TOOLS["CURVE"].decreaseStrokeWeight();
    } else if (maker.currentTool == Maker.TOOLS.SELECT) {
        Maker.TOOLS["LINE"].decreaseStrokeWeight();
        Maker.TOOLS["SELECT"].decreaseStrokeWeight();
    }
}
function cancelText() {
    if(maker.currentTool == Maker.TOOLS.TEXT) {
        maker.currentTool.cancel();
    }
}
function confirmText() {
    if(maker.currentTool == Maker.TOOLS.TEXT) {
        maker.currentTool.confirm();
    }
}

function insideCanvas(mouseX, mouseY) {
    return mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
}

function clearCanvas() {
    maker.clear();
}

function zoom(x) {
    canvasScale = constrain(canvasScale + x, 0.1, 3);
    document.getElementById("canvasContainer").style.scale = canvasScale;
}

function pan(x, y) {
    canvasXOffset = constrain(canvasXOffset + int(x) / canvasScale, -width, width);
    canvasYOffset = constrain(canvasYOffset + int(y) / canvasScale, -height, height);
    document.getElementById("canvasContainer").style.transform = "translate("+canvasXOffset+"px, "+canvasYOffset+"px)";
}

function continuousPress(button, callback) {
    button.addEventListener("mousedown", () => {
        button.pressInterval = setInterval(callback, 20);
        setTimeout(() => {clearInterval(button.pressInterval)}, 3000);
    });
    button.addEventListener("touchstart", () => {
        button.pressInterval = setInterval(callback, 20);
        setTimeout(() => {clearInterval(button.pressInterval)}, 3000);
    });
    button.addEventListener("mouseup", () => {
        clearInterval(button.pressInterval);
    });
    button.addEventListener("touchend", () => {
        clearInterval(button.pressInterval);
    });
}

function newProject() {
    console.log("New Project");
    ID.reset();
    let currentTool = maker.currentTool;
    maker = new Maker(document.getElementById("canvasW").value, document.getElementById("canvasH").value, document.getElementById("tileResolution").value, 1, document.getElementById("canvasBG").value);
    maker.currentTool = currentTool;
    maker.currentTool.onEnable(maker);
    resizeCanvas(maker.width*maker.resolution, maker.height*maker.resolution);
    refreshLayerDisplay();
}

function loadProject() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.tlc';

    input.onchange = e => { 
        // getting a hold of the file reference
        var file = e.target.files[0]; 

        // setting up the reader
        var reader = new FileReader();
        reader.readAsText(file,'UTF-8');

        // here we tell the reader what to do when it's done reading...
        reader.onload = readerEvent => {
            var content = readerEvent.target.result; // this is the content!
            loadFileText(content);
        }
    }

    input.click();
}

function loadFileText(text) {
    try {
        console.log("Loading text:");
        console.log(text);
        let currentTool = maker.currentTool;
        maker = Maker.fromBlocks(getIndentBlocks(text.split('\n')));
        maker.currentTool = currentTool;
        resizeCanvas(maker.width*maker.resolution, maker.height*maker.resolution);
    } catch (error) {
        console.error(error);
        maker = new Maker(initialSize, initialSize, initialResolution, 1, "#ffffff");
    }
    refreshLayerDisplay();
}

function saveProject() {
    let c = maker.saveToString();
    console.log(c);
    saveStrings(c.split('\n'), document.getElementById("fileName").value, "tlc");
}

function downloadCanvas() {
    maker.downloadCanvas(document.getElementById("fileName").value);
}

function getIndentBlocks(lines) {
    if(lines.length == 0) {
        return null;
    }
    let blocks = [];
    let blockIndex = -1;
    let nextLines = [];
    for(let line of lines) {
        if(numberOfTabs(line) == 0) {
            if(blockIndex < blocks.length && nextLines.length > 0) {
                blocks[blockIndex].children = getIndentBlocks(nextLines);
                nextLines = [];
            }
            blocks.push({head: line, children: []});
            blockIndex ++;
        } else if(line.trim() != '') {
            nextLines.push(line.slice(1));
        }
    }
    if(blockIndex < blocks.length && nextLines.length > 0) {
        blocks[blockIndex].children = getIndentBlocks(nextLines);
    }
    if(blocks[blocks.length - 1].head == '' && blocks[blocks.length - 1].children.length == 0) {
        blocks.pop();
    }
    return blocks;
}

function numberOfTabs(text) {
  var count = 0;
  var index = 0;
  while (text.charAt(index++) === "\t") {
    count++;
  }
  return count;
}

function addLayer() {
    maker.addAction(new AddLayerAction(ID.getNext()));
    maker.submitActions();
}

function initializeLayerSettings() {
    let menu = document.getElementById("layerSettings");
    document.getElementById('layers').onhide = () => {
        menu.style.display = "none";
        menu.currentLayer = null;
    };
    document.getElementById("layerNameInput").onchange = (event) => {
        menu.currentLayer.name = event.target.value;
        refreshLayerDisplay();
    };
    document.getElementById("layerScaleRange").onchange = (event) => {
        menu.currentLayer.gridScale = event.target.value;
    };
    document.getElementById("layerOffsetXCheckbox").onchange = (event) => {
        menu.currentLayer.offsetX = event.target.checked;
    };
    document.getElementById("layerOffsetYCheckbox").onchange = (event) => {
        menu.currentLayer.offsetY = event.target.checked;
    };
    document.getElementById("layerRemoveButton").onclick = () => {
        maker.addAction(new RemoveLayerAction(menu.currentLayer));
        maker.submitActions();
        menu.style.display = "none";
        menu.currentLayer = null;
    }
    document.getElementById("mergeLayerButton").onclick = () => {
        maker.addAction(new MergeLayerAction(menu.currentLayer));
        maker.submitActions();
        menu.style.display = "none";
        menu.currentLayer = null;
    }
}

function refreshLayerSettings(layer) {
    document.getElementById("layerSettings").currentLayer = layer;
    document.getElementById("layerNameInput").value = layer.name;
    document.getElementById("layerScaleRange").value = layer.gridScale;
    document.getElementById("layerOffsetXCheckbox").checked = layer.offsetX;
    document.getElementById("layerOffsetYCheckbox").checked = layer.offsetY;
    document.getElementById("mergeLayerButton").disabled = maker.layers.indexOf(layer) < 1;
    document.getElementById("layerRemoveButton").disabled = maker.layers.length < 2;
}

function refreshLayerDisplay() {
    let display = document.getElementById('layerDisplay');
    display.innerHTML = "";
    for(let i = 0; i < maker.layers.length; i ++) {
        let node = document.createElement("span");
        let name = document.createElement("button");
            name.type = "text";
            name.style.flexGrow = 1;
            name.style.gridArea = "label";
            name.classList.add("inlineInput");
            name.innerText = maker.layers[i].name;
            name.onclick = () => {
                if(maker.currentLayer == i) {
                    maker.selectActiveLayer();
                } else {
                    maker.setCurrentLayer(i);
                }
            };
            name.addEventListener('paste', onPaste);
            name.addEventListener('copy', onCopy);
        node.appendChild(name);
        let downButton = document.createElement("button");
            downButton.innerHTML = '<img src="assets/up.png">';
            downButton.onclick = () => {
                maker.moveLayerDown(maker.layers[i]);
                refreshLayerDisplay();
            };
        node.appendChild(downButton);
        let showButton = document.createElement("button");
            if(maker.layers[i].hidden) {
                showButton.innerHTML = '<img src="assets/eye-closed.png">';
            } else {
                showButton.innerHTML = '<img src="assets/eye-open.png">';
            }
            showButton.onclick = () => {
                if(maker.layers[i].hidden) {
                    showButton.innerHTML = '<img src="assets/eye-open.png">';
                } else {
                    showButton.innerHTML = '<img src="assets/eye-closed.png">';
                }
                maker.layers[i].hidden = !maker.layers[i].hidden;
            }
        node.appendChild(showButton);
        let upButton = document.createElement("button");
            upButton.innerHTML = '<img src="assets/down.png">';
            upButton.onclick = () => {
                maker.moveLayerUp(maker.layers[i]);
                refreshLayerDisplay();
            };
        node.appendChild(upButton);
        let settingsButton = document.createElement("button");
            settingsButton.innerHTML = '<img src="assets/gear.png">';
            settingsButton.onclick = () => {
                let reclick = maker.currentLayer == i;
                maker.setCurrentLayer(i);
                let menu = document.getElementById("layerSettings");
                if(reclick && menu.style.display != 'none') {
                    menu.style.display = "none";
                    menu.currentLayer = null;
                } else {
                    menu.style.display = '';
                }
            };
        node.appendChild(settingsButton);
        if(i == maker.currentLayer) {
            node.classList.add("highlighted");
        }
        display.appendChild(node);
    }
}

let canvas;
let initialResolution;
function setup() {
    let initialSize = document.getElementById("canvasW").value;
    initialResolution = document.getElementById("tileResolution").value;
    let c = createCanvas(initialSize*initialResolution, initialSize*initialResolution);

    try {
        let autosave = localStorage.getItem('autosave');
        if(autosave == undefined || autosave.length == 0) {
            throw new Error("No autosave detected. Creating new canvas.");
        } else {
            console.log("Located autosave: ");
            console.log(autosave);
            console.log("Loading...");
        }
        maker = Maker.fromBlocks(getIndentBlocks(autosave.split('\n')));
        resizeCanvas(maker.width*maker.resolution, maker.height*maker.resolution);
        console.log("Finished Loading");
    } catch (error) {
        console.error(error);
        maker = new Maker(initialSize, initialSize, initialResolution, 1, "#ffffff");
    }
    initializeLayerSettings();
    refreshLayerDisplay();

    let p = localStorage.getItem('palette');
    if(p != undefined && p.length > 0) {
        loadColors(p.split(","));
    } else {
        loadColors([...defaultPalette]);
    }

    //loadFont('/assets/CourierPrime-Regular.ttf');
    textFont('Courier New');
    textAlign(CENTER, CENTER);
    angleMode(DEGREES);

    c.parent('canvasContainer');
    canvas = document.getElementById("canvasContainer").firstChild;
    for (let element of document.getElementsByClassName("p5Canvas")) {
        element.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    canvas.addEventListener('copy', onCopy);
    document.getElementById("canvasContainer").addEventListener('copy', onCopy);
    document.getElementById("SELECT_Button").addEventListener('copy', onCopy);

    canvas.addEventListener('paste', onPaste);
    document.getElementById("canvasContainer").addEventListener('paste', onPaste);
    document.getElementById("SELECT_Button").addEventListener('paste', onPaste);

    setTool("RECT");
    setToolOption("REPLACEMENT_MODE", document.getElementById("replacementModeSelect").value);
    setToolOption("DRAG_MODE", document.getElementById("placementModeSelect").value);
    setToolOption("SELECTION_MODE", document.getElementById("selectionModeSelect").value);

    continuousPress(document.getElementById("zoomInButton"), () => {zoom(0.05)});
    continuousPress(document.getElementById("zoomOutButton"), () => {zoom(-0.05)});
    continuousPress(document.getElementById("panLeftButton"), () => {pan(10, 0)});
    continuousPress(document.getElementById("panRightButton"), () => {pan(-10, 0)});
    continuousPress(document.getElementById("panUpButton"), () => {pan(0, 10)});
    continuousPress(document.getElementById("panDownButton"), () => {pan(0, -10)});

    document.getElementById("canvasBGPicker").addEventListener('input', () => {
        document.getElementById("canvasBG").value = document.getElementById("canvasBGPicker").value;
    });
    document.getElementById("newColorPicker").addEventListener('input', () => {
        document.getElementById("newColorText").value = document.getElementById("newColorPicker").value;
    });

    rectMode(CORNERS);
    ellipseMode(CORNERS);
    // loadColors(defaultPalette);
    // setColor(defaultPalette[0]);
    noSmooth();
}

let canvasScale = 1;
let canvasXOffset = 0;
let canvasYOffset = 0;
let clickingOnCanvas = false;

function draw() {
    clear();
    
    maker.draw();
    maker.update(getMouseX(), getMouseY(), clickingOnCanvas);

    if(maker.hasSelection()) {
        document.getElementById("selectionTools").style = "";
        if(maker.getSelection().onlyBezier()) {
            document.getElementById("bezierControls").style = "";
        } else {
            document.getElementById("bezierControls").style = "display: none;";
        }
        if(maker.getSelection().onlyLinesOrCurves()) {
            document.getElementById("lineTools").style = "";
        } else {
            document.getElementById("lineTools").style = "display: none;";
        }
    } else {
        document.getElementById("selectionTools").style = "display: none;";
        if(maker.currentTool != Maker.TOOLS.LINE && maker.currentTool != Maker.TOOLS.CURVE) {
            document.getElementById("lineTools").style = "display: none;";
        }
    }
    if(maker.currentTool == Maker.TOOLS.TEXT && maker.currentTool.mode == TextTool.MODES.TYPING) {
        document.getElementById("textTools").style = "";
    } else {
        document.getElementById("textTools").style = "display: none;";
    }

    if(maker.clipboard.length > 0) {
        if(document.getElementById("pasteTools").style.display == 'none' && maker.clipboard.startsWith('TC CLIPBOARD:\n')) {
            document.getElementById("pasteTools").style = '';
        }
    } else {
        document.getElementById("pasteTools").style.display = 'none';
    }

    if(mouseIsPressed && mouseButton != "left") {
        pan(globalMouse.x - globalMouse2.x, globalMouse.y - globalMouse2.y);
    }

    globalMouse2.x = globalMouse.x;
    globalMouse2.y = globalMouse.y;
    if(Tool.ROTATION_MODE == Tool.ROTATION_MODE_OPTIONS.UI) {
        for(let button of document.getElementsByClassName("shapeButton")) {
            button.childNodes[0].style = "rotate:"+maker.getRotation()*90+"deg;"
        }
    }
}

controlPressed = false;
shiftPressed = false;
canvasSelected = false;

function keyPressed() {
    if(!canvasSelected) {
        return;
    }
    if(maker.currentTool == Maker.TOOLS.TEXT && maker.currentTool.mode == TextTool.MODES.TYPING) {
        if(key.length == 1) {
            maker.currentTool.addChar(key);
        } else if(key == 'Enter') {
            maker.currentTool.addChar('\n');
        } else if(key == 'Backspace') {
            maker.currentTool.backspace();
        }
        return;
    }
    switch(key) {
        case 'r':
            setTool("RECT");
        break;
        // case 'c':
        //     setTool("ELLIPSE");
        // break;
        case 'q':
            setTool("QUADRANT");
        break;
        case 'i':
            setTool("INVERSE_QUADRANT");
        break;
        case 'w':
            setTool("WEDGE");
        break;
        case 'b':
            setTool("BEZIER_WEDGE");
        break;
        case 'e':
            setTool("ERASE");
        break;
        case 'p':
            setTool("PAINT");
        break;
        case 's':
            setTool("SELECT");
        break;
        case 'g':
            toggleGrid(document.getElementById("gridButton"));
        break;
        case 'l':
            toggleMenu('layers', document.getElementById("layerMenuButton"));
        break;
        case 'Control':
            controlPressed = true;
        break;
        case 'Shift':
            shiftPressed = true;
        break;
        case 'z': case 'Z':
            if (controlPressed) {
                if(shiftPressed) {
                    redo();
                } else {
                    undo();
                }
            }
        break;
    }
}
function keyReleased() {
    switch (key) {
        case 'Control':
            controlPressed = false;
        break; 
        case 'Shift':
            shiftPressed = false;
        break; 
    }
}

function mousePressed(event) {
    if(event.target == canvas && insideCanvas(getMouseX(), getMouseY()) && mouseButton == "left") {
        clickingOnCanvas = true;
        canvasSelected = true;
        document.getElementById("canvasContainer").style.borderColor = "var(--white)";
    } else {
        document.getElementById("canvasContainer").style.borderColor = "var(--gray)";
        canvasSelected = false;
    }
}
function mouseReleased(event) {
    clickingOnCanvas = false;
}
function mouseWheel(event) {
    if (event.delta > 0) {
        canvasScale = max(canvasScale - 0.1, 0.1);
    } else {
        canvasScale = min(canvasScale + 0.1, 3);
    }
    document.getElementById("canvasContainer").style.scale = canvasScale;
}
function touchStarted(event) {
    if(event.target == canvas && insideCanvas(getMouseX(), getMouseY()) && mouseButton == "left") {
        clickingOnCanvas = true;
        canvasSelected = true;
        document.getElementById("canvasContainer").style.borderColor = "var(--highlight-2)";
    }
}
function touchEnded(event) {
    clickingOnCanvas = false;
    canvasSelected = false;
    document.getElementById("canvasContainer").style.borderColor = "var(--gray)";
}

let globalMouse = { x: undefined, y: undefined };
let globalMouse2 = { x: undefined, y: undefined };

window.addEventListener('mousemove', (event) => {
    globalMouse = { x: event.clientX, y: event.clientY };
});

window.addEventListener('beforeunload',(event) => {
    localStorage.setItem('autosave', maker.saveToString());
    localStorage.setItem('palette', palette);
});

window.setInterval(() => {
    localStorage.setItem('autosave', maker.saveToString());
    localStorage.setItem('palette', palette);
}, 60000);//Autosave every minute

window.addEventListener('gesturestart', function(e) {
  e.preventDefault();
});

window.mobileAndTabletCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};