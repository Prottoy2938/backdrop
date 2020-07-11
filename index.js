const imageUpload = document.querySelector("#cs1-image-upload");
const captureFrame = document.querySelector("#capture-frame");
let video;
let uNet;
let segmentationImage;
let bg;
let uNetActive = false;

// load uNet model
function preload() {
  console.log("I'm running here");
  uNet = ml5.uNet("face");
}

function setup() {
  createCanvas(540, 400);
  //load up an image
  bg = loadImage("./assets/loading.jpg");
  // load up your video
  video = createCapture(VIDEO);
  video.size(width, height);
  //video.hide();
  // Start with a blank image
  segmentationImage = createImage(width, height);

  // initial segmentation
  uNet.segment(video, gotResult);
}

function gotResult(error, result) {
  if (error) {
    console.error(error);
    return;
  }
  //loading the initial background image
  if (!uNetActive) {
    bg = loadImage("./assets/initial-background.jpg");
    uNetActive = true;
  }
  segmentationImage = result.backgroundMask; // set the result to the global segmentation variable
  uNet.segment(video, gotResult); // Continue asking for a segmentation image
}

//adding the dom elements, from p5js
function draw() {
  background(bg);
  image(segmentationImage, 0, 0, width, height);
}

//Image Upload
imageUpload.addEventListener("change", (e) => {
  const imgSrc = window.URL.createObjectURL(e.target.files[0]);
  //changing background to imported image
  bg = loadImage(imgSrc);
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
