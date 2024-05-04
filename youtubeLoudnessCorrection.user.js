// ==UserScript==
// @name           Youtube Loudness Correction Button
// @description    Amplifies any youtube video with loudness lower than 0dB
// @include        https://www.youtube.com/*
// @icon           https://www.youtube.com/favicon.ico
// @version        1.1.3
// @grant          none
// @run-at         document-end
// ==/UserScript==

function createButton()
{
    // Get the target element
    var targetElement = document.querySelector("#bottom-row")

    const newElementHTML = '<yt-button-view-model class="style-scope ytd-menu-renderer"></yt-button-view-model>'

    // Insert the new HTML as a sibling of the target element
    targetElement.insertAdjacentHTML('afterend', newElementHTML);

    // Select the newly inserted element
    const insertedElement = targetElement.nextElementSibling;

    // Edit the inner HTML of the inserted element
    insertedElement.innerHTML = '<button-view-model class="yt-spec-button-view-model"><button class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading" aria-label="Share" title="Share" style=""><div class="yt-spec-button-shape-next__button-text-content">Normalize Loudness</div><yt-touch-feedback-shape style="border-radius: inherit;"><div class="yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response" aria-hidden="true"><div class="yt-spec-touch-feedback-shape__stroke" style=""></div><div class="yt-spec-touch-feedback-shape__fill" style=""></div></div></yt-touch-feedback-shape></button></button-view-model>'


    var buttonInsideInsertedElement = insertedElement.querySelector('button');
    buttonInsideInsertedElement.onclick = gmMain
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
    var audioCtx = new AudioContext({latencyHint: "playback"});
    var source = audioCtx.createMediaElementSource(v);
    var gainNode = audioCtx.createGain();
    gainNode.gain.value = loudness;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    window["_gainNode"] = gainNode;
  } 
}

function runCreateButton() {
    try {
        createButton()
    }
    catch (err){
        console.log("Element not loaded, trying again.");
        setTimeout(runCreateButton, 1000);
    }
}

// Run the createButton function when the page loads
window.addEventListener('load', runCreateButton);

// Reset the gain node when the user navigates to a new video
window.addEventListener('popstate', resetGainNode);
window.addEventListener("spfdone", resetGainNode); // old youtube design
window.addEventListener("yt-navigate-start", resetGainNode); // new youtube design
document.addEventListener("DOMContentLoaded", resetGainNode); // one-time early processing
window.addEventListener("load", resetGainNode); // one-time late postprocessing
