const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

let timeoutFlag = true;
let bestPassedCarCount = JSON.parse(localStorage.getItem("bestPassedCarCount"));

const N = 1000;
const cars = generateCars(N);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.05);
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
