// 1ST DRAFT DATA MODEL
import mongoose from 'mongoose';

// users
const appUser = new mongoose.Schema({
  // username provided by authentication plugin
  // password hash provided by authentication plugin
  id: {type: String, required: true},
  username: {type: String, required: true},
  profilePicture: {type: String, required: true},
  list:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'song' }],
friends:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  _id: true
});

// Song
//Each song is just a title and artist
//Will only store songs which are featured in a least one user's playlsit
const Song = new mongoose.Schema({
  title: {type: String, required: true},
  Artist: {type: String, required: true}
});

// TODO: add remainder of setup for slugs, connection, registering models, etc. below
mongoose.model('appUser', appUser);
mongoose.connect(process.env.DSN);