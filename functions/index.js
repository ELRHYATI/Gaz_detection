const functions = require('firebase-functions');
const admin = require('firebase-admin');
let twilioClient = null;

// Initialize admin once for all functions
try {
  admin.app();
} catch (e) {
  admin.initializeApp();
}

const db = admin.database();

// Initialize Twilio lazily to avoid cold start overhead if not used
const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  const cfg = functions.config() || {};
  const twilioCfg = cfg.twilio || {};
  const accountSid = twilioCfg.account_sid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = twilioCfg.auth_token || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = twilioCfg.whatsapp_from || process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken || !fromNumber) {
    functions.logger.warn('Twilio configuration missing. WhatsApp alerts disabled.');
    return null;
  }
  try {
    const twilio = require('twilio');
    twilioClient = { client: twilio(accountSid, authToken), fromNumber };
    return twilioClient;
  } catch (e) {
    functions.logger.error('Failed to initialize Twilio client', e);
    return null;
  }
};

const isE164 = (num) => typeof num === 'string' && /^\+[1-9]\d{6,14}$/.test(num);

// Callable function to send WhatsApp emergency alerts
exports.sendWhatsAppAlert = functions.region('europe-west1').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  const tw = getTwilioClient();
  if (!tw) {
    throw new functions.https.HttpsError('failed-precondition', 'Twilio is not configured.');
  }
  const to = (data && data.to) || '';
  const body = (data && data.body) || '';
  const meta = (data && data.meta) || {};
  if (!isE164(to)) {
    throw new functions.https.HttpsError('invalid-argument', 'Destination must be E.164 (+[country][number]).');
  }
  if (typeof body !== 'string' || body.trim().length < 10) {
    throw new functions.https.HttpsError('invalid-argument', 'Message body is too short.');
  }
  try {
    const res = await tw.client.messages.create({
      from: `whatsapp:${tw.fromNumber}`,
      to: `whatsapp:${to}`,
      body,
    });
    // Basic audit log
    const logRef = db.ref('alerts_notifications_logs').push();
    await logRef.set({
      timestamp: Date.now(),
      uid: context.auth.uid,
      channel: 'whatsapp',
      to,
      sid: res.sid,
      status: res.status || 'queued',
      meta,
    });
    return { sid: res.sid, status: res.status };
  } catch (e) {
    functions.logger.error('Twilio send error', e);
    throw new functions.https.HttpsError('internal', 'Failed to send WhatsApp message');
  }
});

// --- Free provider integrations ---

const fetchJson = async (url, opts) => {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = { text }; }
  return { ok: res.ok, status: res.status, json };
};

const sendViaCallMeBot = async ({ phone, apikey, body }) => {
  if (!isE164(phone) || !apikey) throw new Error('Invalid callmebot credentials');
  const encodedText = encodeURIComponent(body);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodedText}&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  const ok = res.ok && /Message sent|Message queued/i.test(text);
  return { ok, statusText: text };
};

const sendViaTelegram = async ({ token, chat_id, body }) => {
  if (!token || !chat_id) throw new Error('Invalid Telegram configuration');
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id, text: body }) });
  const ok = res.ok;
  const json = await res.json().catch(() => ({}));
  return { ok, statusText: JSON.stringify(json) };
};

const getNotificationSettings = async () => {
  const snap = await db.ref('notification_settings').get();
  const val = snap.val() || {};
  return val;
};

const mapSeverity = (sev) => {
  switch (sev) {
    case 'critical': return 'critical';
    case 'danger': return 'high';
    case 'warning': return 'medium';
    default: return 'low';
  }
};

const getActiveTemplate = async (severityKey) => {
  const base = db.ref(`message_templates/${severityKey}`);
  const avSnap = await base.child('active_version').get();
  const activeId = avSnap.val();
  if (!activeId) return null;
  const verSnap = await base.child(`versions/${activeId}`).get();
  const ver = verSnap.val();
  return ver || null;
};

const renderTemplate = (tmpl, vars) => {
  const replace = (s, k, v) => s.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v ?? ''));
  let out = String(tmpl || '');
  Object.entries(vars).forEach(([k, v]) => { out = replace(out, k, v); });
  return out;
};

const formatTimestamp = (ts) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(ts));
  } catch { return new Date(ts).toISOString(); }
};

const sendWithRetryAndFallback = async ({ provider, config, body, meta, deliveryId }) => {
  const maxAttempts = 3;
  let attempts = 0;
  let lastError = null;
  const updateDelivery = async (status) => db.ref(`alerts_delivery/${deliveryId}`).update({ status, attempts, provider, last_error: lastError || '' });
  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      let res;
      if (provider === 'callmebot') {
        res = await sendViaCallMeBot({ phone: config.phone, apikey: config.apikey, body });
      } else if (provider === 'telegram') {
        res = await sendViaTelegram({ token: config.token, chat_id: config.chat_id, body });
      } else {
        throw new Error('No provider configured');
      }
      if (res.ok) {
        await updateDelivery('sent');
        await db.ref('alerts_notifications_logs').push({ timestamp: Date.now(), channel: provider, status: 'sent', meta });
        return true;
      }
      lastError = res.statusText || 'Unknown failure';
      await updateDelivery('retrying');
    } catch (e) {
      lastError = e.message || String(e);
      await updateDelivery('retrying');
    }
    await new Promise((r) => setTimeout(r, attempts === 1 ? 2000 : attempts === 2 ? 5000 : 10000));
  }
  // Fallback: if primary provider fails, try Telegram if available
  if (provider !== 'telegram' && config.telegram) {
    try {
      const fb = await sendViaTelegram({ token: config.telegram.token, chat_id: config.telegram.chat_id, body });
      if (fb.ok) {
        await updateDelivery('sent-fallback');
        await db.ref('alerts_notifications_logs').push({ timestamp: Date.now(), channel: 'telegram', status: 'sent-fallback', meta });
        return true;
      }
    } catch (e) {
      lastError = e.message || String(e);
    }
  }
  await updateDelivery('failed');
  await db.ref('alerts_notifications_logs').push({ timestamp: Date.now(), channel: provider, status: 'failed', meta, error: lastError || 'failure' });
  return false;
};

// Server-side guaranteed delivery trigger on alerts_active creation
exports.onAlertsActiveCreate = functions.database.ref('/alerts_active/{fp}').onCreate(async (snap, context) => {
  try {
    const val = snap.val() || {};
    const severity = String(val.severity || 'danger');
    const parameter = String(val.parameter || 'gas');
    const value = Number(val.value || 0);
    const started = Number(val.started_at || Date.now());
    const loc = String(val.location || 'Unknown');
    const severityKey = mapSeverity(severity);
    const tmpl = await getActiveTemplate(severityKey);
    const actions = Array.isArray(tmpl?.actions) ? tmpl.actions.join('\n') : '';
    const contacts = ''; // GDPR: do not include personal contacts unless configured in template
    const vars = {
      heading: 'EMERGENCY ALERT',
      severity: severityKey.toUpperCase(),
      type: parameter,
      value,
      timestamp: formatTimestamp(started),
      location: loc,
      actions,
      contacts,
    };
    const body = tmpl?.template ? renderTemplate(tmpl.template, vars) : `${vars.heading}\nType: ${vars.type} ${vars.severity}\nValue: ${vars.value}\nTime: ${vars.timestamp}\nLocation: ${vars.location}\n\nActions:\n${actions}`;

    const notif = await getNotificationSettings();
    const provider = notif.provider || 'none';
    const deliveryId = `${context.params.fp}-${started}`;
    const meta = { fingerprint: context.params.fp, severity, parameter, value, timestamp: started };
    if (provider === 'callmebot' && notif.callmebot && notif.callmebot.phone && notif.callmebot.apikey) {
      await sendWithRetryAndFallback({ provider, config: { ...notif.callmebot, telegram: notif.telegram }, body, meta, deliveryId });
    } else if (provider === 'telegram' && notif.telegram && notif.telegram.token && notif.telegram.chat_id) {
      await sendWithRetryAndFallback({ provider, config: { ...notif.telegram }, body, meta, deliveryId });
    } else {
      functions.logger.warn('No messaging provider configured, skipping send');
      await db.ref('alerts_notifications_logs').push({ timestamp: Date.now(), channel: 'none', status: 'skipped', meta });
    }
    return null;
  } catch (e) {
    functions.logger.error('onAlertsActiveCreate error', e);
    return null;
  }
});

const mapFenetreToState = (v) => (v === 'OUVERT' ? 'open' : 'closed');
const mapStateToFenetre = (s) => (s === 'open' ? 'OUVERT' : 'FERME');
const mapStateToAngle = (s) => (s === 'open' ? 90 : 0);

const updateWindowControl = async (state) => {
  const ts = Date.now();
  const angle = mapStateToAngle(state);
  await db.ref('window_control').update({
    current_state: state,
    servo_position: angle,
    last_updated: ts,
  });
};

const setMotorStatus = async (state) => {
  await db.ref('motor/status').set(state);
};

// Mirror fenetres <-> actionneurs/fenetres and drive window_control/motor
exports.onFenetresWrite = functions.database.ref('/fenetres').onWrite(async (change, context) => {
  const before = change.before.val();
  const after = change.after.val();
  if (before === after) return null;
  try {
    // Mirror to actionneurs/fenetres if needed
    const mirrorRef = db.ref('actionneurs/fenetres');
    const mirrorSnap = await mirrorRef.get();
    if (mirrorSnap.val() !== after) {
      await mirrorRef.set(after);
    }
    const mapped = mapFenetreToState(after);
    await updateWindowControl(mapped);
    await setMotorStatus(mapped);
    return null;
  } catch (e) {
    functions.logger.error('onFenetresWrite error', e);
    return null;
  }
});

exports.onActionneursFenetresWrite = functions.database.ref('/actionneurs/fenetres').onWrite(async (change, context) => {
  const before = change.before.val();
  const after = change.after.val();
  if (before === after) return null;
  try {
    // Mirror to root fenetres if needed
    const rootRef = db.ref('fenetres');
    const rootSnap = await rootRef.get();
    if (rootSnap.val() !== after) {
      await rootRef.set(after);
    }
    const mapped = mapFenetreToState(after);
    await updateWindowControl(mapped);
    await setMotorStatus(mapped);
    return null;
  } catch (e) {
    functions.logger.error('onActionneursFenetresWrite error', e);
    return null;
  }
});

// Manual override: when current_state changes, sync fenetres and motor
exports.onWindowControlStateWrite = functions.database.ref('/window_control/current_state').onWrite(async (change, context) => {
  const before = change.before.val();
  const after = change.after.val();
  if (before === after) return null;
  try {
    const overrideSnap = await db.ref('window_control/manual_override').get();
    const override = !!overrideSnap.val();
    if (!override) {
      // Ignore client attempts when manual override disabled
      functions.logger.warn('Manual override disabled; ignoring state write');
      // Revert to previous if available
      if (typeof before === 'string') {
        await db.ref('window_control/current_state').set(before);
      }
      return null;
    }
    const fenetreVal = mapStateToFenetre(after);
    await db.ref('fenetres').set(fenetreVal);
    await db.ref('actionneurs/fenetres').set(fenetreVal);
    await updateWindowControl(after);
    await setMotorStatus(after);
    return null;
  } catch (e) {
    functions.logger.error('onWindowControlStateWrite error', e);
    return null;
  }
});

// Optional: when servo_position is written manually, align current_state
exports.onServoPositionWrite = functions.database.ref('/window_control/servo_position').onWrite(async (change, context) => {
  const before = change.before.val();
  const after = change.after.val();
  if (before === after) return null;
  try {
    const overrideSnap = await db.ref('window_control/manual_override').get();
    const override = !!overrideSnap.val();
    if (!override) return null;
    const state = after === 90 ? 'open' : 'closed';
    const fenetreVal = mapStateToFenetre(state);
    await db.ref('fenetres').set(fenetreVal);
    await db.ref('actionneurs/fenetres').set(fenetreVal);
    await updateWindowControl(state);
    await setMotorStatus(state);
    return null;
  } catch (e) {
    functions.logger.error('onServoPositionWrite error', e);
    return null;
  }
});

// Manual command channel: /commandes/servo_manuel
// Accepts various values to OPEN/CLOSE and applies with manual override
// Supported values: 'OUVERT','FERME','ouvrir','fermer','open','closed', boolean, number (1=open,0=closed)
const parseServoCommand = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val ? 'open' : 'closed';
  if (typeof val === 'number') return val !== 0 ? 'open' : 'closed';
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (['ouvert','ouvrir','open','on'].includes(s)) return 'open';
    if (['ferme','fermer','closed','close','off'].includes(s)) return 'closed';
  }
  return null;
};

exports.onCommandServoManuelWrite = functions.database.ref('/commandes/servo_manuel').onWrite(async (change, context) => {
  const before = change.before.val();
  const after = change.after.val();
  if (before === after) return null;
  try {
    const state = parseServoCommand(after);
    if (!state) {
      functions.logger.warn('Ignoring unsupported servo_manuel command:', after);
      return null;
    }
    // Enable manual override and apply state
    await db.ref('window_control/manual_override').set(true);
    await updateWindowControl(state);
    await setMotorStatus(state);
    const fenetreVal = mapStateToFenetre(state);
    await db.ref('fenetres').set(fenetreVal);
    await db.ref('actionneurs/fenetres').set(fenetreVal);
    // Acknowledge
    await db.ref('commandes/servo_manuel_ack').set({ timestamp: Date.now(), applied: state });
    return null;
  } catch (e) {
    functions.logger.error('onCommandServoManuelWrite error', e);
    return null;
  }
});

// Scheduled job: auto-dismiss expired danger alerts after 10 minutes
exports.onScheduledAlertsExpiryCheck = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  try {
    const now = Date.now();
    const snap = await db.ref('alerts_active').get();
    if (!snap.exists()) return null;
    const updates = [];
    snap.forEach((child) => {
      const val = child.val() || {};
      if (!val.dismissed && typeof val.expires_at === 'number' && val.expires_at <= now) {
        const key = child.key;
        updates.push((async () => {
          await db.ref(`alerts_active/${key}`).update({ dismissed: true, dismiss_reason: 'expired' });
          // audit log
          const log = {
            timestamp: now,
            severity: val.severity || 'danger',
            parameter: val.parameter || 'gas',
            value: val.value || 0,
            location: val.location || '',
            message: 'Auto-dismiss after 10 minutes',
            acknowledged: true,
          };
          const newLogRef = db.ref('alerts_logs').push();
          await newLogRef.set(log);
        })());
      }
    });
    await Promise.all(updates);
    return null;
  } catch (e) {
    functions.logger.error('onScheduledAlertsExpiryCheck error', e);
    return null;
  }
});
// (Email-to-SMS functions removed)