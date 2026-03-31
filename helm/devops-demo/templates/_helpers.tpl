{{- define "devops-demo.name" -}}
{{- .Chart.Name -}}
{{- end }}

{{- define "devops-demo.fullname" -}}
{{- .Release.Name -}}
{{- end }}

{{- define "devops-demo.appName" -}}
{{- .Values.app.name -}}
{{- end }}

{{- define "devops-demo.postgresName" -}}
{{- .Values.postgres.name -}}
{{- end }}
