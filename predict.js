const canvas = document.getElementById('main-canvas');
const canvassnap = document.getElementById('main-canvas-snap');
const smallCanvas = document.getElementById('small-canvas');
const smallMainCanvas = document.getElementById('small-main-canvas');
const displayBox = document.getElementById('prediction');

const inputBox = canvas.getContext('2d');
const smBox = smallCanvas.getContext('2d');
const smMBox = smallMainCanvas.getContext('2d');

let isDrawing = false;
let model;

/* Loads trained model */
async function init() {
  model = await tf.loadModel('http://localhost:2600/tfjs-models/model/model.json');
}


canvas.addEventListener('mousedown', event => {
  isDrawing = true;

  inputBox.strokeStyle = 'black';
  inputBox.lineWidth = '15';
  inputBox.lineJoin = inputBox.lineCap = 'round';
  inputBox.beginPath();
});

canvas.addEventListener('mousemove', event => {
  if (isDrawing) drawStroke(event.clientX, event.clientY);
});

canvas.addEventListener('mouseup', event => {
  isDrawing = false;
//   updateDisplay(predict());
});

/* Draws on canvas */
function drawStroke(clientX, clientY) {
  // get mouse coordinates on canvas
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  // draw
  inputBox.lineTo(x, y);
  inputBox.stroke();
  inputBox.moveTo(x, y);
}

/* Makes predictions */
function predict() {
  let values = getPixelData(stayImage());
  let predictions = model.predict(values).dataSync();

  return predictions;
}

/* Returns pixel data from canvas after applying transformations */
function getPixelData(imgData) {

  // preserve and normalize values from red channel only
  let values = [];
  for (let i = 0; i < imgData.data.length; i += 4) {
    values.push(imgData.data[i] / 255);
  }
  values = tf.reshape(values, [1, 28, 28, 1]);
  return values;
}

/* Displays predictions on screen */
function updateDisplay() {
    smMBox.drawImage(inputBox.canvas, 0, 0, smallCanvas.width, smallCanvas.height);
    const imageData = smMBox.getImageData(0, 0, smallCanvas.width, smallCanvas.height);
  
  // Find index of best prediction, which corresponds to the predicted value
  predictions = predict()
  // console.log(predictions);
  const bestPred = predictions.indexOf(Math.max(...predictions));
  displayBox.innerText = bestPred;
  label.innerText = IMAGE_CLASSES[bestPred];
}

document.getElementById('erase').addEventListener('click', erase);
document.getElementById('predict').addEventListener('click', updateDisplay);

function stayImage() {

    smBox.save();
    smBox.translate(smallCanvas.width/2,smallCanvas.height/2);
    smBox.drawImage(smMBox.canvas,-smallCanvas.width/2,-smallCanvas.height/2);
    smBox.restore();
    return smBox.getImageData(0, 0, smallCanvas.width, smallCanvas.height);
}

/* Clears canvas */
function erase() {
  inputBox.fillStyle = 'white';
  inputBox.fillRect(0, 0, canvas.width, canvas.height);
  displayBox.innerText = '';
  label.innerText = '';
}

function draw(){
    smBox.clearRect(0,0,smallCanvas.width,smallCanvas.height);
    smBox.save();
    smBox.translate(smallCanvas.width/2,smallCanvas.height/2);
    smBox.drawImage(image,-smallCanvas.width/2,-smallCanvas.height/2);
    smBox.restore();
}

	var start = function(e) {
    isDrawing = true;


    inputBox.strokeStyle = 'black';
    inputBox.lineWidth = '15';
    inputBox.lineJoin = inputBox.lineCap = 'round';
		inputBox.beginPath();
	};
	var move = function(e) {
		e.preventDefault();
		x = e.changedTouches[0].pageX;
		y = e.changedTouches[0].pageY-44;
 
    if (isDrawing) drawStroke(e.changedTouches[0].pageX, e.changedTouches[0].pageY);

	};

  var end = function(e) {
    isDrawing = false;
  };
  document.getElementById("main-canvas").addEventListener("touchstart", start, false);
	document.getElementById("main-canvas").addEventListener("touchmove", move, false);
  document.getElementById("main-canvas").addEventListener("touchend", end, false);

erase();
init();