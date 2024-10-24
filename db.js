const express = require('express');
const app = express();
let CUSTOMIZE = require('./server.js');
let nombre_alternativo;

require('dotenv').config();

const mySql2 = require('mysql2/promise');

async function connection() {
    const db = await mySql2.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: nombre_alternativo || CUSTOMIZE.CUSTOMIZE || process.env.DATABASE,
        port: process.env.DB_PORT || 3306
    });
    
    try {
        console.log('Conectado a la base de datos llamada ' + db.config.database + ' :)');
        async function getDatabaseName(){
            try {
                const [ROWS] = await db.query(`SELECT base_de_datos FROM base_de_datos;`, (req, res) => {
                    if(res){
                        console.log('ALL RIGHT!!!')
                    } else {
                        console.log('ALL BAD!!!')
                    }
                });
                console.log(ROWS[0]);
                return ROWS[0].base_de_datos;
            } catch {
        
            }
        }
        
        async function changeDatabase(nombre_alternativo) {
            try {
                const LA_QUERY = await db.query(`USE ${nombre_alternativo};`, (req,resp) => {
                    if(resp){
                        console.log('TODO BIEN!!!')
                    } else {
                        console.log('TODO MALLLL!!!')
                    }
                });
                console.log(LA_QUERY);
            } catch {
        
            }
        }
        
        async function main() {
            try {
                nombre_alternativo = await getDatabaseName();
                
                await Promise.all([
                    changeDatabase(nombre_alternativo)
                ])
            } catch (error) {
                console.log('Error en ...main...', error)
            }
        }
        
        main();
        module.exports = db;
    } catch {
        console.log('Error al conectarte a la base de datos, verifique "user", "pass", "database", "port" por último si el servicio se encuentra activo')
    }
}

connection();


async function intentar1() {
    try {
        console.log('Conectado a la base de datos llamada ' + db.config.database + ' :)');
        const RESULTADO = await (async () => {
            db.query(`SELECT base_de_datos FROM base_de_datos;`, (req, res) => {
                if (res.length > 0) {
                    console.log(res[0].base_de_datos)
                    nombre_alternativo = res[0].base_de_datos
                    console.log('Nombre: ', nombre_alternativo)
                }
            });
        })();
        const RTA_RESULTADO = await RESULTADO.json();
        console.log('MOSTRAMEEE: ' + RTA_RESULTADO)
        intentar2();
        async function intentar2() {
            try {
                if (nombre_alternativo !== "") {
                    console.log('nombre alternativo en pantalla: ', nombre_alternativo)
                    const RESULT = await (async () => {
                        db.query(`USE ${nombre_alternativo};`, (req, resp) => {
                            console.log('NECESITO EL NOMBRE AQUI: ', resp);
                        });
                    })();
                    const RTA_RESULT = await RESULT.json();
                    console.log('RESULT: ', RESULT);
                    console.log('RTA_RESULT: ', RTA_RESULT);
                } else {
                    console.log('nombre alternativo en pantalla vacio: ', nombre_alternativo)
                }
            } catch {
                console.log('Error al conectarte a la base de datos, verifique "user", "pass", "database", "port" por último si el servicio se encuentra activo')
            }
        }
    } catch {
        console.log('Error al conectarte a la base de datos, verifique "user", "pass", "database", "port" por último si el servicio se encuentra activo')
    }
}

async function intentar2() {
    try {
        if (nombre_alternativo !== "") {
            console.log('nombre alternativo en pantalla: ', nombre_alternativo)
            const RESULT = await (async () => {
                db.query(`USE ${nombre_alternativo};`, (req, resp) => {
                    console.log('NECESITO EL NOMBRE AQUI: ', resp);
                });
            })();
            const RTA_RESULT = await RESULT.json();
            console.log('RESULT: ', RESULT);
            console.log('RTA_RESULT: ', RTA_RESULT);
        }
    } catch {
        console.log('Error al conectarte a la base de datos, verifique "user", "pass", "database", "port" por último si el servicio se encuentra activo')
    }
}

//intentar1();
//intentar2();
// module.exports = db;