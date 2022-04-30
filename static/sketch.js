let canvas;
let lastPressTimestamp;
let shortClickThreshold = 500;

let myGrid;
let pieces = [];
let selectedPiece;
let make_move = false;

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

            if (this.grid[idx+x_grid+y_grid*this.resolution] != 0 && piece.shape[i] != 0)
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

        send_data_to_player({"grid": this.grid});
        make_move = false;
    }
}

class Piece{
    constructor(letters, shape, rotation, position, size) {
        this.position = position;
        this.size = size;
        this.letters = letters;
        this.shape = shape;
        this.rotation = rotation;
        this.inHand = false;
        this.orig = position;
    }
    Update(){
        if (this.inHand) {
            this.size = 40;
        } else {
            this.size = 30;
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

const piece_shapes = {
    bar:      [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    l:        [1, 0, 0, 0, 2, 0, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0],
    square:   [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    s:        [0, 0, 1, 0, 0, 2, 3, 0, 0, 4, 0, 0, 0, 0, 0, 0],
}

const pieces_positions = {
    left: {x: 90, y: 500},
    right: {x: 300, y: 500},
}

function setup(){
    canvas = createCanvas(500, 700);
    canvas.position(0,0,'fixed');
    myGrid = new Grid(400, 10, 50);
    pieces = [
        new Piece("WASD", piece_shapes.bar, 0, pieces_positions.left, 30),
        new Piece("WASD", piece_shapes.square, 0, pieces_positions.right, 30),
    ]
}

function draw() {
    background(150);
    fill(0);

    myGrid.Render();
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

function mouseDragged() {
    if (selectedPiece) {
        selectedPiece.position = createVector(mouseX - selectedPiece.size/2, mouseY - selectedPiece.size/2);
    } else if (millis() - lastPressTimestamp < shortClickThreshold) {
        for (let i = 0; i < pieces.length; i++) {
            if (
                mouseX - pieces[i].position.x < pieces[i].size*4 &&
                mouseY - pieces[i].position.y < pieces[i].size*4 &&
                mouseX > pieces[i].position.x &&
                mouseY > pieces[i].position.y && make_move){
                selectedPiece = pieces[i];
                selectedPiece.inHand = true;
            }
        }
    }

}

function mouseReleased() {
    lastPressTimestamp = 0;
    if (selectedPiece) {
        const is_valid_placement = myGrid.CheckValidPosition(selectedPiece);
        if (is_valid_placement) {
            myGrid.placePiece(selectedPiece);
        }
        selectedPiece.position = selectedPiece.orig;
        selectedPiece.inHand = false;
        selectedPiece = null;
    }
}
