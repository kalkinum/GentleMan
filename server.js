const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const MACRODROID_URL = "https://trigger.macrodroid.com/8c707e77-2775-44f4-8685-cfe0240b79e5/gentleman_cmd";

// Home route
app.get('/', (req, res) => {
  res.send('Gentleman Bot Active');
});

// Trigger command
app.get('/trigger-click', async (req, res) => {
  try {
    await axios.get(MACRODROID_URL);
    console.log(">>> [SIGNAL SENT]: Bot ko command bhej di gayi hai.");
    res.status(200).send("Signal Sent");
  } catch (err) {
    console.log("!!! [ERROR]: Signal nahi gaya.");
    res.status(500).send("Error");
  }
});

// Clean Report from Bot
app.post('/', (req, res) => {
  // Sirf bot ka status aur message console mein dikhega
  const { status, message } = req.body;
  console.log(`<<< [BOT REPORT]: Status: ${status} | Msg: ${message}`);
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`--- Server Started on Port ${port} ---`);
});
