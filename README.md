<h1 align="center">shotlix</h1>
<p align="center">Make good use of bullets, make your way, collect numbers and get high scores!</p>


<img src="https://github.com/kik-lab/shotlix/blob/master/public/assets/images/card.png?raw=true" width="100%" />

---

## How to run

### clone

```:sh
$ git clone git@github.com:shotlix/shotlix.git
$ cd shotlix
```

### local

#### install package

```:sh
$ yarn install
```

#### listen server (PORT: 8000)
```:sh
$ yarn start
```

#### developing mode (open server, compile sass, and add prefix)
```:sh
$ yarn test
```

#### compile sass

```:sh
$ yarn scss
```

#### add prefix
```:sh
$ yarn prefix
```

#### open hotreload develop server

```:sh
$ yarn hot-dev-server
```

### docker

#### build

```:docker
$ docker build -t shotlix .
```

#### run

```:docker
$ docker run -p 8000:8000 -it shotlix
```

