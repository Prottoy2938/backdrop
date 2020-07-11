const imageUpload = document.querySelector("#cs1-image-upload");
const captureFrame = document.querySelector("#capture-frame");
let video;
let uNet;
let segmentationImage;
let bg;

// load uNet model
function preload() {
  console.log("I'm running here");
  uNet = ml5.uNet("face");
}

function setup() {
  createCanvas(640, 480);
  //load up an image
  bg = loadImage(
    "https://images.pexels.com/photos/821668/pexels-photo-821668.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=640&w=480"
  );
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
  // if there's an error return it
  if (error) {
    console.error(error);
    return;
  }
  // set the result to the global segmentation variable
  segmentationImage = result.backgroundMask;

  // Continue asking for a segmentation image
  uNet.segment(video, gotResult);
}

function draw() {
  background(bg);
  image(segmentationImage, 0, 0, width, height);
}

imageUpload.addEventListener("change", (e) => {
  const imgSrc = window.URL.createObjectURL(e.target.files[0]);

  bg = loadImage(imgSrc);
  background(bg);
});

captureFrame.addEventListener("click", () => {
  saveFrames("out", "png", 1, 25, (data) => {
    print(data);
    //create a feature of capture-this-frame and show them all 8 images and allow them to download which frame they want to download
    for (let i = 0; i < data.length; i++) {
      downloadFile(data[i].imageData, data[i].filename, data[i].ext);
    }
  });
});
