let canvas;
let d;
let g;
let color = 255;
let lastPressTimestamp;
let shortClickThreshold = 500;
let x = 0;
let y = 0;
let myGrid;
let piece;

class Grid{
    constructor(gridSize, resolution, offset) {
        this.grid = new Array(resolution * resolution);

        for (let i = 0; i < resolution; i++) 
            for (let j = 0; j < resolution; j++)
                this.grid[i+j*resolution] = 0;

        this.resolution = resolution;
        this.position = 0;
        this.offset = offset;
        this.gridSize = gridSize;
    }
    Render(){
        for (let i = 0; i < this.resolution*this.resolution; i++) {
            let cellPositionX =  (i % 10) * 40;
            let cellPositionY =  Math.floor((i / 10)) * 40;
            fill(255);
            const cellSize = this.gridSize/this.resolution;
            const pos = {
                x: cellPositionX + this.offset,
                y: cellPositionY + this.offset,
            };
            square(pos.x, pos.y, cellSize);
            fill(1);
            textAlign(CENTER, CENTER);
            text(this.grid[i] != 0 ? this.grid[i] : "", pos.x + cellSize/2, pos.y + cellSize/2)
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

            // check doesn't collide
            if (this.grid[idx+x_grid+y_grid*4] != 0 && piece.shape[i] != 0)
                return false;
        }

        return true;
    }

    placePiece(piece) {
        const idx = this.GetIdx(piece.position);
        for (let i = 0; i < 16; i++) {
            const x_grid = i % 4;
            const y_grid = Math.floor(i / 4);
            if (piece.shape[i] > 0) {
                this.grid[idx+x_grid+y_grid*this.resolution] = piece.letters[piece.shape[i]-1];
            }
        }
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
    myGrid = new Grid(400, 10, 50);
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
    myGrid.Render();
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
    const is_valid_placement = myGrid.CheckValidPosition(piece);
    if (is_valid_placement) {
        myGrid.placePiece(piece);
        //delete piece
    }
}
