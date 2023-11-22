import './config.mjs';
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import './db.mjs';
import mongoose from 'mongoose';
import url from 'url';
//const Review = mongoose.model('Review');
import session from 'express-session';

const app = express();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '')));

// configure templating to hbs
app.set('view engine', 'hbs');

// body parser (req.body)
app.use(express.urlencoded({ extended: false }));

const sessionOptions = { 
	secret: 'secret', 
	saveUninitialized: false, 
	resave: false 
};
app.use(session(sessionOptions));



app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    //redirect to myAccount if correct
});

app.get('/User/username', (req, res) => {
    res.render('user');
});

app.get('/myAccount', (req, res) => {
    if(!(req.session.pfp))
    {
        req.session.pfp = "/public/img/defaultPFP.avif"
        res.locals.pfp = req.session.pfp;
    }
    res.render('myAccount', { username: req.session.username, pfp: req.session.pfp });
});

app.post('/myAccount', (req, res) => {
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