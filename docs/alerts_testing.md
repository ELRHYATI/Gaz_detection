# Alerts Testing Procedures

## Prerequisites
- Ensure thresholds are configured under `Thresholds` page:
  - Gas: min 0, max 200 ppm (example)
  - Humidity: min 30%, max 70%
  - Temperature: min 10°C, max 35°C
- Run the frontend dev server and open the Dashboard.

## WhatsApp Emergency Alert Setup
- Configure Twilio WhatsApp:
  - Create a Twilio account and enable WhatsApp (sandbox or Business profile).
  - Set Firebase Functions env:
    - `firebase functions:config:set twilio.account_sid="<SID>" twilio.auth_token="<TOKEN>" twilio.whatsapp_from="<WhatsAppEnabledNumber>"`
  - Deploy functions.
- In the app Settings, enter your WhatsApp phone in E.164 format (e.g., `+33601020304`) and save. A success confirmation should appear.
- Enable notifications for Critical (default on) and Danger (optional) in Settings.

## Scenarios
Use the simulator to write readings:

```
node admin/simulate_alerts.cjs danger_gas
node admin/simulate_alerts.cjs critical_gas
node admin/simulate_alerts.cjs danger_humidity
node admin/simulate_alerts.cjs danger_temperature
node admin/simulate_alerts.cjs safe
```

## Expected Results
- Visual:
  - Alert banner appears with severity color and message.
  - Modal pop-up shows location, parameter, value, and timestamp.
  - Banner remains until you click Acknowledge.
- Auditory:
  - A tone plays for each new alert (800–1500 Hz, 1–3 s). Critical plays longest.
- Vibration (optional):
  - Device vibrates a pattern per severity (if supported).
- Logging:
  - `alerts_logs` contains a new entry with id, timestamp, severity, parameter, value, threshold snapshot, location, and `acknowledged=false`.
  - After acknowledging, the corresponding log is marked `acknowledged=true`.
  - For WhatsApp sends, `alerts_notifications_logs` records `channel=whatsapp`, destination, and Twilio `sid/status`.

## WhatsApp Delivery Failures
- If Twilio is misconfigured or the destination is invalid, the system logs an error and appends an `alerts_logs` entry with message `WhatsApp alert delivery failed`.
- Ensure your phone has joined the Twilio WhatsApp sandbox if using sandbox mode.

## Notes
- If the modal or sound does not trigger, verify browser autoplay policies and allow sound for the site.
- If alerts do not trigger, confirm the latest reading uses millisecond epoch timestamps and thresholds are set.