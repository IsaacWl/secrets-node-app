require("dotenv").config()
const express = require("express")
const app = express()
const PORT = process.env.PORT || 8000
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const passport = require("passport")
const session = require("express-session")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const LocalStrategy = require("passport-local")
const User = require("./models/User")

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))
app.set("view engine", "ejs")

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(( user, done ) => {
    return done(null, user.id)
})

passport.deserializeUser((id, done ) => {
    User.findById(id, (error, user) => {
        if (error) return done(error)
        const { password, ...userInfo } = user._doc
        return done(null, userInfo)
    })
})

passport.use(new LocalStrategy((username, password, cb) => {
    User.findOne({ email: username }, (error, user) => {
        if (error) {
            return cb(error)
        }
        if (!user) {
            return cb(null, false, { message: "email or password incorrect."})
        }

        bcrypt.compare(password, user.password, (error, equals) => {
            if (error) {
                return cb(error)
            }

            if(!equals) {
                return cb(null, false, { message: "email or password incorrect."})
            }
            return cb(null, user)
        })
    })
}))

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/secrets",
}, (accessToken, refreshToken, profile, cb) => {
    User.findOne({ googleId: profile.id }, (error, user) => {
        if (error) {
            return console.error(error)
        }
        if (!user) {
            const newUser = new User({
                googleId: profile.id,
                email: profile._json.email,
                username: profile.displayName,
                // picture: profile._json.picture
            })
            newUser.save((error) => {
                if (error)
                    return console.error(error)
                
                return cb(error, newUser)
            })
        } else {
            return cb(error, user)
        }
    })
}))

app.get("/", ( req, res ) => {
    res.render("home")
})

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
)

app.get("/auth/google/secrets",
passport.authenticate("google", { failureRedirect: "/login" })
, (req, res) => {
    // if successful redirect to /secrets
    res.redirect("/secrets")
})

app.get("/secrets", ( req, res) => {
    User.find({ "secret": {$ne: null}}, (error, foundUsers) => {
        if (error) {
            return res.status(500).json({ error })
        }
        res.render("secrets", {
            userSecrets: foundUsers
        })
    })
})

app.route("/register")

.get((req, res) => {
    res.render("register")
})

.post( async (req, res) => {
    const saltRounds = 10
    let { password } = req.body
    password = await bcrypt.hash(password, saltRounds)

    User.create({ email: req.body.username, password: password }, (error) => {
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

.post(
    passport.authenticate("local",
    { failureRedirect: "/login", failureMessage: true}),
    ( req, res ) => {
    res.redirect("/secrets")
})

app.route("/submit")
 
.get( (req, res)  => {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login")
    }
})

.post(( req, res ) => {
    const userId = req.user._id
    const { secret } = req.body
    User.findById(userId, (error, user) => {
        if (error) {
            return res.status(500).json({ error })
        }
        if (!user) {
            return res.status(404).json({ message: `user of id: ${userId} not found.`})
        }
        user.secret = secret
        user.save((error) => {
            if (error) {
                return res.status(500).json({ error })
            }
            res.redirect("/secrets")
        })
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

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    app.listen(PORT, () => {
        console.log(`Listening port ${PORT}`)
    })
})
.catch(error => console.error(error))