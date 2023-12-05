import './config.mjs';
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import './db.mjs';
import mongoose from 'mongoose';
import url from 'url';
const appUser = mongoose.model('appUser');
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
            callbackURL: 'http://localhost:24931/authSuccess' // Adjust the URL based on your setup
        },
        async function(accessToken, refreshToken, expires_in, profile, done) {
            try {
                console.log(profile);
                const existingUser = await appUser.findOne({ id: profile.id });
                if (existingUser) {
                    //don't change custom usernames or pfps of existing users
                    return done(null, existingUser);
                } else {
                    // User doesn't exist, create a new user with pfp and name of spotify account
                    const newUser = new appUser({
                        id: profile.id,
                        username: profile.displayName,
                        profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '/public/img/defaultPFP.avif',
                        lists: [],
                        friends: []
                    });
                    await newUser.save();
                    return done(null, newUser);
                }
            } catch (error) {
                console.error('Error handling Spotify authentication:', error);
                return done(error);
            }
        }
    )
);

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


app.get('/', (req, res) => {
    res.render('login');
});

app.get('/login', (req, res) => {
    res.redirect('/auth/spotify');
});

app.get('/auth/error', (req, res) => res.send('Unknown Error'))
app.get('/auth/spotify',passport.authenticate('spotify'));

app.get('/User/username', (req, res) => {
    res.render('user');
});

app.get('/authSuccess', passport.authenticate('spotify', { failureRedirect: '/login' }), (req, res) => {
    res.redirect("/myAccount");});

app.get('/myAccount', async (req, res) => {
    try{
        let userInDatabase;
        if (!req.isAuthenticated()) {
            res.redirect('/login'); // Redirect to login if not authenticated
            return;
        }
        if(!req.session.userID)
        {
            req.session.userID = req.user.id
            userInDatabase = await appUser.findOne({ id: req.session.userID });
            if (!userInDatabase) {
                // If the user doesn't exist in the database, create a new user
                userInDatabase = new appUser({
                    id: req.user.id,
                    username: req.user.displayName,
                    profilePicture: req.user.photos && req.user.photos.length > 0 ? req.user.photos[0].value : '/public/img/defaultPFP.avif',
                    lists: [],
                    friends: []
                });

                // Save the new user to the database
                await userInDatabase.save();
            }
            req.session.user = userInDatabase;
            req.session.save();
        }
        else {userInDatabase = await appUser.findOne({ id: req.session.userID });}
        const friendsDetails = await Promise.all(
            userInDatabase.friends.map(async friendID => {
                const friend = await appUser.findById(friendID);
                return { id: friend.id, profilePicture: friend.profilePicture };
            })
        );
        res.render('myAccount', { username: req.session.user.username, pfp: req.session.user.profilePicture, id: req.user.id, friendsDetails: friendsDetails });
    } catch (error) {
        console.error('Error in myAccount route:', error);
        res.redirect('/auth/error');
    }
});

app.post('/myAccount', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            res.redirect('/login');
            return;
        }
        if (!req.session.userID) {
            res.redirect('/login');
            return;
        }
        let userInDatabase = await appUser.findOne({ id: req.session.userID });
        if (!userInDatabase) {
            res.redirect('/login');
            return;
        }
        if (req.body.username) {
            userInDatabase.username = req.body.username;
        }
        if (req.body.pfp && isImage(req.body.pfp)) {
            userInDatabase.profilePicture = req.body.pfp;
        }
        if(req.body.friendID)
        {
            const friendToAdd = await appUser.findOne({ id: req.body.friendID });
            if(friendToAdd)
            {
                if (req.body.action === "add" && !(userInDatabase.friends.some(async friendID => friendID == req.body.friendID))) {
                    if (friendToAdd) {
                        userInDatabase.friends.push(friendToAdd);
                    }
                }
                if (req.body.action === "remove") {
                    const friendIndex = userInDatabase.friends.findIndex((async friendID => friendID == req.body.friendID));

                    if (friendIndex !== -1) {
                        userInDatabase.friends.splice(friendIndex, 1);
                        console.log("spliced");
                    }
                }
            }
        }
        await userInDatabase.save();
        req.session.user = userInDatabase;
        req.session.save();
        const friendsDetails = await Promise.all(
            userInDatabase.friends.map(async friendID => {
                const friend = await appUser.findById(friendID);
                return { id: friend.id, profilePicture: friend.profilePicture };
            })
        );
        res.render('myAccount', { username: req.session.user.username, pfp: req.session.user.profilePicture, id: req.user.id, friendsDetails: friendsDetails });
    } catch (error) {
        console.error('Error in myAccount POST route:', error);
        res.redirect('/auth/error');
    }
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

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

console.log("here");
app.listen(process.env.PORT || 3000);

function isImage(url)
{
    const extension = url.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'avif', 'webp'];
    return imageExtensions.includes(extension);
}