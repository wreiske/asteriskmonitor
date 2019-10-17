// TODO: This should really be in settings.json!
// super dirrty baaad baad but w\e it works for now.

if (!process.env.PBXMON_DOMAIN_RESTRICTION) {
    throw "PBXMON_DOMAIN_RESTRICTION is a required Environment variable. See https://github.com/wreiske/asteriskmonitor#environment-variables";
}
GlobalSettings = {
    Google: {
        clientId: process.env.PBXMON_GOOGLE_CLIENT_ID || '',
        secret: process.env.PBXMON_GOOGLE_SECRET || '',
    },
    LoginRestrictions: {
        Domain: process.env.PBXMON_DOMAIN_RESTRICTION
    }
};