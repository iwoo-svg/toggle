// On / Off — every control changes the page in a different way

document.addEventListener("DOMContentLoaded", function () {

  // ---------- elements ----------
  const body = document.querySelector("body");
  const stage = document.querySelector(".stage");
  const barText = document.querySelector(".bar-text");

  const resetButton = document.querySelector("#reset");
  const blackoutButton = document.querySelector("#blackout");
  const popButton = document.querySelector("#pop");
  const barToggle = document.querySelector("#bar-toggle");
  const darkToggle = document.querySelector("#dark-toggle");
  const roundToggle = document.querySelector("#round-toggle");
  const roundKnob = document.querySelector(".round-knob");

  const blurSlider = document.querySelector("#blur-slider");
  const volumeSlider = document.querySelector("#volume-slider");
  const puffSlider = document.querySelector("#puff-slider");
  const sliders = [blurSlider, volumeSlider, puffSlider];

  const popSound = new Audio("pop.wav");

  // ---------- numbers from the Figma file ----------
  const STAGE_WIDTH = 1440;
  const STAGE_HEIGHT = 1024;
  const SLIDER_TRAVEL = 581;   // track height 663 - knob height 82
  const ROUND_TRAVEL = 185;    // track width 290 - knob width 105

  // where each slider knob starts (top, in px)
  const startTops = [581, 276, 421];   // blur, volume, puffiness

  // current values (0 = bottom, 1 = top)
  let blurValue = 0;
  let volumeValue = 0;
  let puffValue = 0;


  // ---------- fit the 1440 x 1024 frame into the window ----------
  let scale = 1;

  function fitStage() {
    scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    stage.style.transform = "scale(" + scale + ")";
  }

  fitStage();
  window.addEventListener("resize", fitStage);


  // ---------- the toggle bar shows what just happened ----------
  function showMessage(message) {
    barText.textContent = message;
  }


  // ---------- 1. dark mode toggle (click) ----------
  darkToggle.addEventListener("click", function () {
    body.classList.toggle("dark");

    if (body.classList.contains("dark")) {
      showMessage("DARK MODE ON");
    } else {
      showMessage("DARK MODE OFF");
    }
  });


  // ---------- 2. toggle bar on / off (click) ----------
  barToggle.addEventListener("click", function () {
    body.classList.toggle("bar-on");
    showMessage("THE TOGGLE BAR");
  });


  // ---------- 3. blackout (click) ----------
  blackoutButton.addEventListener("click", function () {
    body.classList.toggle("blackout-on");
  });


  // ---------- 4. pop sound (click) ----------
  popButton.addEventListener("click", function () {
    popSound.currentTime = 0;
    popSound.volume = volumeValue;
    popSound.play();

    popButton.classList.add("popping");
    setTimeout(function () {
      popButton.classList.remove("popping");
    }, 350);

    showMessage("POP!");
  });


  // ---------- 5. sliders (drag) ----------
  let activeSlider = null;

  // move one slider knob and update its value
  function setSlider(slider, top) {
    if (top < 0) {
      top = 0;
    }
    if (top > SLIDER_TRAVEL) {
      top = SLIDER_TRAVEL;
    }

    const knob = slider.querySelector(".slider-knob");
    knob.style.top = top + "px";

    const value = 1 - top / SLIDER_TRAVEL;   // 0 at the bottom, 1 at the top

    if (slider === blurSlider) {
      blurValue = value;
      showMessage("BLUR " + Math.round(blurValue * 10));
    } else if (slider === volumeSlider) {
      volumeValue = value;
      showMessage("VOLUME " + Math.round(volumeValue * 100));
    } else {
      puffValue = value;
      applyPuff();
      showMessage("PUFF " + Math.round(puffValue * 100));
    }

    applyFilters();
  }

  // blur is applied to the whole stage
  function applyFilters() {
    const blur = blurValue * 10;   // 0px - 10px
    stage.style.filter = "blur(" + blur + "px)";
  }

  // puffiness: every shadow gets bigger, so the UI looks thicker
  // 1 = the Figma design, 0.2 = almost flat, 3.1 = very puffy
  function applyPuff() {
    const puff = 0.2 + puffValue * 2.9;
    const root = document.documentElement;

    root.style.setProperty("--off", 18 * puff + "px");
    root.style.setProperty("--off-neg", -18 * puff + "px");
    root.style.setProperty("--blur", 30 * puff + "px");
    root.style.setProperty("--blur-small", 20 * puff + "px");
    root.style.setProperty("--spread", -13 * puff + "px");
    root.style.setProperty("--spread-knob", -19 * puff + "px");
  }

  // mouse position -> knob position
  function dragSlider(event) {
    const box = activeSlider.getBoundingClientRect();
    const y = (event.clientY - box.top) / scale;
    setSlider(activeSlider, y - 41);   // 41 = half the knob, so the mouse holds its middle
  }

  for (let i = 0; i < sliders.length; i++) {
    sliders[i].addEventListener("mousedown", function (event) {
      activeSlider = sliders[i];
      dragSlider(event);
    });
  }


  // ---------- 6. corner rounding toggle (drag or click) ----------
  let roundDragging = false;
  let roundMoved = false;
  let startX = 0;
  let startLeft = 0;

  roundToggle.addEventListener("mousedown", function (event) {
    roundDragging = true;
    roundMoved = false;
    startX = event.clientX;

    if (roundToggle.classList.contains("on")) {
      startLeft = ROUND_TRAVEL;
    } else {
      startLeft = 0;
    }

    roundKnob.classList.add("dragging");
  });

  function dragRound(event) {
    const moved = (event.clientX - startX) / scale;

    if (Math.abs(moved) > 3) {
      roundMoved = true;
    }

    let left = startLeft + moved;
    if (left < 0) {
      left = 0;
    }
    if (left > ROUND_TRAVEL) {
      left = ROUND_TRAVEL;
    }
    roundKnob.style.left = left + "px";
  }

  function dropRound() {
    let isOn;

    if (roundMoved) {
      // dragged: snap to the closer side
      isOn = parseFloat(roundKnob.style.left) > ROUND_TRAVEL / 2;
    } else {
      // just clicked: flip
      isOn = !roundToggle.classList.contains("on");
    }

    roundKnob.classList.remove("dragging");
    roundKnob.style.left = "";   // let the CSS class decide (with transition)

    roundToggle.classList.toggle("on", isOn);
    body.classList.toggle("round", isOn);

    if (isOn) {
      showMessage("ROUND");
    } else {
      showMessage("SQUARE");
    }

    roundDragging = false;
  }


  // ---------- mouse move / up for everything that drags ----------
  document.addEventListener("mousemove", function (event) {
    if (activeSlider !== null) {
      dragSlider(event);
    }
    if (roundDragging) {
      dragRound(event);
    }
  });

  document.addEventListener("mouseup", function () {
    activeSlider = null;
    if (roundDragging) {
      dropRound();
    }
  });


  // ---------- 7. reset (click) — back to the beginning ----------
  function resetAll() {
    body.classList.remove("dark", "bar-on", "blackout-on", "round");
    roundToggle.classList.remove("on");

    for (let i = 0; i < sliders.length; i++) {
      setSlider(sliders[i], startTops[i]);
    }

    showMessage("THE TOGGLE BAR");
  }

  resetButton.addEventListener("click", function () {
    resetButton.classList.add("spin");
    setTimeout(function () {
      resetButton.classList.remove("spin");
    }, 600);

    resetAll();
    console.log("back to the start!");
  });


  // start
  resetAll();

});