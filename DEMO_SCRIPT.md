# Demo Script

1. Open Universal Paperclips in a normal browser window.
2. Run `npm run dev`.
3. In the sidecar, click `Select Paperclips Window`.
4. Choose the browser window showing Paperclips, not the sidecar.
5. Click `Capture & Ask` with `What should I do now?`.
6. Point out the visible evidence chips: funds, demand, inventory, wire, and price.
7. Let one spoken answer play. Stop/replay/mute if needed.
8. Click `Proactive` once after changing the Paperclips state.

Expected interview moment:

The companion should recommend lowering price when unsold inventory is high and demand is low, or buying wire when wire is nearly exhausted and funds cover the wire cost. The answer must cite visible evidence from the screenshot.

Fallback:

If live capture fails, open a prerecorded Paperclips gameplay/video window and select that window. Do not switch to DOM reads or browser automation state.
