// Exposes the game modules to the page shell (shell/tail.js). Generated list; see tools/assemble.mjs.
import { save, audioInit, sfx, say, h, wait, englishVoices, setVoice, currentVoice, hush } from './core.js';
import { setCam, flyCam, pickAt, stopFollow, newWorld } from './gfx.js';
import { buildMap, STOPS, setCamRef, EPISODES, MAX_EP } from './sets.js';
import { mountUI, hideStory, hideTask, MODE, ownedCount, cardTotal, CARDS, cardSrc } from './ui.js';
import { playMusic, setMusic } from './music.js';
import { cloudsIn, cloudsCovered, cloudsOut } from './clouds.js';
import { preload } from './props.js';
preload();
import { stop1, stop2, stop3, sumUp } from './ep1.js';
import { stop4, stop5, stop6, sumUp2 } from './ep2.js';
import { stop7, stop8, stop9, sumUp3 } from './ep3.js';
import { stop10, stop11, stop12, sumUp4 } from './ep4.js';
import { stop13, stop14, stop15, sumUp5, debugVarn } from './ep5.js';
import { buildBeach } from './sets2.js';
import { makeCast } from './chars.js';
import { makeVarn } from './varn.js';
import { buildCliff, buildShelf, buildCrack } from './sets3.js';
import { stop16, stop17, stop18, sumUp6 } from './ep6.js';
import { buildGrayShore } from './sets6.js';
import { S, load } from './core.js';
import { init, camera, renderer, THREE } from './gfx.js';
window.__caveApi = { THREE, stop16, stop17, stop18, sumUp6, buildGrayShore, save, audioInit, sfx, say, h, wait, englishVoices, setVoice, currentVoice, hush, setCam, flyCam, pickAt, stopFollow, newWorld, buildMap, STOPS, setCamRef, EPISODES, MAX_EP, mountUI, hideStory, hideTask, MODE, ownedCount, cardTotal, CARDS, cardSrc, playMusic, setMusic, cloudsIn, cloudsCovered, cloudsOut, stop1, stop2, stop3, sumUp, stop4, stop5, stop6, sumUp2, stop7, stop8, stop9, sumUp3, stop10, stop11, stop12, sumUp4, stop13, stop14, stop15, sumUp5, debugVarn, buildBeach, makeCast, makeVarn, buildCliff, buildShelf, buildCrack,
  load, init, S: () => S, camera: () => camera, renderer: () => renderer };
