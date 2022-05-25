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
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, msg: "Bad Request, No Data Provided" })
        }

        let { fname, lname, email, phone, password, address } = data

        // Profile Image Creation :-
        let files = req.files
        if (!files || files.length == 0) {
            return res.status(400).send({ status: false, msg: "No file found" })
        }
        const uploadedFileURL = await aws.uploadFile(files[0])
        data.profileImage = uploadedFileURL

        // fname Validation :-
        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, msg: "fname is required" })
        }

        // lname Validation :-
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, msg: "lname is required" })
        }

        // Email Validation :-
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false.valueOf, msg: "Email is required" })
        }

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
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

        if (!(/^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/.test(phone))) {
            return res.status(400).send({ status: false, msg: "Please Provide a Valid Phone Number" })
        }

        let uniquePhone = await userModel.findOne({ phone })
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

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim()))) {
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
        if (checkUser == false) {
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
                expiresIn: "3600sec",
            });

        res.setHeader("Authorization", "Bearer")
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

        if (!mongoose.isValidObjectId(userId))
            res.status(400).send({ status: false, msg: "Please enter a valid userId" })

        let findUser = await userModel.findById(userId)
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        res.status(200).send({ status: true, msg: "User profile details", data: findUser })

    }
    catch (err) {
        res.status(500).send({ status: false, msg: "err.message" })
    }
}


//================================== < Update User Profile > ============================================
const updateUser = async function (req, res) {
    try {

        let userId =req.params.userId
        // let userIdFromParams = req.params.userId
         //let userIdFromToken = req.userId


        // if(userId !=userIdFromToken){
        //     return res.status(403).send({status:false, message:"You are not Authorized"})
        // }

        // if (!validator.isValid(userIdFromParams)) {
        //     return res.status(400).send({ status: false, msg: "userId is required to get User data" })
        // }

        // if (!mongoose.isValidObjectId({_id :userId}))
        //     res.status(400).send({ status: false, msg: "Please enter a valid userId" })

        let findUser = await userModel.findById({_id:userId})
        if (!findUser) {
            return res.status(404).send({ status: false, message: "User not found" })
        }

        // // let data = req.body
        if (Object.keys(req.body) == 0) {
            return res.status(400).send({ status: false, msg: "Bad Request, No Data Provided" })
        }

         let { fname, lname, email, password, phone, address } = req.body

        //let files = req.body.files
        // if (!files || files.length == 0) {
        //     return res.status(400).send({ status: false, msg: "No file found" })
        // }
        //  const uploadedFileURL = await aws.uploadFile(files[0])
        // data.profileImage = uploadedFileURL

        // // Validation For First and Last Name :-
        if (fname == 0) {
            return res.status(400).send({ status: false, msg: "first name should not be empty" })
        }

        if (lname == 0) {
            return res.status(400).send({ status: false, msg: "last name should not be empty" })
        }

        // // Email Validation :-
        if(email == 0) {
            return res.status(400).send({ status: false, msg: "Email should not be empty" })
        }

        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.trim()))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid email" })
        }

        let uniqueEmail = await userModel.findOne({ email })
        if (uniqueEmail) {
            return res.status(400).send({ status: false, msg: "Email Already Exist" })
        }

        // // Password Validation :-
        if (password == 0) {
            return res.status(400).send({ status: false, msg: "Password should not be empty" })
        }

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, msg: "Password Should be minimum 8 characters and maximum 15 characters", });
        }

        let protectedPassword = await bcrypt.hash(password, 10)
         data.password = protectedPassword

        // // Phone Number Validation :-
        // if (phone == 0) {
        //     return res.status(400).send({ status: false, msg: "Phone Number should not be empty" })
        // }

        // // if (!(/^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/.test(phone))) {
        //     return res.status(400).send({ status: false, msg: "Please Provide a Valid Phone Number" })
        // }

        // let uniquePhone = await userModel.findOne({ phone })
        // if (uniquePhone) {
        //     return res.status(400).send({ status: false, msg: "Phone Number Already Exist" })
        // }

        // // Address Validation :-
        // if (address == 0) {
        //     return res.status(400).send({ status: false, msg: "Address should not be empty" })
        // }
        // address = JSON.parse(address)

        // // Shipping address Validation :-
        // if (address.shipping == 0) {
        //     return res.status(400).send({ status: false, msg: "Shipping Address should not be empty" })
        // }

        // if (address.shipping.street == 0) {
        //     return res.status(400).send({ status: false, msg: "Street of Shipping Address should not be empty" })
        // }

        // if (address.shipping.city == 0) {
        //     return res.status(400).send({ status: false, msg: "City of Shipping Address should not be empty" })
        // }

        // if (address.shipping.pincode == 0) {
        //     return res.status(400).send({ status: false, msg: "Pincode of Shipping Address should not be empty" })
        // }

        // if (!(/^[1-9][0-9]{5}$/.test(address.shipping.pincode))) {
        //     return res.status(400).send({ status: false, msg: "Enter Valid Pincode for Shipping Address" })
        // }

        // // Billing Address Validatiom :-
        // if (address.billing == 0) {
        //     return res.status(400).send({ status: false, msg: "Billing Address should not be empty" })
        // }

        // if (address.billing.street == 0) {
        //     return res.status(400).send({ status: false, msg: "Street of Billing Address should not be empty" })
        // }

        // if (address.billing.city == 0) {
        //     return res.status(400).send({ status: false, msg: "City of Billing Address should not be empty" })
        // }

        // if (address.billing.pincode == 0) {
        //     return res.status(400).send({ status: false, msg: "Pincode of Billing Address should not be empty" })
        // }

        // if (!(/^[1-9][0-9]{5}$/.test(address.billing.pincode))) {
        //     return res.status(400).send({ status: false, msg: "Enter Valid Pincode for Billing Address" })
        // }

        let updateUserProfile = await userModel.findByIdAndUpdate({ _id :userId }, {
         
                fname:req.body.fname,
                lname: req.body.lname,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password,
                profileImage: req.body.profileImage,
                "address.shipping.street": req.body.shippingStreet,
                "address.shipping.city": req.body.shippingCity,
                "address.shipping.pincode":req.body.shippingPincode,
                "address.billing.street": req.body.billingStreet,
                "address.billing.city": req.body.billingCity,
                "address.billing.pincode": req.body.billingPincode
            },
     { new: true })

        return res.status(200).send({ status: true, msg: "User Profile Updated Successfully", updateUserProfile: updateUserProfile })

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, msg: "err.message" })
    }
}



module.exports = { createUser, loginUser, getUser, updateUser }