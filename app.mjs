import './config.mjs';
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import './db.mjs';
import mongoose from 'mongoose';
import url from 'url';
//const Review = mongoose.model('Review');
import session from 'express-session';
import passport from 'passport';
import { Strategy as SpotifyStrategy } from 'passport-spotify';

const app = express();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '')));

// configure templating to hbs
app.set('view engine', 'hbs');

// body parser (req.body)
app.use(express.urlencoded({ extended: false }));

const sessionOptions = { 
	secret: 'secret', 
	saveUninitialized: true, 
	resave: true 
};
app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new SpotifyStrategy(
        {
            clientID: '93f9f155c30949a98f9e0f3ee7aab905',
            clientSecret: '340a2326cff24d74bbddfd1ea681f348',
            callbackURL: 'http://localhost:24931/myAccount' // Adjust the URL based on your setup
        },
        function(accessToken, refreshToken, expires_in, profile, done) {

            // Save the user profile information in the session
            req.session.accessToken = accessToken
            res.locals.accessToken = req.session.accessToken;
            req.session.refreshToken = refreshToken
            res.locals.refreshToken = req.session.refreshToken;
            req.session.expires_in = expires_in
            res.locals.expires_in = req.session.expires_in;
            req.session.profile = profile
            res.locals.profile = req.session.profile;
            console.log("profile");
            console.log(profile);
            return done(null, profile);
        }
    )
);

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});



app.get('/login', (req, res) => {
    res.redirect('/auth/spotify');
});

app.get('/auth/error', (req, res) => res.send('Unknown Error'))
app.get('/auth/spotify',passport.authenticate('spotify'));

app.get('/User/username', (req, res) => {
    res.render('user');
});

app.get('/myAccount', passport.authenticate('spotify', { failureRedirect: '/editor' }), async (req, res) => {
    if(!(req.session.pfp))
    {
        req.session.pfp = "/public/img/defaultPFP.avif"
        res.locals.pfp = req.session.pfp;
    }
    console.log("req")
    console.log(req.session)
    console.log(req.user)
    res.render('myAccount', { username: req.session.username, pfp: req.session.pfp });
});

app.post('/myAccount', async (req, res) => {
    if(req.body.username)
    {
        req.session.username = req.body.username;
        res.locals.username = req.session.username;
    }
    if(req.body.pfp && isImage(req.body.pfp))
    {
        req.session.pfp = req.body.pfp;
        res.locals.pfp = req.session.pfp;
    }
    res.render('myAccount', { username: req.session.username, pfp: req.session.pfp });
});

app.get('/Editor', (req, res) => {
    res.render('editor');
});

app.get('/Progress', (req, res) => {
    res.render('progress');
});

app.post('/Editor', (req, res) => {
    //create playlist
    const submittedValues = {
        genre: req.body.genre,
        time: req.body.time,
        timeComparison: req.body['time-comparison'],
        streams: req.body.streams,
        streamsComparison: req.body['streams-comparison'],
        artist: req.body.artist,
        date: req.body.date,
        dateComparison: req.body['date-comparison'],
        album: req.body.album,
    };
    res.render('editor', submittedValues);
});

console.log("here");
app.listen(process.env.PORT || 3000);

function isImage(url)
{
    const extension = url.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'avif', 'webp'];
    return imageExtensions.includes(extension);
}