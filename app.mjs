import './config.mjs';
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import './db.mjs';
import mongoose from 'mongoose';
import url from 'url';
const appUser = mongoose.model('appUser');
const Song = mongoose.model('Song');
import session from 'express-session';
import passport from 'passport';
import { Strategy as SpotifyStrategy } from 'passport-spotify';
import axios from 'axios'

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
            callbackURL: 'http://linserv1.cims.nyu.edu:24931/authSuccess' // Adjust the URL based on your setup
        },
        async function(accessToken, refreshToken, expires_in, profile, done) {
            try {
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

app.get('/User', async (req, res) => {
    try{
        let friendsDetails;
        let userInDatabase = await appUser.findOne({ id: req.query.user });
        if(userInDatabase)
        {
            friendsDetails = await Promise.all(
                userInDatabase.friends.map(async friendID => {
                    const friend = await appUser.findById(friendID);
                    return { id: friend.id, profilePicture: friend.profilePicture };
                })
            );
            res.render('user', { songs: userInDatabase.list.length, username: userInDatabase.username, pfp: userInDatabase.profilePicture, id: userInDatabase.id, friendsDetails: friendsDetails });
        }else {console.error('Error in finding user:', );res.send('Error in finding user:');}
        } catch (error) {
        console.error('Error in in finding user:', error);
        res.redirect('/auth/error');
    }
});

app.get('/authSuccess', passport.authenticate('spotify', { failureRedirect: '/login' }), (req, res) => {
    res.redirect("/myAccount");});

app.get('/myAccount', async (req, res) => {
    try{
        let userInDatabase;
        if (!req.isAuthenticated()) {
            res.redirect('/login');
            return;
        }
        if(!req.session.userID)
        {
            req.session.userID = req.user.id
            userInDatabase = await appUser.findOne({ id: req.session.userID });
            if (!userInDatabase) {
                userInDatabase = new appUser({
                    id: req.user.id,
                    username: req.user.displayName,
                    profilePicture: req.user.photos && req.user.photos.length > 0 ? req.user.photos[0].value : '/public/img/defaultPFP.avif',
                    lists: [],
                    friends: []
                });

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
        res.render('myAccount', { songs: req.session.user.list.length, username: req.session.user.username, pfp: req.session.user.profilePicture, id: req.user.id, friendsDetails: friendsDetails });
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
                let inList = await userInDatabase.friends.reduce((accumulator, currentFriend) =>
                accumulator || (friendToAdd._id.equals(currentFriend)), false,)
                if (req.body.action === "add" && !(inList)) {
                    userInDatabase.friends.push(friendToAdd);
                }
                if (req.body.action === "remove") {
                    let friendIndex = -1
                    for (let i = 0; i < userInDatabase.friends.length; i++) {
                        if (friendToAdd._id.equals(userInDatabase.friends[i])) {
                            friendIndex = i;
                            break;
                        }
                    }

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
        res.render('myAccount', { songs: req.session.user.list.length, username: req.session.user.username, pfp: req.session.user.profilePicture, id: req.user.id, friendsDetails: friendsDetails });
    } catch (error) {
        console.error('Error in myAccount POST route:', error);
        res.redirect('/auth/error');
    }
});

app.get('/Editor', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    res.render('editor');
});

app.post('/Editor', (req, res) => {
    res.redirect('/Songs?user='+ req.body.id + '&time='+ req.body.time + '&comp='+ req.body.comparison + '&artist=' + req.body.artist)
});

app.get('/Progress', (req, res) => {
    res.render('progress');
});

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.get('/Songs', async (req, res) => {
    try {
        const user = await appUser.findOne({ id: req.query.user });

        if (!user) {
            res.status(404).send('User not found');
            return;
        }

        let filteredSongs = user.list;
        if (req.query.time || req.query.artist) {
            filteredSongs = [];
            let max = req.query.time;
            if(!req.query.time)
            {
                max = 9999999999
            }
            let artist = req.query.artist.toLowerCase();
            for (const songID of user.list) {
                const song = await Song.findById(songID);
                const meetsTimeCriteria =
                    req.query.comp === 'greater-than'
                        ? song.duration >= max
                        : song.duration <= max;

                const meetsArtistCriteria = (song.Artist.toLowerCase()).includes(artist);

                if (meetsTimeCriteria && meetsArtistCriteria) {
                    filteredSongs.push(songID);
                }
            }
        }

        const songDetails = await Promise.all(
            filteredSongs.map(async songID => {
                const song = await Song.findById(songID);
                return { title: song.title, artist: song.Artist, duration: song.duration };
            })
        );

        res.render('songs', { username: user.username, songs: songDetails, id: user.id });
    } catch (error) {
        console.error('Error in /Songs route:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/Songs', async (req, res) => {
    try {
        const user = await appUser.findOne({ id: req.session.userID });
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        //switch playlist
        const clientId = '93f9f155c30949a98f9e0f3ee7aab905';
        const clientSecret = '340a2326cff24d74bbddfd1ea681f348';
        const playlistId = req.body.playlist;
        let accessToken;
        try {
            const response = await axios.post('https://accounts.spotify.com/api/token', null, {
                params: {
                    grant_type: 'client_credentials',
                }, headers: {
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                },});
            accessToken = response.data.access_token;
        } catch (error) {
            console.error('Error fetching access token:', error);
            throw error;
        }
        try {
            const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const playlist = response.data;
            const tracks = playlist.tracks.items;
            user.list = [];
            const songDetails = await Promise.all(tracks.map(async track => {
                const { name, artists, duration_ms } = track.track;
                const artistNames = artists.map(artist => artist.name).join(', ');
                let newSong = await Song.findOne({title: name});
                if(!(newSong)){
                newSong = new Song({title: name, Artist: artistNames, duration: duration_ms});}
                user.list.push(newSong)
                await newSong.save();
                return { title: name, artist: artistNames, duration: duration_ms };
            }));
            await user.save();
            req.session.user = user;
            req.session.save();
            res.render('songs', { username: user.username, songs: songDetails, id: user.id });
        } catch (error) {
            console.error('Error fetching playlist details:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in /Songs route:', error);
        res.status(500).send('Internal Server Error');
    }
});

console.log("here");
app.listen(process.env.PORT || 3000);

function isImage(url)
{
    const extension = url.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'avif', 'webp'];
    return imageExtensions.includes(extension);
}