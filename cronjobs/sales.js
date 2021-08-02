const fetch = require('node-fetch');
const Discord = require('discord.js');
const { openseaEventsUrl } = require('../config.json');

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

      let url = `${openseaEventsUrl}?account_address=${process.env.CONTRACT_ADDRESS}&only_opensea=false&offset=${offset}&limit=50&occurred_after=${lastTimestamp}&occurred_before=${newTimestamp}`;
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
              .setDescription(event.asset.event_type)
              .setThumbnail(event.asset.image_original_url)

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

      offset += data.asset_events.length;
    }

    lastTimestamp = newTimestamp;
  }
};
