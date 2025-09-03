# Taller paso a paso

## Integrantes
- Ariel Sanchez
- Keylor Solano
- Deyanira Maradiaga
- Amanda Montero


## Descargamos los repositorios
Descargamos los repositorios de github, en su última versión, vamos a tener un repositorio de la siguiente manera:
```
tournament-manager/
│── tournament-api
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── tournament-ui/
    ├── Dockerfile
    └── docker-compose.yml

```

## Compilar las imagenes
### API
Nos movemos a la carpeta del api, y compilamos las imágenes mediante el siguiente comando:

```cmd
docker-compose build
```

Este comando hará dos cosas:
1. Descarga la imagen de mongo
2. Compila la aplicación del api

## UI
Nos movemos a la carpeta del ui.

```cmd
docker-compose build
```

Este comando hará dos cosas:
1. Compila la aplicación del IO

## Verificamos
En este momento, podemos realizar una verificación con el comando `docker container ls` y debemos tener 3 imágenes.

# Subir las aplicaciones
En las carpetas de UI y API podemos subir las aplicaciones utilizando el comando
```
docker-compose up
```

El UI estará expuesto en el puerto 80 y el api en el 3000.

## Incluímos datos
Tomamos datos del archivo `data.ts` y utilizando Postman para insertar los datos en la base de datos.  Tenemos que importar el archivo `docs/Tournament.postman_collection.json`.

Posteriormente, enviamos la solicitud de `Create Tournament` para tener datos en la basde de datos.
Podemos verificar estos datos entrando a mongo directamente desde el pod o utilizando la solicitud de `Fetch Tournaments`.

---

# Arquitectura y conexión de los componentes

El sistema está compuesto por los siguientes servicios, todos definidos y conectados en el archivo `docker-compose.yml`:

- **API NodeJS (`api`)**  
  Expone el puerto **3000**. Se conecta a MongoDB y Kafka usando las variables de entorno `MONGO_URI` y `KAFKA_BROKER`.  
  - MongoDB: `mongodb://mongo:27017/tournament_designer`
  - Kafka: `kafka:9092`

- **Job Consumer (`job`)**  
  Es un servicio NodeJS que se conecta a Kafka y consume los mensajes del tópico.  
  No expone puertos externos, pero imprime los mensajes en consola.  
  Se conecta a Kafka usando la variable de entorno `KAFKA_BROKER=kafka:9092`.

- **MongoDB (`mongo`)**  
  Expone el puerto **27017** para acceso local.  
  Usado por la API para almacenar y consultar los torneos.

- **Kafka (`kafka`)**  
  Expone el puerto **9092**.  
  Utiliza Zookeeper para la coordinación interna.

- **Zookeeper (`zookeeper`)**  
  Expone el puerto **2181**.  
  Necesario para el funcionamiento de Kafka.

Todos los servicios están conectados a la red interna de Docker llamada `internal_net`, lo que permite que se comuniquen entre sí usando los nombres de los servicios como hostnames (por ejemplo, la API accede a Mongo usando `mongo:27017` y a Kafka usando `kafka:9092`).

---

## Cómo levantar los servicios

1. **Compilar y levantar todos los servicios**
   
   Desde la carpeta donde está el archivo `docker-compose.yml`, ejecuta:
   ```sh
   docker-compose up --build
   ```
   Esto construirá las imágenes necesarias y levantará todos los servicios conectados.

2. **Verificar los servicios levantados**
   
   Usa el comando:
   ```sh
   docker container ls
   ```
   Deberías ver los siguientes contenedores corriendo:
   - tournament-designer-api (API)
   - job-consumer (Job)
   - tournament-designer-db (MongoDB)
   - kafka (Kafka)
   - zookeeper (Zookeeper)

---

## Puertos expuestos

- **API NodeJS:** `localhost:3000`
- **MongoDB:** `localhost:27017`
- **Kafka:** `localhost:9092`
- **Zookeeper:** `localhost:2181`

---

## Flujo de conexión

1. **La API recibe solicitudes en el puerto 3000.**
2. **Cuando se hace un POST a `/registrar`, la API:**
   - Inserta el registro en MongoDB.
   - Encola el mismo registro en Kafka.
3. **El Job Consumer escucha los mensajes en Kafka y los imprime en consola.**

---

## Ver logs del Job Consumer

Para ver los mensajes procesados por el job, ejecuta:
```sh
docker-compose logs -f job
```
o revisa los logs directamente en Docker Desktop en el contenedor `job-consumer`.

---

## Notas

- Todos los servicios se comunican por la red interna de Docker, usando los nombres de los servicios como hostnames.
- Si necesitas acceder a MongoDB o Kafka desde fuera de Docker, usa los puertos expuestos en tu máquina local.