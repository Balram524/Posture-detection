let capture;
let posenet;
let poses = [];
let isLive = false;
let currentImage = null;
let initialBackground = true; // Track whether the initial message should be shown

function setup() {
  let canvas = createCanvas(600, 480);
  canvas.parent("canvas-container");

  const goLiveBtn = document.getElementById("goLive");
  const imageUploadInput = document.getElementById("imageUpload");
  const captureBtn = document.getElementById("capture");

  goLiveBtn.addEventListener("click", () => {
    startLiveVideo();
    captureBtn.disabled = false;
    initialBackground = false; // Stop showing the initial background
  });

  imageUploadInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    handleImageUpload(file);
    captureBtn.disabled = true;
    initialBackground = false; // Stop showing the initial background
  });

  captureBtn.addEventListener("click", captureScreenshot);
}

function startLiveVideo() {
  if (capture) {
    capture.remove();
  }
  capture = createCapture(VIDEO);
  capture.hide();

  posenet = ml5.poseNet(capture, modelLoaded);
  posenet.on("pose", receivedPoses);
  isLive = true;
}

function handleImageUpload(file) {
  if (capture) {
    capture.remove();
  }

  const img = createImg(URL.createObjectURL(file), "", "", () => {
    image(img, 0, 0, width, height);

    // Load PoseNet after the image is loaded into the canvas
    posenet = ml5.poseNet(modelLoaded);
    posenet.on("pose", receivedPoses);
    posenet.singlePose(img.elt); // Ensuring PoseNet processes the uploaded image
    currentImage = img;
  });
  img.hide();
  isLive = false;
}

function receivedPoses(results) {
  poses = results;
}

function modelLoaded() {
  console.log("PoseNet model has loaded");
}

function draw() {
  if (initialBackground) {
    background(200);
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(100);
    text("Press 'Go Live' or Upload an Image", width / 2, height / 2);
    return;
  }

  background(255);

  if (isLive && capture) {
    image(capture, 0, 0);
  } else if (currentImage) {
    image(currentImage, 0, 0, width, height);
  }

  if (poses.length > 0) {
    for (let i = 0; i < poses.length; i++) {
      let pose = poses[i].pose;

      // Draw keypoints and skeleton
      drawSkeleton(pose);
    }
  }
}

function drawSkeleton(pose) {
  // Define the body part pairs to connect keypoints
  let connections = [
    [5, 6],
    [5, 7],
    [7, 9],
    [6, 8],
    [8, 10], // Arms
    [5, 11],
    [6, 12],
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16], // Legs
  ];

  // Draw keypoints
  for (let j = 0; j < pose.keypoints.length; j++) {
    let x = pose.keypoints[j].position.x;
    let y = pose.keypoints[j].position.y;
    fill(255, 0, 0);
    ellipse(x, y, 10, 10);
  }

  // Draw skeleton by connecting keypoints
  stroke(255, 0, 0);
  strokeWeight(2);
  for (let i = 0; i < connections.length; i++) {
    let partA = pose.keypoints[connections[i][0]];
    let partB = pose.keypoints[connections[i][1]];
    if (partA.score > 0.5 && partB.score > 0.5) {
      // Draw line only if confidence is high
      line(
        partA.position.x,
        partA.position.y,
        partB.position.x,
        partB.position.y
      );
    }
  }
}

function captureScreenshot() {
  const screenshot = createGraphics(width, height);
  screenshot.image(capture, 0, 0);
  screenshot.fill(255, 0, 0);

  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      let x = pose.keypoints[j].position.x;
      let y = pose.keypoints[j].position.y;
      screenshot.ellipse(x, y, 10, 10);
    }
  }

  // Display screenshot
  const imgElement = screenshot.canvas.toDataURL();
  const imgContainer = document.createElement("img");
  imgContainer.src = imgElement;
  imgContainer.className = "screenshot-image";
  imgContainer.addEventListener("click", () => {
    downloadImage(imgElement);
  });
  document.getElementById("screenshots").appendChild(imgContainer);
}

// Function to download image
function downloadImage(dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "pose_screenshot.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
