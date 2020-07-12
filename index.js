const eventContainer = document.querySelector("#event-container"); //initializing the element, not showing it yet [look at `gotResult` function]
const imageUpload = document.querySelector("#image-upload");
const captureFrameBtn = document.querySelector("#capture-frame-btn");
const previewImgContainer = document.querySelector("#preview-img-container");
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
  video.size(200, 150);
  segmentationImage = createImage(width, height);
  uNet.segment(video, gotResult); // initial segmentation
  bg = loadImage("./assets/loading.jpg"); //initial loading image
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
    const video = document.querySelector("video"); //getting the video after its created by p5js
    video.parentNode.insertBefore(eventContainer, video.nextSibling); //inserting the eventContainer after the video element [https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib]
    eventContainer.style.display = "table";
  }

  segmentationImage = result.backgroundMask;
  uNet.segment(video, gotResult);
}

//adding the dom elements, from p5js
function draw() {
  background(bg);
  image(segmentationImage, 0, 0, width, height);
}

//Image upload handler
imageUpload.addEventListener("change", (e) => {
  const imgSrc = window.URL.createObjectURL(e.target.files[0]);
  bg = loadImage(imgSrc); //changing background to imported image
  background(bg);
});

//Image download handler
captureFrameBtn.addEventListener("click", () => {
  saveFrames("out", "png", 1, 25, (data) => {
    //create a feature of capture-this-frame and show them all 8 images and allow them to download which frame they want to download
    for (let i = 0; i < 4; i++) {
      const containerDiv = document.createElement("div");
      const img = new Image(300, 200);
      const downloadBtn = document.createElement("a");
      img.src = data[i].imageData;
      downloadBtn.href = data[i].imageData;
      img.className = "card-img-top";
      containerDiv.className = "col-6 col-md-6";
      downloadBtn.innerText = "Download";
      downloadBtn.className = "btn btn-primary";
      previewImgContainer.append(containerDiv);
      containerDiv.append(img);
      containerDiv.appendChild(downloadBtn);
      downloadBtn.download = `${data[i].filename}.${data[i].ext}`;
    }
  });
});

const recordBtn = document.querySelector("#record-canvas");
let recording = false;
let recorder;
const chunks = [];

function record() {
  chunks.length = 0;
  let stream = document.querySelector("canvas").captureStream(30);
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size) {
      chunks.push(e.data);
    }
  };
  recorder.onstop = exportVideo;
  // recordBtn.onclick = (e) => {
  //   recorder.stop();
  //   recordBtn.innerText = "start recording";
  //   recordBtn.onclick = record;
  // };
  recorder.start();
  recordBtn.innerText = "stop recording";
}

function exportVideo(e) {
  var blob = new Blob(chunks);
  var vid = document.createElement("video");
  vid.id = "recorded";
  vid.controls = true;
  vid.src = URL.createObjectURL(blob);
  document.body.appendChild(vid);
  vid.play();
}

recordBtn.addEventListener("click", () => {
  if (!recording) {
    record();
    recording = true;
  } else {
    recording = false;
    recorder.stop();
    recordBtn.innerText = "start recording";
  }
});
