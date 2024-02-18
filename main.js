const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

let timeoutFlag = true;
let bestPassedCarCount = JSON.parse(localStorage.getItem("bestPassedCarCount"));

const N = 500;
const cars = generateCars(N);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.06);
    }
  }
}

const traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 1.5),
  new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 1.5),
  new Car(road.getLaneCenter(1), -400, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -550, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -610, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -660, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(2), -810, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(1), -860, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(0), -1060, 30, 50, "DUMMY", 2),
  new Car(road.getLaneCenter(1), -1080, 30, 50, "DUMMY", 2),
];

animate();

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
  localStorage.setItem(
    "bestPassedCarCount",
    JSON.stringify(bestCar.passedCarCount)
  );
}

function discard() {
  localStorage.removeItem("bestBrain");
  localStorage.removeItem("bestPassedCarCount");
}

function exportModel() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = JSON.parse(localStorage.getItem(key));
  }
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "localStorage.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importModel() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";

  fileInput.onchange = function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const data = JSON.parse(e.target.result);
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        }
      };
      reader.readAsText(file);
    }
  };

  fileInput.click();
}

function generateCars(N) {
  const cars = [];
  for (let i = 0; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
  }

  return cars;
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }
  // bestCar = cars.find((c) => c.y == Math.min(...cars.map((c) => c.y)));
  bestCar = cars.find(
    (c) => c.passedCarCount == Math.max(...cars.map((c) => c.passedCarCount))
  );

  if (bestCar.passedCarCount > bestPassedCarCount) {
    bestPassedCarCount = bestCar.passedCarCount;
    setTimeout(() => {
      if (!bestCar.damaged) {
        const currBestCar = bestCar;
        save();
        console.log("saved:", bestCar.passedCarCount);
      }
    }, 1000);
  }

  if (timeoutFlag) {
    let prevPassedCarCount = bestCar.passedCarCount;
    setTimeout(() => {
      if (bestCar.passedCarCount == prevPassedCarCount) {
        console.log(bestCar.passedCarCount, prevPassedCarCount);
        window.location.reload();
      }
      timeoutFlag = true;
    }, 5000);

    timeoutFlag = false;
  }

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx, "red");
  }
  carCtx.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx, "blue");
  }
  carCtx.globalAlpha = 1;
  bestCar.draw(carCtx, "blue", true);

  carCtx.restore();

  networkCtx.lineDashOffset = -time / 50;
  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  requestAnimationFrame(animate);
}
