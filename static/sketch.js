let canvas;
let d;
let g;
let gray = 0;
let x = 0;
let y = 0;

function setup(){
    canvas = createCanvas(400, 400);
}

function draw() {
    background(255);
    fill(0);
    text(x + ', ' + y, 200, 200);
}

function mousePressed() {
    x = mouseX;
    y = mouseY;
}