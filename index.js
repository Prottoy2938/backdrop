const eventContainer = document.querySelector("#dom-elements"); //initializing the element, not showing it yet [look at `gotResult` function]
const imageUpload = document.querySelector("#image-upload");
const captureFrameBtn = document.querySelector("#capture-frame-btn");
const previewImgContainer = document.querySelector("#preview-img-container");
const previewVideoContainer = document.querySelector(
  "#video-capture-container"
);
const recordBtn = document.querySelector("#record-canvas-btn");
const backgroundColor = document.querySelector("#background-color-picker");
const recordIconClone = document.querySelector("#record-icon").cloneNode(true);
const loadingTime = document.querySelector("#loading-time")
const recordAudio = document.querySelector("#audio-recorder")


let video;
let uNet;
let segmentationImage;
let bg;
let uNetActive = false;
let recording = false;
let recorder;
const chunks = [];
let updateTimer;
let timeCounter = 45; //loading time component


navigator.mediaDevices.getUserMedia({
  audio: true,
}).then(strm => {
  if (window.URL) {
    recordAudio.srcObject = strm;
  } else {
    recordAudio.src = strm;
  }
}, error => {
  // Something went wrong, or the browser does not support getUserMedia
});

// load uNet model
function preload() {
  uNet = ml5.uNet("face");
}



const captureInterval = setInterval(() => {
  if (timeCounter !== 0) {
    timeCounter = timeCounter - 1;
    console.log(timeCounter)
    loadingTime.innerText = `Estimated loading time: ${timeCounter} seconds`
  }

}, 1000);

//p5js initial setup
function setup() {
  createCanvas(540, 400);
  video = createCapture(VIDEO);
  video.size(200, 150); //displaying the main image on the side
  video.class("webcam-feed");
  segmentationImage = createImage(width, height);
  uNet.segment(video, gotResult); // initial segmentation
  bg = loadImage("./assets/loading.jpg"); //initial loading image

}

//adding the dom elements, from p5js. this function runs continuously
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
    loadingTime.style.display = "none"
    clearInterval(captureInterval)
  }
  segmentationImage = result.backgroundMask;
  uNet.segment(video, gotResult);
}

//starts capturing video from canvas and saving that data on `chunks` [https://stackoverflow.com/questions/42437971/exporting-a-video-in-p5-js]
function startRecording() {
  let audioCtx = new AudioContext();
  // create a stream from our AudioContext
  let dest = audioCtx.createMediaStreamDestination();
  // connect our video element's output to the stream
  let sourceNode = audioCtx.createMediaElementSource(recordAudio);
  sourceNode.connect(dest);
  sourceNode.connect(audioCtx.destination);
  let aStream = dest.stream.getAudioTracks()[0];


  chunks.length = 0;
  let canvasStream = document.querySelector("canvas").captureStream(30);
  // stream.addTrack(recordAudio.getAudioTracks()[0]);
  canvasStream.addTrack(aStream);

  recorder = new MediaRecorder(canvasStream);

  recorder.ondataavailable = (e) => {
    if (e.data.size) {
      chunks.push(e.data);
    }
  };
  recorder.onstop = exportVideo;
  recorder.start();
}

// https://codepen.io/Sambego/pen/XNOJqM?editors=0010
// https://stackoverflow.com/questions/39302814/mediastream-capture-canvas-and-audio-simultaneously

//displays captured video on the dom
function exportVideo(e) {
  const blob = new Blob(chunks);
  const vid = document.createElement("video");
  vid.id = "preview-video";
  vid.style.width = "400px";
  vid.style.height = "294px";
  vid.controls = true;
  vid.src = URL.createObjectURL(blob);
  previewVideoContainer.appendChild(vid);
  vid.play();
  //creting video download btn
  const downloadVideoBtn = document.createElement("a");
  downloadVideoBtn.innerText = "Download";
  downloadVideoBtn.className = "btn btn-light";
  downloadVideoBtn.id = "download-video-btn";
  previewVideoContainer.appendChild(downloadVideoBtn);
  //connecting the download btn with the video source
  downloadVideoBtn.href = vid.src;
  downloadVideoBtn.download = "from-backdrop.mp4";
}

//Image upload handler
imageUpload.addEventListener("change", (e) => {
  bg = "#000000";
  background(bg); //try setting bg to #eee
  const imgSrc = window.URL.createObjectURL(e.target.files[0]);
  bg = loadImage(imgSrc); //changing background to imported image
  background(bg);
});

//Image preview and download handler
captureFrameBtn.addEventListener("click", () => {
  saveFrames("out", "png", 1, 25, (data) => {
    //removing an image if theres more than 6 images
    if (previewImgContainer.childElementCount > 5) {
      previewImgContainer.removeChild(
        previewImgContainer.getElementsByTagName("div")[
          previewImgContainer.childElementCount - 1
        ]
      );
    }
    const imgCard = document.createElement("div");
    const img = new Image(300, 220);
    const downloadBtn = document.createElement("a");
    img.src = data[0].imageData;
    downloadBtn.href = data[0].imageData;
    img.className = "card-img-top";
    img.style.width = "300px"; //need this to override bootstrap style
    imgCard.className = "col-6 col-md-6";
    downloadBtn.className = "btn btn-primary";
    downloadBtn.innerText = "Download";
    downloadBtn.id = "download-img-btn";
    imgCard.append(img);
    imgCard.appendChild(downloadBtn);
    previewImgContainer.insertBefore(imgCard, previewImgContainer.firstChild);
    downloadBtn.download = `${data[0].filename}.${data[0].ext}`;
  });
});

//handling record-btn click
recordBtn.addEventListener("click", () => {
  //starts recording
  if (!recording) {
    recording = true;
    const previewVideo = document.querySelector("#preview-video");
    const downloadVideoBtn = document.querySelector("#download-video-btn");

    if (previewVideo) {
      previewVideoContainer.removeChild(previewVideo);
    }
    if (downloadVideoBtn) {
      previewVideoContainer.removeChild(downloadVideoBtn);
    }
    const counterSpan = document.createElement("span");
    recordBtn.innerText = "stop recording";
    recordBtn.className = "btn btn-danger";
    counterSpan.className = "badge bg-secondary";
    counterSpan.innerText = 0;
    recordBtn.appendChild(counterSpan);
    startRecording();
    updateTimer = setInterval(() => {
      counterSpan.innerText = Number(counterSpan.innerText) + 1; //updating video capture counter timer
    }, 1000);
  }
  //stops recording
  else {
    clearInterval(updateTimer);
    recording = false;
    recordBtn.innerText = "start a new recording"; //using innerHTML, which also removes the `counterSpan` element
    recordBtn.className = "btn btn-light";
    recordBtn.appendChild(recordIconClone);
    recordAudio.pause()
    recorder.stop(); //recorder.stop calls `exportVideo` function
  }
});

//color picker
backgroundColor.addEventListener("change", (e) => {
  bg = e.target.value;
  background(bg);
});