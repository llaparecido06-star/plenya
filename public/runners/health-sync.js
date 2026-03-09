/**
 * Background Runner: Health Data Sync
 * Runs every ~12 hours (720 min) when app is backgrounded.
 * Reads sleep data from HealthKit/Health Connect and syncs to Supabase.
 */

addEventListener('syncHealthData', async (resolve, reject, args) => {
  try {
    // Read sleep data from native health APIs (last 24h)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let sleepData;
    try {
      sleepData = await CapacitorHealth.readSamples({
        dataType: 'sleep',
        startDate: yesterday.toISOString(),
        endDate: now.toISOString(),
      });
    } catch (e) {
      console.log('Health API not available in background runner, skipping');
      resolve();
      return;
    }

    if (!sleepData || !sleepData.samples || sleepData.samples.length === 0) {
      console.log('No sleep data to sync');
      resolve();
      return;
    }

    // Group by date
    const byDate = {};
    for (const sample of sleepData.samples) {
      const date = (sample.startDate || '').split('T')[0];
      if (!date) continue;
      if (!byDate[date]) byDate[date] = { minutes: 0 };
      byDate[date].minutes += (sample.value || 0);
    }

    // Get stored auth info from KV
    const supabaseUrl = await CapacitorKV.get('supabase_url');
    const supabaseKey = await CapacitorKV.get('supabase_anon_key');
    const userId = await CapacitorKV.get('user_id');
    const accessToken = await CapacitorKV.get('access_token');

    if (!supabaseUrl || !supabaseKey || !userId || !accessToken) {
      console.log('Missing auth data for background sync');
      resolve();
      return;
    }

    // Sync each date
    for (const [date, data] of Object.entries(byDate)) {
      const hours = Math.round(data.minutes / 60 * 10) / 10;
      if (hours <= 0) continue;

      // Get existing log
      const getRes = await fetch(
        `${supabaseUrl}/rest/v1/daily_logs?user_id=eq.${userId}&log_date=eq.${date}&select=notes`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const existing = await getRes.json();

      let notesObj = {};
      if (existing && existing.length > 0 && existing[0].notes) {
        try { notesObj = JSON.parse(existing[0].notes); } catch (e) { notesObj = { text: existing[0].notes }; }
      }

      // Don't overwrite manual entries
      if (notesObj.sleep_source === 'manual') continue;

      notesObj.sleep_hours = hours;
      notesObj.sleep_quality = 3;
      notesObj.sleep_source = 'health_connect_bg';

      await fetch(`${supabaseUrl}/rest/v1/daily_logs`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          log_date: date,
          notes: JSON.stringify(notesObj),
        }),
      });
    }

    console.log('Background health sync completed');
    resolve();
  } catch (error) {
    console.error('Background health sync error:', error);
    reject(error.message || 'Unknown error');
  }
});
