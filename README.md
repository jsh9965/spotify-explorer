The content below is an example project proposal / requirements document. Replace the text below the lines marked "__TODO__" with details specific to your project. Remove the "TODO" lines.

# Spotify explorer

## Overview

This will be a site that will allow users to filter, create, and analyze their music taste, as well as compare with other people.  There are many sites that use the Spotify API to tell you very specific things about your music taste, but this will allow the user to choose what statistics they want to see, make and manage playlists using this information.  They will also be able to have friends, and view their friend's music, and apply filters in a similar way.  This will involve using the spotify API to sort and filter by various statistics such as genre, popularity, length, artist, album, or intersection with other playlists.


## Data Model

The application will store Users, Songs, Lists of songs, and Friends

* users can have as many lists and friends as they choose
* each friend is another user, with their own song lists


An Example User:

```javascript
{
  username: "musicEnjoyer",
  hash: // a password hash,
  lists: // an array of song lists
  friends: // an array of other user's names
}
```
A Song:

```javascript
{
  title: //name of song
  artist: //singer of the song
}
```


A Song List:

```javascript
{
  playlsitName: //name of list
  songs: //an array of songs
  public: //boolean which determines whether friends can see this playlist
}
```


## [Link to Commented First Draft Schema](db.mjs) 

## Wireframes

/login - page for logging into your account

![login](documentation/Login.jpg)

/myAccount - page for viewing and managing your friends and playlists as well as changing your name or logging out

![myAccount](documentation/myAccount.jpg)

/Editor - page for filtering, creating, previewing, and viewing playlsits

![editor](documentation/Editor.jpg)

/User/*username* - page for viewing other people's account, typically friends, so you can see their friends and playlsits

![User](documentation/GeneralUser.jpg)

## Site map

Basic site [map](documentation/SiteMap.jpg)

## User Stories or Use Cases

1. as non-registered user, I can register a new account with the site
2. as a user, I can log in to the site
3. as a user, I can add friends, and view my friends' accounts to see their playlists
4. as a user, I can view my playlists, and mark them to be public or private
5. as a user, I can create new playlists, or preview them, by applying filters and operations on existing playlists
6. as a user, I can change my username, or logout

## Research Topics

* (5 points) Integrate user authentication
    * I'm going to be using passport for user authentication
* (4 points) Unit tests with javascript
  * use mocha
  * make sure website does not crash even under variety of combinations of inputs/filters
* (4 points) Spotify API
    * use the spotify API to get songs/playlists, and find information about them

12 points total out of 10 required points


## [Link to Initial Main Project File](app.mjs) 

(__TODO__: create a skeleton Express application with a package.json, app.mjs, views folder, etc. ... and link to your initial app.mjs)

## Annotations / References Used

(__TODO__: list any tutorials/references/etc. that you've based your code off of)

1. [passport.js authentication docs](http://passportjs.org/docs) - (add link to source code that was based on this)
2. [tutorial on vue.js](https://vuejs.org/v2/guide/) - (add link to source code that was based on this)

