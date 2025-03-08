# Guia de Implantação no AWS Amplify

Este guia explica como implantar a aplicação social-partner no AWS Amplify.

## Pré-requisitos

1. Uma conta na AWS
2. Seu código em um repositório Git (GitHub, GitLab, Bitbucket, etc.)
3. AWS CLI instalado (opcional, para configuração avançada)

## Passos para Implantação

### 1. Prepare seu projeto

Seu projeto já está configurado corretamente com:
- Um arquivo `package.json` com os scripts necessários
- Configuração do Vite para build

### 2. Acesse o AWS Amplify Console

1. Faça login no [AWS Management Console](https://aws.amazon.com/console/)
2. Pesquise por "Amplify" e selecione o serviço

### 3. Conecte seu repositório

1. Clique em "Create new app"
2. Selecione seu provedor Git (GitHub, GitLab, Bitbucket, etc.)
3. Autorize o AWS Amplify a acessar seu repositório
4. Selecione o repositório e a branch que contém seu projeto

### 4. Configure as opções de build

O Amplify detectará automaticamente que é um projeto React/Vite, mas você pode precisar ajustar as configurações:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 5. Configurações avançadas (opcional)

#### Variáveis de ambiente

Se sua aplicação utiliza variáveis de ambiente, configure-as em:
- Build settings > Environment variables

Para este projeto, você pode precisar configurar variáveis relacionadas às APIs de redes sociais.

#### Domínio personalizado

1. Vá para "Domain management"
2. Clique em "Add domain"
3. Siga as instruções para configurar seu domínio personalizado

### 6. Inicie a implantação

1. Clique em "Save and deploy"
2. O Amplify iniciará o processo de build e implantação
3. Você pode acompanhar o progresso no console

### 7. Implantações contínuas

O AWS Amplify configurará automaticamente um webhook com seu provedor Git. Quando você enviar alterações para a branch configurada, o Amplify iniciará automaticamente uma nova implantação.

## Solução de problemas

### Erros de build

Se encontrar erros durante o build:
1. Verifique os logs de build no console do Amplify
2. Certifique-se de que todas as dependências estão instaladas corretamente
3. Verifique se o script de build está configurado corretamente no package.json

### Problemas com rotas

Para aplicações com React Router, você pode precisar configurar redirecionamentos para rotas de cliente:

1. Vá para "Rewrites and redirects"
2. Adicione uma regra para redirecionar todas as solicitações para index.html:
   - Source: `</^[^.]+$|\.((?!css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)\w+)$/>`
   - Target: `/index.html`
   - Type: 200 (Rewrite)

## Recursos adicionais

- [Documentação do AWS Amplify](https://docs.aws.amazon.com/amplify/)
- [Melhores práticas para implantação de aplicações React](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-react-app.html)