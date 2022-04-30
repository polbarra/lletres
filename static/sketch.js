let canvas;
let d;
let g;
let color = 50;
let lastPressTimestamp;
let shortClickThreshold = 500;
let x = 0;
let y = 0;

function setup(){
    canvas = createCanvas(400, 400);
}

function draw() {
    background(color);
    fill(0);

    if(mouseIsPressed){
        if(millis() - lastPressTimestamp < shortClickThreshold) {
            color = 0;
        }
        else{
                color = 255;
        }
    }
    text(x + ', ' + y, 200, 200);
}

function mousePressed() {
    x = mouseX;
    y = mouseY;
    lastPressTimestamp = millis();
}

function mouseReleased() {
    lastPressTimestamp = 0;
    color = 50;
}