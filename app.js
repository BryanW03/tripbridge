// app.js – TripBridge Entry Point
import { router } from './router.js';
import { initNav }  from './utils/domHelpers.js';
import { renderFooter } from './components/footer.js';

// Boot
initNav();
renderFooter();
router.init();
