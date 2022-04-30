let canvas;
let lastPressTimestamp;
let shortClickThreshold = 500;

let grid;
let pieces = [];
let selectedPiece;

class Grid{
    constructor(gridSize, resolution, offset) {
        this.grid = new Array(resolution * resolution);
        this.resolution = resolution;
        this.offset = offset;
        this.gridSize = gridSize;
    }
    Render(){
        for (let i = 0; i < this.resolution*this.resolution; i++) {
            let cellPositionX =  Math.floor(i / 10) * 40;
            let cellPositionY = (i % 10) * 40;
            fill(255);
            square(cellPositionX + this.offset, cellPositionY + this.offset, this.gridSize / this.resolution);
        }
    }
    GetIdx(position) {
        const cellSize = this.gridSize/this.resolution;
        return Math.floor((position.x-this.offset+cellSize/2)/cellSize) + Math.floor((position.y-this.offset+cellSize/2)/cellSize)*10;
    }
    CheckValidPosition(piece){
        const idx = this.GetIdx(piece.position);

        if (idx < 0)
            return false;

        for (let i = 0; i < 16; i++) {
            let x_grid = i % 4;
            let y_grid = Math.floor(i / 4);
            if (idx + x_grid < this.resolution) // right overlflow
                return false
            if (idx + this.resolution*y_grid < this.resolution*this.resolution) // bottom overlfow
                return false

            // check doesn't collide
            if (grid[idx+x_grid+y_grid*this.resolution] != '0')
                return false;
        }
        return false;
    }

    placePiece(piece){

    }
}
class Piece{
    constructor(letters, shape, rotation, position, size) {
        this.position = position;
        this.size = size;
        this.letters = letters;
        this.shape = shape;
        this.rotation = rotation;
        this.inHand = true;
    }
    Update(){
        if(this.inHand){
            this.size = 30;
        }
        else{
            this.size = 40;
        }
    }
    Render(){
        for(let i = 0; i < 4; i++){
            let segmentOffsetX;
            let segmentOffsetY;
            for(let j = 0; j < 16; j++){
                if(this.shape[j] === i+1){
                    segmentOffsetY = Math.floor(j / 4) * this.size;
                    segmentOffsetX = (j % 4) * this.size;
                }
            }
            fill(200);
            square(this.position.x + segmentOffsetX, this.position.y + segmentOffsetY, this.size, 5);
            fill(1);
            textAlign(CENTER, CENTER);
            text(this.letters[i], this.position.x + segmentOffsetX + this.size/2, this.position.y + segmentOffsetY + this.size/2)
        }
    }
}
class HandSlot{
    constructor(piece, position) {
        this.piece = piece;
        this.position= position;
        this.empty = false;
    }
}

function setup(){
    canvas = createCanvas(500, 700);
    canvas.position(0,0,'fixed');
    grid = new Grid(400, 10, 50);
    let piecePosition = createVector(90, 500);
    let shape = [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 , 0, 0];
    pieces.push(new Piece("WASD", shape, 0, piecePosition, 30));
}

function draw() {
    background(150);
    fill(0);

    if(mouseIsPressed){
        if(millis() - lastPressTimestamp < shortClickThreshold) {
            //Handle Short Press Input
        }
        else{
            selectedPiece = pieces[0];
            selectedPiece.inHand = false;
            selectedPiece.position = createVector(mouseX - selectedPiece.size/2, mouseY - selectedPiece.size/2);
        }
    }
    grid.Render();
    fill(200);
    square(75, 485, 150, 40);
    square(275, 485, 150, 40);

    for(let i = 0; i < pieces.length; i++){
        pieces[i].Update();
        pieces[i].Render();
    }
}

function mousePressed() {
    lastPressTimestamp = millis();
}

function mouseReleased() {
    lastPressTimestamp = 0;
    selectedPiece.inHand = true;
    selectedPiece.position = createVector(100, 500);
    const is_valid_placement = grid.CheckValidPosition(selectedPiece);
    if (is_valid_placement) {

    }
}
