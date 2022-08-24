//jshint esversion:6
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
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
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

app.route("/register")

.get((req, res) => {
    res.render("register")
})

.post((req, res) => {
    const { username, password } = req.body
    const saltRounds = 10
    bcrypt.hash(password, saltRounds, (error, hash) => {
        if (error) {
            return res.status(500).json({ error })
        }
        const newUser = new User({
            email: username,
            password: hash
        })
        newUser.save((error) => {
            if (error) {
                return res.status(500).json({ error })
            }
            res.render("secrets")
        })
    })
})

app.route("/login")

.get((req, res) => {
    res.render("login")
})

.post((req, res) => {
    const { username, password } = req.body
    User.findOne({ email: username }, (error, user) => {
        if (error) {
            return res.status(500).json({ error })
        }
        if (!user) {
            return res.status(404).json({ message: "email not registered."})
        }
        const passwordEquals = bcrypt.compare(password, user.password)
        if (!passwordEquals) {
            return res.status(400).json({ message: "email or password incorrect."})
        }
        res.render("secrets")
    })
})



const uri = "mongodb://localhost:27017/secrets"

// mongoose.set("useCreateIndex", true)
mongoose.connect(uri)
.then(() => {
    app.listen(PORT, () => {
        console.log(`Listening port ${PORT}`)
    })
})
.catch(error => console.error(error))