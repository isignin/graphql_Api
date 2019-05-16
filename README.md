#GraphQL API using Node.js, MongoDB

## Project setup
```
npm install
```
create config.sys in the root path with the followings:
```
    module.exports = {
        "MONGO_USER" : "mongo_user",
        "MONGO_PW" : "mongo_password",
        "JWT_KEY" : "secret key for JsonWebToken"
    };
```

### Compiles and hot-reloads for development
```
npm run start
```

### Dependencies
```
node.js
express.js
mongodb
mongoose
```
