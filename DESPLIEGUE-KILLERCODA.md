# Despliegue de Territorio Colombia en Killercoda

Guia paso a paso para publicar la imagen en Docker Hub y desplegar la app y MySQL en un cluster de Killercoda.

Convenciones:
- **Terminal local:** PowerShell en tu PC, en la carpeta `deploy-kube`.
- **Terminal Killercoda:** la terminal del navegador del escenario.

---

## Antes de empezar

Necesitas:
- Cuenta en [Docker Hub](https://hub.docker.com).
- Docker Desktop encendido en tu PC (terminal local).
- Cuenta gratuita en [Killercoda](https://killercoda.com).

Reemplaza `TU_USUARIO` por tu usuario de Docker Hub en todos los comandos.

---

## Parte 1: subir la imagen a Docker Hub

### Paso 1. Crear el repositorio (navegador)

1. Entra en Docker Hub.
2. Ve a **My Hub** > **Repositories**.
3. Pulsa **Create repository**.
4. En **Repository Name** escribe `deploy-kube-web`.
5. Elige **Public**. Killercoda debe poder descargar la imagen sin credenciales.
6. Pulsa **Create**.

Fuente: [Docker Docs: Create a repository](https://docs.docker.com/docker-hub/repos/create/).

### Paso 2. Construir y subir la imagen (terminal local)

```powershell
Set-Location 'C:\Users\JuanIgnacioSilvaLagu\Music\deploy-kube'
docker login
docker build -t juanig29/deploy-kube-web:1.0 ./web
docker push juanig29/deploy-kube-web:1.0
```

- `docker login` pide usuario y token de acceso. Usa un access token, no tu contrasena.
- `docker build` usa [web/Dockerfile](web/Dockerfile) y crea la imagen con el nombre `juanig29/deploy-kube-web:1.0`.
- `docker push` la sube a Docker Hub.

Comprueba en Docker Hub que aparezca la etiqueta `1.0`.

Si ya construiste la imagen con el nombre `deploy-kube-web:1.0`, basta con:

```powershell
docker tag deploy-kube-web:1.0 juanig29/deploy-kube-web:1.0
docker push juanig29/deploy-kube-web:1.0
```

---

## Parte 2: preparar el escenario en Killercoda

### Paso 3. Crear un escenario o usar el Playground (navegador)

1. Entra en Killercoda e inicia sesion.
2. Abre el **Playground** o un escenario de Kubernetes.
3. Espera a que la terminal y el cluster esten listos.

Fuente: [Killercoda docs](https://killercoda.com/docs/).

### Paso 4. Comprobar herramientas y cluster (terminal Killercoda)

```bash
kubectl get nodes
kubectl version --client
```

Resultado esperado: al menos un nodo en `Ready`.

Si el escenario no tiene Docker, no hace falta: no construiremos nada alli. Solo descargaremos la imagen desde Docker Hub.

### Paso 5. Obtener los archivos de Kubernetes (terminal Killercoda)

Opcion recomendada: sube el proyecto a un repositorio publico de GitHub y clonalo. Sustituye la URL:

```bash
git clone https://github.com/juanig29/deploy-kube.git
cd deploy-kube
ls k8s
```

Alternativa: crea los archivos de `k8s/` a mano en el editor de Killercoda, copiando el contenido de [k8s/web.yaml](k8s/web.yaml), [k8s/mysql.yaml](k8s/mysql.yaml) y [k8s/secret.yaml](k8s/secret.yaml).

### Paso 6. Cambiar la imagen (terminal Killercoda)

Abre `k8s/web.yaml` y cambia la linea de la imagen por:

```yaml
image: juanig29/deploy-kube-web:1.0
```

Puedes hacerlo en el editor de Killercoda, o con este comando, sustituyendo `juanig29`:

```bash
sed -i 's#image: deploy-kube-web:1.0#image: juanig29/deploy-kube-web:1.0#' k8s/web.yaml
grep image k8s/web.yaml
```

---

## Parte 3: desplegar en el cluster de Killercoda

### Paso 7. Crear el Secret y el ConfigMap (terminal Killercoda)

```bash
kubectl create configmap mysql-init --from-file=init.sql=./db.sql
kubectl apply -f k8s/secret.yaml
```

Si no tienes `db.sql` en la carpeta actual, copia su contenido al archivo `db.sql` antes de ejecutar el comando.

Advertencia: `secret.yaml` contiene una contrasena de ejemplo. Usala solo en un laboratorio desechable.

### Paso 8. Desplegar MySQL y la web (terminal Killercoda)

```bash
kubectl apply -f k8s/mysql.yaml
kubectl rollout status deployment/mysql-db --timeout=300s
kubectl apply -f k8s/web.yaml
kubectl rollout status deployment/web-app --timeout=180s
kubectl get pods
kubectl get services
```

Resultado esperado: los Pods en `Running` y los Services `mysql-db` y `web-app`.

### Paso 9. Abrir la web (terminal Killercoda)

```bash
kubectl port-forward service/web-app 3000:3000
```

Killercoda muestra un boton de **Port** o **Open port 3000** en la interfaz. Pulsalo para abrir la app en el navegador. Si no aparece, revisa la opcion de puertos del escenario.

Deja esa terminal abierta. Ctrl+C detiene el tunel.

---

## Si la imagen no se descarga

Revisa el error de pod:

```bash
kubectl get pods
kubectl describe pod NOMBRE_DEL_POD
```

- `ImagePullBackOff` suele indicar un nombre de imagen mal escrito o un repositorio privado. Comprueba que el repositorio sea publico y que la etiqueta sea `1.0`.
- `CrashLoopBackOff` suele indicar que MySQL aun no esta listo. Revisa los logs: `kubectl logs deployment/web-app`.

---

## Resumen de terminales

| Paso | Donde se ejecuta |
| --- | --- |
| Crear repositorio | Navegador, Docker Hub |
| `docker login`, `build`, `push` | Terminal local PowerShell |
| `kubectl`, `git clone`, `sed`, `apply` | Terminal de Killercoda |
| Abrir la web | Boton de puerto de Killercoda |

---

## Alternativas a Docker Hub

- **Azure Container Registry (ACR):** util si quieres mantener el despliegue en Azure. Requiere credenciales o un secreto de pull.
- **GitHub Container Registry (ghcr.io):** tambien funciona con Killercoda si la imagen es publica.
- **kind load:** solo sirve para un cluster local kind. Killercoda no usa tu PC.

Docker Hub es la opcion mas sencilla para este caso porque Killercoda puede descargar una imagen publica sin configuracion adicional.

---

## Fuentes

- [Docker Docs: Create a repository](https://docs.docker.com/docker-hub/repos/create/)
- [Killercoda docs](https://killercoda.com/docs/)
- [Kubernetes: conceptos](https://kubernetes.io/docs/concepts/)

Los pasos de la interfaz de Killercoda pueden cambiar. Verifica el boton de puertos y el entorno del escenario que elijas antes de la practica.
