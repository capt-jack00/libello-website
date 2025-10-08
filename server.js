//TODO: Check if the code is properly secured, if not code a automatic logout mechanism to increase the seciurity. 
// Also add additional seciurity mechanism which will block the account after specified ammount of failed login attempts.  

const express = require('express');
const session = require('express-session');
const ejs = require('ejs')
let mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
const debugsql = "SELECT * FROM uzytkownicy;"

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');

// RENDERS
app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/notes", (req, res) => {
  res.render("notes.ejs");
});

// SESSION
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 1}
    }
));

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try{
    const result = con.query("SELECT * FROM uzytkownicy WHERE username = ?;", [username], (err, result) =>{
      if (err) {
        console.log(err);
        return;
      }

      if(result.length > 0){
      const user = result[0];
      const storedPassword = user.password;
      const isAdmin = user.isAdmin;

        if(storedPassword === password){
          if(isAdmin == 1){
            res.render("notes.ejs", {info: "You're an admin", file: "plik.pdf"});
          }
          else{
            res.render("notes.ejs", {info: "You're not an admin"});
          }
        }
        else{
          res.render("login.ejs", { error: "Password incorrect" });
          // console.log("Password incorrect");
        }
      }
      else{
        res.render("login.ejs", { error: "User not found" });
        // console.log("User not found");
      }
    });
    
  }
  catch(err){
    console.log(err);
    console.error("Database error:", err.message);
    return res.status(500).send("Internal server error");
  }
});

// DATABASE
let con = mysql.createPool({
    host: "localhost",
    database: "uzytkownicy",
    user: "root",
    password: "",
    connectionLimit: 10
}); 


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});













//DEBUG QUERY - USE ONLY WHEN SOMETHING'S WRONG 
// conn.query(debugsql, function(err, result){
//     if(err) throw err;
//     console.log(result);
// });