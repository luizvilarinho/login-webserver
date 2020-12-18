const express = require('express');
const app = express();

require("dotenv").config();
const jwt = require("jsonwebtoken");
const mysql = require("mysql");

const cookieParser = require("cookie-parser");

const pool = mysql.createPool({
    host     : 'sql399.main-hosting.eu',
    user     : 'u575119774_vilarinho',
    password : 'Batata.33',
    database : 'u575119774_economia',
    connectionLimit: 10
  });

const cors = require("cors");

var db = mysql.createConnection({
    host     : 'sql399.main-hosting.eu',
    user     : 'u575119774_vilarinho',
    password : 'Batata.33',
    database : 'u575119774_economia',
    connectTimeout:2000
  });

var bodyParser = require("body-parser");

//db.connect();
//db.end();

 
//db.end();
app.use(cookieParser())
app.use(cors());
app.use(express.json())

function auth(req, res, next){
    const token = req.header('x-auth-token');
    if(!token) res.status(401).send('access denied. No token provided.');

    try{
        const decoded = jwt.verify(token, "mysecret");
        req.user_id = decoded;
        next();
    }
    catch(ex){
        res.status(400).send("Invalid token");
    }
}
app.post("/user/login", (request, response) =>{
    const { email, password } = request.body;
    console.log(email, password);
    var objRespopnse = {};

    let findUserQuery = `SELECT * FROM users WHERE email = '${email}'`;
    
    pool.getConnection((err, connection)=>{
        if(err) throw err;

        connection.query(findUserQuery, (err, user)=>{
            if(err) throw err;

            if(user.length == 0){
                console.log("Usuário não encontrado");
    
                objRespopnse = {
                    success : false,
                    findUser: false,
                    correctPassword: false,
                    message:"usuário não encontrado"
                }
                connection.release();


                return response.json(objRespopnse);
            }
            
            if(user[0].password === password){
                //auth
                //console.log("process", process.env)
                const token = jwt.sign({id:user[0].id}, "mysecret", {
                    expiresIn:"30d"
                });

                console.log("TOKEN", token);

                objRespopnse = {
                    success : true,
                    findUser: true,
                    correctPassword: true,
                    name:user[0].name,
                    email:user[0].email,
                    user_id:user[0].id,
                    auth:true,
                    token:token,
                    message:"usuário encontrado"
                }

                connection.release();

                /**Cookie Test */
                //response.clearCookie()
                //response.cookie('token:', {Expires: Date.now()})
                //response.clearCookie("novoCookie")
                //response.clearCookie("token:")

                //console.log("request.cookies", request.cookies);
                //console.log("request.signedCookies", request.signedCookies);
                /**Cooquie test */
                console.log(objRespopnse)
                response.json(objRespopnse) 
            }else{
                objRespopnse = {
                    success : true,
                    findUser: true,
                    correctPassword: false,
                    message:"Senha incorreta"
                }
                connection.release();
                response.json(objRespopnse) 
            }

        })
    })
})

app.get("/users", (request, response)=>{
        //db.connect();
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            let query = "SELECT * FROM users";
            var responseObj={};

            connection.query(query, (error, result)=> {
                 if (error) throw error;
                 
                 responseObj = result;
                 console.log(result);
                 
                 //db.destroy();
                 connection.release();
                 response.json(responseObj);
            });

        })
})

app.get("/users/getuserbyid/:id", auth, (request, response)=>{
    const  id = request.params.id
    var responseObj = {};

    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        let query = `SELECT * FROM users WHERE id = '${id}'`;

        connection.query(query, (error, result)=> {
             if (error) throw error;
             
            // responseObj = result;

             if(result.length == 0){
                responseObj.success = false;
                responseObj.message = "user not found";
                response.json(responseObj);
             }else{
                connection.release();
                response.json(result[0]);
             }
             
             //db.destroy();
            
            
        });

    })
})

app.post("/user/create", (request, response)=>{
    const { name, email, password  } = request.body;
    
    var responseObj={};

    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        var responseObj={};

        let checkEmailQuery = `SELECT * FROM users WHERE email = '${email}'`;

        connection.query(checkEmailQuery, (error, result)=>{
            if (error) throw error;

            console.log("RESULT", result);

            if(result.length > 0){
                responseObj.success = false;
                responseObj.message = "e-mail já cadastrado.";

                 return response.json(responseObj);
            }

            if(result.length == 0){
                let query = `INSERT INTO users (name, email, password) VALUES('${name}','${email}','${password}')`;

                connection.query(query, (error, result)=> {
                    if (error) throw error;
                    
                    responseObj.user = {name, email, password};
                    responseObj.success = true;
                    responseObj.message = "user created";
                    
                    //db.destroy();
                    connection.release();
                    response.json(responseObj);
               })
            }
        })
    })

})


app.delete("/user/delete/:id", (req, response)=>{
    const  id = req.params.id
    var responseObj = {};
    pool.getConnection((err, connection)=>{
        if (err) throw error;
        let findUserQuery = `DELETE FROM users WHERE id = '${id}'`;
        connection.query(findUserQuery, (err, user)=>{
            if (err) throw error;

            connection.release();
            responseObj.success = true;
            responseObj.message = "user deleted"
            response.json(responseObj);
        })
    })
})

const port = 3000;

app.listen(port, ()=>{
    console.log(`app inicialized on port ${port} ...`)
})