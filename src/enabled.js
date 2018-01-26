export default function cmpConfigEnvBool(envKey, configKey) {
  if (process.env[envKey] === undefined) return configKey;
  const lcValue = process.env[envKey].toLowerCase();

  /* process.env has a setter that ensures the value is always a string */
  /* env key explicitly set to false should override other config. */
  switch (lcValue) {
    case 'false':
    case 'disable':
    case 'disabled':
      return false;
    case 'true':
    case 'enable':
    case 'enabled':
      return true;
    default:
      return configKey;
  }
}
