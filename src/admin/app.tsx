import type { StrapiApp } from '@strapi/strapi/admin';
import AuthLogo from './extensions/auth-logo.png';
import MenuLogo from './extensions/menu-logo.png';
import Favicon from './extensions/favicon.png';

export default {
  config: {
    auth: {
      logo: AuthLogo,
    },
    menu: {
      logo: MenuLogo,
    },
    head: {
      favicon: Favicon,
    },
    translations: {
      en: {
        'Auth.form.welcome.title': 'Welcome to Scharle CMS',
        'Auth.form.welcome.subtitle': 'Log in to manage Scharle Beauty College',
        'app.components.LeftMenu.navbrand.title': 'Scharle CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Beauty College',
      },
    },
    tutorials: false,
    notifications: {
      releases: false,
    },
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    document.title = 'Scharle CMS';
  },
};
