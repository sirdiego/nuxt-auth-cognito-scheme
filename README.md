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
    '@sirdiego/nuxt-auth-cognito-scheme', // Insert before @nuxtjs/auth
    '@nuxtjs/auth'
  ],
  auth: {
    strategies: {
      cognito: {
        tokenType: "Bearer",
        globalToken: true,
        tokenName: "Authorization",
        autoFetchUser: true,
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        clientId: process.env.AWS_COGNITO_CLIENT_ID,
        refreshInterval: 5 * 60 * 1000, // Set to 0 to disable the browser interval
        fetchUserCallback: false // Can be used to put more information into the user object
      }
    }
  }
}
```
