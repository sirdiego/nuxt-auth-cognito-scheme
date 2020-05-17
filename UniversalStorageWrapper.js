export class UniversalStorageWrapper /* implements ICognitoStorage */ {
  constructor(storage, poolId) {
    this.storage = storage;
    this.poolId = poolId;
  }

  setItem(key /* : string */, value /* : string */) /* : void */ {
    this.storage.setUniversal(key, value);
  }
  getItem(key /* : string */) /* : string */ {
    return this.storage.getUniversal(key);
  }
  removeItem(key /* : void */) /* : void */ {
    this.storage.removeUniversal(key);
  }
  clear() /* : void */ {
    let prefix = `auth.CognitoIdentityServiceProvider.${this.poolId}.`;
    const lastAuthUser = this.getItem(prefix + "LastAuthUser");
    if (!lastAuthUser) {
      return;
    }
    this.removeItem(prefix + "LastAuthUser");

    ["accessToken", "clockDrift", "idToken", "refreshToken"]
      .map(name => "." + name)
      .map(name => prefix + lastAuthUser + name)
      .map(name => this.removeItem(name));
  }
}
