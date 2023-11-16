const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();

require("dotenv").config();
const api = process.env.API_URL;

app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(morgan("tiny"));

app.get("/", (req, res) => {
    res.json({ "goldReserves": 10000 }); 
});


let server = app.listen(process.env.PORT || 3000, function () {
  let port = server.address().port;
  console.log("Express is working on port " + port);
});
