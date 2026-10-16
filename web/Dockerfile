# Usamos una imagen oficial de Node.js
FROM node:18
# Creamos un directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app
# Copiamos el package.json y descargamos las dependencias
COPY package*.json ./
RUN npm install
# Copiamos el resto del codigo
COPY . .
# Exponemos el puerto
EXPOSE 3000
# Comando para iniciar la aplicacion
CMD ["node", "server.js"]