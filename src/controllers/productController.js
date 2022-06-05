const productModel = require('../models/productModel')
const aws = require('../aws/aws');
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

        let { title, description, price, currencyId, currencyFormat, productImage, availableSizes, style, installments } = data

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
        if(data.installments){
            if(!(!isNaN(Number(installments)))){
                return res.status(400).send({ status: false, msg: "Plz, enter valid format of installmentsit should be a number" })
            }
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
        //Selection of size

        //data.availableSizes=JSON.parse(availableSizes)
        //console.log(data.availableSizes)
        //     let Sizes = ["S", "XS", "M","L", "X","XL", "XXL" ]
        // for (let i = 0; i < availableSizes.length; i++) {
        //   if (!Sizes.includes(availableSizes[i])) {
        //     return res.status(400).send({status: false,message: " size must among S, XS,M,X, L,XXL and XL"})
        //   }
        //  }
        let sizeArray = availableSizes.split(",").map(x => x.trim())
        for (let i = 0; i < sizeArray.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeArray[i]))) {
                return res.status(400).send({ status: false, message: `Available Sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
            }
        }

        let productData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            productImage: data.productImage,
            style,
            availableSizes: sizeArray,
            installments


        }

        let savedPoduct = await productModel.create(productData);
        res.status(201).send({ status: true, message: 'Success', data: savedPoduct })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

//====================================== < Get Product > ==========================================

const getProducts = async function (req, res) {
    try {
        let data = req.query
        let priceGreaterThan = req.query.priceGreaterThan
        let priceLessThan = req.query.priceLessThan
        let priceSort = req.query.priceSort
        let name = req.query.name
        let availableSizes = req.query.size;
        let title = name
        //console.log(availableSizes)
        //Fetching all products
        if (Object.keys(data).length == 0) {
            let allProdtucts = await productModel.find({ isDeleted: false })
            if (allProdtucts) {
                return res.status(200).send({ status: true, message: 'Success', data: allProdtucts })
            }
        }
        //Fetching products using filters,
        if (title) {
            let filteredProducts = await productModel.find({ isDeleted: false, title: title })
            if (filteredProducts.length === 0) {
                return res.status(404).send({ status: false, message: 'No Products Found' })
            }
            return res.status(200).send({ status: true, message: 'Success', data: filteredProducts })
        }
        if (availableSizes) {
            filteredProducts = await productModel.find({ isDeleted: false, availableSizes: availableSizes })
            return res.status(200).send({ status: false, message: 'Success', data: filteredProducts })
        }
        if (priceSort) {
            if (!priceSort == 1 || !priceSort == -1) {
                return res.status(400).send({ status: false, message: 'Plz, Provide priceSort as 1 or -1' })
            }
               let sortedProducts = await productModel.find({ isDeleted: false }).sort({ price: priceSort })
                return res.status(200).send({ status: true, message: 'Success', data: sortedProducts })
        
        }

        // price range handling
        if (priceGreaterThan && priceLessThan) {
            if (priceGreaterThan === priceLessThan) {
                return res.status(400).send({ status: false, message: 'Plz, Provide valid price range' })
            }

            let productFound = await productModel.find({
                $and: [{ isDeleted: false }, { price: { $gt: priceGreaterThan } },
                { price: { $lt: priceLessThan } }]
            }).sort({ price: priceSort })
            if (productFound.length === 0) {
                return res.status(400).send({ status: false, message: "No products found" })

            }
            return res.status(200).send({ status: true, message: "Success", data: productFound })

        }

        if (priceGreaterThan) {
            let productFound = await productModel.find({ $and: [{ isDeleted: false }, { price: { $gt: priceGreaterThan } }] }).sort({ price: priceSort })
            console.log(productFound)
            if (productFound.length === 0) {
                return res.status(400).send({ status: false, message: "No available products" })
            }
            return res.status(200).send({ status: true, message: "Success", data: productFound })


        }
        else if (priceLessThan) {
            let productFound = await productModel.find({ $and: [{ isDeleted: false }, { price: { $lt: priceLessThan } }] }).sort({ price: priceSort })
            if (productFound.length === 0) {
                return res.status(400).send({ status: false, message: 'No available products' })
            }
            return res.status(200).send({ status: true, message: "Success", data: productFound })

        }
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}


//======================================== < Get Product By Params > =================================

const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!mongoose.isValidObjectId(productId))
            return res.status(400).send({ status: false, msg: "Please enter a valid ProductId" })

        let foundProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!foundProduct) {
            return res.status(404).send({ status: false, msg: 'No product found' })
        }
        return res.status(200).send({ status: true, message: 'Success', data: foundProduct })

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
            return res.status(400).send({ status: false, msg: "Please enter a valid ProductId" })


        if (!validator.isValid(productId)) {
            return res.status(400).send({ status: false, msg: "ProductId is required for update data" })
        }


        if (Object.keys(bodyData) == 0) {
            return res.status(400).send({ status: false, msg: "Bad Request, No Data Provided" })
        }
// check for deleted product
        let productDeleted = await productModel.findOne({ _id: productId, isDeleted: true })
        if (productDeleted) {
            return res.status(400).send({ status: false, message: "Product is already deleted" })
        }
        
        const { title, description, price, isFreeShipping, productImage, style, availableSizes, installments } = bodyData;

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


        let files = req.files
        if (files && files.length > 0) {
            let productImage = await aws.uploadFile(files[0]);
            bodyData.productImage = productImage;
            let uploadImage = await productModel.findOneAndUpdate({ _id: productId }, bodyData, { new: true })
            res.status(200).send({ status: true, msg: "Product Updated Successfully", data: uploadImage })
        }
        else {
            let uploadImage = await productModel.findOneAndUpdate({ _id: productId }, bodyData, { new: true })
            res.status(200).send({ status: true, message: "Product Updated Successfully", data: uploadImage })
        }
        updateUser["productImage"] = productImage;


        // if (productImage == 0) {
        //     return res.status(400).send({ status: false, msg: "productImage should not be empty" })
        // }
        // updateUser["productImage"] = productImage;

        // let updateData = await productModel.findByIdAndUpdate(productId, updateUser, { new: true });
        // return res.status(200).send({ status: true, msg: "Product Updated Successfully", data: updateData })

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, msg:error.message })
    }
}


//==================================== < Delete Product >======================================

const deleteproduct = async function (req, res) {

    try {
        let productId = req.params.productId;

        if (!mongoose.isValidObjectId(productId))
            return res.status(400).send({ status: false, msg: "Please enter a valid productId" })


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
//=====================================================EXPORTING======================================================================

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteproduct }



