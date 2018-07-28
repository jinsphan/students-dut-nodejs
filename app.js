const express = require('express');
const cookiesParser = require('cookie-parser');
const bodyParser    = require('body-parser');

const cors = require('cors');
const app = express();

const { getStudentsByClassName } = require("./utils");

app.use(cors());
app.use(cookiesParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/start', (req, res) => {
    res.json({
        message: 'Welcome Nodejs With Mongoose'
    });
})

app.get('/students/:class', (req, res) => {
    getStudentsByClassName(req.params.class)
    .then(students => {
        res.json({
            data: students.reduce((cur, next) => {
                if (next[0] == undefined) return cur;
                return {
                    ...cur,
                    [next[0].class]: next
                }
            }, {})
        });
    })
    .catch(er => {
        res.status(400).json(er);
    })
})

app.use((req, res) => {
    res.status(404).json({ error: "Link does not exist" });
})

app.use((err, req, res, next) => {
    res.status(400).json({
        error: err.message
    });
})

module.exports = app;
