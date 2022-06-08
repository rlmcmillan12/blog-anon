const http = require('http')
const express = require('express')
const es6Renderer = require('express-es6-template-engine')
const pgPromise = require('pg-promise')()
const bodyParser = require('body-parser')
const text = require('body-parser/lib/types/text')
const { isTypedArray } = require('util/types')

const hostname = 'localhost'
const port = 3001
const config = {
    host: 'localhost',
    port: 5432,
    database: 'bloganon',
    user: 'postgres',
}

const app = express()
const server = http.createServer(app)
const db = pgPromise(config)

app.engine('html', es6Renderer)
app.set('views', 'templates')
app.set('view engine', 'html')
const partials = {
    head: 'partials/head',
    foot: 'partials/foot',
    form: 'partials/form'
}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//post routes

app.get('/', (req, res) => {
    res.render('index', {
        partials,
        locals: {
            title: 'BlogAnon'
        }
    })
});

app.get('/blogs', (req, res) => {
    db.query('SELECT * FROM posts;')
        .then((posts) => {
            res.render('blog-list', {
                partials,
                locals: {
                    title: 'BlogAnon Post List',
                    posts
                }
            })
        })
});

app.get('/blogs/new', (req, res) => {
    res.render('blog-new', {
        partials,
        locals: {
            title: 'Add BlogAnon Post'
        }
    })
});
app.post('/blogs/new', (req, res) => {
    const title = req.body.title
    const post = req.body.post
    if (!title) {
        db.query('INSERT INTO posts (post) VALUES ($1);', [post])
            .then(() => {
                res.render('blog-confirm', {
                    partials,
                    locals: {
                        title: 'Congrats. Add another BlogAnon post'
                    }
                })
            })
            .catch((e) => {
                console.log(e)
                res.send('nope!')
            })
        return
    }
    if (title) {
        db.query('INSERT INTO posts (title, post) VALUES ($1, $2);', [title, post])
            .then(() => {
                res.render('blog-confirm', {
                    partials,
                    locals: {
                        title: 'Congrats. Add another BlogAnon post'
                    }
                })
            })
            .catch((e) => {
                console.log(e)
                res.send('nope!')
            })
    }
});

app.get('/blogs/:id', (req, res) => {
    const id = req.params.id
    db.oneOrNone('SELECT * FROM posts WHERE id = $1;', [id])
        .then((post) => {
            if (!post) {
                res.status(404).json({ error: 'post not found' })
            }
            res.render('blog-single', {
                partials,
                locals: {
                    title: post.title,
                    p: post
                }
            })
        })
        .catch((e) => {
            console.log(e)
            res.status(400).json({ error: 'invalid id' })
        })
});

// db.query('INSERT INTO posts (title, text ) VALUES ($1, $2)', [title],[post] )
app.get('*', (req, res) => {
    res.status(404).send('404 Not Found')
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`)
})