import { boot, registerArea } from './shell.js';
import signs from './areas/signs.js';
import train from './areas/train.js';
import bridge from './areas/bridge.js';
import library from './areas/library.js';
import workshop from './areas/workshop.js';
import detective from './areas/detective.js';
import market from './areas/market.js';
import storm from './areas/storm.js';
import science from './areas/science.js';

[signs, train, bridge, library, workshop, detective, market, storm, science].forEach(registerArea);
window.addEventListener('DOMContentLoaded', boot);
