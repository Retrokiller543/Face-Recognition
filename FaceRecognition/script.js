const video = document.getElementById("video");
const acceptedPeople = ["Emil Schütt"];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  console.log("loaded");
  setInterval(async () => {
    // const detections = await faceapi
    //   .detectAllFaces(video)
    //   .withFaceLandmarks()
    //   .withFaceExpressions()
    //   .withFaceDescriptor();
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      drawBox.draw(canvas);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      if (acceptedPeople.includes(result._label)) {
        console.log(result._label + " detected!");
      }
      //   faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      //   faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    });
    // if ((results = "")) {
    //   canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    // }
  }, 100);
});

function loadLabeledImages() {
  const labels = [
    "Emil Schütt",
    // "Marcus Nykvist",
    // 'Alexander Franke',
    // 'Sofia',
    // 'Stella'
  ];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 4; i++) {
        const img = await faceapi.fetchImage(
          `https://raw.githubusercontent.com/Retrokiller543/Face-Recognition/master/Face%20rec%202/labeled_images/${label}/${i}.jpg`,
          { mode: "no-cors" }
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}
