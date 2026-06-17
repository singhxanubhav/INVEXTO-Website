const axios = require("axios");

async function main() {
  try {
    const res = await axios.post("http://localhost:3000/api/tournament/trade", {
      stockSymbol: "RELIANCE.NS",
      quantity: 1,
      type: "buy"
    }, {
      headers: {
        // We need a session cookie. I'll just check the db.
      }
    });
    console.log(res.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}

main();
