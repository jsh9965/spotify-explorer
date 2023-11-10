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
app.use(express.static(path.join(__dirname, 'public')));

// configure templating to hbs
app.set('view engine', 'hbs');

// body parser (req.body)
app.use(express.urlencoded({ extended: false }));

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
    res.render('myAccount');
});

app.get('/Editor', (req, res) => {
    res.render('editor');
});

app.post('/Editor', (req, res) => {
    //create playlist
});


app.listen(process.env.PORT || 3000);
