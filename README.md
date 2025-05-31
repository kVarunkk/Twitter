# Twitter-Frontend

Opensource Twitter built using Nextjs 15.2.2

Live version: [https://varuns-twitter-clone.vercel.app](https://varuns-twitter-clone.vercel.app)

## Features

- Fully responsive
- Auth via JWT Token(httpOnly Cookies)
- Publish Tweet
- Publish Comment
- Create Retweet
- AI Tweet Generator
- AI Comment Generator
- Like, Edit & Delete tweets and comments
- Tweets filtered according to "Topics"
- Tweet images by easily adding Image URLs
- Push Notifications
- Semantic Search
- Realtime End-To-End Encrypted Messaging
- Customize profile(avatar, banner, bio, etc)
- Infinite Scrolling

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
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
NEXT_PUBLIC_AWS_REGION=<your-aws-region>
NEXT_PUBLIC_S3_BUCKET_NAME=<your-aws-s3-bucket>
OPENAI_API_KEY=<your-openai-api-key>
NEXT_PUBLIC_PYTHON_API_URL=<your-python-api-url>
NEXT_PUBLIC_SOCKET_URL=<your-socket-server-url>
```

- **MONGO_URI**: This should be the connection string for your MongoDB Atlas cluster. You can find this in your MongoDB Atlas dashboard.
- **JWT_SECRET_KEY**: You can generate a secure key online using tools like [randomkeygen.com](https://randomkeygen.com/) or any other secure key generator.
- **AWS_ACCESS_KEY_ID**, **AWS_SECRET_ACCESS_KEY**, **NEXT_PUBLIC_AWS_REGION**, **NEXT_PUBLIC_S3_BUCKET_NAME**: Get these from your AWS account. You'll have to set correct permissions for your S3 bucket to be able to upload and retrieve tweet images, avatar etc. in the app.
- **OPENAI_API_KEY**: Generate this from your OpenAI API Dashboard.
- **NEXT_PUBLIC_PYTHON_API_URL**: This is the url for the FastAPI server that contains APIs to create document and query embeddings powering the Search Module in the application. Navigate to [this repo](https://github.com/kVarunkk/Search_Server); fork => clone => host and get a public url.
- **NEXT_PUBLIC_SOCKET_URL**: This is the url for the Socket server that supports the Realtime End-to-End Encrypted Messaging in the application. Navigate to [this repo](https://github.com/kVarunkk/chat_server); fork => clone => host and get a public url.

### Run the app

```
$ npm run dev
```

## License

This project is made available under the MIT License.
