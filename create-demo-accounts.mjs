// create-demo-accounts.mjs — Create 2 MetaApi demo accounts for Gold Foundry
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const TOKEN = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI0MjQ5ZWQ4MDEwZDNiNGJkZGU3YWQxMjBhNTJlYmQ3MCIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJiaWxsaW5nLWFwaSIsIm1ldGhvZHMiOlsiYmlsbGluZy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiNDI0OWVkODAxMGQzYjRiZGRlN2FkMTIwYTUyZWJkNzAiLCJpYXQiOjE3NzM5NDYxMTJ9.Kosa8veGvSNB-k55gx4rzSimVYRizHKxCuRmXz_uVvtZcyDzl3xrpKACg6LNjXsCkPpfjEuXZn-CCLLRnTGHOCsd4b5gOPdxwwYZz-p42emLyq7ods3OosYRZsc3SHaNUvb81Vc9o6YCl22XC2KBEVlW4518l6j4nyF5026DHhlTS2UHM4D9YdiKMxun_hwaIUqUuV2b1Nv2xO5UgqSblxXoQ5pX5HP4urKhtjO3kYlBoCwSntNHqMrvblaXORJpQHAPpuHjZzbHVPw8c-kw-2jR5I6Z7St60Yb-kSTkxtXaxUU0nn-1rkvODeupb_f4tj6Z4fxDOPO944xQMblnJlHoAQKxwejSW-_SceIDLPRWUvHoKPPrx0Qc2EYrXwssbXlPL3k164uRnn9RdYx2WOjUJeiMm9xuOO601ljo99-MNUFgdF9DERAR-rpOPK7XRl7xYzosH4-yd4z5nIzfLfqUGc16vxFbodDP24qWTBYQQ1dVwZhUar47MVL5VzelfAjdaXWW9z6gh4GsltaWtdwJKHvYLYawqf9OZyn2s_MugmQvh-ZnrUH1kvGgOwl1UzMVgPRUcVbKY465qg3OSZeacyfU1G7WuO0zV9M4Qnidt8Xd07kKacXREtiVyPfVa7RL32mrTcQy2EuZGcRqe0XL-5rJNZbiZ4h3K0GEmBw';

const SUPABASE_URL = 'https://exgmqztwuvwlncrmgmhq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Z21xenR3dXZ3bG5jcm1nbWhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU5NzM0OSwiZXhwIjoyMDg5MTczMzQ5fQ.WgPLR0d1WU2YAOQBRyZBv1ZR1ivs5tit7Dm7eKph9rk';

const PROV_BASE = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const USER_ID = '0da80a9f-2652-46b1-8e1c-edfe1d057d18';

async function main() {
  console.log('Starting at', new Date().toISOString());

  const accountConfigs = [
    { email: 'elite@goldfoundry.de', label: 'Elite', accountName: 'Demo Elite ($10k)' },
    { email: 'phenex@goldfoundry.de', label: 'Phenex', accountName: 'Demo Phenex ($10k)' }
  ];

  const results = [];

  for (const config of accountConfigs) {
    console.log('\n=== Creating', config.label, 'account ===');

    const servers = ['ICMarketsSC-Demo', 'MetaQuotes-Demo', 'Pepperstone-Demo', 'Exness-MT5Trial7'];
    let demoAccount = null;
    let usedServer = null;

    for (let retry = 0; retry < 5; retry++) {
      for (const server of servers) {
        console.log('Trying server:', server, '(retry', retry, ')');
        try {
          const res = await fetch(PROV_BASE + '/users/current/provisioning-profiles/default/mt5-demo-accounts', {
            method: 'POST',
            headers: { 'auth-token': TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              balance: 10000, leverage: 500, serverName: server,
              email: config.email, name: 'Gold Foundry',
              phone: '+491000000001', accountType: 'hedging'
            }),
            signal: AbortSignal.timeout(60000),
          });
          const data = await res.json();
          console.log('  Status:', res.status);
          console.log('  Response:', JSON.stringify(data).substring(0, 400));

          if (res.ok && data.login) {
            demoAccount = data;
            usedServer = server;
            console.log('  SUCCESS! Login:', data.login);
            break;
          }

          if (res.status === 429) {
            const retryAt = data?.metadata?.recommendedRetryTime;
            if (retryAt) {
              const waitUntil = new Date(retryAt);
              const waitFor = Math.max(0, waitUntil.getTime() - Date.now()) + 10000;
              console.log('  Rate limited until:', retryAt, '- waiting', Math.round(waitFor/1000), 's');
              await new Promise(r => setTimeout(r, waitFor));
              break; // break inner loop to retry all servers
            }
          }
        } catch (e) {
          console.log('  Error:', e.message);
        }
      }
      if (demoAccount) break;
    }

    if (!demoAccount) {
      console.log('FAILED to create', config.label, 'account');
      continue;
    }

    console.log('\nDemo Account Credentials:');
    console.log('  Login:', demoAccount.login);
    console.log('  Password:', demoAccount.password);
    console.log('  InvestorPassword:', demoAccount.investorPassword);
    console.log('  Server:', demoAccount.serverName || usedServer);

    // Connect to MetaApi
    console.log('\nConnecting to MetaApi...');
    let metaApiId = null;
    try {
      const connectRes = await fetch(PROV_BASE + '/users/current/accounts', {
        method: 'POST',
        headers: { 'auth-token': TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'GF-' + config.label + '-' + demoAccount.login,
          type: 'cloud-g2',
          login: String(demoAccount.login),
          password: demoAccount.password,
          server: demoAccount.serverName || usedServer,
          platform: 'mt5',
          application: 'MetaApi',
          magic: 0,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const connectData = await connectRes.json();
      console.log('Connect status:', connectRes.status);
      console.log('Connect response:', JSON.stringify(connectData).substring(0, 400));
      metaApiId = connectData._id || connectData.id;
      console.log('MetaApi Account ID:', metaApiId);
    } catch (e) {
      console.log('Connect error:', e.message);
    }

    // Deploy
    if (metaApiId) {
      console.log('Deploying...');
      try {
        const deployRes = await fetch(PROV_BASE + '/users/current/accounts/' + metaApiId + '/deploy', {
          method: 'POST',
          headers: { 'auth-token': TOKEN, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(30000),
        });
        console.log('Deploy status:', deployRes.status);
        const deployText = await deployRes.text();
        console.log('Deploy response:', deployText.substring(0, 200));
      } catch (e) {
        console.log('Deploy error:', e.message);
      }
    }

    // Save to Supabase
    console.log('Saving to Supabase...');
    const insertBody = {
      user_id: USER_ID,
      metaapi_account_id: metaApiId || ('demo-' + demoAccount.login),
      account_type: 'demo',
      account_name: config.accountName,
      firm_profile: 'tracking',
      broker_server: demoAccount.serverName || usedServer,
      broker_name: (demoAccount.serverName || usedServer).split('-')[0],
      mt_login: String(demoAccount.login),
      mt_password: demoAccount.password,
      platform: 'mt5',
      initial_balance: 10000,
      current_equity: 10000,
      equity_high: 10000,
      dd_limit: 0,
      dd_type: 'fixed',
      currency: 'USD',
      leverage: 500,
      copier_active: true,
    };

    try {
      const dbRes = await fetch(SUPABASE_URL + '/rest/v1/slave_accounts', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(insertBody),
      });
      const dbData = await dbRes.json();
      console.log('Supabase status:', dbRes.status);
      console.log('Supabase response:', JSON.stringify(dbData).substring(0, 500));

      results.push({
        label: config.label,
        accountName: config.accountName,
        login: demoAccount.login,
        password: demoAccount.password,
        investorPassword: demoAccount.investorPassword,
        server: demoAccount.serverName || usedServer,
        metaApiId: metaApiId,
        supabaseId: Array.isArray(dbData) ? dbData[0]?.id : dbData?.id,
      });
    } catch (e) {
      console.log('Supabase error:', e.message);
      results.push({
        label: config.label,
        accountName: config.accountName,
        login: demoAccount.login,
        password: demoAccount.password,
        investorPassword: demoAccount.investorPassword,
        server: demoAccount.serverName || usedServer,
        metaApiId: metaApiId,
        supabaseId: null,
      });
    }

    // Small delay between accounts
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log('\n\n========================================');
  console.log('FINAL RESULTS');
  console.log('========================================');
  console.log(JSON.stringify(results, null, 2));

  // Link to telegram channels
  if (results.length > 0) {
    console.log('\n=== Linking to Telegram channels ===');

    // Get Elite channel from DB
    const eliteChannelRes = await fetch(
      SUPABASE_URL + '/rest/v1/telegram_active_channels?select=*&channel_name=ilike.*elite*',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    const eliteChannels = await eliteChannelRes.json();
    console.log('Elite channels found:', JSON.stringify(eliteChannels));

    const eliteResult = results.find(r => r.label === 'Elite');
    const phenexResult = results.find(r => r.label === 'Phenex');

    if (eliteResult && eliteChannels.length > 0) {
      const ch = eliteChannels[0];
      const channelId = ch.channel_id;
      console.log('Linking Elite to channel_id:', channelId);
      const updateRes = await fetch(
        SUPABASE_URL + '/rest/v1/telegram_active_channels?channel_id=eq.' + channelId,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ linked_account_id: eliteResult.metaApiId }),
        }
      );
      const updateData = await updateRes.text();
      console.log('Elite link status:', updateRes.status, updateData);
    }

    if (phenexResult) {
      const phenexChannelId = '-1002568714747';
      console.log('Linking Phenex to channel_id:', phenexChannelId);
      const updateRes = await fetch(
        SUPABASE_URL + '/rest/v1/telegram_active_channels?channel_id=eq.' + phenexChannelId,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ linked_account_id: phenexResult.metaApiId }),
        }
      );
      const updateData = await updateRes.text();
      console.log('Phenex link status:', updateRes.status, updateData);
    }
  }

  console.log('\nALL DONE!');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
