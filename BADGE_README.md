Usage

1. Include the CSS and JS on pages where you want the badge (add before </body>):

<link rel="stylesheet" href="badge.css">
<script src="badge.js"></script>

2. The badge auto-initializes and reads the current count from localStorage key `aurraa:badgeCount`.

3. Increment the badge when the user completes a level by dispatching a custom event:

window.dispatchEvent(new CustomEvent('aurraa:levelCompleted'));

or by calling the API directly:

window.AURRAA.badge.inc();
window.AURRAA.badge.set(42);

4. Color thresholds:
- 1–24: bronze
- 25–99: silver
- 100+: gold

5. The component dispatches `aurraa:badgeUpdated` with `event.detail.count` whenever the count changes.
