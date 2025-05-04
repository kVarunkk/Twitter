# Twitter-Frontend

Opensource Twitter built using Nextjs 15.2.2

## Features

- Fully responsive
- Sign up/ Sign in via JWT Token
- Customize profile(avatar, banner, bio, etc)
- Tweet
- Comment
- Retweet
- Follow user
- Like, Edit & Delete tweets and comments
- Tweets filtered according to "Topics"
- Tweet images by easily adding Image URLs
- No character limit on tweets
- Global Search
- Realtime End-To-End Encrypted Messaging

## Contribute

### Prerequisites

- npm

1. Fork this repository
2. Clone this repository
3. Install dependencies

```
$ npm install
```

> **Note**: Use the `--force` flag only if `npm install` fails without it. This forces the installation of dependencies but may lead to potential issues with incompatible packages.

4. Create a `.env` file in the root directory and add the following variables:

```
MONGO_URI=<your-mongodb-atlas-uri>
JWT_SECRET_KEY=<your-jwt-secret-key>
```

- **MONGO_URI**: This should be the connection string for your MongoDB Atlas cluster. You can find this in your MongoDB Atlas dashboard.
- **JWT_SECRET_KEY**: You can generate a secure key online using tools like [randomkeygen.com](https://randomkeygen.com/) or any other secure key generator.

### Run the app

```
$ npm run dev
```

## License

This project is made available under the MIT License.
