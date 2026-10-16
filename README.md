# 🐳 Guía Definitiva de Docker (De Cero a Experto)

¡Bienvenido a tu guía personal de Docker! Este documento está diseñado para explicarte de forma sencilla cómo funciona Docker, los comandos más importantes, y cómo se estructuran los archivos clave de tu proyecto.

---

## 📘 1. Conceptos Básicos

*   **Imagen (Image):** Es como un "plano" o una "receta". Contiene el sistema operativo, tu código y todas las herramientas que necesita para funcionar (ej. Node.js, MySQL). Es de solo lectura.
*   **Contenedor (Container):** Es la "casa construida" a partir de ese plano. Es la aplicación viva y corriendo en un entorno aislado.
*   **Volumen (Volume):** Es un mecanismo para guardar datos de forma permanente. Si el contenedor de la base de datos se borra, el volumen asegura que los datos (como tus departamentos y municipios) no se pierdan.

---

## 🛠️ 2. Comandos Más Utilizados en Docker

Aquí tienes tu "navaja suiza" de comandos esenciales en la terminal:

### Gestión de Imágenes
*   `docker images` -> Muestra todas las imágenes descargadas en tu PC.
*   `docker pull mysql:8.0` -> Descarga una imagen específica desde internet.
*   `docker rmi [nombre_imagen]` -> Elimina una imagen que ya no usas.

### Gestión de Contenedores
*   `docker ps` -> Muestra los contenedores que están **encendidos** actualmente.
*   `docker ps -a` -> Muestra **todos** los contenedores (encendidos y apagados).
*   `docker stop [nombre_contenedor]` -> Apaga un contenedor que está corriendo.
*   `docker rm [nombre_contenedor]` -> Elimina un contenedor (debe estar apagado primero).
*   `docker logs [nombre_contenedor]` -> Muestra los mensajes de error o registros del contenedor.
*   `docker exec -it [nombre_contenedor] bash` -> Te abre una terminal interactiva por dentro del contenedor.

---

## 🆚 3. ¿Cómo trabajar SIN vs CON Docker Compose?

Para entender la magia de Docker Compose, veamos cómo sería levantar nuestra aplicación web y nuestra base de datos de ambas formas.

### ❌ Forma Manual (SIN Docker Compose)
Si no existiera Docker Compose, tendrías que hacer todo paso a paso, creando tu propia red e iniciando cada contenedor por separado.

1.  **Crear una red virtual manualmente:**
    ```bash
    docker network create mi_red_colombia
    ```
2.  **Iniciar la Base de Datos (conectada a la red):**
    ```bash
    docker run -d --name mysql-db --network mi_red_colombia -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=colombia_db mysql:8.0
    ```
3.  **Construir la imagen de Node.js a partir del Dockerfile:**
    ```bash
    docker build -t mi_imagen_node .
    ```
4.  **Iniciar la Aplicación Web (conectada a la red y apuntando a la BD):**
    ```bash
    docker run -d --name web-app --network mi_red_colombia -p 3000:3000 -e DB_HOST=mysql-db mi_imagen_node
    ```

### ✅ Forma Automatizada (CON Docker Compose)
Docker Compose resume todos los pasos anteriores en un solo archivo de configuración (`docker-compose.yml`) y un solo comando.

1.  **Levantar todo (red, base de datos y aplicación):**
    ```bash
    docker-compose up -d --build
    ```
2.  **Apagar y limpiar todo (contenedores y redes):**
    ```bash
    docker-compose down
    ```

---

## 📄 4. Explicación del `Dockerfile` (Línea por Línea)

El `Dockerfile` es el script que crea tu imagen de Node.js.

```dockerfile
# 1. Trae una imagen base oficial de Node.js (versión 18) desde internet.
FROM node:18

# 2. Crea una carpeta llamada /usr/src/app dentro del contenedor y se ubica en ella.
WORKDIR /usr/src/app

# 3. Copia los archivos package.json y package-lock.json de tu PC al contenedor.
COPY package*.json ./

# 4. Ejecuta el comando para instalar las librerías de Node (como express y mysql2).
RUN npm install

# 5. Copia TODO el resto de tu código (como server.js) al contenedor.
COPY . .

# 6. Le avisa a Docker que este contenedor usará el puerto 3000.
EXPOSE 3000

# 7. Define el comando final que encenderá la aplicación cuando el contenedor arranque.
CMD ["node", "server.js"]
```

---

## 🗂️ 5. Explicación del `docker-compose.yml` (Línea por Línea)

Este archivo es el director de orquesta que coordina ambos contenedores.

```yaml
# 1. Define la versión del formato de Docker Compose que estamos usando.
version: '3.8'

# 2. Inicia la sección donde declaramos nuestros contenedores (servicios).
services:
  
  # --- SERVICIO 1: LA BASE DE DATOS ---
  mysql-db:
    # 3. Usa la imagen oficial de MySQL en su versión 8.0.
    image: mysql:8.0
    
    # 4. Define las variables de entorno obligatorias para MySQL.
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: colombia_db
      
    # 5. Mapea el puerto de tu PC (izq) con el puerto del contenedor (der) para usar DBeaver.
    ports:
      - "3306:3306"
      
    # 6. Copia tu archivo SQL inicial al interior del contenedor para que cree las tablas automáticamente.
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  # --- SERVICIO 2: LA APLICACIÓN WEB ---
  web-app:
    # 7. En lugar de descargar una imagen, la construye usando el Dockerfile de esta carpeta (.).
    build: .
    
    # 8. Mapea el puerto 3000 de tu PC para que puedas ver la web en el navegador.
    ports:
      - "3000:3000"
      
    # 9. Le pasa una variable de entorno a Node.js para que sepa cómo se llama la base de datos en la red.
    environment:
      DB_HOST: mysql-db
      
    # 10. Le dice a Docker que espere a que la base de datos exista antes de encender la web.
    depends_on:
      - mysql-db
```