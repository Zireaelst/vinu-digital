export interface AppConfig {
  ethereumWssUrl: string;
  firebaseAdminConfigPath: string;
}

export default (): AppConfig => ({
  ethereumWssUrl: process.env.ETHEREUM_WSS_URL || '',
  firebaseAdminConfigPath: process.env.FIREBASE_ADMIN_CONFIG_PATH || '',
});
