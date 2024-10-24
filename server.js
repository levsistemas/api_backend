const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dayJs = require('dayjs');
const mySql2 = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();

// Middleware para parsear JSON y manejar CORS
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/conectar', async (req, resp) => {
    const db = require('./db')
    db.connect((err, res) => {
        if (err) {
            console.log('Error al conectarte a la base de datos... verifica los parametros...', err)
            console.log('TIPS: revisemos si el servicio de base de datos o conexion MySQL esta en ejecucion...')
            resp.send('Error')
            return
        } else {
            console.log('Conectado a la base de datos llamada ' + db.config.database + ' :)');
            resp.status(200).send(res)
        }
    })
})

app.get('/table_usuarios', async (req, resp) => {
    const db = require('./db');
    const sql = `SELECT * FROM usuarios;`
    db.query(sql, (err, result) => {
        if (err) {
            console.log('Error al consultar la tabla usuarios...')
            return
        } else {
            result.forEach(resultado => {
                resultado.Nacimiento = dayJs(resultado.Nacimiento).format('YYYY-MM-DD HH:mm:ss')
            })
            resp.status(200).send(result);
            return
        }
    })
})

app.get('/table_email', async (req, resp) => {
    const db = require('./db');
    const sql = `SELECT id_email, email, correos FROM email;`
    db.query(sql, (err, result) => {
        if (err) {
            console.log('Error al consultar la tabla email')
            return
        } else {
            resp.status(200).send(result);
            return
        }
    })
})

app.get('/table_email_root', async (req, resp) => {
    try {
        const db = require('./db');
        const sql = `SELECT * FROM email;`
        const CONSULTA = await (async () => {
            db.query(sql, (err, result) => {
               if (err) {
                   console.log('Error al consultar la tabla email detallada')
                   //sreturn
               } else {
                   resp.status(200).send(result);
                   return
               }
           })
        })();
        const RTA_CONSULTA = await CONSULTA.json();
        console.log('10:', RTA_CONSULTA)
        console.log('20:', CONSULTA)
    } catch {

    }
})

app.get('/table_email_root/:id', async (req, resp) => {
    const db = require('./db');
    const id = req.params.id
    const sql = `SELECT * FROM email WHERE id_email=?;`
    db.query(sql, id, (err, result) => {
        if (err) {
            console.log('Error al consultar la tabla email detallada')
            return
        } else {
            resp.status(200).send(result);
            return
        }
    })
})

//VALIDACION CORREO SI EXISTE O NO EN BASE DE DATOS
app.post('/mail_sin_encriptacion_contrasena', (req, resp) => {
    const db = require('./db');
    const correo_login = req.body.correo;
    console.log('req.body:', req.body);
    console.log('Recibiendo en servidor para validar si existe:', correo_login);
    const sql = `SELECT email, password, admin FROM email WHERE email LIKE '${correo_login}';`
    db.query(sql, (err, result) => {
        if (err) {
            console.log('Error al validar si el correo existe en la base de datos... verificar...')
            console.log(err)
            return
        } else {
            if (result == '') {
                console.log('NO HAY INFO EN LA CONSULTA DEL CORREO...')
                //resp.status(200).send(result)
                resp.json({ receivedData: { result } })
            } else {
                console.log(result)
                const CORREO = result[0].email
                const CLAVE = result[0].password
                //const PROTECTEDPASSWORD = await bcrypt.hash(CLAVE, 10);
                const ADMIN = result[0].admin
                console.log('correo:', result[0].email)
                console.log('clave:', result[0].password)
                //console.log('clave protegida:', PROTECTEDPASSWORD)
                console.log('root:', result[0].admin)
                console.log('EL CORREO YA SE ENCUENTRA EN LA BASE DE DATOS: ', result[0].email)
                /*if(CLAVE==await bcrypt.compare(PROTECTEDPASSWORD, CLAVE)){
                    const TOKEN = jwt.sign({email: CORREO}, secretKey, { expiresIn: '1h'});
                }*/
                resp.json({ receivedData: { CORREO, CLAVE, ADMIN } })
            }
        }
    })
})

app.post('/mail', async (req, resp) => {
    try {
        async function connectDB() {
            try {
                const db = await require('./db');
                //console.log('RTA de db...', db);
            } catch {

            }
        }
        connectDB();
        const correo_login = req.body.correo;
        console.log('req.body:', req.body);
        console.log('Recibiendo en servidor de forma asincrona para validar si existe:', correo_login);
        const sql = `SELECT email, password, admin FROM email WHERE email LIKE '${correo_login}';`
        db.query(sql, async (err, result) => {
            if (err) {
                console.log('Error al validar si el correo existe en la base de datos... verificar...')
                console.log(err)
                return
            } else {
                if (result == '') {
                    console.log('NO HAY INFO EN LA CONSULTA DEL CORREO... del modo asincrono')
                    resp.status(200).send(result)
                    //resp.json({ receivedData: { result } })
                } else {
                    console.log(result)
                    const CORREO = result[0].email
                    const CLAVE = result[0].password
                    const PROTECTEDPASSWORD = await bcrypt.hash(CLAVE, 10);
                    const ADMIN = result[0].admin
                    console.log('correo:', result[0].email)
                    console.log('clave:', result[0].password)
                    console.log('clave protegida:', PROTECTEDPASSWORD)
                    console.log('root:', result[0].admin)
                    console.log('EL CORREO YA SE ENCUENTRA EN LA BASE DE DATOS: ', result[0].email)
                    if (CLAVE == await bcrypt.compare(PROTECTEDPASSWORD, CLAVE)) {
                        const TOKEN = jwt.sign({ email: CORREO }, secretKey, { expiresIn: '1h' });
                    }
                    resp.json({ receivedData: { CORREO, CLAVE, ADMIN } })
                }
            }
        })
    } catch {
        console.log('ERRORES! en modo asincrono')
    }
})

//VALIDACION DNI EXISTENTE EN BASE DE DATOS
app.post('/dni', async (req, resp) => {
    const db = require('./db');
    const dni = req.body.dni;
    console.log('req.body:', req.body);
    console.log('Recibiendo en servidor para validar si existe DNI:', dni);
    const sql = `SELECT * FROM usuarios WHERE Dni LIKE '${dni}';`
    db.query(sql, async (err, result) => {
        if (err) {
            console.log('Error al verificar si el DNI existe en la base de datos')
            console.log(err)
            return
        } else {
            if (result == '') {
                console.log('NO HAY INFO EN LA CONSULTA DEL DNI...')
                resp.status(200).send(result)
            } else {
                console.log(result[0].id)
                console.log(result[0].Nombre)
                console.log(result[0].Apellido)
                console.log(result[0].Dni)
                console.log('EL DNI YA SE ENCUENTRA EN LA BASE DE DATOS: ', result[0].Dni)
                resp.json({ receivedData: result })
            }
        }
    })
})

app.post('/login', async (req, resp) => {
    const { LOGIN, CLAVE } = req.body;
    console.log('req.body:', req.body);
    console.log('correo:' + LOGIN);
    console.log('clave:' + CLAVE);
    resp.json({ receivedData: { LOGIN, CLAVE } })
})

app.get('/:id', async (req, resp) => {
    const db = require('./db');
    const id = req.params.id;
    const sql = `SELECT * FROM usuarios WHERE id=?;`
    db.query(sql, id, (err, result) => {
        if (err) {
            console.log('Error al consultar registro ' + id, err)
            return
        }
        if (result[0] == undefined) {
            console.log('Este registro ya no existe...')
        } else {
            console.log('Consulta exitosa')
            console.log('ID:', result[0].id)
            console.log('Nombre:', result[0].Nombre)
            console.log('Apellido:', result[0].Apellido)
            console.log('DNI:', result[0].Dni)
            console.log('Celular:', result[0].Celular)
            console.log('Sexo:', result[0].Sexo)
            console.log('Email:', result[0].Email)
            result[0].Nacimiento = dayJs(result[0].Nacimiento).format('YYYY-MM-DD HH:mm:ss');
            console.log('Nacimiento:', result[0].Nacimiento)
            resp.status(200).send(result);
        }
    })
})

app.put('/:id', async (req, resp) => {
    const db = require('./db');
    const { id } = req.params;
    console.log('id=' + id);
    const { nombre, apellido, dni, celular, sexo, email, nacimiento } = req.body;
    const sql = `UPDATE usuarios SET Nombre = ?, Apellido = ?, Dni = ?, Celular = ?, Sexo = ?, Email = ?, Nacimiento = ? WHERE id=?;`
    db.query(sql, [nombre, apellido, dni, celular, sexo, email, nacimiento, id], (err, result) => {
        if (err) {
            console.log('Error al actualizar registro ' + id, err)
            return
        } else {
            resp.status(200).send(result)
            console.log('Registro modificado exitosamente con ID: ' + id);
        }
    })
})

app.post('/insert_usuarios', async (req, resp) => {
    const db = require('./db.js')
    const FK_email = 1;
    const FK_inscripciones = 1;
    const FK_cursos = 1;
    const { nombre, apellido, dni, celular, sexo, email, nacimiento } = req.body;
    const sql = `INSERT INTO usuarios (Nombre, Apellido, Dni, Celular, Sexo, Email, Nacimiento, fk_email, fk_inscripciones, fk_cursos) VALUES (?,?,?,?,?,?,?,?,?,?);`
    db.query(sql, [nombre, apellido, parseInt(dni), parseInt(celular), sexo, email, nacimiento, FK_email, FK_inscripciones, FK_cursos], (err, result) => {
        if (err) {
            console.log('ALGUN LIO TE MANDASTE... REVISA...', err)
            return;
        }
        if (resp.status(200)) {
            console.log('Registro agregado exitosamente con ID:' + result.insertId + ' para la Tabla usuarios');
            console.log('nombre:', nombre)
            console.log('apellido:', apellido)
            console.log('dni:', dni)
            console.log('celular:', celular)
            console.log('sexo:', sexo)
            console.log('email:', email)
            console.log('nacimiento:', nacimiento)
            resp.json({ receivedData: result })
        }
    })
})

app.post('/insert_email', async (req, resp) => {
    const db = require('./db.js')
    const { correoe, password, root, correo } = req.body;
    const protectedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO email (email, password, admin, correos) VALUES (?,?,?,?);`
    db.query(sql, [correoe, protectedPassword, root, correo], (err, result) => {
        if (err) {
            console.log('ALGUN LIO COMETISTE...', err)
            return
        }
        if (resp.status(200)) {
            console.log('Registro agregado exitosamente con ID:' + result.insertId + ' para la Tabla email');
            console.log('email', correoe)
            console.log('password:', password)
            console.log('protected:', protectedPassword)
            console.log('admin:', root)
            console.log('correos:', correo)
            resp.json({ receivedData: result })
        }
    })
})

app.delete('/usuarios/:id', async (req, resp) => {
    const db = require('./db');
    const { id } = req.params;
    const sql = `DELETE FROM usuarios WHERE id=?;`
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.log('Error al eliminar el registro ' + id, err)
            return
        } else {
            resp.status(200).send(result);
            console.log('Registro número ' + id + ' eliminado exitosamente en la tabla usuarios!');
        }
    })
})

app.delete('/email/:id', async (req, resp) => {
    const db = require('./db');
    const { id } = req.params;
    const sql = `DELETE FROM email WHERE id=?;`
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.log('Error al eliminar el registro ' + id, err)
            return
        }
        resp.status(200).send(result);
        console.log('Registro número ' + id + ' eliminado exitosamente en la tabla email!');
    })
})

// Ruta POST para la API
app.post('/api/data', async (req, res) => {
    const { nombre } = req.body; // Extraer datos del cuerpo de la solicitud
    console.log('req.body:', req.body);
    console.log('name:', nombre);
    console.log('Data received:', nombre);
    res.send({ message: 'Data processed', receivedData: nombre });
});

app.get('/admin', async (req, resp) => {
    const db = require('./db');
    const sql = `SELECT admin FROM email;`
    db.query(sql, (err, result) => {
        if (err) {
            console.log('Error en la consulta de admin')
        } else {
            resp.status(200).send(result);
        }
    })
})

app.post('/table_email_set_root', async (req, resp) => {
    const db = require('./db');
    const { N_CONSULTA } = req.body;
    const sql = `UPDATE email SET admin = 'SI' WHERE id_email=?;`
    db.query(sql, N_CONSULTA, (err, result) => {
        if (err) {
            console.log('Error al intentar setear el usuario root', err)
            return
        } else {
            console.log('Seteo de usuario root exitoso para el registro número:' + N_CONSULTA)
            resp.json(result)
            return
        }
    })
})

app.post('/table_email_set_no_root', async (req, resp) => {
    const db = require('./db');
    const { N_CONSULTA } = req.body;
    const sql = `UPDATE email SET admin = '' WHERE id_email=?;`
    db.query(sql, N_CONSULTA, (err, result) => {
        if (err) {
            console.log('Error al intentar setear el usuario NO root', err)
            return
        } else {
            console.log('Seteo de usuario NO root exitoso para el registro número:' + N_CONSULTA)
            resp.json({ result })
            return
        }
    })
})

app.post('/change_db', async (req, res) => {
    const db = require('./db');
    const { NAME_CHANGE } = req.body;
    console.log(NAME_CHANGE);
    db.query(`USE ${NAME_CHANGE};`, (err, result) => {
        if (err) {
            console.log('Error al cambiar la base de datos ' + NAME_CHANGE, err);
            return;
        } else {
            console.log('BASE DE DATOS CAMBIADA: ' + NAME_CHANGE);
            const DB_NUEVA = {
                CUSTOMIZE: NAME_CHANGE
            }
            exports.CUSTOMIZE = NAME_CHANGE;
            res.json({ result });
            return;
        }
    })
})

app.post('/nueva_db', async (req, res) => {
    const db = require('./db');
    const { nombre_db } = req.body;
    console.log('DATABASE:', nombre_db);
    try {
        db.query(`CREATE DATABASE IF NOT EXISTS ${nombre_db} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
        db.query(`USE ${nombre_db};`)
    
        db.query(`CREATE TABLE IF NOT EXISTS Email (
          id_email INT NOT NULL AUTO_INCREMENT,
          email VARCHAR(35) NOT NULL,
          password VARCHAR(100) NOT NULL,
          admin VARCHAR(5) NULL,
          correos INT NOT NULL,
          PRIMARY KEY (id_email),
          INDEX (correos)
        );`)
    
        db.query(`INSERT INTO Email (email,password,admin,correos) VALUES ('usuaria.apellido_usuaria@gmail.com','root1234','',1);`)
        db.query(`INSERT INTO Email (email,password,admin,correos) VALUES ('levsistemasit@gmail.com','admin1234','SI',2);`)
    
        db.query(`CREATE TABLE IF NOT EXISTS Usuarios (
          id INT NOT NULL AUTO_INCREMENT,
          Nombre VARCHAR(20) NOT NULL,
          Apellido VARCHAR(20) NOT NULL,
          Dni INT NOT NULL,
          Celular INT NOT NULL,
          Sexo VARCHAR(10) NOT NULL,
          Email VARCHAR(35) NOT NULL,
          Nacimiento DATE NOT NULL,
          fk_email INT NOT NULL,
          fk_inscripciones INT NOT NULL,
          fk_cursos INT NOT NULL,
          PRIMARY KEY (id),
          INDEX (fk_email),
          INDEX (fk_inscripciones),
          INDEX (fk_cursos)
        );`)
    
        db.query(`INSERT INTO Usuarios (Nombre,Apellido,Dni,Celular,Sexo,Email,Nacimiento,fk_email,fk_inscripciones,fk_cursos) VALUES ('Usuaria','Apellido_Usuaria',15000000,1130601984,'Femenino','usuaria.apellido_usuaria@gmail.com','1984-03-15',1,1,1);`)
        db.query(`INSERT INTO Usuarios (Nombre,Apellido,Dni,Celular,Sexo,Email,Nacimiento,fk_email,fk_inscripciones,fk_cursos) VALUES ('Leandro','Vega',32000000,1155443322,'Masculino','levsistemasit@gmail.com','1986-07-01',2,2,2);`)
    
        db.query(`CREATE TABLE IF NOT EXISTS Inscripciones (
           id_inscripciones INT AUTO_INCREMENT,
           fecha DATETIME NOT NULL,
           alumnos_id INT NOT NULL,
           curso_id INT NOT NULL,
           PRIMARY KEY (id_inscripciones),
           INDEX (curso_id)
        );`)
    
        db.query(`INSERT INTO Inscripciones (fecha,alumnos_id,curso_id) VALUES (CURRENT_TIMESTAMP,1,1);`)
        db.query(`INSERT INTO Inscripciones (fecha,alumnos_id,curso_id) VALUES (CURRENT_TIMESTAMP,2,2);`)
    
        db.query(`CREATE TABLE IF NOT EXISTS curso (
           id_curso INT AUTO_INCREMENT,
           titulo VARCHAR(45) NOT NULL,
           horas INT NOT NULL,
           portada TEXT NOT NULL,
           docentes_id INT NOT NULL,
           PRIMARY KEY (id_curso),
           INDEX (docentes_id)
        );`, (err, response) => {
            if (err) {
                console.log(err);
                return
            } else {
                console.log('EXITOSO');
                //res.json(response);
            }
        })
    
        db.query(`INSERT INTO curso (titulo,horas,portada,docentes_id) VALUES ('PHP',40,'Elephant',1);`)
        db.query(`INSERT INTO curso (titulo,horas,portada,docentes_id) VALUES ('Node.JS',40,'Javascript Backend',2);`)
    
        db.query(`ALTER TABLE Usuarios ADD FOREIGN KEY (fk_email) REFERENCES Email(id_email) ON DELETE RESTRICT ON UPDATE RESTRICT;`)
        db.query(`ALTER TABLE Usuarios ADD FOREIGN KEY (fk_inscripciones) REFERENCES Inscripciones(id_inscripciones) ON DELETE RESTRICT ON UPDATE RESTRICT;`)
        db.query(`ALTER TABLE Usuarios ADD FOREIGN KEY (fk_cursos) REFERENCES curso(id_curso) ON DELETE RESTRICT ON UPDATE RESTRICT;`)
    } catch {
        console.log('Error al crear la base de datos y las tablas... :(')
    }
})

app.post('/drop_db', async (req, res) => {
    const db = require('./db')
    const { delete_db } = req.body;
    console.log(delete_db);
    db.query(`USE ${delete_db};`)
    db.query(`DROP TABLE Usuarios;`)
    db.query(`DROP DATABASE ${delete_db};`)
})

// Iniciar el servidor
const PORT = process.env.SV_PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
});