const eventContainer = document.querySelector("#dom-elements"); //initializing the element, not showing it yet [look at `gotResult` function]
const imageUpload = document.querySelector("#image-upload");
const captureFrameBtn = document.querySelector("#capture-frame-btn");
const previewImgContainer = document.querySelector("#preview-img-container");
const previewVideoContainer = document.querySelector(
  "#video-capture-container"
);
const recordBtn = document.querySelector("#record-canvas-btn");

let video;
let uNet;
let segmentationImage;
let bg;
let uNetActive = false;
let recording = false;
let recorder;
const chunks = [];
let counterSpan;

// load uNet model
function preload() {
  uNet = ml5.uNet("face");
}

//p5js initial setup
function setup() {
  createCanvas(540, 400);
  video = createCapture(VIDEO);
  video.size(200, 150);
  video.class("webcam-feed");
  segmentationImage = createImage(width, height);
  uNet.segment(video, gotResult); // initial segmentation
  bg = loadImage("./assets/loading.jpg"); //initial loading image
}

//adding the dom elements, from p5js
function draw() {
  background(bg);
  image(segmentationImage, 0, 0, width, height);
}

function gotResult(error, result) {
  if (error) {
    console.error(error);
    return;
  }
  if (!uNetActive) {
    //doing stuff after the initial uNet model has loaded and working, running this only once
    uNetActive = true;
    bg = loadImage("./assets/initial-background.jpg");
    const video = document.querySelector("video"); //getting the video after its created by p5js
    video.parentNode.insertBefore(eventContainer, video.nextSibling); //inserting the eventContainer after the video element [https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib]
    eventContainer.style.display = "block";
  }
  segmentationImage = result.backgroundMask;
  uNet.segment(video, gotResult);
}

//Image upload handler
imageUpload.addEventListener("change", (e) => {
  const imgSrc = window.URL.createObjectURL(e.target.files[0]);
  bg = loadImage(imgSrc); //changing background to imported image
  background(bg);
});

//Image preview and download handler
captureFrameBtn.addEventListener("click", () => {
  saveFrames("out", "png", 1, 25, (data) => {
    //removing single image if theres more than 6 images
    if (previewImgContainer.childElementCount + 1 > 6) {
      previewImgContainer.removeChild(
        previewImgContainer.getElementsByTagName("div")[0]
      );
    }
    const containerDiv = document.createElement("div");
    const img = new Image(300, 220);
    const downloadBtn = document.createElement("a");
    img.src = data[0].imageData;
    downloadBtn.href = data[0].imageData;
    img.className = "card-img-top";
    img.style.width = "300px"; //need this to override bootstrap style
    containerDiv.className = "col-6 col-md-6";
    downloadBtn.className = "btn btn-primary";
    downloadBtn.innerText = "Download";
    containerDiv.append(img);
    containerDiv.appendChild(downloadBtn);
    previewImgContainer.append(containerDiv);
    downloadBtn.download = `${data[0].filename}.${data[0].ext}`;
  });
});

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
}

function exportVideo(e) {
  const blob = new Blob(chunks);
  const vid = document.createElement("video");
  vid.id = "preview-video";
  vid.style.width = "400px";
  vid.style.height = "294px";
  // vid.id = "recorded";
  vid.controls = true;
  vid.src = URL.createObjectURL(blob);
  previewVideoContainer.appendChild(vid);
  vid.play();
}

//handling record-btn click
recordBtn.addEventListener("click", () => {
  if (!recording) {
    const previewVideo = document.querySelector("#preview-video");
    if (previewVideo) {
      previewVideoContainer.removeChild(previewVideo);
    }
    counterSpan = document.createElement("span");
    recordBtn.innerText = "stop recording";
    recordBtn.className = "btn btn-danger";
    counterSpan.className = "badge bg-secondary";
    counterSpan.innerText = 0;
    recordBtn.appendChild(counterSpan);
    record();
    recording = true;
    setInterval(() => {
      console.log(counterSpan.innerText);
      counterSpan.innerText = Number(counterSpan.innerText) + 1;
    }, 1000);
  } else {
    recording = false;
    recordBtn.innerHTML = "start a new recording";
    recordBtn.className = "btn btn-success";
    recorder.stop();
  }
});
