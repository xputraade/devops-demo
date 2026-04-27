# devops-demo

Aplikasi demo support ticketing berbasis Node.js dan PostgreSQL.

## Fungsi Repository

Repository ini berisi:

- source code aplikasi
- Dockerfile
- dependency aplikasi
- workflow build image

Deployment aplikasi **tidak dikontrol langsung dari repo ini**.

Deployment dikontrol melalui repository GitOps:

- `devops-demo-gitops`

## Deployment Model

Aplikasi ini dideploy menggunakan:

- Docker image
- GitHub Container Registry (GHCR)
- Helm
- Argo CD
- Kubernetes

## Alur Delivery

1. source code diubah di repo ini
2. image aplikasi dibuild
3. image dipush ke GHCR
4. tag image diperbarui di repo GitOps
5. Argo CD menyinkronkan perubahan ke cluster

## Registry

Container image dipublish ke:

```text
ghcr.io/xputraade/devops-demo
