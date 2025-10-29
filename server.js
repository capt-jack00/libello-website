//TODO: Also add additional seciurity mechanism which will block the account after specified ammount of failed login attempts.  

const express = require('express');
const session = require('express-session');
const ejs = require('ejs')
let mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
let parserAttempt = 0;
const saltRounds = 10;
const debugsql = "SELECT * FROM uzytkownicy;"

const path = require('path');
const fs = require('fs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

//SESSION
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60}
    }
));

// NON-SECURE RENDERS
app.get("/", (req, res) => {
  if(parserAttempt === 1){
    res.render("error.ejs");
  }

  res.redirect("/login");
});

app.get("/login", (req, res) => {
  if(parserAttempt === 1){
    res.render("error.ejs");
  }

  if(req.session.user){
    const user = req.session.user;
    con.query("SELECT * FROM notatki WHERE class = ? AND course = ?", [user.class, user.course], (err, result) => {
      if(err){
        console.log("Something went wrong while selecting table with notes" + err);
        return;
      }
      if(user.isAdmin === 1){
        res.render("notes.ejs", {notes: result, userName: user.username, isAdmin: true});
        return;
      }
      else{
        res.render("notes.ejs", {notes: result, userName: user.username, isAdmin: false});
        return;
      }
    });
  } 
  else{
    res.render("login.ejs")
  }
});

// SECURED RENDERS
app.get('/logout', (req, res) => {
  const user = req.session && req.session.user;
  req.session.destroy( err => {
    if(err){
      console.log("Session destruction error: " + err);
      return res.redirect("/");
    }
    console.log("Session destruction for " + user.username + " succeded");
    res.redirect("/login");
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try{
    con.query("SELECT * FROM uzytkownicy WHERE username = ?;", [username], (err, result) =>{
      if (err) {
        console.log(err);
        return res.status(500).send("Database error");
      }
      
      if(result.length > 0){
        const user = result[0];
        const storedPassword = user.password;
        const isAdmin = user.isAdmin;
        const isAccountBlocked = user.isAccountBlocked;

        if(isAccountBlocked == 1){
          console.log("Login attempt for blocked account " + username);
          return res.render("login.ejs", { error: "Konto zablokowane. Skontaktuj się z administratorem." });
        }

        bcrypt.compare(password, storedPassword, (err, result) => {
          if(err){
            console.log("Something went wrong " + err)
            return res.status(500).send("Internal server error");
          }

          if(result){
            req.session.user = {
              username: user.username,
              role: user.isAdmin,
              class: user.class,
              course: user.course
            };
            if(isAdmin == 1){
              con.query("SELECT * FROM notatki WHERE class = ? AND course = ?", [user.class, user.course], (err, result) => {
                if(err){
                  console.log("Something went wrong while selecting table with notes")
                }
              
                res.render("notes.ejs", {isAdmin: true, notes: result, userName: user.username});
              });
            }
            else{
              con.query("SELECT * FROM notatki WHERE class= ?", [user.class], (err, result) => {
                if(err){
                  console.log("Something went wrong while selecting table with notes")
                }
              
                res.render("notes.ejs", {isAdmin: false, notes: result, userName: user.username});
              });
            }

            
            console.log("Login for " + username + " success")
          }
          else{
            res.render("login.ejs", { error: "Nieprawidłowe hasło" });
            console.log("Login for " + username + " failed")
          }
        });
      }
      else{
        res.render("login.ejs", { error: "Nie znaleziono użytkownika" });
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

app.get("/notes", (req, res) => {
  const user = req.session.user;
  if(req.session.user && req.session.user.role === 1){
    con.query("SELECT * FROM notatki WHERE class = ? AND course = ?", [user.class, user.course], (err, result) => {
      if(err){
        console.log("Something went wrong while selecting table with notes" + err);
        return;
      }

      res.render("notes.ejs", {notes: result});
    });
  }
  else{
    res.redirect("/login")
  }
})

//TODO: Rewiev the code
app.get('/pdfs/:filename', (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('Access denied');
  }

  const filePath = path.join(__dirname, 'pdfs', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.sendFile(filePath);
});

//TODO: Add some way to inform user that he needs to be logged in and have admin priviliegs to view this site
app.get("/adminpanel", (req, res) => {
  if(req.session.user && req.session.user.role === 1){
    con.query("SELECT * FROM uzytkownicy", (err, result) => {
      if(err){
        console.log(err);
        return;
      }

      res.render("adminpanel.ejs", {users: result})
    });
  }
  else{
    res.redirect("/login")
  }
});

app.post("/adminpanel", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const passwordConfirmation = req.body.passwordConfirmation;
  const classa = req.body.classa;
  const course = req.body.course; 

  if (!username || !password || !classa || !course) {
    con.query("SELECT * FROM uzytkownicy", (err, result) => {
      if(err) return console.log(err);
      return res.render("adminpanel.ejs", {users: result, error: "Wszystkie pola muszą być wypełnione!"});
    }); 
    return;
  }

  if(password != passwordConfirmation){
    con.query("SELECT * FROM uzytkownicy", (err, result) => {
      if(err) return console.log(err);
      return res.render("adminpanel.ejs", {users: result, error: "Hasła muszą być takie same!"});
    });  
    return;
  }

  try{
    const result = con.query("SELECT * FROM uzytkownicy WHERE username = ?;", [username], (err, result) => {
      if(err){
        console.log(err);
      }

      if(result.length > 0){
        con.query("SELECT * FROM uzytkownicy", (err, result) => {
          if(err){
            console.log(err);
            return;
          }

          res.render("adminpanel.ejs", {users: result, error: "Użytkownik " + username + " już istnieje!"})
        });
      }
      else{
        const hashedPassword = bcrypt.hash(password, saltRounds, (err, hash) => {
          if(err){
            console.log(err);
          }

          const registerNewUser = con.query("INSERT INTO uzytkownicy (username, password, class, course, isAdmin, isAccountBlocked) VALUES (?, ?, ?, ?, 0, 0);", [username, hash, classa, course], (err, result) => {
            if(err){
              console.log(err);
            }

            console.log("Hashed password: " + hash)

            con.query("SELECT * FROM uzytkownicy", (err, result) => {
                if(err){
                  console.log(err);
                  return;
                }
              
              res.render("adminpanel.ejs", {users: result, error: "registerSuccess"})
            });
          });
        })
      }
    })
  }
  catch(err){
    console.log(err);
  }
});


app.get("/verysecretendpointMetallica123", (req, res) => {
  res.render("forgotpassword.ejs");
});

app.post("/verysecretendpointMetallica123", (req, res) => {
  parserAttempt = 1;
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