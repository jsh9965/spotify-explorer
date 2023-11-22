// 1ST DRAFT DATA MODEL
import mongoose from 'mongoose';

// users
const User = new mongoose.Schema({
  // username provided by authentication plugin
  // password hash provided by authentication plugin
  lists:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'songList' }],
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

// Song list
// * Can have any numebr of songs
// can create automatically by applying restraints to existing playlsits
const songList = new mongoose.Schema({
  name: {type: String, required: true},
  songs:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  public: {type: Boolean, required: true}
});

// TODO: add remainder of setup for slugs, connection, registering models, etc. below
mongoose.connect(process.env.DSN);