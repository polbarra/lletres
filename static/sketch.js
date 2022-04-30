let canvas;
let d;
let g;
let color = 255;
let lastPressTimestamp;
let shortClickThreshold = 500;
let x = 0;
let y = 0;
let grid;
let piece;

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
        console.log(idx);
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

function setup(){
    canvas = createCanvas(500, 650);
    canvas.position(0,0,'fixed');
    grid = new Grid(400, 10, 50);
    let piecePosition = createVector(50, 500);
    let shape = [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 , 0, 0];
    piece = new Piece("WASD", shape, 0, piecePosition, 30)
}

function draw() {
    background(150);
    fill(0);

    if(mouseIsPressed){
        if(millis() - lastPressTimestamp < shortClickThreshold) {
            //Handle Short Press Input
        }
        else{
            piece.inHand = false;
            piece.position = createVector(mouseX - piece.size/2, mouseY - piece.size/2);
        }
    }
    grid.Render();
    piece.Update();
    piece.Render();
}

function mousePressed() {
    x = mouseX;
    y = mouseY;
    lastPressTimestamp = millis();
}

function mouseReleased() {
    lastPressTimestamp = 0;
    piece.inHand = true;
    //piece.position = createVector(50, 500);
    const valid_placement = grid.CheckValidPosition(piece);
}
