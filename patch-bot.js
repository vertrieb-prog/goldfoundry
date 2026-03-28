const fs = require("fs");
let c = fs.readFileSync("signal-bot.mjs", "utf8");

// Replace dialog search with direct getEntity
c = c.replace(
  /const dialogs = await client\.getDialogs.*?\n/,
  "// Direct entity resolve (no dialogs needed)\n"
);

c = c.replace(
  /for \(const d of dialogs\)[\s\S]*?console\.log\(`\s*📢[\s\S]*?\n\s*\}\s*\}/,
  `for (const chId of Object.keys(CHANNELS)) {
    try {
      const rawId = chId.replace("-100", "");
      const entity = await client.getEntity(rawId);
      channelEntities[chId] = entity;
      const acc = channelAccountMap[chId];
      console.log("  📢 " + CHANNELS[chId] + " → " + (acc ? acc.metaApiId.slice(0, 8) : "KEIN ACCOUNT"));
    } catch (e) { console.log("  ❌ " + CHANNELS[chId] + ": " + (e.message || "").slice(0,40)); }
  }`
);

fs.writeFileSync("signal-bot.mjs", c);
console.log("PATCHED: direct entity resolve for " + Object.keys(JSON.parse('{"a":1}')).length + " test");
