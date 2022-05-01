let canvas;
let lastPressTimestamp;
let shortClickThreshold = 500;

let myGrid;
let pieces = [];
let selectedPiece;
let make_move = false;


let mouseWasReleased = false;
let mouseWasDragged = false;

let runGame = false;
let gridBackground;
let emptyTile;
let hTile;
let aTile;
let cTile;
let kTile;

class Grid{
    constructor(gridSize, resolution, offset) {
        this.grid = new Array(resolution * resolution);

        for (let i = 0; i < resolution; i++) 
            for (let j = 0; j < resolution; j++)
                this.grid[i+j*resolution] = '0';

        this.resolution = resolution;
        this.position = 0;
        this.offset = offset;
        this.gridSize = gridSize;
    }
    Render(){
        image(gridBackground, this.offset.x - 10, this.offset.y - 10);
        for (let i = 0; i < this.resolution*this.resolution; i++) {
            let cellPositionX =  (i % 10) * 40;
            let cellPositionY =  Math.floor((i / 10)) * 40;
            fill(255);
            const cellSize = this.gridSize/this.resolution;
            const pos = {
                x: cellPositionX + this.offset.x,
                y: cellPositionY + this.offset.y,
            };
            if(this.grid[i] == '0'){
                image(emptyTile, pos.x, pos.y);
            }
            else if(this.grid[i] === 'H'){
                image(hTile, pos.x, pos.y);
            }
            else if(this.grid[i] === 'A'){
                image(aTile, pos.x, pos.y);
            }
            else if(this.grid[i] === 'C'){
                image(cTile, pos.x, pos.y);
            }
            else if(this.grid[i] === 'K'){
                image(kTile, pos.x, pos.y);
            }
        }
    }

    GetIdx(position) {
        const cellSize = this.gridSize/this.resolution;
        return Math.floor((position.x-this.offset.x+cellSize/2)/cellSize) + Math.floor((position.y-this.offset.y+cellSize/2)/cellSize)*10;
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
            if(this.letters[i] == 'H'){
                image(hTile, this.position.x + segmentOffsetX, this.position.y + segmentOffsetY);
            }
            else if(this.letters[i] == 'A'){
                image(aTile, this.position.x + segmentOffsetX, this.position.y + segmentOffsetY);
            }
            else if(this.letters[i] == 'C'){
                image(cTile, this.position.x + segmentOffsetX, this.position.y + segmentOffsetY);
            }
            else if(this.letters[i] == 'K'){
                image(kTile, this.position.x + segmentOffsetX, this.position.y + segmentOffsetY);
            }
        }
    }
    Rotate(){
        let transposed = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        for (let i = 0; i < 4; i++) {
            for (let j = i; j < 4; j++) {
                transposed[i][j] = this.shape[i*4 + j];
            }
        }
        var n = 4 ;
        for (var i=0; i<n/2; i++) {
            for (var j=i; j<n-i-1; j++) {
                var tmp=transposed[i][j];
                transposed[i][j]=transposed[n-j-1][i];
                transposed[n-j-1][i]=transposed[n-i-1][n-j-1];
                transposed[n-i-1][n-j-1]=transposed[j][n-i-1];
                transposed[j][n-i-1]=tmp;
            }
        }

        for (let i = 0; i < 4; i++) {
            for (let j = i; j < 4; j++) {
                this.shape[i*4 + j] = transposed[i][j];
            }
        }

    }
}

const piece_shapes = {
    bar1:      [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bar2:      [1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0],
    bar3:      [4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bar4:      [4, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0],
    l1:        [1, 0, 0, 0, 2, 0, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0],
    l2:        [3, 2, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    l3:        [4, 3, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    l4:        [0, 0, 4, 0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    square1:    [1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    square2:    [3, 1, 0, 0, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    square3:    [4, 3, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    square4:    [2, 4, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    s1:        [0, 1, 0, 0, 3, 2, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0],
    s2:        [1, 2, 0, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    s3:        [0, 4, 0, 0, 2, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    s4:        [4, 3, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

const pieces_positions = {
    left: {x: 90, y: 700},
    right: {x: 290, y: 700},
}

function setup(){
    canvas = createCanvas(500, 1000);
    canvas.position(0,0,'fixed');
    
    InitialiseGameScene();
    gridBackground = loadImage('../images/GridBackground.png');
    emptyTile = loadImage('../images/EmptyTile.png');
    hTile = loadImage('../images/HTile.png');
    aTile = loadImage('../images/ATile.png');
    cTile = loadImage('../images/CTile.png');
    kTile = loadImage('../images/KTile.png');
}

function draw() {
    background(29, 22, 56);

    UpdateGameScene();
    RenderGameScene();
}

function mousePressed() {
    lastPressTimestamp = millis();
}

function mouseDragged() {
    mouseWasDragged = true;
}

function mouseReleased() {
    mouseWasReleased = true;
    lastPressTimestamp = 0;
}

function InitialiseMatchmakingScene(){

}
function UpdateMatchmakingScene(){

}
function RenderMatchmakingScene(){

}

function InitialiseGameScene(){
    myGrid = new Grid(400, 10, createVector(50, 150));
    pieces = [
        new Piece("HACK", piece_shapes.square3, 0, pieces_positions.left, 40),
        new Piece("HACK", piece_shapes.square4, 0, pieces_positions.right, 40),
    ]
}
function UpdateGameScene(){
    if(mouseWasDragged){
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
        mouseWasDragged = false;
    }
    if(mouseWasReleased){
        if (selectedPiece) {
            const is_valid_placement = myGrid.CheckValidPosition(selectedPiece);

            if (is_valid_placement) {
                myGrid.placePiece(selectedPiece);
            }

            selectedPiece.position = selectedPiece.orig;
            selectedPiece.inHand = false;
            selectedPiece = null;
        }else {
            for (let i = 0; i < pieces.length; i++) {
                if (
                    mouseX - pieces[i].position.x < pieces[i].size*4 &&
                    mouseY - pieces[i].position.y < pieces[i].size*4 &&
                    mouseX > pieces[i].position.x &&
                    mouseY > pieces[i].position.y && make_move){
                    pieces[i].Rotate();
                }
            }
        }
        mouseWasReleased = false;
    }
}
function RenderGameScene(){
    fill(95, 87, 79);
    myGrid.Render();
    fill(200);
    square(75, 685, 150, 40);
    square(275, 685, 150, 40);

    for(let i = 0; i < pieces.length; i++){
        pieces[i].Render();
    }
}

function InitialiseWinnerScene(){

}
function UpdateWinnerScene(){

}
function RenderWinnerScene(){

}

function InitialiseLoosingScene(){

}
function UpdateLoosingScene(){

}
function RenderLoosingScene(){

}