# @sirdiego/nuxt-auth-cognito-scheme

## Setup

Install with npm:

```bash
npm install --save @sirdiego/nuxt-auth-cognito-scheme
```

Install with yarn:

```bash
yarn add @sirdiego/nuxt-auth-cognito-scheme
```

Edit `nuxt.config.js`:

```js
{
  modules: [
    '@nuxtjs/axios',
    '@sirdiego/nuxt-auth-cognito-scheme',
    '@nuxtjs/auth'
 ],

 auth: {
    strategies: {
      cognito: {
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        clientId: process.env.AWS_COGNITO_CLIENT_ID
      }
    }
 }
```
