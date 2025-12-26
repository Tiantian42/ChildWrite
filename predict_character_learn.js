/* Canvas elements */
const canvas = document.getElementById('main-canvas');
const smallCanvas = document.getElementById('small-canvas');
const smallMainCanvas = document.getElementById('small-main-canvas');
const displayBox = document.getElementById('prediction');

const inputBox = canvas.getContext('2d');
const smBox = smallCanvas.getContext('2d');
const smMBox = smallMainCanvas.getContext('2d');

/* Modal */
const modal = document.getElementById('predictionModal');
const modalClose = document.getElementById('modalClose');
const predictionText = document.getElementById('predictionText');

const tryAnotherButton = document.getElementById('tryAnother');

canvas.style.backgroundColor = 'transparent';

let isDrawing = false;
let model;
let confidenceScore = 0; // Added global variable

/* Loads trained model */
async function init() {  
  model = await tf.loadModel('http://localhost:2600/tfjs-models/model-character/model.json');
}

/* Handles image upload */
const uploadInput = document.getElementById('upload-input');

uploadInput.addEventListener('change', handleImageUpload);

function preprocessImage(img) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  const tempContext = tempCanvas.getContext('2d');
  tempContext.drawImage(img, 0, 0, img.width, img.height);

  // Apply thresholding
  const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const brightness = (r + g + b) / 3;
    const threshold = 128;
    const newValue = brightness > threshold ? 255 : 0;
    imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = newValue;
  }
  tempContext.putImageData(imageData, 0, 0);

  return tempCanvas;
}

function handleImageUpload(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Preprocess the image (e.g., normalize, resize, or remove background)
        const processedImage = preprocessImage(img);

        // Draw the preprocessed image on the canvas
        inputBox.drawImage(processedImage, 0, 0, canvas.width, canvas.height);

        // Update display after predicting (if applicable)
        const predictions = predict();
        updateDisplay(predictions);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }
}


// Serves as the pen, when mouse is pressed down on the canvas
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
  values = tf.tensor4d(values, [1, 28, 28, 1]);
  return values;
}

/* pag white lng meron (kasi white ung sa canvas kaso nga naka opacity kasi) */
function isCanvasEmpty(imageData) {
  const tolerance = 170; // tollerance nya sa pagka less white
  const alphaThreshold = 178; //White na naka opacity (255 na naka 0.7)

  //(RGBA)red, green, blue, alpha values
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    // Basically, dito, dba extract ung RGBA values.
    //Tapos, determine kung ung pixels ma meet ung criteria
    //un i check nya kung ung color within sa tolerance nya na color na 170 mas mababa, kasi nga 178 ung 0.7 ng 255
    if (r < tolerance || g < tolerance || b < tolerance || a < alphaThreshold) {
      return false;
    }
  }
  return true;
}
/* ensure the predictions adhere to the dataset's standards (para di mataas ung feedback kahit malayo sa dataset*/
function preprocessImageForModel(imageData, width, height) { //preprocessImageForModel(avoid clash of uload and verdict)
  // Create a temporary canvas to preprocess the image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempContext = tempCanvas.getContext('2d');

  // Draw the image onto the temporary canvas
  tempContext.putImageData(imageData, 0, 0);

  // Resize the image to the required dimensions
  tempContext.drawImage(tempCanvas, 0, 0, width, height);

  // Get the resized image data
  const resizedImageData = tempContext.getImageData(0, 0, width, height);

  // Convert to grayscale and normalize pixel values
  const grayscaleData = [];
  for (let i = 0; i < resizedImageData.data.length; i += 4) {
    const gray = resizedImageData.data[i] * 0.299 + resizedImageData.data[i + 1] * 0.587 + resizedImageData.data[i + 2] * 0.114;
    grayscaleData.push(gray / 255); // Normalize to range [0, 1]
  }

  return grayscaleData;
}

function give_verdict() {
  // Retrieve the text content of the element with ID "writingDigit"
  let digit = parseInt(document.getElementById("writingDigit").textContent);
  
  // Draw the content of the inputBox canvas onto the smMBox canvas
  smMBox.drawImage(inputBox.canvas, 0, 0, smallCanvas.width, smallCanvas.height);
  
  // Get the image data of the smMBox canvas
  const imageData = smMBox.getImageData(0, 0, smallCanvas.width, smallCanvas.height);

/* Check if the canvas is empty (pag walang sulat) */
 if (isCanvasEmpty(imageData)) {
  alert("Oops...The canvas is empty, please draw something.");
  return;
}

  // Preprocess the image //preprocessImageForModel(avoid clash of uload and verdict)
  const preprocessedData = preprocessImageForModel(imageData, 28, 28); // Assuming the model expects 28x28 images

  // Predict the digit based on the preprocessed image data
  const predictions = predict();
  const bestPred = Math.max(...predictions);
  const bestPredIndex = predictions.indexOf(bestPred);
  const confidence = bestPred * 100;

  let resultText = '';

/*dyty diyay feedbck mismo*/
  // Check if the predicted digit matches the actual digit and if confidence is high enough
  // Check if the predicted digit matches the actual digit and if confidence is high enough
  if (digit === bestPredIndex && confidence > 60) {
    resultText = `
      🎉 Congratulations! 🎉 
      You got ${Math.floor(bestPred * 10)} out of 10
      Confidence Level: ${Math.floor(confidence)}%
      🌟⭐🌟⭐🌟⭐🌟⭐🌟
    `;
    modal.classList.add('modal-success');
    modal.classList.remove('modal-error');
  } else {
    resultText = `
      ⚠️ Oh no! There was a mistake ⚠️
      You scored ${Math.floor(bestPred * 5) >= 0 ? Math.floor(bestPred * 5) : 0} out of 10
      Confidence Level: ${Math.floor(confidence)}%
      😱😨😱😨😱😨😱😨😱
    `;
    modal.classList.add('modal-error');
    modal.classList.remove('modal-success');
  }

  // Display the result in the modal
  predictionText.innerText = resultText;
  modal.style.display = 'block';
}

document.getElementById('erase').addEventListener('click', erase);
document.getElementById('predict').addEventListener('click', give_verdict);
modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
  erase();
});

/* take the content of one canvas (smMBox.canvas), center it within 
another canvas (smBox), and return the resulting image data.*/
function stayImage() {
    smBox.save();
    smBox.translate(smallCanvas.width/2,smallCanvas.height/2);
    smBox.drawImage(smMBox.canvas,-smallCanvas.width/2,-smallCanvas.height/2);
    smBox.restore();
    return smBox.getImageData(0, 0, smallCanvas.width, smallCanvas.height);
}

/* Clears canvas */
function erase() {
  
// Set the fill style (0.7 ung opacity para makita ung tracer)
inputBox.fillStyle = 'rgba(255, 255, 255, 0.7)';

// Clear the canvas
inputBox.clearRect(0, 0, canvas.width, canvas.height);

// Fill the rectangle with the updated fill style
inputBox.fillRect(0, 0, canvas.width, canvas.height);


  // Clear any inner text content of displayBox
  displayBox.innerText = '';
  
  // Clear any inner text content of label
  label.innerText = '';
}

/* Clears the canvas, draw an image onto it, and 
position the image in the center of the canvas. */
function draw(){
    smBox.clearRect(0,0,smallCanvas.width,smallCanvas.height);
    smBox.save();
    smBox.translate(smallCanvas.width/2,smallCanvas.height/2);
    smBox.drawImage(image,-smallCanvas.width/2,-smallCanvas.height/2);
    smBox.restore();
}

	var start = function(e) {
    isDrawing = true; // Indicates that drawing has started.

    // Set drawing styles
    inputBox.strokeStyle = 'black'; // Set the stroke color to black.
    inputBox.lineWidth = '15'; // Set the line width to 15 pixels.
    inputBox.lineJoin = inputBox.lineCap = 'round'; // Set line join and cap styles to 'round'.
		
    // Begin a new path for drawing.
    inputBox.beginPath();
	};

var move = function(e) {
  e.preventDefault(); // Prevents default touch event behavior.
  
  // Get the coordinates of the touch event.
  x = e.changedTouches[0].pageX;
  y = e.changedTouches[0].pageY - 44; // Adjusting for any offset or padding.
  
  // If drawing is enabled, draw the stroke.
  if (isDrawing) drawStroke(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
  };
  
  var end = function(e) {
    isDrawing = false; // Indicates that drawing has ended.
  };
  
 // This event occurs when a touch starts on the touch surface.
 document.getElementById("main-canvas").addEventListener("touchstart", start, false);
 
 // This event occurs when a touch moves across the touch surface.
 document.getElementById("main-canvas").addEventListener("touchmove", move, false);
 
 //This event occurs when a touch is lifted from the touch surface.
 document.getElementById("main-canvas").addEventListener("touchend", end, false);

erase(); //  resets the canvas
init(); //sets up the initial state for the canvas