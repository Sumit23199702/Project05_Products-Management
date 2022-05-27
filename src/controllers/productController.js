const productModel = require('../models/productModel')
const aws = require('../aws/aws')
const validator = require('../validator/validator')
const mongoose = require('mongoose')

//======================================== < Create Product > ========================================
const createProduct = async function (req, res) {
    try {
        let data = req.body
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, mgs: 'Bad Request, No Data Provided' })
        }

        // Creating Product Image :-
        let files = req.files

        if (!files || files.length == 0) {
            return res.status(400).send({ status: false, msg: 'No filse found' })
        }
        const uploadedFileURL = await aws.uploadFile(files[0])
        data.productImage = uploadedFileURL

        let { title, description, price, currencyId, currencyFormat, productImage, availableSizes } = data

        // Validation for title :-
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, mgs: 'Plz,Provide Title' })
        }

        let titleExisted = await productModel.findOne({ title })
        if (titleExisted) {
            return res.status(400).send({ status: false, msg: "Title already exists" })
        }

        // Validation for Description :-
        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, mgs: 'Plz,Provide Description' })
        }

        // Validation for Price :-
        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, mgs: 'Plz,Provide Price ' })
        }

        if (!(/^\d{0,8}(\.\d{1,2})?$/.test(price))) {
            return res.status(400).send({ status: false, msg: "Plz, enter valid format of price" })
        }
        // Validation for CurrencyId :-
        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, mgs: 'Plz,Provide currencyId ' })
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, mgs: 'CurrencyId Should be in INR ' })
        }

        // Validation for CurrencyFormat :-
        if (!validator.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, mgs: 'Plz,Provide currencyFormat ' })
        }

        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, mgs: 'CurrencyFormat Should be in ₹ ' })
        }

        // Validation for Product Image :-
        if (!validator.isValid(productImage)) {
            return res.status(400).send({ status: false, mgs: 'Plz,Provide Product Image ' })
        }


        // Validation For Available Sizes :-
        if (!validator.isValid(availableSizes)) {
            return res.status(400).send({ status: false, mgs: 'Plz,Provide availableSizes ' })
        }

        if (availableSizes !== 'S' &&
            availableSizes !== 'XS' &&
            availableSizes !== 'M' &&
            availableSizes !== 'X' &&
            availableSizes !== 'L' &&
            availableSizes !== 'XXL' &&
            availableSizes !== 'XL') {
            return res.status(400).send({ status: false, msg: 'Provide Size among S,XS,M,X,L,XXL and XL' })
        }

        let savedPoduct = await productModel.create(data);
        res.status(201).send({ status: true, msg: 'Product Created Successfully', data: savedPoduct })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

//====================================== < Get Product > ==========================================

const getProducts = async function (req, res) {
    try {
        let data = req.query
        //console.log(data.availableSizes)
        //Fetching all products
        if (Object.keys(data).length == 0) {
            let allProdtucts = await productModel.find({ isDeleted: false }).select({ __v: 0 })
            if (allProdtucts) {
                return res.status(200).send({ status: true, message: 'Success', data: allProdtucts })
            }
        }
        //Fetchin products using filters
        if (data.availableSizes || data.title || data.price) {

            let filteredProduct = await productModel.find({ $and: [data, { isDeleted: false }] })
            if (filteredProduct.length == 0) {
                return res.status(400).send({ status: false, message: 'No products found' })
            }
            res.status(200).send({ status: false, message: 'Success', data: filteredProduct })
        }



    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}


//======================================== < Get Product By Params > =================================

const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!mongoose.isValidObjectId(productId))
            res.status(400).send({ status: false, msg: "Please enter a valid ProductId" })

        let foundProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!foundProduct) {
            return res.status(400).send({ status: false, msg: 'No product found' })
        }
        return res.status(200).send({ status: true, msg: 'Sucess', data: foundProduct })

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

//========================================== < Update Product >=======================================

const updateProduct = async function (req, res) {
    try {

        let productId = req.params.productId;
        let bodyData = req.body;

        if (!mongoose.isValidObjectId(productId))
            res.status(400).send({ status: false, msg: "Please enter a valid ProductId" })


        if (!validator.isValid(productId)) {
            return res.status(400).send({ status: false, msg: "userId is required for update data" })
        }


        if (Object.keys(bodyData) == 0) {
            return res.status(400).send({ status: false, msg: "Bad Request, No Data Provided" })
        }


        const { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = bodyData;

        let updateUser = {};

        if (title == 0) {
            return res.status(400).send({ status: false, msg: "title should not be empty" })
        }
        updateUser["title"] = title;

        let titleExisted = await productModel.findOne({ title })
        if (titleExisted) {
            return res.status(400).send({ status: false, msg: "Title is already exist" })
        }


        if (description == 0) {
            return res.status(400).send({ status: false, msg: "description should not be empty" })
        }
        updateUser["description"] = description;


        if (price == 0) {
            return res.status(400).send({ status: false, msg: "price should not be empty" })
        }
        updateUser["price"] = price;


        if (currencyId == 0) {
            return res.status(400).send({ status: false, msg: "currencyId should not be empty" })
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, mgs: 'CurrencyId Should be in INR ' })
        }
        updateUser["currencyId"] = currencyId;


        if (currencyFormat == 0) {
            return res.status(400).send({ status: false, msg: "currencyFormat should not be empty" })
        }

        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, mgs: 'CurrencyFormat Should be in ₹ ' })
        }
        updateUser["currencyFormat"] = currencyFormat;


        if (isFreeShipping == 0) {
            return res.status(400).send({ status: false, msg: "isFreeShipping should not be empty" })
        }
        updateUser["isFreeShipping"] = isFreeShipping;

        if (style == 0) {
            return res.status(400).send({ status: false, msg: "style should not be empty" })
        }
        updateUser["style"] = style;

        if (availableSizes == 0) {
            return res.status(400).send({ status: false, msg: "availableSizes should not be empty" })
        }
        updateUser["availableSizes"] = availableSizes;

        if (installments == 0) {
            return res.status(400).send({ status: false, msg: "installments should not be empty" })
        }
        updateUser["installments"] = installments;

        if (productImage) {
            if (files && files.length > 0) {
                productImage = await uploadFile(files[0]);
            }
            updateUser["productImage"] = productImage;
        }



        let updateData = await productModel.findByIdAndUpdate(productId, updateUser, { new: true });

        res.status(200).send({ status: true, msg: "Product Updated Successfully", data: updateData })

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, msg: "err.message" })
    }
}


//==================================== < Delete Product >======================================

const deleteproduct = async function (req, res) {

    try {
        let productId = req.params.productId;

        // Check valid for ProductId
        if (!mongoose.isValidObjectId(productId))
            res.status(400).send({ status: false, msg: "Please enter a valid productId" })

        // Find product in DB by productId
        let deletedProduct = await productModel.findById({ _id: productId })

        if (!deletedProduct) {
            return res.status(404).send({ status: false, msg: "Product Not found" })
        }

        if (deletedProduct.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "Product is already deleted" })
        }
        else {
            const deleteProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })
            return res.status(200).send({ status: true, message: "Product Deleted Successfully", data: deleteProduct })
        }

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteproduct }



