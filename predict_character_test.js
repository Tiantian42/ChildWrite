const canvas = document.getElementById('main-canvas');
const smallCanvas = document.getElementById('small-canvas');
const smallMainCanvas = document.getElementById('small-main-canvas');

const displayBox = document.getElementById('prediction');

const scoresList = document.getElementById('scores-list');

const inputBox = canvas.getContext('2d');
const smBox = smallCanvas.getContext('2d');
const smMBox = smallMainCanvas.getContext('2d');

const modal = document.getElementById('predictionModal');
const modalClose = document.getElementById('modalClose');
const predictionText = document.getElementById('predictionText');

const tryAnotherButton = document.getElementById('tryAnother');


let isDrawing = false;
let model;
let confidenceScore = 0; // Added global variable
let scores = []; // Array to store the last 20 scores

/* Loads trained model */
async function init() {  
  model = await tf.loadModel('http://localhost:2600/tfjs-models/model-character/model.json');
}

/* Handles image upload */
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

function updateDisplay(prediction) {
  // Your update display logic here
}

function predict() {
  // Your prediction logic here
  return "Prediction result";
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
});

/* Draws on canvas */
function drawStroke(clientX, clientY) {
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
  let values = [];
  for (let i = 0; i < imgData.data.length; i += 4) {
    values.push(imgData.data[i] / 255);
  }
  values = tf.reshape(values, [1, 28, 28, 1]);
  return values;
}

/* capture the content of the canvas where the user is drawing 
and processes it further based on the text content */
function isCanvasEmpty(imageData) {
  // Check if all pixels are white
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i] !== 255 || imageData.data[i + 1] !== 255 || imageData.data[i + 2] !== 255) {
      return false;
    }
  }
  return true;
}

function preprocessImageForModel(imageData, width, height) {
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

  // Check if the canvas is empty
  if (isCanvasEmpty(imageData)) {
    alert("Oops...The canvas is empty, please draw something.");
    return;
  }

  // Preprocess the image
  const preprocessedData = preprocessImageForModel(imageData, 28, 28); // Assuming the model expects 28x28 images

  // Predict the digit based on the preprocessed image data
  const predictions = predict(preprocessedData); // Ensure your predict function accepts this format
  const bestPred = Math.max(...predictions);
  const bestPredIndex = predictions.indexOf(bestPred);

  let resultText = '';
  let saveScores = '';

  // Check if the predicted digit matches the actual digit and if confidence is high enough
  if (digit === bestPredIndex && Math.floor(bestPred * 10) > 6) {
    tryAnotherButton.disabled = false;
    resultText = `
      🎉 Congratulations! 🎉 
      You got ${Math.floor(bestPred * 10)} out of 10
      Confidence Level: ${Math.floor(bestPred * 100)}% 
      🌟⭐🌟⭐🌟⭐🌟⭐🌟
    `; 
    saveScores = `${Math.floor(bestPred * 10)} `;
    modal.classList.add('modal-success');
    modal.classList.remove('modal-error');
    tryAnotherButton.style.display = 'inline-block'; // Show the "Next" button
  } else {
    const score = Math.floor(bestPred * 5) >= 0 ? Math.floor(bestPred * 5) : 0;
    saveScores = `${score} `;
    tryAnotherButton.disabled = true;
    ShowPopup();
    resultText = `
      ⚠️ Oh no! There was a mistake ⚠️
      You scored ${score} out of 10
      Confidence Level: ${Math.floor(bestPred * 50)}%
      😱😨😱😨😱😨😱😨😱
    `;
    modal.classList.add('modal-error');
    modal.classList.remove('modal-success');
    tryAnotherButton.style.display = 'none'; // Hide the "Next" button
  }

    // Save the score
    const engLetters = ENG_CHAR_LETTERS_CLASS[digit];
    saveScore(`${engLetters} | ${saveScores}`);

  // Display the result in the modal
  predictionText.innerText = resultText;
  modal.style.display = 'block';
}

function saveScore(score) {
  scores.unshift(score); // Add new score at the end
  if (scores.length > 20) { //number of scores na ma sesave
    scores.pop(); // Remove the oldest score if we have more than 20
  }
  updateScoresDisplay();
}

function updateScoresDisplay() {
  scoresList.innerHTML = ''; // Clear the current list
  scores.forEach(score => {
    const listItem = document.createElement('li');
    listItem.textContent = score;
    scoresList.appendChild(listItem);
  });
}

// Collapsible functionality
document.addEventListener('DOMContentLoaded', function() {
  var coll = document.getElementsByClassName("collapsible");

  for (var i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = "300px"; //max height ng collapsible mismo
      }
    });
  }
});


document.getElementById('erase').addEventListener('click', erase);
document.getElementById('predict').addEventListener('click', give_verdict);
modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
  erase();
});


tryAnotherButton.addEventListener('click', () => {
  if (tryAnotherButton.disabled) {
    return;
  } else {
    random_digit();
    erase();
    modal.style.display = 'none'; // Pag nag click ng next mawawala modal

  }
});

function ShowPopup() {
  var popup = document.getElementById("myPopup");
  popup.classList.toggle("show");
  
  // 3 seconds timer before mawala (3000 milliseconds)
  setTimeout(function() {
    popup.classList.remove("show");
  }, 3000);
}

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

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  function initCharactersQueue() {
    charactersQueue = [...Array(26).keys()];
    shuffleArray(charactersQueue);
  }
  
  function random_digit() {
    if (charactersQueue.length === 0) {
      initCharactersQueue();
    }
    
    const digit = charactersQueue.pop();
    document.getElementById("writingDigit").textContent = digit;
    document.getElementById("writingDigit_text_eng").textContent = ENG_CHAR_LETTERS_CLASS[digit];
    document.getElementById('audio_source').src = `/audio/character/${digit}.mp3`;
    document.getElementById('audio').load();
    document.getElementById('audio').play();
  }
  
  erase();
  init();
  initCharactersQueue();
  random_digit();