require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const port = process.env.PORT || 4001
const mongo_url = process.env.MONGO_URL
const jwt_secret = process.env.JWT_SECRET
const mongoose = require('mongoose');
const User = require('./models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const download = require('image-downloader');
const multer = require('multer');
const fs = require('fs')

const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json())
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'))
mongoose.connect(mongo_url)

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

app.get('/test', (req, res) => {
    res.json('res ok')
})

app.get('/profile', (req, res) => {
    const { token } = req.cookies
    if (token) {
        // jwt.verify(token, )
    } else {
        res.json(null)
    }
})
app.post('/register', async (req, res) => {
    try {
        if (!req.body.name || !req.body.password || !req.body.email) {
            return res.status(200).json({
                EC: -2,
                EM: 'Please enter all required information',
                DT: {}
            })
        }
        const { name, email, password } = req.body
        const existedEmail = await User.findOne({
            email: email
        })
        if (existedEmail) {
            return res.status(200).json({
                EC: -1,
                EM: 'This email is already registered by another user',
                DT: {}
            })
        } else {
            const newUser = await User.create({
                name,
                email,
                password: bcrypt.hashSync(password, bcryptSalt)
            })
            return res.status(200).json({
                EC: 0,
                EM: 'ok',
                DT: newUser
            })
        }
    } catch (e) {
        console.log(e)
        return res.status(200).json({
            EC: 1,
            EM: 'error controller',
            DT: {}
        })
    }

})

app.post('/login', async (req, res) => {
    try {
        if (!req.body.password || !req.body.email) {
            return res.status(200).json({
                EC: -2,
                EM: 'Please enter all required information',
                DT: {}
            })
        }
        const { email, password } = req.body
        const existedUser = await User.findOne({
            email: email
        })
        if (existedUser) {
            const checkPassword = await bcrypt.compareSync(password, existedUser.password)

            // login succcess
            if (checkPassword === true) {
                jwt.sign({ email: existedUser.email, id: existedUser._id }, jwt_secret, {}, (error, token) => {
                    if (error) throw error
                    res.cookie('token', token, {
                        expires: new Date(Date.now() + 9999999),
                        httpOnly: false,
                        secure: true, sameSite: 'None'
                    }).json({
                        EC: 0,
                        EM: 'ok',
                        DT: {
                            userData: existedUser,
                        }
                    });
                })

            }
            // login failed
            else {
                return res.status(200).json({
                    EC: -1,
                    EM: 'Wrong password',
                    DT: {}
                })
            }
        } else {
            return res.status(200).json({
                EC: -3,
                EM: 'This user does not exist',
                DT: {}
            })
        }
    } catch (e) {
        console.log(e)
        return res.status(200).json({
            EC: 1,
            EM: 'error controller',
            DT: {}
        })
    }

})

app.post('/logout', async (req, res) => {
    try {
        res.cookie('token', '').json({
            EC: 0,
            EM: 'Logout successfully',
            DT: {}
        })
    }
    catch (e) {
        console.log(e)
        return res.status(200).json({
            EC: 1,
            EM: 'error controller',
            DT: {}
        })
    }

})

app.post('/upload-by-link', async (req, res) => {
    try {
        if (!req.body.link) {
            return res.status(200).json({
                EC: -2,
                EM: "Please enter a valid URL",
                DT: ''
            })
        }
        const { link } = req.body
        console.log(__dirname + '/upload')
        const newImgName = 'photo' + Date.now() + '.jpg'
        const options = {
            url: link,
            dest: __dirname + '/uploads/' + newImgName
        }
        let newPhoto = await download.image(options)
        return res.status(200).json({
            EC: 0,
            EM: 'ok',
            DT: newImgName
        })
    }
    catch (e) {
        console.log(e)
        return res.status(200).json({
            EC: 1,
            EM: 'error controller',
            DT: {}
        })
    }
})


const photoMiddleware = multer({ dest: 'uploads/' })
app.post('/upload', photoMiddleware.array('photos', 100), async (req, res) => {
    try {
        const uploadFiles = []
        for (let i = 0; i < req.files.length; i++) {
            let { path, originalname } = req.files[i]
            const parts = originalname.split('.')
            const ext = parts[parts.length - 1]
            const newPath = `${path}.${ext}`
            fs.renameSync(path, newPath)
            uploadFiles.push(newPath.slice('uploads/'.length))
            console.log('new upload files: ', newPath.slice('uploads/'.length))
        }
        return res.status(200).json({
            EC: 0,
            EM: 'upload ook',
            DT: uploadFiles
        })
    }
    catch (e) {
        console.log(e)
        return res.status(200).json({
            EC: 1,
            EM: 'error controller',
            DT: {}
        })
    }
})


app.listen(port, () => {
    console.log('ok listening on port', port)
})