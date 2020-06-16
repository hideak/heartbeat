// Element declaration
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const colorR = document.getElementById('color-r');
const colorG = document.getElementById('color-g');
const colorB = document.getElementById('color-b');
const heartbeat = document.getElementById('heartbeat');
const beatLabel = document.getElementById('beat-label');
const context = canvas.getContext('2d');

// Constants declaration
const itemsLimit = 100;
const beatsLimit = 16;
const risingLabel = '❤️';
const fallingLabel = '❤';
const lowerThreshold = 0.2;
const upperThreshold = 0.8;
const lightDetectionFactor = 30;
const darkDetectionFactor = 5;

// Heartbeat buffer
const buffer = [];
const beats = [];
let stabilizingCount = 0;

// Initial flexible threshold
let threshold = upperThreshold;

// Content update for the webpage
function updateContent() {
    context.drawImage(video, 0, 0, 300, 300);
    const frame = context.getImageData(0, 0, 300, 300);
    const length = frame.data.length / 4;
    let [r, g, b] = [0, 0, 0];
    for(let i = 0; i < length; i++) {
        r = (i*r + frame.data[i*4+0])/(i+1);
        g = (i*g + frame.data[i*4+1])/(i+1);
        b = (i*b + frame.data[i*4+2])/(i+1);
    }
    colorR.innerHTML = `R: ${r.toFixed(3)}`;
    colorG.innerHTML = `G: ${g.toFixed(3)}`;
    colorB.innerHTML = `B: ${b.toFixed(3)}`;

    // Light detection
    if (b + g > 30) {
        heartbeat.innerHTML = "Place your finger on the device's camera!";
        beatLabel.innerHTML = '-';
        stabilizingCount = 0;
        return;
    }

    // Dark detection
    if (r < darkDetectionFactor * b) {
        heartbeat.innerHTML = "Wait for auto exposure or move to a brighter place...";
        beatLabel.innerHTML = '-';
        stabilizingCount = 0;
        return;
    }

    // Heartbeat monitor
    buffer.push(r);
    if (buffer.length > itemsLimit) buffer.shift();

    const maxRed = Math.max(...buffer);
    const minRed = Math.min(...buffer);
    const deltaRed = maxRed - minRed;

    if ((threshold > 0.5) && (r > minRed + threshold * deltaRed)) {
        beats.push(Date.now());
        threshold = lowerThreshold;
        beatLabel.innerHTML = risingLabel;
        stabilizingCount++;
    } else if ((threshold < 0.5) && (r < minRed + threshold * deltaRed)) {
        beats.push(Date.now());
        threshold = upperThreshold;
        beatLabel.innerHTML = fallingLabel;
        stabilizingCount++;
    } else return;

    if (beats.length > beatsLimit) beats.shift();

    const intervals = [];
    for (let i = 1; i < beats.length; i++) intervals.push(beats[i] - beats[i-1]);

    const heartMeasure = 30000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length);
    heartbeat.innerHTML = (stabilizingCount > beatsLimit)
        ? `Heart Rate (BPM): ${heartMeasure.toFixed(0)}`
        : `Stabilizing Values: ${stabilizingCount} of ${beatsLimit} ...`
}

if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
        video.srcObject = stream;
        video.play();
    });
}

setInterval(updateContent, 0);