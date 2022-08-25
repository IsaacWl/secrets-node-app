const ejs = require("ejs")
const express = require("express")
const app = express()
const PORT = process.env.PORT || 8000
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const session = require("express-session")

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))
app.set("view engine", "ejs")

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    }
})

UserSchema.plugin(passportLocalMongoose)

const User = mongoose.model("User", UserSchema)

passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/", ( req, res ) => {
    res.render("home")
})

app.get("/secrets", ( req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

app.route("/register")

.get((req, res) => {
    res.render("register")
})

.post((req, res) => {
    User.register({ username: req.body.username }, req.body.password, (error, user) => {
        if (error) {
            console.log(error)
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            })
        }
    })
})

app.route("/login")

.get((req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/secrets")
    } else {
        res.render("login")
    }
})

.post((req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (error) => {
        if (error) {
            console.log(error)
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            })
        }
    })
})

app.get("/logout", (req, res) => {
    req.logout((error) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect("/")
        }
    })
})


const uri = "mongodb://localhost:27017/secrets"

mongoose.connect(uri)
.then(() => {
    app.listen(PORT, () => {
        console.log(`Listening port ${PORT}`)
    })
})
.catch(error => console.error(error))