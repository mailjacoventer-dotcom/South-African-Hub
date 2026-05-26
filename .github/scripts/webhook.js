export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.body;
  const formId = req.query.form;

  const typeMap = {
    directory: 'directory-submission',
    markplaats: 'markplaats-submission',
    events: 'event-submission',
  };

  const eventType = typeMap[formId];
  if (!eventType) return res.status(400).json({ error: `Unknown form: ${formId}` });

  const response = await fetch(
    `https://api.github.com/repos/mailjacoventer-dotcom/south-african-hub/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAT_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: payload,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('GitHub dispatch failed:', err);
    return res.status(500).json({ error: 'Failed to trigger action' });
  }

  return res.status(200).json({ ok: true, event_type: eventType });
}
