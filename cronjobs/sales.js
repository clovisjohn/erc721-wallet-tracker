const fetch = require('node-fetch');
const Discord = require('discord.js');
const { openseaEventsUrl } = require('../config.json');

var accounts=["0xa5d31a3ed981ec2fc2b10987be0dd04dfc6b8c38","0x0f0eae91990140c560d4156db4f00c854dc8f09e","0x96079afc8e407f6020b6f2c6a854343a384ea2a5","0x598fdd699c874440ebd31fdcf5cffc1500735a9f","0xfef1f1e87818593485f18d20bf7af4f8aaf75628","0x727f25672f4f2815831ed496c87b33faeb639238"]
var salesCache = [];
var lastTimestamp = null;

module.exports = {
  name: 'sales',
  description: 'sales bot!',
  schedule: '0,30 * * * * *',
  async execute(client) {
    if (lastTimestamp == null) lastTimestamp = Math.floor(Date.now()/1000) - 60;
    let newTimestamp = Math.floor(Date.now()/1000) - 30;

    let offset = 0;
    let settings = { 
      method: "GET",
      headers: {
        "X-API-KEY": process.env.OPEN_SEA_API_KEY
      }
    };
    while(1)
    {
	for (account of accounts) {

      let url = `${openseaEventsUrl}?account_address=${account}&only_opensea=false&offset=${offset}&limit=50&occurred_after=${lastTimestamp}&occurred_before=${newTimestamp}`;
      try {
        var res = await fetch(url, settings);
        
        if (res.status != 200) {
          throw new Error(`Couldn't retrieve events: ${res.statusText}`);
        }

        data = await res.json();
        if (data.asset_events.length == 0) {
          break;
        }

        data.asset_events.forEach(function(event) {
          if (event.asset) {
            if (salesCache.includes(event.id)) {
              return;
            } else {
              salesCache.push(event.id);
              if (salesCache.length > 20) salesCache.shift();
            }

            const embedMsg = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .setTitle(event.asset.name)
              .setURL(event.asset.permalink)
              .setDescription(event.event_type)
              .setThumbnail(event.asset.image_url)
	      .addField("collection", `[${event.asset.collection.name}](https://opensea.io/collection/${event.asset.collection.slug})`, true)
              .addField("From", `[${event.from_account.user.username || event.from_account.address.slice(0,8)}](https://etherscan.io/address/${event.from_account.address})`, true)
	      .addField("To", `[${event.to_account.user.username || event.to_account.address.slice(0,8)}](https://etherscan.io/address/${event.to_account.address})`, true)

            client.channels.fetch(process.env.DISCORD_SALES_CHANNEL_ID)
              .then(channel => {
                channel.send(embedMsg);
              })
              .catch(console.error);
          }
        });
      }
      catch (error) {
        console.error
      }
	}
      offset += data.asset_events.length;
	
    }

    lastTimestamp = newTimestamp;
  }

};
