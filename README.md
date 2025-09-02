# Taller paso a paso
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