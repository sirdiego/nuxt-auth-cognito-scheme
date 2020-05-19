if (!process.client || !"fetch" in window) {
  require("cross-fetch/polyfill");
}

import {
  AuthenticationDetails,
  CognitoUserPool,
  CognitoUser,
} from "amazon-cognito-identity-js";
import { UniversalStorageWrapper } from "@sirdiego/nuxt-auth-cognito-scheme/UniversalStorageWrapper";

export default class CognitoAuthScheme {
  constructor(auth, options) {
    this.$auth = auth;
    this.name = options._name;
    this.options = Object.assign({}, DEFAULTS, options);

    this.$storage = new UniversalStorageWrapper(this.$auth.$storage, this.options.clientId);
    this.$pool = new CognitoUserPool({
      UserPoolId: this.options.userPoolId,
      ClientId: this.options.clientId,
      Storage: this.$storage,
    });
  }

  _setToken(token) {
    if (this.options.globalToken) {
      this.$auth.ctx.app.$axios.setHeader(this.options.tokenName, token);
    }
  }

  _clearToken() {
    if (this.options.globalToken) {
      this.$auth.ctx.app.$axios.setHeader(this.options.tokenName, false);
    }
  }

  async mounted() {
    if (this.options.tokenRequired) {
      const cognitoUser = this.$pool.getCurrentUser();
      let token = false;
      if (cognitoUser) {
        try {
          token = await new Promise((resolve, reject) => {
            cognitoUser.getSession((err, cognitoUserSession) => {
              if (err) {
                return reject(err);
              }
              return resolve(cognitoUserSession.getIdToken().getJwtToken());
            });
          });
        } catch (error) {}
      }

      this._setToken(token);
    }

    return this.$auth.fetchUserOnce();
  }

  _scheduleRefresh() {
    if (
      this.options.refreshInterval &&
      process.client &&
      !this.$auth.$storage.getState("interval") &&
      this.$auth.$state.user
    ) {
      this.$auth.$storage.setState(
        "interval",
        setInterval(() => {
          this.$auth.fetchUser(true);
        }, this.options.refreshInterval)
      );
    }
  }

  async login({ data }) {
    await this.$auth.reset();

    const result = await this._login(data.username, data.password);
    const idToken = result.getIdToken().getJwtToken();
    const token = this.options.tokenType
      ? this.options.tokenType + " " + idToken
      : idToken;

    this._setToken(token);

    if (this.options.autoFetchUser) {
      await this.fetchUser();
    }

    return result;
  }

  async setUserToken(tokenValue) {
    const token = this.options.tokenType
      ? this.options.tokenType + " " + tokenValue
      : tokenValue;
    this._setToken(token);

    return this.fetchUser();
  }

  async fetchUser(forceRefresh) {
    const cognitoUser = this.$pool.getCurrentUser();
    if (cognitoUser === null) {
      return;
    }

    const user = await new Promise((resolve, reject) => {
      const handler = (err, cognitoUserSession) => {
        if (err) {
          return reject(err);
        }

        cognitoUser.getUserAttributes(async (err, attributes) => {
          if (err) {
            return reject(err);
          }

          let user = {};
          attributes.map(({Name, Value}) => (user[Name] = Value));
          user.groups =
            cognitoUserSession.getIdToken().payload["cognito:groups"] || [];

          if (this.options.fetchUserCallback) {
            const custom = await fetchUserCallback(cognitoUser);
            user = {...user, ...custom};
          }

          return resolve(user);
        });
      }

      return cognitoUser.getSession((error, session) => {
        if (error) {
          return reject(error);
        }

        if (!forceRefresh) {
          return handler(error, session);
        }

        return cognitoUser.refreshSession(session.getRefreshToken(), handler);
      });
    });

    this._scheduleRefresh();
    this.$auth.setUser(user);
  }

  async logout() {
    const cognitoUser = this.$pool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.signOut();
    }

    return this.$auth.reset();
  }

  async reset() {
    if (this.options.tokenRequired) {
      this._clearToken();
    }

    if (process.client) {
      const interval = this.$auth.$storage.getState("interval");
      if (interval) {
        clearInterval(interval);
        this.$auth.$storage.removeState("interval");
      }
    }

    this.$auth.setUser(false);
    this.$storage.clear();

    return Promise.resolve();
  }

  async _login(Username, Password) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username,
        Password,
      });
      const cognitoUser = new CognitoUser({
        Username,
        Pool: this.$pool,
        Storage: this.$storage,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => resolve(result),
        onFailure: (error) => reject(error),
      });
    });
  }
}

const DEFAULTS = {
  tokenType: "Bearer",
  globalToken: true,
  tokenRequired: true,
  tokenName: "Authorization",
  autoFetchUser: true,
  userPoolId: undefined,
  clientId: undefined,
  refreshInterval: 5 * 60 * 1000,
  fetchUserCallback: false,
};
