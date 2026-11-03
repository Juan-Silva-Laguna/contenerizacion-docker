# Guion de video: de Docker a Kubernetes y Azure AKS en 20 minutos

## Antes de grabar

Publico: alguien que nunca ha usado Kubernetes. Objetivo: comprender y desplegar Territorio Colombia, una web Node.js que guarda departamentos y municipios en MySQL.

Duracion del video editado: exactamente 20 minutos, divididos en 20 bloques de un minuto. Instalar programas, descargar imagenes y crear AKS puede tardar mucho mas: prepara esas operaciones antes o corta las esperas durante la edicion. No prometas completar el laboratorio real en 20 minutos.

Todos los comandos usan **PowerShell en Windows**, no CMD ni Bash. Ejecuta los bloques en orden y detente si aparece un error. Los comandos de Azure son instrucciones para el espectador; no se han ejecutado como parte de la preparacion de este documento.

Necesitas Docker Desktop encendido en modo contenedores Linux, kind y kubectl. Para Azure necesitas una suscripcion activa, Azure CLI y permisos para crear recursos, subir imagenes y asignar roles a AKS sobre ACR. Ser Contributor por si solo no permite asignar roles; pide ayuda al administrador si corresponde.

Instala solo las herramientas que te falten y vuelve a abrir PowerShell si cambia el PATH:

```powershell
winget install --exact --id Docker.DockerDesktop
winget install --exact --id Kubernetes.kind
winget install --exact --id Kubernetes.kubectl
winget install --exact --id Microsoft.AzureCLI
```

Azure cobra por recursos como maquinas virtuales, discos, registro de imagenes y red. El nivel Free de AKS no hace gratuitos los nodos. Revisa precios y presupuesto antes de crear recursos; una alerta de presupuesto no detiene automaticamente los gastos. No muestres inicios de sesion, tokens ni contrasenas en el video.

## 00:00-01:00 | Que vamos a construir

**En pantalla:** abre la app funcionando y registra un municipio de prueba, sin datos personales.

**Di:** "Tenemos una pagina para guardar departamentos y municipios de Colombia. La pagina necesita una base de datos. Hoy vamos a empaquetar la pagina y pedirle a Kubernetes que mantenga todo funcionando. Primero practicaremos en nuestra computadora y luego en Azure."

**Dibuja:**

```text
Navegador -> web Node.js -> MySQL
```

**Pregunta:** "Si cerramos la pagina, donde queda guardado el municipio?" Respuesta: en MySQL, no en el navegador.

## 01:00-02:00 | Conocer los archivos de esta app

**En pantalla:** muestra el explorador de VS Code y abre estos archivos:

| Archivo | Explicacion para decir en voz alta |
| --- | --- |
| [web/server.js](web/server.js) | Es el programa: muestra formularios y consulta MySQL. |
| [web/package.json](web/package.json) | Es la lista de bibliotecas que necesita el programa. |
| [db.sql](db.sql) | Crea las tablas y unos registros iniciales. |
| [web/Dockerfile](web/Dockerfile) | Es la receta para empacar nuestra web. |
| [web/docker-compose.yml](web/docker-compose.yml) | Permite encender web y MySQL juntos sin Kubernetes. |
| [k8s/web.yaml](k8s/web.yaml) | Pide dos copias de la web y una direccion interna. |
| [k8s/mysql.yaml](k8s/mysql.yaml) | Pide MySQL, almacenamiento y una direccion interna. |
| [k8s/secret.yaml](k8s/secret.yaml) | Contiene una contrasena de ejemplo, solo para el laboratorio local. |

**Di:** "No estamos reescribiendo la aplicacion. Estamos cambiando la forma de ejecutarla. Tampoco moveremos automaticamente los datos que hayas creado antes."

## 02:00-03:00 | Dockerfile, imagen y contenedor

**En pantalla:** abre [web/Dockerfile](web/Dockerfile).

**Di:** "Una receta no es una comida. El Dockerfile es la receta; la imagen es el paquete preparado con esa receta; el contenedor es ese paquete funcionando. Podemos encender varias copias de la misma imagen."

Explica las instrucciones existentes:

- `FROM node:18`: el entorno base con Node.js.
- `WORKDIR`: la carpeta de trabajo dentro del contenedor.
- `COPY` y `RUN npm install`: copiar archivos e instalar bibliotecas.
- `EXPOSE 3000`: documentar el puerto; no lo publica automaticamente.
- `CMD`: arrancar `node server.js`.

**Aclara:** "Conservamos Dockerfile y Compose. Kubernetes usara la imagen, pero no leera el Compose. Node 18 ya esta fuera de soporte: este laboratorio reproduce el proyecto; antes de produccion hay que actualizarlo a una version LTS soportada y probar la app."

## 03:00-04:00 | Kubernetes con una analogia sencilla

**Dibuja:** una escuela con aulas y un encargado.

**Di:** "El cluster es toda la escuela. Cada nodo es un aula con espacio para trabajar. Un Pod es un lugar donde vive un contenedor. El Deployment es el encargado que dice: quiero dos copias de esta web. Si desaparece una, crea otra."

**Aclara:** "Dos Pods no significan dos computadoras. En nuestra practica pueden estar los dos en el mismo nodo. Si ese nodo falla, tener dos copias alli no evita la interrupcion."

Explica las herramientas: Docker ejecuta los contenedores; kind crea Kubernetes local usando Docker; kubectl envia instrucciones a Kubernetes. En AKS el runtime de los nodos normalmente es containerd, no Docker Desktop.

## 04:00-05:00 | Por que existe k8s y como leer YAML

**En pantalla:** abre [k8s/web.yaml](k8s/web.yaml).

**Di:** "K8s es una abreviatura: hay ocho letras entre la k y la s de Kubernetes. La carpeta podria llamarse de otra forma. Elegimos k8s para guardar las instrucciones del despliegue."

Senala los campos reales:

| Campo | Significado |
| --- | --- |
| `apiVersion` | Version de la API de ese tipo de recurso. |
| `kind: Deployment` | Tipo de recurso; no es la herramienta kind. |
| `metadata.name` | Nombre del recurso. |
| `spec` | Estado que queremos conseguir. |
| `replicas: 2` | Dos copias deseadas de la web. |
| `template` | Plantilla para crear los Pods. |
| `labels` y `selector` | Etiquetas que permiten encontrar los Pods correctos. |
| `image` | Imagen que ejecutara el contenedor. |
| `---` | Separa recursos dentro de un mismo archivo YAML. |

**Aclara:** "La sangria importa: usa espacios. Kubernetes compara lo que pedimos con lo que existe e intenta acercarlos. Eso es trabajar con estado deseado."

## 05:00-06:00 | Revisar Docker y crear el cluster local

**En pantalla:** abre PowerShell desde la raiz del proyecto.

```powershell
Set-Location 'C:\Users\JuanIgnacioSilvaLagu\Music\deploy-kube'
docker info
kind get clusters
```

**Di:** "Si Docker muestra la seccion Server, su motor responde. Estar en la carpeta correcta importa porque luego usaremos rutas relativas como web y db.sql."

Solo si `practica` no aparece en la lista:

```powershell
kind create cluster --name practica
```

Selecciona el cluster y comprueba su nodo:

```powershell
kubectl config use-context kind-practica
kubectl get nodes
```

**Resultado esperado:** un nodo con estado `Ready`. En esta historia el cluster ya fue creado; no necesitas borrarlo ni crearlo otra vez.

## 06:00-07:00 | Construir y entregar la imagen

```powershell
docker build -t deploy-kube-web:1.0 ./web
kind load docker-image deploy-kube-web:1.0 --name practica
```

**Di:** "Build prepara el paquete. La opcion -t le pone nombre y etiqueta: deploy-kube-web, version 1.0. La ruta web indica donde estan la receta y los archivos. Load entrega una copia a los nodos de kind."

**En pantalla:** senala `image: deploy-kube-web:1.0` en [k8s/web.yaml](k8s/web.yaml).

**Aclara:** "El nombre debe coincidir. IfNotPresent usa la imagen si ya esta disponible en el nodo; si falta, intenta descargarla. No significa que nunca consultara un registro. En AKS no usaremos kind load: subiremos la imagen a un registro en Azure."

## 07:00-08:00 | Configuracion y contrasenas

**En pantalla:** muestra el inicio de [web/server.js](web/server.js): `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

**Di:** "La misma web puede trabajar en nuestra computadora o en Azure. Le damos los datos de conexion mediante variables de entorno, sin cambiar el programa."

```powershell
kubectl create configmap mysql-init --from-file=init.sql=./db.sql --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f ./k8s/secret.yaml
```

**Explica:** ConfigMap guarda configuracion no secreta. Aqui entrega el SQL con el nombre `init.sql`. `--dry-run=client` prepara la definicion sin crearla; `-o yaml` elige su formato; la tuberia `|` entrega el resultado a `apply`; `-f -` lee desde la entrada. Esta combinacion sirve para crear o actualizar el ConfigMap.

**Aclara:** "Secret separa las credenciales de los Deployments, pero no es una caja magica: base64 no es cifrado y este archivo contiene root en texto plano. No guardes contrasenas reales en Git."

## 08:00-09:00 | MySQL, disco y direccion interna

**En pantalla:** recorre [k8s/mysql.yaml](k8s/mysql.yaml).

**Di:** "El Pod puede desaparecer. Para que el cuaderno de datos no desaparezca con el, pedimos almacenamiento aparte mediante un PVC. El contenedor guarda sus datos en /var/lib/mysql, conectado a ese volumen."

Explica sus tres recursos: PVC `mysql-data`, Deployment `mysql-db` y Service `mysql-db`. `ReadWriteOnce` permite montaje de lectura y escritura desde un nodo; no significa necesariamente un unico Pod.

```powershell
kubectl apply -f ./k8s/mysql.yaml
kubectl rollout status deployment/mysql-db --timeout=300s
kubectl get pvc
```

**Resultado esperado:** despliegue disponible y PVC `Bound`.

**Aclara:** "MySQL ejecuta init.sql al inicializar un directorio de datos vacio. Editar el ConfigMap no vuelve a ejecutar el SQL en una base existente. El PVC conserva datos al reemplazar Pods, pero no es un backup ni garantiza conservarlos si borras el cluster kind o el almacenamiento."

## 09:00-10:00 | Encender la web y entender los Services

```powershell
kubectl apply -f ./k8s/web.yaml
kubectl rollout status deployment/web-app --timeout=180s
kubectl get pods
kubectl get services
```

**Di:** "El Deployment mantiene dos copias. El Service es una direccion estable para encontrarlas aunque cambien sus IP. La web busca mysql-db y Kubernetes resuelve ese nombre dentro del mismo namespace."

**En pantalla:** muestra como el selector `app: web-app` coincide con las etiquetas de los Pods.

**Aclara:** "No existe un depends_on equivalente que ordene todo automaticamente. Por eso aqui esperamos primero a MySQL. Los manifiestos actuales de la web no tienen readiness probe: Running y 1/1 no prueban por si solos que las consultas SQL funcionen. Hay que abrir y probar la app."

## 10:00-11:00 | Abrir la app y comprobar datos

En una terminal dedicada:

```powershell
kubectl port-forward service/web-app 3000:3000
```

**En pantalla:** abre http://localhost:3000 y luego http://localhost:3000/ver. Registra un municipio y comprueba que aparece.

**Di:** "Creamos un tunel temporal desde nuestra computadora hasta un Pod seleccionado a traves del Service. El numero de la izquierda es nuestro puerto; el de la derecha es el puerto del Service. Esto no publica la app en Internet ni demuestra balanceo entre replicas."

**Aclara:** "La terminal debe seguir ocupada por port-forward. Si vuelves a ver el prompt, el tunel termino. Ctrl+C lo detiene, pero no apaga los Pods. Si 3000 esta ocupado, usa 3001:3000 y entra a localhost:3001."

## 11:00-12:00 | Ver como Kubernetes reemplaza un Pod

En otra PowerShell, con contexto `kind-practica`:

```powershell
kubectl get pods -l app=web-app
$PodWeb = kubectl get pods -l app=web-app -o jsonpath='{.items[0].metadata.name}'
kubectl delete pod $PodWeb
kubectl get pods -l app=web-app -w
```

**Di:** "Borramos una copia de la web, no el Deployment. El encargado ve que falta una y crea otra. No revive el mismo Pod: aparece uno nuevo con otro nombre."

Deten la observacion con Ctrl+C. Si se corto port-forward al borrar su Pod, vuelve a ejecutarlo.

**Pregunta:** "Que pasaria si borramos el Deployment?" Respuesta: ya no existiria esa orden de mantener dos copias.

**Transicion:** "Ya conocemos Kubernetes. Ahora cambiaremos el lugar donde vive, no el lenguaje de las instrucciones."

## 12:00-13:00 | Azure: AKS, ACR y costos

**Dibuja:**

```text
Computadora -- docker push --> ACR (almacen de imagenes)
Computadora -- kubectl -----> AKS (Kubernetes en Azure)
                               |-- dos Pods web
                               |-- un Pod MySQL -> disco de Azure
```

**Di:** "ACR guarda paquetes; AKS los ejecuta. Azure administra el plano de control de Kubernetes, pero nosotros seguimos cuidando la app, permisos, datos y costos. Este es un laboratorio, no una arquitectura de produccion."

**En pantalla:** presupuesto y calculadora de Azure. Repite que un nodo de AKS, ACR y un disco generan cargos. No crees recursos si no tienes autorizacion.

**Aclara:** "Vamos a crear una base nueva con db.sql. Los registros agregados en kind no viajan con la imagen. Migrar datos existentes exige exportar, restaurar y verificar la base por separado."

## 13:00-14:00 | Entrar a Azure y preparar el laboratorio

Usa una PowerShell distinta para Azure, desde la raiz del proyecto. Conserva esta sesion: las variables siguientes se usan hasta la limpieza.

```powershell
az login
az account list -o table
$Suscripcion = Read-Host 'ID de la suscripcion autorizada para el laboratorio'
az account set --subscription $Suscripcion
az account show -o table
$Grupo = 'rg-territorio-lab'
$Region = 'eastus'
$Aks = 'aks-territorio-lab'
$Acr = 'acrterritorio' + (Get-Random -Minimum 10000000 -Maximum 99999999)
az provider register --namespace Microsoft.ContainerService --wait
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.Compute --wait
az provider register --namespace Microsoft.Network --wait
az group create --name $Grupo --location $Region
```

**Di:** "La suscripcion indica quien paga. El grupo es una carpeta logica para juntar y luego borrar el laboratorio. La region indica donde crearemos los recursos. Las variables con dolar evitan repetir nombres."

**Nota de grabacion:** verifica que ese grupo no exista con recursos ajenos. Elige un nombre distinto si existe. La region es un ejemplo: revisa disponibilidad, restricciones y cuotas de tu suscripcion antes de continuar.

## 14:00-15:00 | Subir nuestra imagen a ACR

```powershell
az acr check-name --name $Acr
az acr create --resource-group $Grupo --name $Acr --sku Basic --role-assignment-mode rbac
$Registro = az acr show --name $Acr --query loginServer -o tsv
az acr login --name $Acr
docker tag deploy-kube-web:1.0 "${Registro}/deploy-kube-web:1.0"
docker push "${Registro}/deploy-kube-web:1.0"
az acr repository show-tags --name $Acr --repository deploy-kube-web -o table
```

**Di:** "Tag pone una direccion adicional a nuestra imagen: ahora incluye el almacen de Azure. Push la sube. La etiqueta 1.0 deberia aparecer al final. No estamos subiendo la base de datos ni los registros de MySQL."

**Aclara:** "El nombre del registro debe ser unico globalmente. Si check-name indica que esta ocupado, genera otro antes de crearlo. Elegimos RBAC para permitir la integracion con --attach-acr; los registros con modo RBAC+ABAC necesitan otro procedimiento de roles."

## 15:00-16:00 | Crear AKS y elegir el contexto correcto

```powershell
az aks create --resource-group $Grupo --name $Aks --location $Region --node-count 1 --node-vm-size Standard_D2s_v3 --tier free --enable-managed-identity --attach-acr $Acr --generate-ssh-keys
az aks get-credentials --resource-group $Grupo --name $Aks --context territorio-aks
kubectl config use-context territorio-aks
kubectl config current-context
kubectl get nodes
kubectl version
kubectl get storageclass
```

**Di:** "Creamos un nodo para practicar. Azure administra el plano de control. Attach-acr autoriza al cluster a descargar del registro sin escribir contrasenas de ACR en los YAML. Get-credentials configura nuestra conexion."

**Aclara:** "Este tamano de maquina es un ejemplo sujeto a cuota y disponibilidad. Si Azure lo rechaza, consulta los tamanos admitidos en tu region; no cambies al azar. Free se refiere al nivel de administracion, no al costo de la maquina. Un unico nodo no ofrece alta disponibilidad."

**Nota de grabacion:** corta la espera de creacion. Comprueba que kubectl este a no mas de una version menor de distancia del servidor; AKS puede ofrecer una version distinta de kind. Instala un cliente compatible si hace falta. Debe existir `managed-csi` para el disco del siguiente paso.

## 16:00-17:00 | Preparar MySQL en Azure sin reutilizar root/root

**Di:** "Este cluster empieza vacio. Creamos su configuracion y una contrasena aleatoria de laboratorio, sin mostrarla ni guardarla en Git. No aplicaremos secret.yaml en Azure."

```powershell
kubectl config current-context
kubectl create configmap mysql-init --from-file=init.sql=./db.sql --dry-run=client -o yaml | kubectl apply -f -
$ClaveDb = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$Secreto = @{
    apiVersion = 'v1'
    kind = 'Secret'
    metadata = @{ name = 'db-secret' }
    type = 'Opaque'
    stringData = @{ MYSQL_ROOT_PASSWORD = $ClaveDb }
}
$Secreto | ConvertTo-Json -Depth 10 -Compress | kubectl apply -f -
Remove-Variable ClaveDb, Secreto
$MysqlAzure = kubectl create --dry-run=client -f ./k8s/mysql.yaml -o json | ConvertFrom-Json
foreach ($Recurso in $MysqlAzure.items) {
    if ($Recurso.kind -eq 'PersistentVolumeClaim') {
        $Recurso.spec | Add-Member -NotePropertyName storageClassName -NotePropertyValue 'managed-csi' -Force
    }
    if ($Recurso.kind -eq 'Deployment') {
        $Recurso.spec | Add-Member -NotePropertyName strategy -NotePropertyValue @{ type = 'Recreate' } -Force
    }
}
$MysqlAzure | ConvertTo-Json -Depth 100 | kubectl apply -f -
kubectl rollout status deployment/mysql-db --timeout=600s
kubectl get pvc
```

**Explica con calma:** "Leemos los tres recursos de mysql.yaml como datos JSON, no modificamos el archivo local. Al PVC le indicamos que use un disco administrado por Azure. Recreate evita que una actualizacion del Deployment intente arrancar dos MySQL sobre el mismo disco: primero retira el anterior y luego crea el nuevo. Esto implica una interrupcion."

**Importante:** ejecuta la creacion del Secret una sola vez en este laboratorio nuevo. Si ya hay datos, generar otra contrasena no cambia la contrasena interna de MySQL y puede romper la conexion. No es un procedimiento de rotacion. AKS puede asignar y facturar un disco de mayor capacidad que el 1Gi solicitado. El SQL solo se ejecuta al inicializar el disco vacio.

## 17:00-18:00 | Desplegar la web desde ACR

**Di:** "Reutilizamos web.yaml, pero sustituimos la direccion de la imagen antes de enviarla. Los nombres mysql-db y db-secret siguen funcionando dentro de este cluster."

```powershell
$WebAzure = kubectl create --dry-run=client -f ./k8s/web.yaml -o json | ConvertFrom-Json
foreach ($Recurso in $WebAzure.items) {
    if ($Recurso.kind -eq 'Deployment') {
        $Recurso.spec.template.spec.containers[0].image = "${Registro}/deploy-kube-web:1.0"
    }
}
$WebAzure | ConvertTo-Json -Depth 100 | kubectl apply -f -
kubectl rollout status deployment/web-app --timeout=300s
kubectl get pods
kubectl get services
kubectl logs deployment/web-app --tail=30
```

**En pantalla:** senala los Pods en AKS y busca la conexion a MySQL en los logs. Ese comando muestra logs de un Pod elegido, no necesariamente de todas las replicas.

**Aclara:** "No ejecutes apply -f k8s/ en AKS despues de estos pasos: restauraria la imagen local y la contrasena root de ejemplo. Estas adaptaciones viven en el cluster y en las variables de esta sesion; para un proyecto mantenible las guardariamos en configuraciones separadas por entorno, por ejemplo con Kustomize."

## 18:00-19:00 | Probar Azure y explicar el acceso publico

En la terminal de Azure:

```powershell
kubectl --context territorio-aks port-forward service/web-app 3001:3000
```

**En pantalla:** abre http://localhost:3001, consulta registros y guarda uno de prueba. Muestra `localhost:3000` para kind solo si su tunel sigue abierto; explica que son bases independientes.

**Di:** "Ahora la app corre en Azure, aunque entro por un tunel desde mi computadora. Estar en la nube no significa estar publicado para todo Internet. Dejamos MySQL interno y no exponemos la web sin proteccion."

**Explicacion opcional, sin ejecutar:** un Service `LoadBalancer` puede crear acceso externo; Ingress permite enrutar HTTP con un controlador o gateway. Para publicar esta app hacen falta autenticacion, HTTPS, controles de acceso y revision de seguridad. Hoy no tiene login: una IP publica permitiria a otras personas consultar y enviar registros.

**Antes de produccion:** actualizar Node.js, usar usuario SQL de minimo privilegio en lugar de root, configurar requests/limits y sondas de salud de la web, gestionar secretos con permisos adecuados y Key Vault, y preparar backups. Para MySQL considera Azure Database for MySQL Flexible Server; si lo alojas en Kubernetes, necesita diseno de operacion y recuperacion, no solo este Deployment. No escales este MySQL a varias replicas independientes sobre el mismo disco.

## 19:00-20:00 | Limpiar y resumir lo aprendido

Deten el tunel con Ctrl+C. Antes de borrar nada, comprueba el grupo y confirma que contiene exclusivamente este laboratorio. Los siguientes pasos eliminan los datos de prueba en Azure.

```powershell
az account show -o table
az resource list --resource-group $Grupo -o table
az aks show --resource-group $Grupo --name $Aks --query nodeResourceGroup -o tsv
az group delete --name $Grupo
```

**Di:** "La eliminacion pide confirmacion. Solo la acepto despues de revisar el nombre. Borra AKS, ACR y los recursos asociados del laboratorio; AKS tambien gestiona un grupo de nodos separado. Compruebo en el portal que no queden discos, IP u otros recursos facturables del ejercicio. Cerrar la terminal o detener port-forward no detiene la facturacion."

Comprueba al terminar la eliminacion:

```powershell
az group exists --name $Grupo
kubectl config use-context kind-practica
```

**Resultado esperado:** `false` para el grupo eliminado. Revisa tambien en Azure el grupo de nodos cuyo nombre mostraste antes. No borres recursos compartidos o que no pertenezcan al ejercicio.

**Cierre:** "Dockerfile prepara el paquete; el registro lo guarda; Kubernetes lo ejecuta; los Services lo conectan; el volumen guarda los datos. Kind nos permite practicar localmente y AKS nos permite usar Kubernetes en Azure. No cambiamos de aplicacion: cambiamos donde y como la ejecutamos."

## Anexo: diccionario para tener al lado del video

| Palabra | Explicacion sencilla |
| --- | --- |
| Dockerfile | Receta para construir la imagen. |
| Imagen | Paquete con el programa y sus dependencias. |
| Contenedor | Una instancia de ese paquete en ejecucion. |
| Docker Compose | Herramienta para coordinar contenedores sin Kubernetes. |
| Kubernetes / K8s | Sistema que administra aplicaciones en contenedores. |
| kind | Herramienta para crear clusters locales usando contenedores Docker. |
| kubectl | Cliente que envia peticiones a la API de Kubernetes. |
| Cluster | Conjunto de nodos y componentes de administracion. |
| Nodo | Maquina donde se ejecutan Pods. |
| Plano de control | Componentes que coordinan el estado del cluster. |
| Pod | Unidad que agrupa uno o mas contenedores que comparten red y recursos. |
| Deployment | Define y mantiene replicas, y administra sus actualizaciones. |
| Replica | Una copia deseada de la aplicacion. |
| Service | Punto estable de acceso a un conjunto de Pods. |
| DNS | Sistema que traduce nombres como mysql-db a direcciones de red. |
| ClusterIP | Service con acceso interno; es el tipo predeterminado. |
| LoadBalancer | Service que puede solicitar un balanceador externo al proveedor. |
| Ingress | Reglas de entrada HTTP/HTTPS; requieren un controlador compatible. |
| ConfigMap | Configuracion no secreta, incluyendo pequenos archivos. |
| Secret | Recurso para datos sensibles; requiere proteccion y permisos. |
| PVC | Peticion de almacenamiento persistente. |
| PV | Recurso que representa el almacenamiento provisto para un PVC. |
| StorageClass | Define como se aprovisiona almacenamiento. |
| Volumen | Almacenamiento montado dentro de un contenedor. |
| Manifiesto | Documento YAML o JSON que describe recursos. |
| YAML | Formato de texto estructurado que usa sangria. |
| JSON | Otro formato de datos estructurados aceptado por Kubernetes. |
| Label / selector | Etiqueta y criterio para seleccionar recursos. |
| Namespace | Separacion logica dentro de un cluster; aqui usamos default. |
| Contexto | Conexion seleccionada por kubectl: cluster, usuario y namespace. |
| Readiness probe | Comprobacion que indica si un contenedor esta listo para trafico. |
| Rollout | Proceso de desplegar o actualizar una aplicacion. |
| Recreate | Estrategia que retira los Pods anteriores antes de crear los nuevos. |
| Registro | Almacen desde el que se suben y descargan imagenes. |
| ACR | Azure Container Registry, registro de imagenes en Azure. |
| AKS | Azure Kubernetes Service, Kubernetes administrado en Azure. |
| Azure CLI / az | Herramienta para administrar recursos de Azure. |
| Suscripcion | Ambito de recursos, permisos y facturacion en Azure. |
| Resource group | Grupo logico de recursos de Azure. |
| Region | Ubicacion geografica de los recursos de Azure. |
| RBAC | Permisos asignados mediante roles. |
| Identidad administrada | Identidad de un recurso Azure sin contrasena gestionada por ti. |
| Port-forward | Tunel temporal local hacia un Pod, incluso seleccionandolo por Service. |
| Backup | Copia recuperable de datos; no es lo mismo que un volumen. |

## Anexo: errores frecuentes y como observarlos

Ejecuta estos comandos en el contexto que quieras diagnosticar; no hace falta volver a desplegar todo para investigar.

```powershell
kubectl config current-context
kubectl get pods,pvc,services
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl logs deployment/web-app --tail=50
kubectl logs deployment/mysql-db --tail=50
```

Para un Pod concreto, copia su nombre desde `get pods`:

```powershell
$PodProblema = Read-Host 'Nombre del Pod que quieres revisar'
kubectl describe pod $PodProblema
```

| Sintoma | Que revisar primero |
| --- | --- |
| Error dockerDesktopLinuxEngine | Docker Desktop y su motor Linux deben estar encendidos. |
| Path web not found | Ejecuta desde la raiz deploy-kube, no desde Music. |
| Cluster practica already exists | Usa el existente; no lo borres solo para repetir el tutorial. |
| ImagePullBackOff en kind | Coincidencia de nombre/etiqueta y kind load en el cluster correcto. |
| ImagePullBackOff en AKS | URL de ACR, etiqueta publicada y permisos de descarga de AKS. |
| Pending | Eventos del Pod, recursos del nodo y aprovisionamiento del PVC. |
| CrashLoopBackOff | Logs del contenedor y eventos; no es una causa por si mismo. |
| Error SQL o HTTP 500 | Espera de MySQL, credenciales, tablas y logs de ambos componentes. |
| Puerto local ocupado | Usa otro puerto izquierdo, por ejemplo 3002:3000. |
| Azure AuthorizationFailed | Suscripcion y permisos; solicita al administrador el rol necesario. |
| Error de cuota/SKU | Capacidad y tamanos disponibles en la region para esa suscripcion. |

No soluciones errores borrando PVCs: podrias perder la base. Cambiar una contrasena del Secret tampoco modifica automaticamente una base ya inicializada.

## Anexo: ejercicios despues del video

Realiza estos ejercicios solo en `kind-practica`, sin cargos de Azure:

```powershell
kubectl config use-context kind-practica
kubectl scale deployment/web-app --replicas=3
kubectl get pods -l app=web-app
kubectl scale deployment/web-app --replicas=2
```

Explica por que aparecen tres copias y despues vuelven a dos. El comando scale cambia el estado del cluster, no el archivo: un apply posterior puede restablecer las replicas escritas en el manifiesto.

Otro ejercicio: guarda un registro, elimina solo el Pod de MySQL y comprueba despues de su recuperacion que el registro sigue alli. No borres el PVC. El volumen permite conservar datos en ese reemplazo, pero la base queda temporalmente no disponible.

Cuando ya no necesites la practica local, `kind delete cluster --name practica` elimina el cluster y puede destruir sus datos locales. Exporta cualquier dato que quieras conservar antes de hacerlo.

## Referencias oficiales

- [Kubernetes: conceptos](https://kubernetes.io/docs/concepts/).
- [kind: inicio rapido](https://kind.sigs.k8s.io/docs/user/quick-start/).
- [AKS: crear un cluster con Azure CLI](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli).
- [Integracion de AKS con ACR y limitaciones ABAC](https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration).
- [Azure CLI: comandos de ACR](https://learn.microsoft.com/en-us/cli/azure/acr?view=azure-cli-latest).
- [Precios de AKS](https://azure.microsoft.com/en-us/pricing/details/kubernetes-service/).
- [Calculadora de Azure](https://azure.microsoft.com/en-us/pricing/calculator/).

Los comandos de Azure se contrastaron con estas referencias al preparar el guion. La disponibilidad de versiones, regiones, permisos y precios debe comprobarse en la suscripcion donde se haga la practica.