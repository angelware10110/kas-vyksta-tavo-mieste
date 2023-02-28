const User = require('../models/UserModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')

// @desc Register a new user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400)
        throw new Error('Please fill in all fields')
    }

    // check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400)
        throw new Error('User already exists')
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "simple",
    });

   if(user){
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        })
    }else{
        res.status(400)
        throw new Error('Invalid user data')
    }
})

// @desc Login user
// @route POST /api/users/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        })
    }else {
        res.status(401)
        throw new Error('Invalid email or password')
    }
})

// @desc Get user data
// @route GET /api/users/user
// @access Private
const getUser = asyncHandler(async (req, res) => {
    res.status(200).json(req.user)
})

// @desc get all users data
// @route GET /api/users/list
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.aggregate([
        {
            $lookup:{
                from: "events",
                localField: "_id",
                foreignField: "user",
                as: "events",
            },
        },
        {
            $match: { role: { $in: ["simple", "admin"] } }
        },
        {
            $unset: [
                "password",
                "createdAt",
                "updatedAt",
                "events.createdAt",
                "events.updatedAt",
                "events.__v",
                "__v"
            ],
        },
    ]);

    res.status(200).json(users)
});

// generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env/* irasyti jwt secret key*/, {
        expiresIn: '30d',
    });
};

module.exports = {
    registerUser,
    loginUser,
    getUser,
    getAllUsers,
};