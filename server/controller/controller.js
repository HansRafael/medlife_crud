var Userdb = require('../model/model');
var UserAuth = require('../model/user');
var bycrpt  = require('bcryptjs');
var jwt = require('jsonwebtoken');
const user = require('../model/user');

// create and save new user
exports.create = (req,res)=>{
    // validate request
    if(!req.body){
        res.status(400).send({ message : "Content can not be emtpy!"});
        return;
    }

    // new user
    const user = new Userdb({
        name : req.body.name,
        cpf : req.body.cpf,
        url: req.body.url,
        status : req.body.status
    })

    // save user in the database
    user
        .save(user)
        .then(data => {
            //res.send(data)
            res.redirect('/add-user');
        })
        .catch(err =>{
            res.status(500).send({
                message : err.message || "Some error occurred while creating a create operation"
            });
        });

}

// retrieve and return all users/ retrive and return a single user
exports.find = (req, res)=>{

    if(req.query.id){
        const id = req.query.id;

        Userdb.findById(id)
            .then(data =>{
                if(!data){
                    res.status(404).send({ message : "Not found doctor with id "+ id})
                }else{
                    res.send(data)
                }
            })
            .catch(err =>{
                res.status(500).send({ message: "Erro retrieving doctor with id " + id})
            })

    }else{
        Userdb.find()
            .then(user => {
                res.send(user)
            })
            .catch(err => {
                res.status(500).send({ message : err.message || "Error Occurred while retriving doctor information" })
            })
    }

    
}

exports.find_CPF = (req,res) =>{
    if(req.query.id){
        const id = req.query.id;
    
        Userdb.findOne({cpf:id})
            .then(data =>{
                if(!data){
                    res.status(404).send({ message : "Not found doctor with cpf "+ id})
                }else{
                    res.send(data)
                }
            })
            .catch(err =>{
                res.status(500).send({ message: "Erro retrieving doctor with cpf " + id})
            })

    }else{
        res.status(500).send({message : "erro: must CPF"})
    }
}

exports.find_video = (req,res) => {
    if(req.query.id && req.query.video){
        const id = req.query.id;
        const video = req.query.video;

        Userdb.findOne({cpf:id})
            .then(data =>{
                if(!data){
                    res.status(404).send({message: "Not found doctor with cpf" + id})
                } else {
                    res.send(data.url[video])
                }
            })
            .catch(err => {
                res.status(500).send({message: "error retrieving doctor with cpf "+ id})
            })
    }else{
        res.status(500).send({messega: "error: must cpf and video"})
    }
}

// Update a new idetified user by user id
exports.update = (req, res)=>{
    console.log(req.body)
    if(!req.body){
        return res
            .status(400)
            .send({ message : "Data to update can not be empty"})
    }

    const id = req.params.id;
    Userdb.findByIdAndUpdate(id, req.body)
        .then(data => {
            if(!data){
                res.status(404).send({ message : `Cannot Update usesr with ${id}. Maybe doctor not found!`})
            }else{
                res.send(data)
            }
        })
        .catch(err =>{
            res.status(500).send({ message : "Error Update doctor information"})
        })
}

// Delete a user with specified user id in the request
exports.delete = (req, res)=>{
    const id = req.params.id;

    Userdb.findByIdAndDelete(id)
        .then(data => {
            if(!data){
                res.status(404).send({ message : `Cannot Delete with id ${id}. Maybe id is wrong`})
            }else{
                res.send({
                    message : "User was deleted successfully!"
                })
            }
        })
        .catch(err =>{
            res.status(500).send({
                message: "Could not delete User with id=" + id
            });
        });
}

/* ------------------- USER AUTH ------------------------ */


exports.register_user = async (req,res) => {
    try {
        console.log(req.body)
        const { lastName, password} = req.body;
        const firstName = req.body.firstName;
        const email = req.body.email;
        if (!(email && password && firstName && lastName)) {
            res.status(400).send({message : "all input are rrequired!"});
        }

        const oldUser = await UserAuth.findOne({email});
        if(oldUser){
            return res.status(409).send({message: `User ${email} already exist. Please Login`});
        }

        encryptedUserPassword = await bycrpt.hash(password,10);

        const userAuth = await UserAuth.create({
            first_name: firstName,
            last_name: lastName,
            email: email.toLowerCase(),
            password: encryptedUserPassword,
        });

        const token = jwt.sign(
            {userAuth_id: userAuth._id,email},
            process.env.TOKEN_KEY,
            {
                expiresIn: "5h"
            }
        );

        userAuth.token = token;

        res.status(201).json(userAuth);

    } catch (error) {
        console.log(error)
    }
}

exports.login_user = async (req,res) =>{
    try {
        const {email, password} = req.body;

        if(!(email && password)){
            res.status(400).send({message: "All inputs are required"})
        }
        const userAuth = await UserAuth.findOne({email});
        
        var userPassword = userAuth.password.toString()
        
        if(userAuth && (await bycrpt.compare(password,userPassword))){
            const token = jwt.sign(
                {userAuth_id: userAuth._id, email},
                process.env.TOKEN_KEY,
                {
                    expiresIn: "5h",
                }
            );

            userAuth.token = token

            return res.status(200).json(userAuth.token);
        }
        return res.status(400).send({message: "Invalid Credentials"});

    } catch (error) {
        console.log(error)   
    }
}
