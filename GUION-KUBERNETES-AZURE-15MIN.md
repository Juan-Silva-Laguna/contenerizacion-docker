# Guion: Kubernetes y Azure (AKS) en 15 minutos

Duracion objetivo: 10 a 15 minutos. Se asume que Docker ya se entiende; la imagen `deploy-kube-web:1.0` ya esta construida.

Comandos en PowerShell. Las esperas largas (crear AKS, descargar imagenes) se cortan en la edicion.

---

## 00:00 - 01:00 | Idea general

**Di:** "Tenemos una web Node.js y una base MySQL. Kubernetes se encarga de mantenerlas funcionando. Azure nos ofrece Kubernetes administrado (AKS) y un almacen de imagenes (ACR)."

**Dibuja:**

```text
Tu PC --> ACR (imagenes) --> AKS (Kubernetes en Azure)
```

---

## 01:00 - 03:00 | Los archivos clave

| Archivo | Que hace |
| --- | --- |
| [k8s/web.yaml](k8s/web.yaml) | Pide 2 copias de la web. |
| [k8s/mysql.yaml](k8s/mysql.yaml) | Pide MySQL y su disco de datos. |
| [k8s/secret.yaml](k8s/secret.yaml) | Guarda la contrasena. Solo para practica local. |

**Di:** "Estos archivos describen lo que queremos. Kubernetes se encarga del resto."

Conceptos rapidos:
- **Pod:** un contenedor en ejecucion.
- **Deployment:** dice cuantas copias queremos y las recrea si fallan.
- **Service:** un nombre fijo para llegar a los Pods.

---

## 03:00 - 05:00 | Entrar a Azure y crear el registro de imagenes

```powershell
az login
az group create --name rg-territorio --location eastus
$Acr = "acrterritorio$(Get-Random -Maximum 99999)"
az acr create --resource-group rg-territorio --name $Acr --sku Basic
```

**Di:** "El grupo de recursos agrupa todo para borrarlo despues de un solo paso. El nombre del registro debe ser unico en el mundo, por eso lleva un numero aleatorio."

Subir la imagen:

```powershell
az acr login --name $Acr
docker tag deploy-kube-web:1.0 "$Acr.azurecr.io/deploy-kube-web:1.0"
docker push "$Acr.azurecr.io/deploy-kube-web:1.0"
```

**Di:** "Ahora la imagen esta en Azure. Kubernetes la descargara desde ahi."

---

## 05:00 - 08:00 | Crear AKS y conectarlo con ACR

```powershell
az aks create --resource-group rg-territorio --name aks-territorio --node-count 1 --attach-acr $Acr --generate-ssh-keys
az aks get-credentials --resource-group rg-territorio --name aks-territorio
kubectl get nodes
```

**Di:** "`--attach-acr` le da permiso al cluster para descargar imagenes de nuestro registro, sin escribir contrasenas. `get-credentials` configura kubectl para hablar con este cluster. El nodo debe aparecer como `Ready`."

**Aclara:** "Un nodo no da alta disponibilidad. Es suficiente para practicar."

---

## 08:00 - 10:00 | Preparar los archivos para Azure

Copia la carpeta de Kubernetes:

```powershell
Copy-Item .\k8s .\k8s-azure -Recurse
```

**En pantalla:** abre `k8s-azure/web.yaml` y cambia una sola linea:

```yaml
image: <tu-acr>.azurecr.io/deploy-kube-web:1.0
```

Escribe el valor real de `$Acr`. Imprime el nombre con `echo $Acr`.

**Di:** "Cambiamos solo la direccion de la imagen. Los nombres `mysql-db` y `db-secret` funcionan igual en Azure."

**Aclara:** "Azure asigna un disco por defecto para MySQL. No hace falta cambiar el almacenamiento en este laboratorio."

---

## 10:00 - 12:00 | Crear la contrasena y desplegar

Crea la contrasena en el cluster. Escribela tu cuando PowerShell la pida, sin mostrarla:

```powershell
$Clave = Read-Host "Contrasena de MySQL"
kubectl create secret generic db-secret --from-literal=MYSQL_ROOT_PASSWORD=$Clave
kubectl create configmap mysql-init --from-file=init.sql=./db.sql
```

**Aclara:** "No usamos `secret.yaml` en Azure. La contrasena de ejemplo no debe llegar a la nube."

Despliega:

```powershell
kubectl apply -f ./k8s-azure/mysql.yaml
kubectl apply -f ./k8s-azure/web.yaml
kubectl get pods
```

**Resultado esperado:** los Pods en `Running`. Puede tardar un par de minutos la primera vez.

---

## 12:00 - 13:00 | Probar la web

```powershell
kubectl port-forward service/web-app 3000:3000
```

**En pantalla:** abre http://localhost:3000 y registra un municipio.

**Di:** "El port-forward es un tunel temporal desde mi PC hacia el cluster. No publica la web en Internet. Ctrl+C lo cierra."

---

## 13:00 - 14:00 | Limpiar

**Importante:** AKS y ACR cuestan dinero mientras existen. Borra el grupo al terminar:

```powershell
az group delete --name rg-territorio --yes --no-wait
```

**Di:** "Un solo comando borra el cluster, el registro y los discos. Revisa el portal para confirmar."

---

## 14:00 - 15:00 | Resumen

**Di:** "Subimos la imagen a ACR. AKS la descarga gracias a `--attach-acr`. Kubernetes mantiene las copias de la web y MySQL. Para publicar la web en Internet hace falta un Service de tipo LoadBalancer o un Ingress, con autenticacion y HTTPS."

**Cierre:** "Docker crea el paquete, ACR lo guarda, AKS lo ejecuta."
