import './config.mjs';
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



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
