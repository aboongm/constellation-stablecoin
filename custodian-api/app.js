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
    res.send("10000");
});

// Routes
// const loanRoutes = require("./routes/loansRoutes");
// const userRoutes = require("./routes/userRoutes");

// app.use(`${api}/loans`, loanRoutes); 
// app.use(`${api}`, userRoutes); 

// Production
let server = app.listen(process.env.PORT || 3000, function () {
  let port = server.address().port;
  console.log("Express is working on port " + port);
});
