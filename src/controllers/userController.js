const userModel = require('../models/userModel')
const aws = require("../aws/aws.js")
const bcrypt = require("bcrypt")
const validator = require("../validator/validator.js")
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')



//======================================= < Create User > ===========================================

const createUser = async function (req, res) {
    try {
        let data = req.body
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: " No Data Provided" })
        }

        // Profile Image Creation :-
        let files = req.files
        if (!files || files.length == 0) {
            return res.status(400).send({ status: false, msg: "No file found" })
        }
        const uploadedFileURL = await aws.uploadFile(files[0])
        data.profileImage = uploadedFileURL

        let { fname, lname, email, phone, password, address } = data

        // fname Validation :-

        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, msg: "fname is required" })
        }

        if (!validator.isValidName.test(fname)) {
            return res.status(400).send({ status: false, msg: "Plz provide a valid First name" })
        }

        // lname Validation :-
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, msg: "lname is required" })
        }

        if (!validator.isValidName.test(lname)) {
            return res.status(400).send({ status: false, msg: "Plz provide a valid Last name" })
        }

        // Email Validation :-
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false.valueOf, msg: "Email is required" })
        }

        if (!validator.isValidEmail.test(email)) {
            return res.status(400).send({ status: false, msg: "Please provide a valid email" })
        }

        let uniqueEmail = await userModel.findOne({ email })
        if (uniqueEmail) {
            return res.status(400).send({ status: false, msg: "Email Already Exist" })
        }

        // Phone Number Validation :-
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, msg: "Phone Number Is Required" })
        }

        if (!validator.isValidPhone.test(phone)) {
            return res.status(400).send({ status: false, msg: "Please Provide a Valid Phone Number" })
        }

        let uniquePhone = await userModel.findOne({phone: phone })
        if (uniquePhone) {
            return res.status(400).send({ status: false, msg: "Phone Number Already Exist" })
        }

        // Password Validation :-
        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, msg: "Password is Required" })
        }

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, msg: "Password Should be minimum 8 characters and maximum 15 characters", });
        }

        // Password Encryption :-
        let protectedPassword = await bcrypt.hash(password, 10)
        data.password = protectedPassword

        // Address Validation :-
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, msg: "Address is Required" })
        }

        address = JSON.parse(address)

        // Shipping Address Validation :-
        if (!validator.isValid(address.shipping)) {
            return res.status(400).send({ status: false, msg: "Shipping Address is Required" })
        }

        if (!validator.isValid(address.shipping.street)) {
            return res.status(400).send({ status: false, msg: "Street of Shipping Address is Required" })
        }

        if (!validator.isValid(address.shipping.city)) {
            return res.status(400).send({ status: false, msg: "City of Shipping Address is Required" })
        }

        if (!validator.isValid(address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: "Pincode of Shipping Address is Required" })
        }

        if (!(/^[1-9][0-9]{5}$/.test(address.shipping.pincode))) {
            return res.status(400).send({ status: false, msg: "Enter Valid Pincode for Shipping Address" })
        }

        //Billing Address Validation :-
        if (!validator.isValid(address.billing)) {
            return res.status(400).send({ status: false, msg: "Billing Address is Required" })
        }

        if (!validator.isValid(address.billing.street)) {
            return res.status(400).send({ status: false, msg: "Street of Billing Address is Required" })
        }

        if (!validator.isValid(address.billing.city)) {
            return res.status(400).send({ status: false, msg: "City of Billing Address is Required" })
        }

        if (!validator.isValid(address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: "Pincode of Billing Address is Required" })
        }

        if (!(/^[1-9][0-9]{5}$/.test(address.billing.pincode))) {
            return res.status(400).send({ status: false, msg: "Enter Valid Pincode for Billing Address" })
        }


        data.address = address
        let savedData = await userModel.create(data)
        res.status(201).send({ status: true, msg: "User Successfully Created", data: savedData })


    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }

}

//=========================================< Login User >==========================================

const loginUser = async function (req, res) {
    try {
        const data = req.body;
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, msg: "Bad Request, No Data Provided" })
        }

        const { email, password } = data;

        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required." });
        }

        if (!validator.isValidEmail.test(email)) {
            return res.status(400).send({ status: false, msg: "Please provide a valid email" })
        }

        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: "Password is required." });
        }

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, msg: "Password Should be minimum 8 characters and maximum 15 characters", });
        }

        const matchUser = await userModel.findOne({ email })
        if (!matchUser) {
            return res.status(404).send({ status: false, message: " Email is Not Matched" });
        }

        let checkPassword = matchUser.password
        let checkUser = await bcrypt.compare(password, checkPassword)
        if (!checkUser) {
            return res.status(400).send({ status: false, message: "Password is Incorrect" });
        }

        const token = jwt.sign(
            {
                userId: matchUser._id.toString(),
                Project: "Products Management",
                iat: new Date().getTime() / 1000   //(iat)Issued At- the time at which the JWT was issued.   
            },
            "Project-05_group-13",
            {
                expiresIn: "36000sec",
            });

        res.setHeader("Authorization", token)
        return res.status(200).send({ status: true, message: "User Logged in successfully", data: { userId: matchUser._id, token: token } });
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};


//========================================= < Get User Profile > =============================================
const getUser = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, msg: "userId is required to get User data" })
        }

        if (req.userId != userId) {
            return res.status(401).send({ status: false, message: "You're not Authorized" });
        }

        if (!mongoose.isValidObjectId(userId))
            return res.status(400).send({ status: false, msg: "Please enter a valid userId" })

        let findUser = await userModel.findById(userId)
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        return res.status(200).send({ status: true, message: "User profile details found", data: findUser })

    }
    catch (err) {
        res.status(500).send({ status: false, msg: "err.message" })
    }
}


//================================== < Update User Profile > ============================================
const updateUserDetails = async function (req, res) {

    let data = req.body;

    const userIdFromParams = req.params.userId
    const userIdFromToken = req.userId

    let { fname, lname, email, phone, password, address } = data

    const updatedData = {}

    if (!mongoose.isValidObjectId(userIdFromParams)) {
        return res.status(400).send({ status: false, message: "Valid userId is required" })
    }

    const userByuserId = await userModel.findById(userIdFromParams);

    if (!userByuserId) {
        return res.status(404).send({ status: false, message: 'user not found.' });
    }

    if (userIdFromToken != userIdFromParams) {
        return res.status(403).send({ status: false, message: "Unauthorized access." });
    }

    if (Object.keys(data) == 0) {
        return res.status(400).send({ status: false, msg: "please provide data to update" })
    }



    //=======================================fname validation=====================================


    if (fname) {
        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, Message: "First name is required" })
        }

        if (!validator.isValidName.test(fname)) {
            return res.status(400).send({ status: false, msg: "Plz provide a valid First name" })
        }

    }
    updatedData.fname = fname


    //===================================lname validation==========================================


    if (lname) {
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, Message: "Last name is required" })
        }

        if (!validator.isValidName.test(lname)) {
            return res.status(400).send({ status: false, msg: "Plz provide a valid Last name" })
        }
    }
    updatedData.lname = lname

    //================================email validation==============================================


    if (email) {

        if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email.trim())) return res.status(400).send({ status: false, msg: "Please provide a valid email" });

        const isEmailUsed = await userModel.findOne({ email: email })
        if (isEmailUsed) {
            return res.status(400).send({ status: false, msg: "email must be unique" })
        }
    }
    updatedData.email = email


    //=======================profile pic upload and validation==========================

    let saltRounds = 10
    const files = req.files

    if (files && files.length > 0) {

        const profilePic = await aws.uploadFile(files[0])

        updatedData.profileImage = profilePic

    }

    //===============================phone validation-========================================

    if (phone) {

        if (!(/^([+]\d{2})?\d{10}$/.test(phone))) return res.status(400).send({ status: false, msg: "please provide a valid phone number" })

        const isPhoneUsed = await userModel.findOne({ phone: phone })
        if (isPhoneUsed) {
            return res.status(400).send({ status: false, msg: "phone number must be unique" })
        }
        updatedData.phone = phone
    }

    //======================================password validation-====================================


    if (password) {
        if (!validator.isValid(password)) { return res.status(400).send({ status: false, message: "password is required" }) }
        //if (!(/^(?=.?[A-Z])(?=.?[a-z])(?=.?[0-9])(?=.?[#?!@$%^&*-]).{8,15}$/.test(data.password.trim()))) { return res.status(400).send({ status: false, msg: "please provide a valid password with one uppercase letter ,one lowercase, one character and one number " }) }

        const encryptPassword = await bcrypt.hash(password, saltRounds)

        updatedData.password = encryptPassword
    }


    //========================================address validation=================================




    if (address) {

        address = JSON.parse(address)

        if (address.shipping) {

            if (!validator.isValid(address.shipping.street)) {
                return res.status(400).send({ status: false, Message: "street name is required" })
            }
            updatedData["address.shipping.street"] = address.shipping.street


            if (!validator.isValid(address.shipping.city)) {
                return res.status(400).send({ status: false, Message: "city name is required" })
            }

            updatedData["address.shipping.city"] = address.shipping.city

            if (!validator.isValid(address.shipping.pincode)) {
                return res.status(400).send({ status: false, Message: "pincode is required" })
            }

            updatedData["address.shipping.pincode"] = address.shipping.pincode

        }

        if (address.billing) {
            if (!validator.isValid(address.billing.street)) {
                return res.status(400).send({ status: false, Message: "Please provide street name in billing address" })
            }
            updatedData["address.billing.street"] = address.billing.street

            if (!validator.isValid(address.billing.city)) {
                return res.status(400).send({ status: false, Message: "Please provide city name in billing address" })
            }
            updatedData["address.billing.city"] = address.billing.city

            if (!validator.isValid(address.billing.pincode)) {
                return res.status(400).send({ status: false, Message: "Please provide pincode in billing address" })
            }
            updatedData["address.billing.pincode"] = address.billing.pincode
        }
    }

    //=========================================update data=============================

    //data.address =address ;

    let updatedUser = await userModel.findOneAndUpdate({ _id: userIdFromParams }, updatedData, { new: true })

    return res.status(200).send({ status: true, message: "User profile updated", data: updatedUser });

}





module.exports = { createUser, loginUser, getUser, updateUserDetails }