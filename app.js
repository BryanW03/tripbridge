// app.js – TripBridge Entry Point
import { router } from './router.js';
import { initNav }  from './utils/domHelpers.js';

// Boot
initNav();
router.init();
