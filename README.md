# Matching Engine

### Installation

Download the repository
```
git clone https://github.com/jethr0j0nes/matching_engine.git
cd matching_engine/
```

Install nvm
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

```

Restart the terminal session so that nvm is available<br>
Install node
```
nvm install node
```

Install dependencies from repo root
```
npm install
```

Install Redis
```
wget http://download.redis.io/releases/redis-4.0.9.tar.gz
tar xzf redis-4.0.9.tar.gz
cd redis-4.0.9
make
```

Start Redis executable and leave it running in the terminal
```
src/redis-server
```
Ideally this would be daemonized and running as a service

Open a new terminal and run all test from the repository root
```
npm test
```
This can't be run while the app is running as the ports will conflict

Run app on port 3000 and leave running in terminal from the repository root
```
npm start
```

From another terminal test app using curl:
```
curl localhost:3000/book

curl localhost:3000/sell --data '{"qty":10,"prc":15}' -H "Content-Type: application/json"

curl localhost:3000/sell --data '{"qty":10,"prc":13}' -H "Content-Type: application/json"

curl localhost:3000/buy  --data '{"qty":10,"prc":7}' -H "Content-Type: application/json"

curl localhost:3000/buy  --data '{"qty":10,"prc":9.5}' -H "Content-Type: application/json"

curl localhost:3000/book

curl localhost:3000/sell --data '{"qty":5, "prc":9.5}' -H "Content-Type: application/json"

curl localhost:3000/book

curl localhost:3000/buy  --data '{"qty":6, "prc":13}' -H "Content-Type: application/json"

curl localhost:3000/book

curl localhost:3000/sell --data '{"qty":7, "prc":7}' -H "Content-Type: application/json"

curl localhost:3000/book

curl localhost:3000/sell --data '{"qty":12, "prc":6}' -H "Content-Type: application/json"

curl localhost:3000/book
```

### Performance notes
The application relies on redis, an in memory data structure store for data storage.  This architecture should scale relatively well as redis is fast and the in code data structures keep cpu usage to a minimum.  Arrays are oriented so that only push and pop operations take place.  Sorting only occurs when a new item is added.  In the possibility that our stored data structures become very large and either the size of the data payload or cpu operations became an issue, switching to a database may improve performance.  This could allow us to only load exactly the data we needed for a given request and keep cpu operations to a minimum within the node application.
