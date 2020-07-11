const imageUpload = document.querySelector("#cs1-image-upload");
const captureFrame = document.querySelector("#capture-frame");
const domBody = document.querySelector("body");

let video;
let uNet;
let segmentationImage;
let bg;
let uNetActive = false;

// load uNet model
function preload() {
  uNet = ml5.uNet("face");
}

//p5js initial setup
function setup() {
  createCanvas(540, 400);
  video = createCapture(VIDEO);
  video.size(width, height);
  segmentationImage = createImage(width, height);
  // initial segmentation
  uNet.segment(video, gotResult);
  bg = loadImage("./assets/loading.jpg");
}

function gotResult(error, result) {
  if (error) {
    console.error(error);
    return;
  }
  if (!uNetActive) {
    //doing stuff after the initial uNet model has loaded and working
    uNetActive = true;
    bg = loadImage("./assets/initial-background.jpg");
    const imageInput = document.createElement("input");
    imageInput.type = "text";
    const canvas = document.querySelector("video"); //getting the canvas after its created by p5js
    canvas.parentNode.insertBefore(imageInput, canvas.nextSibling);
  }
  segmentationImage = result.backgroundMask; // set the result to the global segmentation variable
  uNet.segment(video, gotResult); // Continue asking for a segmentation image
}

//adding the dom elements, from p5js
function draw() {
  background(bg);
  image(segmentationImage, 0, 0, width, height);
}

//Image Upload handler
imageUpload.addEventListener("change", (e) => {
  const imgSrc = window.URL.createObjectURL(e.target.files[0]);
  bg = loadImage(imgSrc); //changing background to imported image
  background(bg);
});

//Image Download
captureFrame.addEventListener("click", () => {
  saveFrames("out", "png", 1, 25, (data) => {
    print(data);
    //create a feature of capture-this-frame and show them all 8 images and allow them to download which frame they want to download
    for (let i = 0; i < data.length; i++) {
      downloadFile(data[i].imageData, data[i].filename, data[i].ext);
    }
  });
});
