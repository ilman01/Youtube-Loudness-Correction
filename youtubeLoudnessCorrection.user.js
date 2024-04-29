// ==UserScript==
// @name           Youtube Loudness Correction Button
// @description    Amplifies any youtube video with loudness lower than 0dB
// @namespace      Septolum
// @include        https://www.youtube.com/*
// @include        https://m.youtube.com/*
// @icon           https://www.youtube.com/favicon.ico
// @version        1.0.0
// @grant          none
// @run-at         document-end
// ==/UserScript==

function createButton() {
  var button = document.createElement('button');
  button.textContent = 'Correct Loudness';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.left = '10px'; // Changed from right to left
  button.style.zIndex = '1000';
  button.onclick = gmMain;
  document.body.appendChild(button);
}

function resetGainNode() {
  if (window["_gainNode"]) {
    window["_gainNode"].gain.value = 1;
    console.log("Loudness Reset");
  }
}

function gmMain() {
  "use strict";
    var req = new XMLHttpRequest();
  req.open(
    "GET",
    "https://" +
      window.location.host +
      "/watch?v=" +
      /v=(.+?)(?:(?:&.*?)|$)/.exec(window.location.href)[1],
    false
  );
  req.send(null);
  if (req.status == 200) {
    var loudness = parseFloat(
      /"loudnessDb":([-0-9.]+),/.exec(req.responseText)[1]
    );
  }

  if (loudness < 0) {
    console.log("Loudness Corrected");
    loudness = 10 ** ((loudness * -1) / 20);
    // from https://stackoverflow.com/questions/43794356/html5-volume-increase-past-100#comment99251398_43794379
    if (window["_gainNode"]) {
      window["_gainNode"].gain.value = loudness;
      return;
    }
    var v = document.querySelector("video");
    var audioCtx = new AudioContext();
    var source = audioCtx.createMediaElementSource(v);
    var gainNode = audioCtx.createGain();
    gainNode.gain.value = loudness;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    window["_gainNode"] = gainNode;
  } else {
    if (window["_gainNode"]) {
      console.log("Loudness Reset");
      window["_gainNode"].gain.value = 1;
      return;
    }
  }
}

// Run the createButton function when the page loads
window.addEventListener('load', createButton);

// Reset the gain node when the user navigates to a new video
window.addEventListener('popstate', resetGainNode);
window.addEventListener("spfdone", resetGainNode); // old youtube design
window.addEventListener("yt-navigate-start", resetGainNode); // new youtube design
document.addEventListener("DOMContentLoaded", resetGainNode); // one-time early processing
window.addEventListener("load", resetGainNode); // one-time late postprocessing
