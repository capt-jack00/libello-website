//TODO: Also add additional seciurity mechanism which will block the account after specified ammount of failed login attempts.  

const express = require('express');
const session = require('express-session');
const ejs = require('ejs')
let mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
let loginAttempt;
const saltRounds = 10;
const debugsql = "SELECT * FROM uzytkownicy;"

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');

// NON-SECURE RENDERS
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// SESSION
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60}
    }
));

// SECURED RENDERS
app.get('/logout', (req, res) => {
  req.session.destroy( err => {
    if(err){
      console.log("Session destruction error: " + err);
      return res.redirect("/");
    }
    res.redirect("/login")
  });
});

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

        bcrypt.compare(password, storedPassword, (err, result) => {
          if(err){
            console.log("Something went wrong " + err)
          }

          if(result){
            if(isAdmin == 1){
              res.render("notes.ejs", {isAdmin: true, file: "plik.pdf"});
            }
            else{
              con.query("SELECT * FROM notatki WHERE class= ?", [user.class], (err, result) => {
                if(err){
                  console.log("Something went wrong while selecting table with notes")
                }
              
                res.render("notes.ejs", {isAdmin: false, notes: result});
              });
            }

            req.session.user = {
              username: user.username,
              role: user.isAdmin,
              class: user.class 
            };
            console.log("Login for " + username + " success")
          }
          else{
            res.render("login.ejs", { error: "Password incorrect" });
            console.log("Login for " + username + " failed")
          }
        });
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

app.get("/notes", (req, res) => {
  if(req.session.user && req.session.user.role === 1){
    con.query("SELECT * FROM notatki WHERE class= ?", [user.class], (err, result) => {
      if(err){
        console.log("Something went wrong while selecting table with notes")
      }

      res.render("notes.ejs", {notes: result});
    });
  }
  else{
    res.redirect("/login")
  }
})
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

    // const [usersAdminQuery] = con.query("SELECT * FROM uzytkownicy;");
    // res.render("adminpanel.ejs", {users: result});
  }
  else{
    res.redirect("/login")
  }
});

app.post("/adminpanel", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const classa = req.body.classa;
  const course = req.body.course; 

  if (!username || !password || !classa || !course) {
    con.query("SELECT * FROM uzytkownicy", (err, result) => {
      if(err){
        console.log(err);
        return;
      }
      
      return res.render("adminpanel.ejs", {users: result, error: "Wszystkie pola muszą być wypełnione!"});
    }); 
  }

  try{
    const result = con.query("SELECT * FROM uzytkownicy WHERE username = ?;", [username], (err, result) => {
      if(err){
        console.log(err);
      }

      if(result.length > 0){
        //TODO: Simplify
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

            //TODO: Simplify
            con.query("SELECT * FROM uzytkownicy", (err, result) => {
              if(err){
                  console.log(err);
                  return;
                }
              
              //TODO: Add option to inform the admin that adding new user was succesful. (Probably will need to rewrite the code for render amidnpanel.ejs)
              res.render("adminpanel.ejs", {users: result})
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

// TODO: Make it work
// app.get("/notes", (req, res) => {
//   const isAdmin = req.query.isAdmin;
//   if(req.session.user){
//     res.render("notes.ejs", {isAdmin});
//   }
//   else{
//     res.redirect("/login")
//   }
// });


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